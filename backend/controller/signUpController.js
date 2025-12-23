// Controller for user signup and email verification.

const UserModel = require('../models/signUpModel');
const bcrypt = require('bcryptjs');

// Helper function to mask an email address for display purposes (e.g., a***@gmail.com).
const maskEmail = async (email) => {
  const atIndex = email.indexOf('@');
  if (atIndex <= 1) {
    return email; // Not enough characters to mask.
  }
  const emailFront = email.substring(0, atIndex);
  const maskedUsername = emailFront.substring(0, 1) + '*'.repeat(emailFront.length - 3) + emailFront.slice(-2);
  const domain = email.substring(atIndex);
  return maskedUsername + domain;
};

// Helper function to hash an OTP code.
const generateOtp = async (otp_Code) => {
  return await bcrypt.hash(String(otp_Code), 10);
};

// Placeholder for sending email. In this version, the OTP flow is disabled.
const sendEmail = async () => {};

// Controller to handle new user registration.
const postUserSignup = async (req, res) => {
  const { username, email, phone, userType, password } = req.body;

  // Server-side password complexity validation.
  const alphanumericRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
  if (!password.match(alphanumericRegex)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be alphanumeric and contain at least one special character.',
    });
  }

  // Check if a user with this email already exists.
  const checkPrevUser = await UserModel.findOne({ email }).select('-password');

  if (!checkPrevUser) {
    // If the user does not exist, create a new one.
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({
      username,
      email,
      password: hashedPassword,
      phone,
      userType,
      emailVerified: true, // Auto-verify email since OTP is disabled.
    });
    return res.status(201).json({
      success: true,
      message: `Account created. You can login now.`,
      GOTO_LOGIN: true,
    });
  }

  // Handle cases where the user already exists.
  if (checkPrevUser.emailVerified) {
    return res.status(200).json({
      success: true,
      message: `Account already exists. Please log in.`,
      GOTO_LOGIN: true,
    });
  } else {
    // If the user exists but is not verified, auto-verify them.
    await UserModel.findByIdAndUpdate(checkPrevUser.id, { emailVerified: true });
    return res.status(200).json({
      success: true,
      message: `Email verified. You can login now.`,
      GOTO_LOGIN: true,
    });
  }
};

// Mock controller for email verification, as OTP is disabled.
const verifyEmail = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: `OTP is disabled. Email is auto-verified on signup.`,
  });
};

// Mock controller for resending OTP, as OTP is disabled.
const resendOtpCode = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: `OTP is disabled; no OTP required.`,
  });
};

module.exports = {
  postUserSignup,
  verifyEmail,
  resendOtpCode,
  sendEmail,
  generateOtp,
  maskEmail,
};