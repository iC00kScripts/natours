const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

//TODO: keep user logged in with refresh tokens

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendJWT = (id, jsonResponse, statusCode, jsonData = {}) => {
  const token = signToken(id);

  //generate the cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //cookie will only be sent over secure connections when running on PROD environment

  jsonResponse.cookie('jwt', token, cookieOptions);

  //remove password from output
  if (jsonData) jsonData.password = undefined;

  return jsonResponse.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: jsonData,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    passwordConfirm: req.body.passwordConfirm,
  });

  sendJWT(newUser._id, res, 201, newUser);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide both email and password!', 400));
  }
  //check if user exists and password is correct
  const user = await User.findOne({ email })
    .select('+password')
    .select('+passwordChangedAt')
    .select('+passwordLastFailed')
    .select('+passwordFailedTries'); //since password and some other needed fields were excluded from all find response, we explicitly including them here

  if (!user) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  //check if account has been locked
  if (user.checkIfLockedAccount()) {
    return next(
      new AppError('Account locked! Try again in the next few hours', 401)
    );
  }

  const isValidPassword = await user.correctPassword(password, user.password); //check if password is correct
  await user.save({ validateBeforeSave: false });

  if (!isValidPassword) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  //if all passed, send token to client
  sendJWT(user._id, res, 200);
});

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success', token: null });
};

//this is our middleware that makes sure only properly logged in users can access some routes
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  //get user token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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
    return next(
      new AppError(
        'User changed password after token was issued. Please login again',
        401
      )
    );
  }

  //everything checks okay. grant access to requested path
  req.user = currentUser; //add user data to request
  res.locals.user = currentUser;
  next();
});

//Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  const token = req.cookies.jwt;
  try {
    if (token) {
      //verify user token
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );
      //check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();
      //check if user changed password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //There is a logged in User make the user data available in the response for the template
      req.user = currentUser;
      res.locals.user = currentUser;
    }
  } catch (e) {}
  next();
};

exports.restrictTo = (...roles) => {
  //roles will be an array of all entered parameters (defined as spread operator )
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      //retrieve the user role from the req
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
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Reset it here ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password reset token (valid for 10mins)',
      message,
    });
  } catch (e) {
    //in case of error, reset the params
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex'); //retrieve token param from request and hash

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
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
  sendJWT(user._id, res, 200);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //get user from collection
  let { user } = req; //retrieve user from the request
  //since password isn't returned, requery the user and include password property
  user = await User.findById(user._id).select('+password');

  //check if posted password is correct
  if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
    return next(
      new AppError(
        'Please enter correct current password or reset password if forgotten',
        400
      )
    );
  }

  //update to new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //log user in by sending a new jwt
  sendJWT(user._id, res, 200);
});
