const express = require('express');
const connectDB = require('./config/db');
const formData = require('express-form-data');

require('colors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes.js');
const collectorRoutes = require('./routes/Collector.route');
const EntrepriseRoutes = require('./routes/Entreprise.route');
const AppointmentRoutes = require('./routes/Appointment.route.js');
const QuoteMobileRoute = require('./routes/QuoteMobile.route.js');
const profiles = require('./routes/profiles.route');
const demandeMunicipal = require('./routes/demandeMunicipal.route');
const binRoute = require('./routes/bin.route');
const cleaningService = require('./routes/cleaningService.route');
const PointbinRoute = require('./routes/pointBin.route');
const site = require('./routes/Sites.route');
const score = require('./routes/score.route');


const morgan = require('morgan');
const { forgotPassword, resetPassword } = require('./controllers/userController');
const { isResetTokenValid } = require('./security/Rolemiddleware');
const passport = require('passport');
const governoratesModel = require('./models/governorates.model');
const access = require('./routes/access.route');
const BinModel = require('./models/Bin.model');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
// passport
app.use(passport.initialize())
require('./security/passport')(passport)
connectDB();


app.use(formData.parse());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({extended: false}));

// app.use(express.json({limit: '50mb'}));
// app.use(express.urlencoded({limit: '50mb'}));


app.post("/forgot-password", forgotPassword )
// router.post("/reset-password", resetPassword )
app.post("/reset-password",isResetTokenValid,  resetPassword )
app.use('/api/users', userRoutes);
app.use('/api/collector', collectorRoutes);
app.use('/api/entreprise', EntrepriseRoutes);
app.use('/api/appointment', AppointmentRoutes);
app.use('/api/QuoteMobile', QuoteMobileRoute);

app.use('/api/profile', profiles);
app.use('/api/access', access);
app.use('/api/site', site);
app.use('/api/bin', binRoute);
app.use('/api/score', score);
app.use('/api/cleaning', cleaningService);
app.use('/api/Pointbin', PointbinRoute);
app.use('/api/demande-municipal', demandeMunicipal);
app.get('/api/governorates', (req, res)=>{
  governoratesModel.find()
  .then(governorates => res.json(governorates))
  .catch(err => res.status(400).json('Error: ' + err));


})
app.get('/zied', (req, res)=>{

  res.send('hello world')



})


app.post('/sendsms', (req, res) => {
  // Extract phone number and OTP code from the request body
  const phoneNumber = req.body.phoneNumber;
  const otpCode = req.body.otpCode;

  // Download the helper library from https://www.twilio.com/docs/node/install
  // Set environment variables for your credentials
  // Read more at http://twil.io/secure
  const accountSid = "ACc88dab16de0d7778d8a00d899baf5d4a";
  const authToken = "076e3375c1ff3ee2a33fa81e1c8619d6";
  const verifySid = "VA0b803b56061e0d4a3ae293393aed7a0b";
  const client = require("twilio")(accountSid, authToken);

  // Create a verification request
  client.verify.v2
    .services(verifySid)
    .verifications.create({ to: phoneNumber, channel: "sms" })
    .then((verification) => {
      // console.log(verification.status);
      // You can send a response to the client here if needed
      res.send("Verification request sent!");
    })
    .then(() => {
      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      readline.question("Please enter the OTP:", (enteredOtpCode) => {
        if (enteredOtpCode === otpCode) {
          client.verify.v2
            .services(verifySid)
            .verificationChecks.create({ to: phoneNumber, code: otpCode })
            .then((verification_check) => {
              // console.log(verification_check.status);
              // You can send a response to the client here if needed
              res.send("OTP verification status: " + verification_check.status);
            })
            .then(() => readline.close());
        } else {
          // Handle incorrect OTP code
          res.status(400).send("Incorrect OTP code");
          readline.close();
        }
      });
    });
});


app.get('/health', function(req,res) {
  res.status(200).json({msg: 'Server is running'})
})
// -------------------------------------------------------------------------------
const mqtt = require("mqtt");
const client = mqtt.connect('tls://9942400369fe41cea9a3c9bb8e6d23d5.s2.eu.hivemq.cloud', {
  username: 'amaltlili',
  password: 'Amaltlili91'
});

const client2 = mqtt.connect('tls://f8f43b3a505c48d7934f2734eb410119.s2.eu.hivemq.cloud', {
  username: 'hivemq.webclient.1683975887446',
  password: 'jf?!1W4GcY5xh3gPE;S<'
});
client.on('connect', function() {
  client.subscribe('waste_level');

  // console.log("client has been subscribed successfully");
});


