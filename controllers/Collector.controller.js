const validateRegisterCollectoInput = require('../validation/RegisterCollector.js')
const User = require('../models/userModel.js')
const CollectorAddInputValidator = require("../validation/CollectorValidation.js")
const asyncHandler = require('express-async-handler')

const CollectorModel = require("../models/Collector.model.js")
const verificationTokenModels = require('../models/verificationToken.models.js')
const { generateOTP, generateEmailTemplate } = require('../utils/mail.js')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var mailer = require('../utils/mailer');
const registerUser = asyncHandler(async (req, res, next) => {
    const { errors, isValid } = validateRegisterCollectoInput(req.body)
    const {avatar} = req.body;
    console.log(req.body)


    try {
      if (!isValid) {
        res.status(404).json(errors);
      } else {
        User.findOne({ email: req.body.email })
          .then(async exist => {
            if (exist) {
              res.status(404).json({success:false, email: "Email already exist" })
            } else {
              // req.body.role = "USER"
              const user = new User({
                name: req.body.firstName + " "+req.body.lastName,
                email: req.body.email,
                password: bcrypt.hashSync(req.body.password, 10),
                role: req.body.role,


              })

              const OTP = generateOTP()
              const verificationToken = new verificationTokenModels({
                owner: user._id,
                token: OTP
              })
              await verificationToken.save()
                .then(token => {
                  console.log(token)
                })
                .catch(err => {
                  console.log(err)
                })

              mailer.send({
                to: ["zbousnina@yahoo.com",user.email ],
                subject: "Verification code",
                html: generateEmailTemplate(OTP)
              }, (err)=>{
                console.log(err)
              })

              user.save()
                .then(user => {
                  if(req.body.role==="Collector" || req.body.role=== "PRIVATE_COMPANY"){
                    console.log("Collector")
                    const token = jwt.sign(
                      {
                        id: user._id,

                        email: user.email,
                        role: user.role,


                      },
                      process.env.SECRET_KEY,
                      { expiresIn: Number.MAX_SAFE_INTEGER }
                    );
                    responseSent = true;
                    return res.header("auth-token", token).status(200).json({ status: true, token: "Bearer " + token });
                  }else{
                    console.log("user", )



                    res.status(200).json({ success: true,user, msg: 'A Otp has been sent to your registered email address.'} )
                  }
                })
                .catch(err => {
                  console.log(err)
                  res.status(500).json({ success:false, message: "error" })
                })

            }
          })
      }



    } catch (error) {
      res.status(500).json({ message: error })
      console.log(error)

    }
  })

  const AddCollector = async (req, res) => {
    const { isValid, errors } = CollectorAddInputValidator(req.body);
    console.log(req.body)

    try {
      if (!isValid) {
        return res.status(400).json(errors); // Return a 400 Bad Request status for invalid data
      }
      req.body.status = 'in progress'
      // Assuming you have already imported the 'Collector' model
      const collectorData = {
        user: req.body.userId, // Assuming userId is the reference to the 'User' model
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        entityType: req.body.entityType,
        status: req.body.status,
        companyName: req.body.companyName,
      };

      const newCollector = new CollectorModel(collectorData);

      // Save the new collector document to the database
      await newCollector.save();

      // Respond with a success message or the newly created collector data
      res.status(201).json({ message: "Collector created successfully", collector: newCollector });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  };

  const findSingleCollector = async(req, res)=>{
    var userId = req.query.id;

    try {
       const data = await CollectorModel.find({user: req.user.id}).populate('user', ['name', 'email', 'role'])
       res.status(200).json(...data)

    } catch (error) {
        res.status(500).json({message: error.message})

    }
}

const findInProgressCollectors = async (req, res) => {
  try {
      const collectorsInProgress = await CollectorModel.find({ status: 'in progress' }).populate('user', ['name', 'email', 'role']);
      res.status(200).json(collectorsInProgress);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
}

const changeStatusToValid = async (req, res) => {
  const collectorId = req.params.id; // Assuming the collector ID is in the URL parameters

  try {
      // Find the collector by ID
      const collector = await CollectorModel.findById(collectorId);

      if (!collector) {
          return res.status(404).json({ message: 'Collector not found' });
      }

      // Update the status to 'valid'
      collector.status = 'valid';

      // Save the updated collector
      await collector.save();

      res.status(200).json({ message: 'Collector status updated to valid' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};



  module.exports = {
    AddCollector,
    registerUser,
    findSingleCollector,
    findInProgressCollectors,
    changeStatusToValid

  };