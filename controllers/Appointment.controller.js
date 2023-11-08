const validateRegisterCollectoInput = require('../validation/RegisterCollector.js')
const User = require('../models/userModel.js')
const appointmentInputValidator = require("../validation/AppointmentValidation.js")
const asyncHandler = require('express-async-handler')

const Appointment = require("../models/Appointment.model.js")
const verificationTokenModels = require('../models/verificationToken.models.js')
const { generateOTP, generateEmailTemplate } = require('../utils/mail.js')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var mailer = require('../utils/mailer');


const createAppointment = async (req, res) => {
    const { isValid, errors } = appointmentInputValidator(req.body); // You need to create an appointmentInputValidator function

    try {
        if (!isValid) {
            res.status(400).json(errors);
        } else {
            const { phone, firstName, lastName, preferredDate, reason, comment } = req.body;
            req.body.status = 'in progress'
            const appointmentData = {
                user: req.user.id, // Set user to req.user.id
                phone,
                firstName,
                lastName,
                preferredDate,
                reason,
                comment,
                status: req.body.status,

            };

            // You can add any additional validation or processing logic here if needed.

            const appointment = await Appointment.create(appointmentData);
            res.status(201).json({ data: appointment, success: true });
        }
    } catch (error) {
        res.status(500).json({ message: "Error creating appointment", error: error.message });
    }
};


const findAppointements = async (req, res)=> {
    try {
        const appointments = await Appointment.find({user:req.user.id});
        res.status(200).json({ data: appointments, success: true });
    } catch (error) {
        res.status(500).json({ message: "Error getting appointments", error: error.message });
    }
}
// module.exports = createAppointment;
const findAllAppointements = async (req, res)=> {
    try {
        const appointments = await Appointment.find({});
        res.status(200).json({ data: appointments, success: true });
    } catch (error) {
        res.status(500).json({ message: "Error getting appointments", error: error.message });
    }
}

module.exports = {

    createAppointment,
    findAppointements,
    findAllAppointements

  };