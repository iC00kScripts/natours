const mongoose = require('mongoose');
const slugify = require('slugify');
const tourSchema = new mongoose.Schema({ //Creating the Tour Schema in Mongoose

    name: {
      type: String,
      required: [true, 'A Tour must have a name'],
      unique: true,
      trim: true
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour must have a cover image']
    },
    images: [String],//images here is being defined as an array of strings pointing to each image location in the file system
    createdAt: {//Automatically created timestamp
      type: Date,
      default: Date.now(),
      select: false //setting this excludes the field from the returned responses
    },
    startDates: [Date],//array of different start dates for the tour
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: { virtuals: true }, //enable virtual properties to be displayed in JSON responses
    toObject: { virtuals: true }
  }
);

//adding a virtual property that's not in the database i.e. a calculated field
tourSchema.virtual('durationWeeks').get(function() { //using regular function to allow access to the 'this' of the current document
  return this.duration / 7;
});

//DOCUMENT MIDDLEWARE
//defining a mongodb document middleware that runs before the model is processed or saved. runs before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//can have multiple pre and post middleware, also called hooks
//defining a post middleware function that is called after all pre middleware are serviced.
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) { //using regex to apply the middleware to every variant of the find operation
  this.find({ //'this' object here points to the query object
    secretTour: { $ne: true }
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  next();
});

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) { //'this' object here, points to the current aggregate object
  this.pipeline()
      .unshift({
        $match: {
          secretTour: { $ne: true }
        }
      }); //unshift adds the element at the beginning of the array
  next();
});

const Tour = mongoose.model('Tour', tourSchema); //creating the model based on the defined schema

module.exports = Tour; //export the model