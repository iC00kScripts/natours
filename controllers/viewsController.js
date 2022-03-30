const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // get all tours from collection
  const tours = await Tour.find();
  //build the template
  //render template using tours data
  res.status(200).render('overview', {
    title: 'All Tours',
    tours, //passing the tour data into the overview template for rendering
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //get data for the requested tour (including reviews and tour guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  //build the template
  //render the template using the tour data
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour: tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //find bookings with user id
  const bookings = await Booking.find({ user: req.user.id });

  //find tours with returnedIDs
  const tourIDs = bookings.map((booking) => booking.tour); //extract the tour ids into a separate arrays
  const tours = await Tour.find({ _id: { $in: tourIDs } }); //find all tours with id in the tourIDS array

  res.status(200).render('overview', { title: 'My Tours', tours });
});

exports.controlCacheHeader = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser,
  });
});
