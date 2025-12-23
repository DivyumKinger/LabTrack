const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const UserModel = require('../models/signUpModel');

// --- Nodemailer Transport Configuration ---
// IMPORTANT: Replace with your actual email service provider's credentials,
// preferably using environment variables for security.
const transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., 'gmail', 'yahoo'
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Your email address
    pass: process.env.EMAIL_PASS || 'your-email-password', // Your email password or app-specific password
  },
});

// @desc    Send password reset email
// @route   POST /api/v1/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      // To prevent user enumeration, we send a success-like response even if the user doesn't exist.
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // 1. Generate a random, unhashed token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash the token and save it to the user model
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 3. Set an expiration time (e.g., 10 minutes)
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // 4. Create the reset URL for the email
    // This URL points to the frontend page where the user will reset their password.
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/reset-password/${resetToken}`;
    
    // In a real app, you'd use a frontend URL like:
    // const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;


    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please go to this link to reset your password:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>This link will expire in 10 minutes.</p>
    `;

    // 5. Send the email
    await transporter.sendMail({
      from: '"Library Management System" <no-reply@library.com>',
      to: user.email,
      subject: 'Password Reset Request',
      html: message,
    });

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    // If an error occurs, invalidate the token just in case
    if (req.body.email) {
        const user = await UserModel.findOne({ email: req.body.email });
        if (user) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
        }
    }
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ success: false, message: 'Email could not be sent. Please try again later.' });
  }
};

// @desc    Reset user's password
// @route   PATCH /api/v1/forgotpassword/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const { resetToken } = req.params;

  try {
    // 1. Hash the token from the URL params
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 2. Find the user by the hashed token and check if the token is still valid (not expired)
    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    // 3. Validate the new password
    const alphanumericRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
    if (!alphanumericRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be alphanumeric and contain at least one special character.',
      });
    }

    // 4. Set the new password and clear the reset token fields
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
};

module.exports = { forgotPassword, resetPassword };