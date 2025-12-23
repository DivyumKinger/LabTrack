// This controller handles fetching and updating user data.

const UserModel = require('../models/signUpModel');
const BookTransactionSchema = require('../models/bookTransaction');
const bcrypt = require('bcryptjs');
const { generateOtp, maskEmail, sendEmail } = require('./signUpController');
const UserOtpVerificationModel = require('../models/userOtpVerificationModel');

// Controller to fetch all users with the 'normal_user' role.
const getAllUsers = async (req, res) => {
  const result = await UserModel.find({ userType: 'normal_user' });
  res.status(200).json({ success: true, totalHits: result.length, data: result });
};

// Controller to fetch a single user's data and their book transactions, used by admins.
const getSingleUser = async (req, res) => {
  const { userId } = req.params;
  const getUserData = await UserModel.findById(userId);
  // Fetches all transactions for the user to display in their profile.
  const getAllUserBookTransaction = await BookTransactionSchema.find({ userId });

  res.status(200).json({
    success: true,
    userData: getUserData,
    bookDataAll: getAllUserBookTransaction,
  });
};

// Controller for a logged-in user to fetch their own data.
const postSingleUser = async (req, res) => {
  const userId = req.userId; // User ID is from the auth middleware.
  const getUserData = await UserModel.findById(userId);
  const getAllUserBookTransaction = await BookTransactionSchema.find({ userId });

  res.status(200).json({
    success: true,
    userData: getUserData,
    bookDataAll: getAllUserBookTransaction,
  });
};

// Controller for a user to update their own profile details (username, phone, email, password).
const patchUserDetail = async (req, res) => {
  const userId = req.userId;
  const { username, email, phone, old_password, new_password } = req.body;

  // Case 1: Update user's general details (username, email, phone).
  if (username && email && phone) {
    const UserDetails = await UserModel.findById(userId);
    const newEmail = await ConvertEmail(email);

    if (UserDetails.email === newEmail) {
      // If the email hasn't changed, just update the username and phone.
      const result = await UserModel.findByIdAndUpdate(userId, { username, phone }, { new: true, runValidators: true });
      return res.status(200).json({ success: true, data: result });
    } else {
      // If the email has changed, directly update the email, username, and phone.
      // Since OTP is disabled, we'll assume the new email is verified.
      const result = await UserModel.findByIdAndUpdate(userId, { email: newEmail, emailVerified: true, username, phone }, { new: true, runValidators: true });
      return res.status(200).json({ success: true, message: "Email updated successfully.", data: result });
    }
  }

  // Case 2: Update user's password.
  if (old_password && new_password) {
    const user = await UserModel.findById(userId).select('+password');

    // Validate password complexity.
    const alphanumericRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
    if (!new_password.match(alphanumericRegex)) {
      return res.status(400).json({ success: false, message: 'Password must be alphanumeric and contain at least one special character.' });
    }

    // Verify the old password is correct.
    const isPasswordCorrect = await bcrypt.compare(old_password, user.password);
    if (isPasswordCorrect) {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await UserModel.findByIdAndUpdate(userId, { password: hashedPassword });
      return res.status(200).json({ success: true, message: "Password updated successfully." });
    } else {
      return res.status(400).json({ success: false, message: `Invalid Old Password` });
    }
  }
};

// Helper function to normalize email addresses.
const ConvertEmail = async (email) => {
  const emailWithoutSpaces = email.replace(/\s/g, '');
  const emailParts = emailWithoutSpaces.split('@');
  return emailParts[0] + '@' + emailParts[1].toLowerCase();
};

module.exports = { getAllUsers, getSingleUser, postSingleUser, patchUserDetail };