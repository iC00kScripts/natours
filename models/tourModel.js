const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel'); no longer needed since we are now referencing users(guides)
//const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    //Creating the Tour Schema in Mongoose

    name: {
      type: String,
      required: [true, 'A Tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have at most 40 characters'],
      minlength: [10, 'A tour name must have at least than 10 characters'],
      //validate: [validator.isAlpha, 'Tour name must be characters '] //run a custom validator that checks if the name contains only strings using the validator package
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be one of easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating must be at most 5.0'],
      set: (val) => val.toFixed(1), //round the average to one decimal place
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //using a custom validator to prevent discount from being higher than the price. Will only work on newly created documents
          return val < this.price;
        },
        message: 'Discount ({VALUE}) must be less than regular price', // {VALUE} is changed into the val received from the function
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour must have a cover image'],
    },
    images: [String], //images here is being defined as an array of strings pointing to each image location in the file system
    createdAt: {
      //Automatically created timestamp
      type: Date,
      default: Date.now(),
      select: false, //setting this excludes the field from the returned responses
    },
    startDates: [Date], //array of different start dates for the tour
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: {
          values: ['Point'],
          message: 'Only Point allowed!',
        },
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: {
            values: ['Point'],
            message: 'Only Point allowed!',
          },
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //guides: Array, FOR EMBEDDING GUIDES IS REPRESENTED THIS WAY IN THE SCHEMA
    //using child referencing
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true }, //enable virtual properties to be displayed in JSON responses
    toObject: { virtuals: true },
  }
);

//tourSchema.index({ price: 1 }); //creating an index on the price field for faster READ operations
tourSchema.index({ price: 1, ratingsAverage: -1 }); //compound index // 1-asc -1-desc
tourSchema.index({ slug: 1 });

//defining a 2d sphere index on startLocation for GeoSpatial queries
tourSchema.index({ startLocation: '2dsphere' });

//adding a virtual property that's not in the database i.e. a calculated field
tourSchema.virtual('durationWeeks').get(function () {
  //using regular function to allow access to the 'this' of the current document
  return this.duration / 7;
});

//adding a Virtual Populate to retrieve all reviews associated with a tour
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //name of the referenced field in the review model
  localField: '_id', //name of field in the local model
});

//DOCUMENT MIDDLEWARE
//defining a mongodb document middleware that runs before the model is processed or saved. runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//embedding the guides document within the tour documents before saving
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id)); //since this returns an array of promises, we need to await it in the next line
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//can have multiple pre and post middleware, also called hooks
//defining a post middleware function that is called after all pre middleware are serviced.
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  //using regex to apply the middleware to every variant of the find operation
  this.find({
    //'this' object here points to the query object
    secretTour: { $ne: true },
  });
  next();
});

//populate referenced fields before sending result  to all find using query pre middleware
//populate helps to include referenced fields from other collections
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides', //get referenced documents from User collection
    select: '-__v', //exclude these fields from the result
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  next();
});

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  //'this' object here, points to the current aggregate object
  this.pipeline().unshift({
    $match: {
      secretTour: { $ne: true },
    },
  }); //unshift adds the element at the beginning of the array
  next();
});

const Tour = mongoose.model('Tour', tourSchema); //creating the model based on the defined schema

module.exports = Tour; //export the model
