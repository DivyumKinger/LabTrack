// User Register/Signup Form API

const { postUserSignup } = require('../controller/signUpController')

const express = require('express')
const signUpRouter = express.Router()

signUpRouter.route('/').post(postUserSignup)
// OTP endpoints removed

module.exports = signUpRouter
