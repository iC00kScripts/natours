const Review = require('./../models/reviewModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Tour = require('../models/tourModel');

exports.create = catchAsync(async (req, res, next) => {
  //endpoint will be authenticated so user is pre-verified

  //check for valid tour using id
  if (!req.body.tour) req.body.tour = req.params.tourId; //retrieve tour id from the query url if available

  if (!req.body.tour || !(await Tour.findById(req.body.tour))) {
    return next(new AppError('Invalid tour Id', 404));
  }

  //create review
  const review = await Review.create({
    review: req.body.review,
    rating: req.body.rating,
    tour: req.body.tour,
    user: req.user.id, //retrieve user id from USER document obtained during authentication
  });

  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});
