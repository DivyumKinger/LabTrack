// Controller to handle user logout.

const postLogout = (req, res) => {
  // Define an array of all cookies that should be cleared on logout.
  const cookiesToClear = ['access-cookie', 'otp-cookie', 'refresh-cookie'];

  // Iterate through the array and clear each cookie.
  // res.clearCookie() tells the browser to expire the cookie immediately.
  cookiesToClear.forEach((cookieName) => {
    res.clearCookie(cookieName);
  });

  // Return a success message.
  return res.status(200).json({ message: 'Successfully Logged Out' });
};

module.exports = postLogout;