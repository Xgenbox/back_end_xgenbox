const asyncHandler = require('express-async-handler')
const generateToken = require('../utils/generateToken.js')
const User = require('../models/userModel.js')
const cleaningModel = require('../models/cleaningSercice.model.js')
var crypto = require('crypto');
var mailer = require('../utils/mailer');
const { generateOtp,verifyOtp } = require('../utils/otp.js');
const validateRegisterInput = require('../validation/Register')
const validateGoogleRegisterInput = require('../validation/Register')
const validateFeedbackInput = require('../validation/FeedbackValidation')
const validateLoginInput = require('../validation/login')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verificationTokenModels = require("../models/verificationToken.models");
const { generateOTP, mailTransport, generateEmailTemplate, plainEmailTemplate, generatePasswordResetTemplate, generateEmailTemplateDeleterAccount } = require("../utils/mail");
const { isValidObjectId } = require('mongoose');
const { sendError, createRandomBytes } = require("../utils/helper");
const resetTokenModels = require("../models/resetToken.models");
const imageToBase64 = require("image-to-base64");
const multer = require('multer')
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const { OAuth2Client } = require('google-auth-library');
const Access = require('../models/access.model.js');
const profileModels = require("../models/profile.models")
const accessModel = require("../models/access.model");
const pointBinV2 = require('../models/PointBinV2.Model.js');
const FeedbackModel = require('../models/Feedback.Model.js');
const scoreModel = require('../models/score.model.js');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
let responseSent = false;
// let responseSent = false;
const authUser = async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  try {
    if (isValid) {
      const user = await User.findOne({ email: req.body.email });
      if (user && user.googleId) {
        errors.email = "Cannot login with email and password. Please use Google Sign In.";
        responseSent = true;
                return res.status(400).json(errors);
              }

      console.log(user)
      if (!user) {
        errors.email = "Email not found";
        responseSent = true;
        return res.status(404).json(errors);
      }
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (isMatch) {
        const token = jwt.sign(
          {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            verified:user.verified,
            profile: user.profile,
            isBlocked:user.isBlocked
          },
          process.env.SECRET_KEY,
          { expiresIn: Number.MAX_SAFE_INTEGER }
        );
        responseSent = true;
        return res.header("auth-token", token).status(200).json({ status: true, token: "Bearer " + token });
      } else {
        errors.password = "Password incorrect";
        responseSent = true;
        return res.status(404).json(errors);
      }
    } else {
      responseSent = true;
      return res.status(404).json(errors);
    }
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.log(error);
      console.log("hi")
      return res.status(500).json({success:false, message: "error" });
    }
  }

}

const addAccessCode = async(req, res)=> {
  const {code} = req.body
  const {_id} = req.user
  console.log(code)
  console.log(_id)

  console.log("code")
  try {

      const access = await pointBinV2.findOne({ code: code });
      if(!access) {
        return res.status(404).json({success:false, message: "code not found" });
      }

      const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
     // Check if access._id is already in the user's accessListBins array
     const accessId = access._id.toString();
     if (user.accessListBins.includes(accessId)) {
       return res.status(400).json({ success: false, message: "Access code already added" });
     }
    user.accessListBins.push(access._id);
    await user.save();



    res.status(200).json({ success: true, message: "Access added successfully" });



  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.log(error);
      console.log("hi")
      return res.status(500).json({success:false, message: "error" });
    }
  }
}

const getCurrentAccessList = async(req, res)=> {
  const {_id} = req.user
  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    // const accessList = await accessModel.find({ _id: { $in: user.accessListBins } }).populate('company');
    const accessList = await User.findById(_id).populate("accessListBins")
    res.status(200).json({ success: true, accessList });
  } catch (error) {
    if (!responseSent) {
      responseSent = true;
      console.log(error);
      console.log("hi")
      return res.status(500).json({success:false, message: "error" });
    }
  }

}


// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
  const { errors, isValid } = validateRegisterInput(req.body)
  const {avatar} = req.body;

  console.log(avatar)

  try {
    if (!isValid) {
      res.status(404).json(errors);
    } else {
      User.findOne({ email: req.body.email })
        .then(async exist => {
          if (exist) {
            res.status(404).json({success:false, email: "Email already exist" })
          } else {
            // req.body.role = "USER"
            const user = new User({
              name: req.body.name,
              email: req.body.email,
              password: bcrypt.hashSync(req.body.password, 10),
              role: req.body.role,
              verified:true


            })

            const OTP = generateOTP()
            const verificationToken = new verificationTokenModels({
              owner: user._id,
              token: OTP
            })
            await verificationToken.save()
              .then(token => {
                console.log(token)
              })
              .catch(err => {
                console.log(err)
              })

            mailer.send({
              to: ["zbousnina@yahoo.com",user.email ],
              subject: "Verification code",
              html: generateEmailTemplate(OTP)
            }, (err)=>{
              console.log(err)
            })

            user.save()
              .then(user => {
                if(req.body.role==="MUNICIPAL" || req.body.role=== "PRIVATE_COMPANY"){
                  console.log("municipal")
                  const token = jwt.sign(
                    {
                      id: user._id,

                      email: user.email,
                      role: user.role,


                    },
                    process.env.SECRET_KEY,
                    { expiresIn: Number.MAX_SAFE_INTEGER }
                  );
                  responseSent = true;
                  return res.header("auth-token", token).status(200).json({ status: true, token: "Bearer " + token });
                }else{

                  res.status(200).json({ success: true,user, msg: 'A Otp has been sent to your registered email address.'} )
                }
              })
              .catch(err => {
                console.log(err)
                res.status(500).json({ success:false, message: "error" })
              })

          }
        })
    }



  } catch (error) {
    res.status(500).json({ message: error })
    console.log(error)

  }
})
const deleteUserById = async (req, res) => {
  const userId = req.params.id;
  const profileId = req.params.idprofile;

  try {
      // Find the user by ID and delete it
      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'User deleted successfully', deletedUser });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};
const deleteProfileAndUser = async (req, res) => {
  const userId = req.params.id;
  const profileId = req.params.idprofile;

  try {
    // Find the profile by ID and delete it
    const deletedProfile = await profileModels.findByIdAndDelete(profileId);

    if (!deletedProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // If userId is not null, delete the user
    if (userId!=="0") {
      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    res.status(200).json({ message: 'Profile and User deleted successfully', deletedProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerGoogleUser = asyncHandler(async (req, res, next) => {
  console.log('hi')
  console.log(req.body);
  const { errors, isValid } = validateGoogleRegisterInput(req.body)
  const { avatar } = req.body;


  try {
    if (!isValid) {
      res.status(404).json(errors);
    } else {
      const { email, name, googleId, tokenId } = req.body;
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      // console.log("Client************:", client)
      // Verify the user's identity with Google
      const response = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      // console.log("response************:", response)
      // const { data } = await google.oauth2('v2').tokeninfo({
      //   access_token: tokenId,
      // });
      const data = response.payload;
      console.log("data------------", data)

      // Check if the user's email matches the one from Google
      if (data.email !== email) {
        res.status(404).json({ success: false, email: "Email does not match" });
      } else {
        // Check if the user already exists in the database
        let user = await User.findOne({ email: email });

        if (user) {
          // If user exists, return error message
          // const token = generateToken(user)
          const token = jwt.sign(
            {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              verified:user.verified,
              profile: user.profile,
              avatar: user.avatar,
            },
            process.env.SECRET_KEY,
            { expiresIn: Number.MAX_SAFE_INTEGER }
          );
          responseSent = true;
          return res.header("auth-token", token).status(200).json({ status: true, token: "Bearer " + token });

          // return res.header("auth-token", token).status(200).json({ success: true, token: "Bearer " + token })
          // res.status(400).json({ success: false, email: "Email already exists" });
        } else {
          // Create a new user
          req.body.verified = true;
          user = new User({
            name,
            email,
            googleId,
            avatar,
            verified:req.body.verified
          });
          await user.save();
          let user2 = await User.findOne({ email: email });
          console.log("user2", user2)

          // Save user to database

          // Generate and return token
          // const token = generateToken(user);
          const token = jwt.sign(
            {
              id: user2._id,
              name: user2.name,
              email: user2.email,
              role: user2.role,
              verified:user2.verified,
              profile: user2.profile,
              avatar: user2.avatar,
            },
            process.env.SECRET_KEY,
            { expiresIn: Number.MAX_SAFE_INTEGER }
          );
          responseSent = true;
          return res.header("auth-token", token).status(200).json({ status: true, token: "Bearer " + token });
          // res.status(201).json({ success: true, token, user });
          // return res.header("auth-token", token).status(200).json({ success: true, token: "Bearer " + token })
        }
      }
    }
  } catch (error) {
    console.log("Catch hello")
    next(error);
  }
});

// @desc    Register a new user
// @route   POST /api/users/resendotp
// @access  Public
const resendOTP = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({success:false, error: "Email not found" });
    } else if(user.verified){
      return res.status(404).json({success:false, error: "Email already verified" });
    } else {
      const OTP = generateOTP();

      // Find and delete existing verification token for the user
      await verificationTokenModels.findOneAndDelete({ owner: user._id });

      const verificationToken = new verificationTokenModels({
        owner: user._id,
        token: OTP,
      });
      await verificationToken.save();
      mailer.send(
        {
          to: ["zbousnina@yahoo.com", user.email],
          subject: "Verification code",
          html: generateEmailTemplate(OTP),
        },
        (err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
          }
        }
        );
        res.status(200).json({ OTP: {success:true ,message: "OTP sent" }});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
  }
};
const resendOTPDeleteAccount = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({success:false, error: "Email not found" });
    // } else if(user.verified){
    //   return res.status(404).json({success:false, error: "Email already verified" });
    } else {
      const OTP = generateOTP();

      // Find and delete existing verification token for the user
      await verificationTokenModels.findOneAndDelete({ owner: user._id });

      const verificationToken = new verificationTokenModels({
        owner: user._id,
        token: OTP,
      });
      await verificationToken.save();
      mailer.send(
        {
          to: ["zbousnina@yahoo.com", user.email],
          subject: "Verification code",
          html: generateEmailTemplateDeleterAccount(OTP),
        },
        (err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
          }
        }
        );
        res.status(200).json({ OTP: {success:true ,message: "OTP sent" }});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ OTP: {success:false ,message: "Error sending OTP email" }});
  }
};

