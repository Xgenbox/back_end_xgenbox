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
      topicOuv,
      governorate,
      municipale
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
      status: true,
      gaz,
      niv,
      topicGaz,
      topicNiv,
      topicOuv,
      governorate,
      municipale
    });

    // Save the newBin instance to the database
    await newBin.save();

    res.status(201).json({ success: true, message: 'Bin created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Topics must be unique' });
  }
};

const UpdateBin = async (req, res) => {
  const id = req.params.id; // Assuming the bin ID is passed as a parameter

  try {
    const existingBin = await BinModel.findOne({
      $and: [
        { _id: { $ne: id } }, // Exclude the current bin being updated
        {
          $or: [
            { topicGaz: req.body.topicGaz },
            { topicNiv: req.body.topicNiv },
            { topicOuv: req.body.topicOuv }
          ]
        }
      ]
    });

    if (existingBin) {
      return res.status(400).json({ success: false, error: 'Topics must be unique' });
    }
    const updatedBin = await BinModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true } // Return the updated bin after the update is applied
    );

    res.status(200).json(updatedBin);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the bin.' });
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

const OpenBinByIDBin = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  try {
    // Assuming you have imported the 'User' model and the 'PointBinV2' model

    // Find the user by their ID and populate the 'accessListBins' field
    const user = await userModel.findById(_id).populate('accessListBins')


    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
const PointBin1 = await pointBinV2.find()
    // Search the user's accessListBins for a bin with the specified idBin
    const matchingPointBins = PointBin1?.filter((pointBin) =>
      pointBin.bins.includes(id)
    );
    // If the bin is found, return the bin
    if (matchingPointBins.length === 0) {
      return res.status(404).json({ error: 'PointBin not found' });
    }
    console.log("User access list bin", user.accessListBins)
    // const accessBin = user.accessListBins.find(bin => bin._id.toString() === id);
    const accessBin = user.accessListBins.flatMap(el => {
      return el.bins.filter(bin => {
        console.log("-----------", bin._id.toString() === id);
        return bin._id.toString() === id;
      });
    });
    console.log("Accesss",accessBin )
    console.log("Accesss",accessBin.length)
    if (accessBin.length===0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // return res.status(200).json(matchingPointBins);

    // Find the bin in the PointBinV2 model by its ID
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
        console.log('Message published successfully');
        await bin.save();
      }
    });

    setTimeout(async () => {
      bin.status = true;
      // client.publish(bin.topicOuv, JSON.stringify(true),async (err) => {
      //   if (err) {
      //     console.error('Failed to publish message:', err);
      //   } else {
      //     console.log('Message published successfully');
      //     console.log('Status updated to false after 20 seconds');
      //   }
      // });
          await bin.save();


    }, 30000);


    res.status(200).json({ success: true, message: 'Bin updated successfully', bin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const fetchAllPointBinsAndHerBinsByUserId = async (req, res) => {
  const {_id} = req.user
  try {
     // Assuming the user ID is passed as a parameter in the request

    // 1. Fetch the user by ID
    const user = await userModel.findById(_id).populate('accessListBins');
    // console.log(user)

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Get the list of accessListBins for the user
    const accessListBins = user.accessListBins;

    // 3. Fetch all PointBins and populate their bins
    const pointBins = await pointBinV2.find().populate({
      path: 'bins',
      model: 'Bin1',
    });
    console.log("access :",accessListBins)

    // 4. Filter the pointBins based on the accessListBins of the user
    const filteredPointBins = pointBins.filter((pointBin) =>
  accessListBins.some((e) => e._id.toString() === pointBin._id.toString())
);
    accessListBins.map(e=>{
      console.log("Id:",e._id.toString())
      // return e._id == pointBin._id
    })
    console.log("--------------------",filteredPointBins)

    return res.status(200).json({ pointBins: filteredPointBins });
  } catch (error) {
    console.error('Error fetching point bins:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};


const deleteBin = async(req, res)=> {
  const { id } = req.params;
  try {
    const bin = await BinModel.findById(id);
    if (!bin) {
      return res.status(404).json({ error: 'Bin not found' });
    }
    await bin.remove();
    res.status(200).json({ success: true, message: 'Bin deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

const FetchBinsNotInPointBinByMunicipal = async (req, res) => {
  const {municipal} = req.params
  try {
    // Find all bin IDs present in PointBinV2
    const pointBins = await pointBinV2.find({municipale:municipal}).exec();
    const binIdsInPointBin = pointBins.reduce((ids, pointBin) => {
      return ids.concat(pointBin.bins);
    }, []);

    // Find all bins that are not in PointBinV2
    const binsNotInPointBin = await BinModel.find({
      municipale:municipal,
      _id: { $nin: binIdsInPointBin },
    }).exec();

    res.status(200).json({ bins: binsNotInPointBin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const FetchBinsNotInPointBins = async (req, res) => {

  try {
    // Find all bin IDs present in PointBinV2
    const pointBins = await pointBinV2.find({}).exec();
    const binIdsInPointBin = pointBins.reduce((ids, pointBin) => {
      return ids.concat(pointBin.bins);
    }, []);

    // Find all bins that are not in PointBinV2
    const binsNotInPointBin = await BinModel.find({

      _id: { $nin: binIdsInPointBin },
    }).exec();

    res.status(200).json({ bins: binsNotInPointBin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports =
{
  CreateBin2,
  fetchAllBins,
  updateStatus,
  FetchBinsNotInPointBin,
  fetchBinByID,
  fetchAccessListBinByUser,
  OpenBinByIDBin,
  fetchAllPointBinsAndHerBinsByUserId,
  deleteBin,
  UpdateBin,
  FetchBinsNotInPointBinByMunicipal,
  FetchBinsNotInPointBins
}