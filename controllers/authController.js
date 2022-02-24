const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const sendJWT = (id, jsonResponse) => {
  const token = signToken(id);

  return jsonResponse.status(200).json({
    status: 'success',
    token
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
  sendJWT(user._id, res);
});

//this is our middleware that makes sure only properly logged in users can access some routes
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

  //generate reset url send it as email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Reset it here ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password reset token (valid for 10mins)',
      message
    });
  } catch (e) {
    //in case of error, reset the params
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email. Try again later', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!'
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex'); //retrieve token param from request and hash

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }); //retrieve user based on token and check if token has not expired

  //if token is valid and there exists a user, set a new password and remove the token
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //update changedpasswordat property for current user
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //log the user in by sending JWT //DONE: refactor code snippet into its own function
  sendJWT(user._id, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  
  //get user from collection
  let { user } = req; //retrieve user from the request
  //since password isn't returned, requery the user and include password property
  user = await User.findById(user._id).select('+password');

  //check if posted password is correct
  if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
    return next(new AppError('Please enter correct current password or reset password if forgotten', 400));
  }

  //update to new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //log user in by sending a new jwt
  sendJWT(user._id, res);
});