const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Please provide a valid review'],
      maxlength: [300, 'A tour name must have at most 300 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a valid rating'],
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating must be at most 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  {
    toJSON: { virtuals: true }, //enable virtual properties (i.e calculated fields not stored in the database) to be displayed in JSON responses
    toObject: { virtuals: true },
  }
);

//populate the Tour and User collections
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour user', //get referenced tour and user documents from their collections
  //   select: 'name photo', //exclude these fields from the result
  // }).select('-__v');
  this.populate({
    path: 'user',
    select: 'name photo',
  }).select('-__v');
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