// @desc    Verify user email
// @route   POST /api/users/verifyemail
// @access  Public
const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;
  console.log(userId, otp)
  if (!userId || !otp.trim()) {
    return sendError(res, 'Invalid request, missing parameters!');
  }

  if (!isValidObjectId(userId)) {
    return sendError(res, 'Invalid user id!');
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 'Sorry! User not found!');
  }

  if (user.verified) {
    return sendError(res, 'This account is already verified!');
  }

  const token = await verificationTokenModels.findOne({ owner: user._id });
  if (!token) {
    // return sendError(res, 'Sorry, user not found');
    return sendError(res, 'Please resend OTP');
  }

  const isMatched = await token.compareToken(otp);
  if (!isMatched) {
    return sendError(res, 'Please provide a valid token!');
  }

  user.verified = true;
  await verificationTokenModels.findByIdAndDelete(token._id);
  await user.save();

  mailer.send({
        to: ["zbousnina@yahoo.com",user.email ],
        subject: "Verification code",
        html: plainEmailTemplate("Email Verified Successfully",
        "Your email has been verified successfully!"
      )
      }, (err)=>{
        console.log(err)
      })

  res.status(200).json({success:true, message: "Email verified successfully" });
};

const DeleteAccount = async (req, res) => {
  const { userId, otp } = req.body;
  // console.log(userId, otp)
  console.log(req.body)

  if (!userId || !otp.trim()) {
    return sendError(res, 'Invalid request, missing parameters!');
  }

  if (!isValidObjectId(userId)) {
    return sendError(res, 'Invalid user id!');
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 'Sorry! User not found!');
  }

  const token = await verificationTokenModels.findOne({ owner: user._id });
  if (!token) {
    return sendError(res, 'Please resend OTP');
  }

  const isMatched = await token.compareToken(otp);
  if (!isMatched) {
    // console.log(res.statusCode)
    return sendError(res, 'Please provide a valid token!');
  }

  await verificationTokenModels.findByIdAndDelete(token._id);
  await user.remove();

  mailer.send({
        to: ["zbousnina@yahoo.com", user.email],
        subject: "Account Deleted Successfully",
        html: plainEmailTemplate("Account Deleted Successfully",
        "Your account has been deleted successfully!"
      )
      }, (err)=>{
        console.log(err)
      })

  res.status(200).json({success:true, message: "Account deleted successfully" });
};


