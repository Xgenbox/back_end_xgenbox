const medicineModel = require('../models/medicine.model');
const userModel = require('../models/userModel');

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




module.exports = {
    addMedicine,
    fetchMedicineByUserId


  }