const express = require('express');
const passport = require('passport');
const router = express.Router()


const { ROLES, isRole } = require('../security/Rolemiddleware');
const { registerUser, AddEntreprise } = require('../controllers/Entreprise.controller');
const {createAppointment, findAppointements, findAllAppointements} = require('../controllers/Appointment.controller');



router.route('/').post(passport.authenticate('jwt', {session: false}), createAppointment)
router.route('/findAppointmens').get(passport.authenticate('jwt', {session: false}), findAppointements)
router.route('/findAllAppointmens').get( findAllAppointements)
// router.route('/AddEntreprise').post( AddEntreprise)





module.exports = router