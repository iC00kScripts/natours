const mongoose = require('mongoose');
const Tour = require('./tourModel');

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

//creating a static method to calculate AverageRatings and update Tour when a new review is created
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    //'this' points to the Model in this case
    {
      $match: { tour: tourId }, //select the tour that the review belongs to
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, //sum up all the reviews matching the tourId
        avgRating: { $avg: '$rating' }, //calculate the average of the ratings on each reviews
      },
    },
  ]);

  //check if reviews exist on the tour and then...
  if (stats.length > 0) {
    //update the tour with the newly calculated aggregates
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating, //since stats is an array, we obtain the properties from the first position
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    //restore to default
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0, //since stats is an array, we obtain the properties from the first position
      ratingsAverage: 4.5,
    });
  }
};

//POST query middleware calling the function to recalculate averages after a new review is created.
reviewSchema.post('save', function () {
  //'this' points to the current review document being created
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
  //receive the newly updated document
  if (doc) Review.calcAverageRatings(doc.tour); //load the static method on the model and update the tour/review stats
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
