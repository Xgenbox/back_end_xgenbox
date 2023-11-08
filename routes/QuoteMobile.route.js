const express = require('express');
const passport = require('passport');
const router = express.Router()


const { ROLES, isRole } = require('../security/Rolemiddleware');
const { registerUser, AddEntreprise } = require('../controllers/Entreprise.controller');
const {createAppointment, findAppointements} = require('../controllers/Appointment.controller');
const { createQuoteMobileRequest, findQuoteMobile } = require('../controllers/Quote.controller');



router.route('/').post(passport.authenticate('jwt', {session: false}), createQuoteMobileRequest)
router.route('/findQuoteMobile').get(passport.authenticate('jwt', {session: false}), findQuoteMobile)
// router.route('/AddEntreprise').post( AddEntreprise)





module.exports = router