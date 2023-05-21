const BinModel = require("../models/Bin.model");
const mqtt = require("mqtt");
const pointBinV2 = require("../models/PointBinV2.Model");
const userModel = require("../models/userModel");
const client = mqtt.connect('tls://9942400369fe41cea9a3c9bb8e6d23d5.s2.eu.hivemq.cloud', {
  username: 'amaltlili',
  password: 'Amaltlili91'
});


const CreateBin2 = async (req, res) => {
  console.log(req.body);
  try {
    const {
      name,
      location,
      address,
      lat,
      long,
      type,
      capacity,
      gaz,
      niv,
      topicGaz,
      topicNiv,
      topicOuv
    } = req.body;

    // Check if the topics already exist
    const existingBin = await BinModel.findOne({
      $or: [
        { topicGaz },
        { topicNiv },
        { topicOuv }
      ]
    });

    if (existingBin) {
      return res.status(400).json({ success: false, error: 'Topics must be unique' });
    }

    // Create a new instance of Bin1 using the request body data
    const newBin = new BinModel({
      name,
      location,
      address,
      lat,
      long,
      type,
      capacity,
      status: false,
      gaz,
      niv,
      topicGaz,
      topicNiv,
      topicOuv
    });

    // Save the newBin instance to the database
    await newBin.save();

    res.status(201).json({ success: true, message: 'Bin created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Topics must be unique' });
  }
};


const fetchAllBins = async (req, res)=> {
  try {
    const bins = await BinModel.find();
    res.status(200).json({ success: true, bins });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch bins' });
  }
}


const FetchBinsNotInPointBin = async (req, res) => {
  try {
    // Fetch all bin IDs present in PointBinV2
    const pointBins = await pointBinV2.find().lean();
    const binIdsInPointBinV2 = pointBins.reduce((ids, pointBin) => {
      return ids.concat(pointBin.bins);
    }, []);

    // Fetch all bins that are not in PointBinV2
    const binsNotInPointBinV2 = await BinModel.find({ _id: { $nin: binIdsInPointBinV2 } }).lean();

    res.status(200).json(binsNotInPointBinV2);
  } catch (error) {
    console.error('Error fetching bins not in PointBinV2:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
};
// const updateStatus = async (req, res)=> {
//   try {
//     const { id } = req.params;
//     // const { status } = req.body;
//     const bin = await BinModel.findById(id);

//     if (!bin) {
//       return res.status(404).json({ success: false, error: 'Bin not found' });
//     }
//     console.log(bin.topicOuv)
//     bin.status = !bin.status;
//     await bin.save();
//     client.on("connect", function() {
//           client.publish(bin.topicOuv, !bin.status)
//           console.log("ok")
//         })
    
    

//     res.status(200).json({ success: true, message: 'Bin updated successfully', bin });
//   } catch (error) {
//     res.status(500).json({ success: false, error: 'Failed to update bin' });
//   }
// }
// const updateStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const bin = await BinModel.findById(id);

//     if (!bin) {
//       return res.status(404).json({ success: false, error: 'Bin not found' });
//     }

//     console.log(bin.topicOuv);
//     bin.status = !bin.status;
//     await bin.save();

//     client.publish(bin.topicOuv, JSON.stringify(!bin.status), (err) => {
//       if (err) {
//         console.error('Failed to publish message:', err);
//       } else {
//         console.log('Message published successfully');
//       }
//     });

//     res.status(200).json({ success: true, message: 'Bin updated successfully', bin });
//   } catch (error) {
//     console.error('Failed to update bin:', error);
//     res.status(500).json({ success: false, error: 'Failed to update bin' });
//   }
// };

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const bin = await BinModel.findById(id);

    if (!bin) {
      return res.status(404).json({ success: false, error: 'Bin not found' });
    }

    console.log(bin.topicOuv);
    bin.status = !bin.status;
    await bin.save();

    client.publish(bin.topicOuv, JSON.stringify(!bin.status), (err) => {
      if (err) {
        console.error('Failed to publish message:', err);
      } else {
        console.log('Message published successfully');
      }
    });

    setTimeout(async () => {
      bin.status = false;
      client.publish(bin.topicOuv, JSON.stringify(bin.status),async (err) => {
        if (err) {
          console.error('Failed to publish message:', err);
        } else {
          console.log('Message published successfully');
          await bin.save();
          console.log('Status updated to false after 20 seconds');
        }
      });
      
      
    }, 10000);

    res.status(200).json({ success: true, message: 'Bin updated successfully', bin });
  } catch (error) {
    console.error('Failed to update bin:', error);
    res.status(500).json({ success: false, error: 'Failed to update bin' });
  }
};