// @desc    Forgot password
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  console.log(req.body.email)
  const { email } = req.body;
  if (!email) {
    return sendError(res, 'Please provide a valid email!');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return sendError(res, 'Sorry! User not found!');
  }

  const token = await resetTokenModels.findOne({ owner: user._id });
  if (token ) {
    return sendError(res, 'You can request a new token after one hour!');
  }

  const resetToken = await createRandomBytes();
  // const resetTokenExpire = Date.now() + 3600000;

  const newToken = new resetTokenModels({
    owner: user._id,
    token: resetToken


  });

  await newToken.save();

  mailer.send({
    to: ["zbousnina@yahoo.com",user.email ],
    subject: "Verification code",
    html: generatePasswordResetTemplate(`https://reset-password-xgenbox.netlify.app/reset-password?token=${resetToken}&id=${user._id}`)
  }, (err)=>{
    console.log(err)
  })

  res.status(200).json({ message: 'Reset password link has been sent to your email!' });
};
const forgotPasswordWithCode = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return sendError(res, 'Please provide a valid email!');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return sendError(res, 'Sorry! User not found!');
  }

  const token = await resetTokenModels.findOne({ owner: user._id });
  if (token ) {
    return sendError(res, 'You can request a new token after one hour!');
  }

  const resetToken = await createRandomBytes();
  // const resetTokenExpire = Date.now() + 3600000;

  const newToken = new resetTokenModels({
    owner: user._id,
    token: resetToken


  });

  await newToken.save();

  mailer.send({
    to: ["zbousnina@yahoo.com",user.email ],
    subject: "Verification code",
    html: generatePasswordResetTemplate(`https://reset-password-xgenbox.netlify.app/reset-password?token=${resetToken}&id=${user._id}`)
  }, (err)=>{
    console.log(err)
  })

  res.status(200).json({ message: 'Reset password link has been sent to your email!' });
};

// @desc    Reset password
// @route   POST /api/users/resetpassword
// @access  Public
const resetPassword = async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return sendError(res, 'User not found');
  }

  const isSamePassword = await user.comparePassword(password);
  if (isSamePassword) {
    return sendError(res, 'You cannot use the same password');
  }

  if (password.trim().length < 8 || password.trim().length > 20) {
    return sendError(res, 'Password must be between 8 and 20 characters');
  }

  // user.password = password.trim();
  user.password = bcrypt.hashSync(password.trim(), 10);
  await user.save();

  await resetTokenModels.findOneAndDelete({ owner: user._id });

  mailTransport().sendMail(
    {
      from: 'security@email.com',
      to: user.email,
      subject: 'Reset Password successfully',
      html: plainEmailTemplate('Password reset successfully', 'Your password has been reset successfully!'),
    },
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );
  mailer.send({
    to: ["zbousnina@yahoo.com",user.email ],
    subject: "Verification code",
    html: plainEmailTemplate('Password reset successfully', 'Your password has been reset successfully!'),
  }, (err)=>{
    console.log(err)
  })

  res.status(200).json({ message: 'Password reset successfully', success:true });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
// const getUserProfile = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id)

//   if (user) {
//     res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       avatar: user.avatar,
//       favorites: user.favorites,
//       otp: user.otp
//     })
//   } else {
//     res.status(404)
//     throw new Error('User not found')
//   }
// })

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
// const updateUserProfile = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id)

//   if (user) {
//     user.name = req.body.name || user.name;
//     user.email = req.body.email || user.email;
//     user.avatar = req.body.avatar || user.avatar;
//     if (req.body.password) {
//       user.password = req.body.password
//     }

//     const updatedUser = await user.save()

//     res.json({
//       _id: updatedUser._id,
//       name: updatedUser.name,
//       email: updatedUser.email,
//       avatar: updatedUser.avatar,
//       token: generateToken(updatedUser._id),
//     })
//   } else {
//     res.status(404)
//     throw new Error('User not found')
//   }
// })

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
// const getUsers = asyncHandler(async (req, res) => {
//   const users = await User.find({})
//   res.json(users)
// })

const getUsers = asyncHandler(async (req, res) => {
  const users = await profileModels.find({}).populate('user')
  res.json(users)
})
// const getUsersCount = async (req, res) => {
//   const usersCount = await User.aggregate([
//     {
//       $group: {
//         _id: '$role',
//         count: { $sum: 1 }
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         role: '$_id',
//         count: 1
//       }
//     }
//   ]);

