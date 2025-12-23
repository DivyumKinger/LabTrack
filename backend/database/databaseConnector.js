const mongoose = require('mongoose')

const ConnectDatabase = (connection_url) => {
  return mongoose.connect(connection_url)
}

module.exports = { ConnectDatabase }
