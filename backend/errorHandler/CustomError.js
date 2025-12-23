const CustomError = (err, req, res, next) => {
  if (err.keyPattern) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ status: 'fail', message: `Email already exists` })
  }

  const msg = err.message || 'Something went wrong';
  res.status(StatusCodes.BAD_REQUEST).json({ status: 'fail', message: msg })
}

module.exports = CustomError
