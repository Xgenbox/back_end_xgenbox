const validateRegisterCollectoInput = require('../validation/RegisterCollector.js')
const User = require('../models/userModel.js')
const QuoteMobileInputValidator = require("../validation/QuoteMobileRequestValidation.js")
const asyncHandler = require('express-async-handler')

const QuoteMobile = require("../models/QuoteMobile.Model.js")
const verificationTokenModels = require('../models/verificationToken.models.js')
const { generateOTP, generateEmailTemplate } = require('../utils/mail.js')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var mailer = require('../utils/mailer');


const createQuoteMobileRequest = async (req, res) => {
    const { isValid, errors } = QuoteMobileInputValidator(req.body); // You need to create an appointmentInputValidator function

    try {
        if (!isValid) {
            res.status(400).json(errors);
        } else {
            const { phone, firstName, lastName, preferredDate, type, comment,option , email} = req.body;
            req.body.status = 'in progress'
            const appointmentData = {
                user: req.user.id, // Set user to req.user.id
                phone,
                firstName,
                lastName,
                preferredDate,
                type,
                comment,
                status: req.body.status,
                option,
                email

            };

            // You can add any additional validation or processing logic here if needed.

            const appointment = await QuoteMobile.create(appointmentData);
            res.status(201).json({ data: appointment, success: true });
        }
    } catch (error) {
        res.status(500).json({ message: "Error creating appointment", error: error.message });
    }
};


const findQuoteMobile = async (req, res)=> {
    try {
        const appointments = await QuoteMobile.find({user:req.user.id});
        res.status(200).json({ data: appointments, success: true });
    } catch (error) {
        res.status(500).json({ message: "Error getting Quote", error: error.message });
    }
}
// module.exports = createAppointment;


module.exports = {

    createQuoteMobileRequest,
    findQuoteMobile

  };