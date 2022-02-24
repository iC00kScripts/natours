const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide both email and password!', 400));
  }
  //check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password'); //since password was excluded from all find response, we explicitly including it here
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  //if all passed, send token to client
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  //get user token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not authenticated!', 401));
  }

  //verify user token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //using the promisify util to force the jwt.verify return a promise

  //check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError('User no longer exists!', 403));

  //check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User changed password after token was issued. Please login again', 401));
  }

  //everything checks okay. grant access to requested path
  req.user = currentUser; //add user data to request
  next();
});

exports.restrictTo = (...roles) => { //roles will be an array of all entered parameters (defined as spread operator )
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {//retrieve the user role from the req
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //get user email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  //generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //disable the validators so we can update the document with new token

  //send it as email
});

exports.resetPassword = (req, res, next) => {
};