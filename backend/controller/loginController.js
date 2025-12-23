// This controller handles the user login process.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModels = require('../models/signUpModel');

// Handles the POST request for user login.
const postUserLogin = async (req, res) => {
  // Sanitize the email by converting the domain part to lowercase to ensure consistency.
  const email = await ConvertEmail(req.body.email);

  // Find a user with the matching email. The .select('+password') is crucial to explicitly include the password field, which is excluded by default in the schema.
  const result = await UserModels.findOne({ email: email }).select('+password');

  // If no user is found, return an unauthorized error.
  if (!result) {
    return res.status(401).json({ success: false, message: `Invalid email or password` });
  }

  // Compare the provided password with the hashed password stored in the database.
  const validate_password = await bcrypt.compare(req.body.password, result.password);
  if (!validate_password) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // If credentials are valid, generate JSON Web Tokens (JWT).

  // 1. Access Token: Short-lived token for authenticating subsequent requests.
  const jwt_token = jwt.sign(
    {
      id: result._id,
      username: result.username,
      email,
      userType: result.userType,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFE }
  );

  // Set the access token in an httpOnly cookie for security.
  res.cookie('access-cookie', jwt_token, {
    path: '/',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24-hour expiry.
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie.
    sameSite: 'lax', // Provides a balance between security and usability.
  });

  // 2. Refresh Token: Long-lived token used to obtain a new access token without requiring the user to log in again.
  const refresh_token = jwt.sign(
    {
      id: result._id,
      username: result.username,
      email,
      userType: result.userType,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_LIFE }
  );

  // Set the refresh token in a separate httpOnly cookie.
  res.cookie('refresh-cookie', refresh_token, {
    path: '/',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1-year expiry.
    httpOnly: true,
    sameSite: 'lax',
  });

  // Send a success response containing the user's role and ID.
  return res.status(200).json({
    success: true,
    userType: result.userType,
    userId: result._id
  });
};

// Helper function to normalize email addresses.
const ConvertEmail = async (email) => {
  const emailWithoutSpaces = email.replace(/\s/g, ''); // Remove any spaces.
  const emailParts = emailWithoutSpaces.split('@');
  const firstEmailPart = emailParts[0];
  const secondEmailPart = emailParts[1].toLowerCase(); // Convert domain to lowercase.
  return firstEmailPart + '@' + secondEmailPart;
};

module.exports = postUserLogin;