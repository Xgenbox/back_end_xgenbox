const medicineModel = require('../models/medicine.model');
const userModel = require('../models/userModel');
const WasteModel = require('../models/waste.model');
const addMedicine = async (req, res) => {
  try {
      const { name } = req.body; // Assuming that the medicine name is sent in the request body

      // Validate input (you may want to add more validation)
      if (!name) {
          return res.status(400).json({ error: 'Medicine name is required' });
      }

      // Check if the medicine name is already in use
      const existingMedicine = await medicineModel.findOne({ name });

      if (existingMedicine) {
          return res.status(400).json({ error: 'Medicine name is already in use' });
      }

      // Create a new medicine instance
      const newMedicine = new medicineModel({
          name,
      });

      // Save the medicine to the database
      await newMedicine.save();

      // Add the medicine to the user's medicine list
      const user = await userModel.findById(req.user._id);
      user.medicineList.push(newMedicine);
      await user.save();

      // Respond with success message
      res.status(201).json({ message: 'Medicine added successfully', data: newMedicine });
  } catch (error) {
      console.error('Error adding medicine:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


const fetchMedicineByUserId = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID is in the request parameters

        // Validate user ID
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find the user by ID and populate the medicineList
        const user = await userModel
            .findById(userId)
            .populate('medicineList'); // Assuming 'medicineList' is the field referencing the medicine model

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Respond with the populated medicine list
        res.status(200).json({ data: user.medicineList });
    } catch (error) {
        console.error('Error fetching medicines by user ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const fetchMedicineByID = async (req, res) => {
    const medicineID = req.params.id; // Assuming the ID is passed as a route parameter

    try {
      const medicine = await medicineModel.findById(medicineID); // Assuming you have a model named 'medicine1' for medicineSchema1

      if (!medicine) {
        // If medicine is not found, return an appropriate response
        return res.status(404).json({ error: 'medicine not found' });
      }

      // If medicine is found, return the medicine object in the response
      res.json(medicine);
    } catch (error) {
      // If any error occurs during the database query, return an error response
      res.status(500).json({ error: 'Internal server error' });
    }
  };

const updateMedicine = async (req, res)=> {
    const medicineID = req.params.id; // Assuming the ID is passed as a route parameter

    try {
      const medicine = await medicineModel.findById(medicineID); // Assuming you have a model named 'medicine1' for medicineSchema1

      if (!medicine) {
        // If medicine is not found, return an appropriate response
        return res.status(404).json({ error: 'medicine not found' });
      }

      // If medicine is found, update the medicine object and return it in the response
      medicine.name = req.body.name;
      await medicine.save();

      res.json(medicine);
    } catch (error) {
      // If any error occurs during the database query, return an error response
      res.status(500).json({ error: 'Internal server error' });
    }

}

const deleteMedicine = async (req, res)=> {
    const medicineID = req.params.id; // Assuming the ID is passed as a route parameter

    try {
      const medicine = await medicineModel.findById(medicineID); // Assuming you have a model named 'medicine1' for medicineSchema1

      if (!medicine) {
        // If medicine is not found, return an appropriate response
        return res.status(404).json({ error: 'medicine not found' });
      }

      // If medicine is found, delete the medicine object and return it in the response
      await medicine.delete();

      res.json(medicine);
    } catch (error) {
      // If any error occurs during the database query, return an error response
      res.status(500).json({ error: 'Internal server error' });
    }


}

const AddToWaste = async (req, res) => {
  try {
    // Assuming you have a unique identifier for the medicine, like an ID
    const medicineId = req.params.medicineId; // Adjust this according to your route

    // Find the medicine by ID
    const medicine = await medicineModel.findById(medicineId);

    // If medicine is not found, return an error or handle it accordingly
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    // Increment the wasteCount by 1
    medicine.wasteCount += 1;

    // Save the updated medicine
    await medicine.save();

    // Send a response or do something else as needed
    res.status(200).json({ message: 'Waste count incremented successfully', newWasteCount: medicine.wasteCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




module.exports = {
    addMedicine,
    fetchMedicineByUserId,
    fetchMedicineByID,
    updateMedicine,
    deleteMedicine,
    AddToWaste



  }