const express = require('express');
const passport = require('passport');
const router = express.Router()


const { ROLES, isRole } = require('../security/Rolemiddleware');
const { registerUser, AddEntreprise } = require('../controllers/Entreprise.controller');



router.route('/').post( registerUser)
router.route('/AddEntreprise').post( AddEntreprise)





module.exports = router