const fetchBinByID = async (req, res) => {
  const binID = req.params.id; // Assuming the ID is passed as a route parameter

  try {
    const bin = await BinModel.findById(binID); // Assuming you have a model named 'Bin1' for binSchema1

    if (!bin) {
      // If bin is not found, return an appropriate response
      return res.status(404).json({ error: 'Bin not found' });
    }

    // If bin is found, return the bin object in the response
    res.json(bin);
  } catch (error) {
    // If any error occurs during the database query, return an error response
    res.status(500).json({ error: 'Internal server error' });
  }
};


const fetchAccessListBinByUser = async (req, res) => {
  const { _id } = req.user;

  try {
    // Assuming you have imported the 'User' model and the 'PointBinV2' model

    // Find the user by their ID
    const user = await userModel.findById(_id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Retrieve the access list bins for the user
    const accessListBins = await pointBinV2.find({ _id: { $in: user.accessListBins } });

    res.status(200).json(accessListBins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// const OpenBinByIDBin = async (req, res) => {
//   const { id } = req.params;
//   const { _id } = req.user;

//   try {
//     // Assuming you have imported the 'User' model and the 'PointBinV2' model

//     // Find the user by their ID and populate the 'accessListBins' field
//     const user = await userModel.findById(_id).populate('accessListBins');
    

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
// console.log("user :", user)
//     // Check if the point bin exists in the user's access list
//     const accessBin = user.accessListBins.find(bin => bin._id.toString() === id);
//     if (!accessBin) {
//       return res.status(403).json({ message: 'Access denied' });
//     }

//     // Find the bin in the PointBinV2 model by its ID
//     const bin = await BinModel.findById(id);

//     if (!bin) {
//       return res.status(404).json({ message: 'Bin not found' });
//     }

//     // Update the status of the bin to false
//     bin.status = false;
//     await bin.save();

//     res.status(200).json({ message: 'Bin opened successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

const OpenBinByIDBin = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  console.log(id)

  try {
    // Assuming you have imported the 'User' model and the 'PointBinV2' model

    // Find the user by their user_id
    const user = await userModel.findById(_id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Search the user's accessListBins for a bin with the specified idBin
    const PointBin1 = await pointBinV2.find()
   
    const matchingPointBins = PointBin1?.filter((pointBin) =>
      pointBin.bins.includes(id)
    );

    if (matchingPointBins.length === 0) {
      return res.status(404).json({ error: 'PointBin not found' });
    }

    console.log('PointBin', matchingPointBins)
    console.log('user', user.accessListBins?.filter((pointBin) =>
      pointBin == matchingPointBins[0]._id.toString()))

    const matchingPointid = user.accessListBins?.filter((pointBin) =>
      pointBin == matchingPointBins[0]._id.toString()
    );

    if (matchingPointid.length === 0) {
      return res.status(404).json({ error: 'you dont have access' });
    }

    const bin = await BinModel.findById(id)
    console.log(bin)
    if (!bin) {
      return res.status(404).json({ success: false, error: 'Bin not found' });
    }
    bin.status = false;
     client.publish(bin.topicOuv, JSON.stringify(false), async (err) => {
      if (err) {
        console.error('Failed to publish message:', err);
      } else {
        await bin.save();
        console.log('Message published successfully');
      }
    });

    setTimeout(async () => {
      bin.status = true;
      client.publish(bin.topicOuv, JSON.stringify(true),async (err) => {
        if (err) {
          console.error('Failed to publish message:', err);
        } else {
          console.log('Message published successfully');
          await bin.save();
          console.log('Status updated to false after 20 seconds');
        }
      });
      
      
    }, 10000);


    res.status(200).json({ success: true, message: 'Bin updated successfully', bin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const findBinByID = async(res, req)=> {

}

module.exports = 
{
  CreateBin2,
  fetchAllBins,
  updateStatus,
  FetchBinsNotInPointBin,
  fetchBinByID,
  fetchAccessListBinByUser,
  OpenBinByIDBin
}