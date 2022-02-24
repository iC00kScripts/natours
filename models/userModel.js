const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user'
  },

  password: {
    type: String,
    minlength: 8,
    select: false,
    required: [true, 'Please provide your password'],
    validate: [validator.isStrongPassword, 'Password must be minimum of 8 characters and must contain at least 1 uppercase, number and symbol character']
  },

  passwordConfirm: {
    type: String,
    minlength: 8,
    required: [true, 'Please confirm your password'],
    validate: {
      //this only works on CREATE & SAVE!!
      validator: function(val) {
        return (validator.equals(val, this.password));
      },
      message: 'Passwords do not match. Please try again'
    }
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now()
  },
  passwordResetToken: String,
  passwordResetExpires: Date
});

//encrypting the password
userSchema.pre('save', async function(next) {
  //run only if password was modified
  if (!this.isModified('password')) return next();

  // hash the password with cost of 13 before storing in the database
  this.password = await bcrypt.hash(this.password, 13);

  this.passwordConfirm = undefined; //delete passwordConfirm field the database
  next();
});

//updating the changedPasswordAt property
userSchema.pre('save', async function(next) {
  //run only if password was modified
  if (!this.isModified('password') || this.isNew) return next(); //exit middleware if this is a new document of if password wasn't modified

  // hash the password with cost of 13 before storing in the database
  this.passwordChangedAt = Date.now() - 1000; //this is added because of the possibility of a slight time difference between saving to db and getting the timestamp
  next();
});

//creating an instance method to check if the password provided is equal to that in the document
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//check if user password has changed after creating token
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);// convert to milliseconds
    return JWTTimestamp < changedTimestamp;
  }
  return false; //user password has not been changed recently
};

//generate reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex'); //generate random hex token using built in crypto library

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); //insert the reset token into the document
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // password reset token expires after 10mins

  return resetToken;
};

const User = mongoose.model('User', userSchema); //creating the model based on the defined schema

module.exports = User; //export the model