function fetchDataAndSubscribe() {
  BinModel.find({}, (err, bins) => {
    if (err) {
      // console.error('Error fetching data:', err);
      return;
    }

    bins.forEach(bin => {
      const topicOuv = bin.topicOuv;
      const topicGaz = bin.topicGaz;
      const topicNiv = bin.topicNiv;

      // subscribe to topics Using Amal client
      client.subscribe(topicOuv, (err) => {
        if (err) {
          // console.error(`Error subscribing to topic ${topicOuv}:`, err);
          return;
        }
        // console.log(`Subscribed to topic ${topicOuv}`);
      });

      client.subscribe(topicGaz, (err) => {
        if (err) {
          // console.error(`Error subscribing to topic ${topicGaz}:`, err);
          return;
        }
        // console.log(`Subscribed to topic ${topicGaz}`);
      });

      client.subscribe(topicNiv, (err) => {
        if (err) {
          // console.error(`Error subscribing to topic ${topicNiv}:`, err);
          return;
        }
        // console.log(`Subscribed to topic ${topicNiv}`);
      });

      client.on('message', (topic, message) => {
        if (topic === topicOuv) {
          bin.valueOuv = message.toString();
          bin.save((err) => {
            if (err) {
              // console.error('Error saving bin:', err);
              return;
            }
            // console.log('Bin updated:', bin);
          });
        } else if (topic === topicGaz) {
          bin.gaz = message.toString();
          bin.save((err) => {
            if (err) {
              // console.error('Error saving bin:', err);
              return;
            }
            // console.log('Bin updated:', bin);
          });
        } else if (topic === topicNiv) {
          bin.niv = message.toString();
          bin.save((err) => {
            if (err) {
              // console.error('Error saving bin:', err);
              return;
            }
            // console.log('Bin updated:', bin);
          });
        }
      });

      // ------------------------------------------------------------------------------------
      // Subscribe to topics using aymen client
      client2.subscribe(topicOuv, (err) => {
        if (err) {
          // console.error(`Error subscribing to topic ${topicOuv}:`, err);
          return;
        }
        // console.log(`Subscribed to topic ${topicOuv}`);
      });

      client2.subscribe(topicGaz, (err) => {
        if (err) {
          // console.error(`Error subscribing to topic ${topicGaz}:`, err);
          return;
        }
        // console.log(`Subscribed to topic ${topicGaz}`);
      });

      client2.subscribe(topicNiv, (err) => {
        if (err) {
          // console.error(`Error subscribing to topic ${topicNiv}:`, err);
          return;
        }
        // console.log(`Subscribed to topic ${topicNiv}`);
      });

      client2.on('message', (topic, message) => {
        if (topic === topicOuv) {
          bin.valueOuv = message.toString();
          bin.save((err) => {
            if (err) {
              // console.error('Error saving bin:', err);
              return;
            }
            // console.log('Bin updated:', bin);
          });
        } else if (topic === topicGaz) {
          bin.gaz = message.toString();
          bin.save((err) => {
            if (err) {
              // console.error('Error saving bin:', err);
              return;
            }
            // console.log('Bin updated:', bin);
          });
        } else if (topic === topicNiv) {
          bin.niv = message.toString();
          bin.save((err) => {
            if (err) {
              // console.error('Error saving bin:', err);
              return;
            }
            // console.log('Bin updated:', bin);
          });
        }
      });
    });
  });
}
// Call the function to fetch data and subscribe to topics
fetchDataAndSubscribe();
// -------------------------------------------------------------------------------

const axios = require('axios');

app.post('/sendsms', (req, res) => {
  const { msg, tel } = req.body;
  // console.log(msg, tel)
  // console.log(msg);

  const username = 'admin';
  const password = 'expressmobidle$$2018';
  const authHeader = `Basic Auth ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  const headers = {
    'Content-Type': 'application/json',


    'Authorization': authHeader,


  };
const body = JSON.stringify({tel:tel, msg:msg})
  // Make a POST request to the SMS API
  axios.post('http://sms.expressdisplay.net/v1/sendsms', body, {
    headers,
  },

  )
    .then(response => {
      // Handle the API response
      // You can customize this based on your requirements
      res.json({
        success: true,
        message: 'SMS sent successfully',
        data: response.data,
      });
    })
    .catch(error => {
      // console.error('Error sending SMS:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
      });
    });
});




app.get('*', function(req, res){
  res.status(404).json({
    msg: "Api path not found."
  });
});

const PORT = process.env.PORT || 3000;
app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.red,
  ),
);



// hosted server https://news-app-native.herokuapp.com/