//   res.json(usersCount);
// };
const getUsersCount = async (req, res) => {
  const currentDate = new Date();
  const lastDayDate = new Date();
  lastDayDate.setDate(currentDate.getDate() - 1);

  const currentDayCountsByRole = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: lastDayDate, $lt: currentDate }
      }
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalCountsByRole = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const currentDayCountTotal = await User.countDocuments({
    createdAt: { $gte: lastDayDate, $lt: currentDate }
  });

  const totalCountTotal = await User.countDocuments({});

  const roles = [...new Set([...currentDayCountsByRole.map(item => item._id), ...totalCountsByRole.map(item => item._id)])];

  const percentageIncreaseByRole = roles.map(role => {
    const currentDayCount = currentDayCountsByRole.find(item => item._id === role);
    const totalCount = totalCountsByRole.find(item => item._id === role);
    const percentageIncrease = totalCount ? ((currentDayCount?.count || 0) - totalCount.count) / totalCount.count * 100 : 0;
    return {
      role,
      currentDayCount: currentDayCount?.count || 0,
      totalCount: totalCount?.count || 0,
      percentageIncrease
    };
  });

  const percentageIncreaseTotal = totalCountTotal ? ((currentDayCountTotal - totalCountTotal) / totalCountTotal) * 100 : 0;

  res.json({
    byRole: percentageIncreaseByRole,
    total: {
      currentDayCount: currentDayCountTotal,
      totalCount: totalCountTotal,
      percentageIncrease: percentageIncreaseTotal
    }
  });
};



// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    await user.remove()
    res.json({ message: 'User removed' })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password')

  if (user) {
    res.json(user)
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})
const getAllUserDetailsById = async (req, res) => {
  try {
    const userId = req?.params?.id;
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    const cleaningServiced = await cleaningModel.find({ user: userId }) || {};
    const profile = await profileModels.find({ user: userId }).populate('user') || {};
    const users = await User.findById(userId).populate('accessListBins') || {};

    res.json({ users, profile, cleaningServiced });
  } catch (error) {
    // Handle the error
    res.status(404).json({ error: 'User not found' });
  }
};


// @desc    Get user by Email
// @route   GET /api/users/:email
// @access  Private/Admin

const getUserByEmail = async (req, res) => {
  const { email } = req.params

  try {
    const user = await User.findOne({ email: email })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json(user)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email

    const updatedUser = await user.save()

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

const blockUser = async(req, res)=>  {
  const { id } = req.params;
  const user = await User.findById(id);
  if (user) {
    user.isBlocked = true;
    await user.save();
    res.json({ message: 'User blocked' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}
const deblockUser = async(req, res)=>  {
  const { id } = req.params;
  const user = await User.findById(id);
  if (user) {
    user.isBlocked = false;
    await user.save();
    res.json({ message: 'User deblocked' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}

// const getAllUserWhoHasASameAccessBin = async(req, res)=> {
//   const { _id } = req.user;

//   const currentUser = await User.findById(_id);

//   const users = await User.find({
//     accessListBins: { $in: currentUser.accessListBins },
//     _id: { $ne: currentUser._id },
//   });


//   const populatedUsers = await Promise.all(
//     users.map(async (user) => {
//       const profile = await profileModels.findOne({ user: user._id });
//       return { ...user.toObject(), profile };
//     })
//   );

//   res.json(populatedUsers);
//  }
const getAllUserWhoHasASameAccessBin = async (req, res) => {
  const { _id } = req.user;

  const currentUser = await User.findById(_id);

  const users = await User.find({
    accessListBins: { $in: currentUser.accessListBins },
    _id: { $ne: currentUser._id },
  });

  // Fetch profiles and scores for each user
  const populatedUsers = await Promise.all(
    users.map(async (user) => {
      const profile = await profileModels.findOne({ user: user._id });
      const score = await scoreModel.findOne({ user: user._id });
      return { ...user.toObject(), profile, score }; // Combine user, profile, and score data
    })
  );

  res.json(populatedUsers);
};



const reportUser = async (req, res)=> {
  const { id } = req.params;
  const user = await User.findById(id);
  if (user) {
    user.isReported = true;
    await user.save();
    res.json({ message: 'User reported' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}

const CreateFeedback = async (req, res)=> {
  const { isValid, errors } = validateFeedbackInput(req.body);
  console.log(req.body);



  const {_id} =req.user
  const {feedback} = req.body
  try {
    if (!isValid) {
      res.status(404).json(errors);
    } else {

    const feedbacks = new FeedbackModel({
      user: _id,
      feedback
    })
    const createdFeedback = await feedbacks.save()
    res.status(201).json(createdFeedback)
  }
  } catch (error) {

    res.status(400).json(error)
  }

}




module.exports = {
  authUser,
  registerUser,
  getUserByEmail,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  resetPassword,
  registerGoogleUser,

  getCurrentAccessList,
  verifyEmail,
  forgotPassword,
  resendOTP,
  resendOTPDeleteAccount,
  DeleteAccount,
  addAccessCode,
  getUsersCount,
  getAllUserDetailsById,
  blockUser,
  deblockUser,
  getAllUserWhoHasASameAccessBin,
  CreateFeedback,
  deleteProfileAndUser

}