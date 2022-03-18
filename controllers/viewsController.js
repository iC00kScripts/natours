const Tour = require('../models/tourModel');
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
