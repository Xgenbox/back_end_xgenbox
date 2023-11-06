const express = require('express');
const passport = require('passport');
const router = express.Router()


const { ROLES, isRole } = require('../security/Rolemiddleware');
const { registerUser, AddCollector, findSingleCollector } = require('../controllers/Collector.controller');


router.route('/').post( registerUser)
router.route('/AddCollector').post( AddCollector)
// get single Collector
router.route('/getCollector').get( passport.authenticate('jwt', {session: false}), findSingleCollector )




module.exports = router