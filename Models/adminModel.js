const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  photo: {
    type: String,
    default: 'defaultImg.png',
  },
  role: {
    type: String,
    default: 'admin',
    enum: ['admin'],
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, 'Please provide an email address'],
    validate: [validator.isEmail, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (conf) {
        return conf === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

const Admin = new mongoose.Model('Admin', adminSchema);

module.exports = Admin;
