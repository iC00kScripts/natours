const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const Tour = require('../models/tourModel');

//this function helps to filter our all elements not listed in allowedFields from the object
const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; //faking the user id as coming from the params in order to use the getUser function
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Use /UpdatePassword',
        400
      )
    );
  }
  //update user document
  const filteredBody = filterObject(req.body, 'name', 'email'); //filter our field names that aren't allowed to be updated
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, //return the newly updated document
    runValidators: true, //run validators on update
  });

  res.status(200).json({
    status: 'success',
    message: 'Updated user successfully',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined Please use /signup instead',
  });
};

exports.getUser = factory.getOne(User);

//for Administrative purposes only
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
