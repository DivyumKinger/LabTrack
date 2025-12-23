// This controller allows an admin to update a user's email address.
// Note: This flow still includes OTP logic, even though it's disabled elsewhere.

const UserOtpVerificationModel = require('../models/userOtpVerificationModel');
const UserModel = require('../models/signUpModel');
const { generateOtp, sendEmail, maskEmail } = require('./signUpController');

// Updates a user's email and initiates an OTP verification process for the new email.
const updateUserEmail = async (req, res) => {
  const { userId, newEmail } = req.body;

  // Generate a new OTP.
  const otp_Code = Math.floor(Math.random() * 9000 + 1000);
  const hashed_otpCode = await generateOtp(otp_Code);

  // Find and update (or create) the OTP verification record for the user.
  await UserOtpVerificationModel.findOneAndUpdate(
    { userId },
    {
      userEmail: newEmail,
      otpCode: hashed_otpCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60), // OTP expires in 1 minute.
    },
    { upsert: true } // Create the record if it doesn't exist.
  );

  // Set a cookie containing the user's ID to track the OTP verification process.
  res.cookie('otp-cookie', userId, {
    path: '/',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24-hour expiry.
    httpOnly: true,
    sameSite: 'lax',
  });

  // Update the user's email in their main profile document.
  await UserModel.findByIdAndUpdate({ _id: userId }, { email: newEmail });

  // Mask the new email for display in the response message.
  const maskedEmailDisplay = await maskEmail(newEmail);

  // Send a response indicating that an OTP has been sent.
  res.status(200).json({
    success: true,
    message: `Verification OTP has been sent to ${maskedEmailDisplay}`,
    ENTER_OTP: true,
  });

  // Send the OTP email (currently a placeholder function).
  await sendEmail(newEmail, otp_Code);
};

module.exports = updateUserEmail;