const express = require('express');
const { ROLES, isRole, isResetTokenValid } = require('../security/Rolemiddleware');
const router = express.Router()
const {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  addToFav,
  getFavorites,
  removeFavorite,
  resetPassword,
  checkFavExistsOrNot,
  verifyEmail,
  forgotPassword,
  resendOTP,
  getUserByEmail,
  registerGoogleUser,
  resendOTPDeleteAccount,
  DeleteAccount,
  addAccessCode,
  getCurrentAccessList,
  getUsersCount,
  getAllUserDetails,
  getAllUserDetailsById,
  blockUser,
  deblockUser,
  getAllUserWhoHasASameAccessBin,
  CreateFeedback,
  deleteProfileAndUser
} = require('../controllers/userController');
const passport = require('passport');
const protect = require('../middleware/authMiddleware.js');
const { CreateReportOnuser, CreateSupport } = require('../controllers/Report.controller');
const { addMedicine, fetchMedicineByUserId } = require('../controllers/medicine.controller.js');

router.route('/').post(registerUser)
router.route('/login').post(authUser)
router.route('/createReport').post(passport.authenticate('jwt', {session: false}),CreateReportOnuser)
router.route('/createSupport').post(passport.authenticate('jwt', {session: false}),CreateSupport)
router.route('/createFeedback').post(passport.authenticate('jwt', {session: false}),CreateFeedback)
router.route('/addmedicine').post(passport.authenticate('jwt', {session: false}),addMedicine)
router.route('/fetchMedicineByUserId').get(passport.authenticate('jwt', {session: false}),fetchMedicineByUserId)
router.route("/getUserCounts").get(getUsersCount)
router.route("/deleteUserById/:idprofile/:id").get(deleteProfileAndUser)


router.route('/getUsers').get(getUsers)
  router.route('/getUserByEmail/:email').get(getUserByEmail)
  router.route('/registerGoogleUser').post(registerGoogleUser)
//   .put(protect, updateUser)
router.route('/verifyemail').post(verifyEmail)
router.route('/deleteaccount').post(DeleteAccount)
router.route("/forgot-password").post( forgotPassword )
router.route("/resendotp").post( resendOTP )
router.route("/resendOTPDeleteAccount").post( resendOTPDeleteAccount )
// router.post("/reset-password", resetPassword )
router.post("/reset-password",isResetTokenValid,  resetPassword )
// router.get("/addAccessCode",  addAccessCode )
router.route("/access/addAccess").put(passport.authenticate('jwt', {session: false}),addAccessCode)
router.route("/access/getCurrentAccessList").get(passport.authenticate('jwt', {session: false}),getCurrentAccessList)
router.route("/access/getAllUserWhoHasASameAccessBin").get(passport.authenticate('jwt', {session: false}),getAllUserWhoHasASameAccessBin)
router.get("/verify-token", isResetTokenValid, (req, res)=> {
  res.json({success:true})
})

router.route('/profile/password/reset').post(protect ,resetPassword);
router.route('/block/:id').put(blockUser);
router.route('/deblock/:id').put(deblockUser);
router.get('/checkTokenValidity', passport.authenticate('jwt', {session: false}), (req, res) => {
  // If the control reaches here, the token is valid
  res.status(200).json({ message: 'Token is valid' });
});

router
  .route('/:id')
//   .delete(protect, deleteUser)
  .get(getAllUserDetailsById)


module.exports = router