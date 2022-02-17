const mongoose = require('mongoose');
const validator = require('validator');

//name, email, photo, password, passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
    maxlength: [40, 'Name must have at most 40 characters']
    //validate: [validator.isAlpha, 'Tour name must be characters '] //run a custom validator that checks if the name contains only strings using the validator package
  },

  email: {
    type: String,
    required: [true, 'Please provide your email address'],
    trim: true,
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email address']
  },

  photo: String,

  password: {
    type: String,
    minlength: 8,
    required: [true, 'Please provide your password'],
    validate: [validator.isStrongPassword, 'Password must be minimum of 8 characters and must contain at least 1 uppercase, number and symbol character']
  },

  passwordConfirm: {
    type: String,
    minlength: 8,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(val) {
        return (validator.equals(val, this.password));
      },
      message: 'Passwords do not match. Please try again'
    }
  }
});


const User = mongoose.model('User', userSchema); //creating the model based on the defined schema

module.exports = User; //export the model