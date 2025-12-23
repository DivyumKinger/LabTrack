const express = require('express');
const forgotpasswordRouter = express.Router();

const {
  forgotPassword,
  resetPassword,
} = require('../controller/forgotpasswordController');

// Route to request a password reset email
forgotpasswordRouter.route('/').post(forgotPassword);

// Route to reset the password using a token
forgotpasswordRouter.route('/:resetToken').patch(resetPassword);

module.exports = forgotpasswordRouter;
