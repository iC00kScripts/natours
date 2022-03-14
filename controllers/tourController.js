const Tour = require('./../models/tourModel'); //import the Tour model
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

//create middleware function to use in the param middleware to check for valid Id
// exports.checkID = (req, res, next, value) => {
//   console.log(`Tour id is ${value}`);
//
//   if (req.params.id * 1) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid Tour Id'
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   console.log(`Post body is ${JSON.stringify(req.body)}`);
//   const reqParams = req.body;
//   let message = '';
//
//   if (!reqParams.name) {
//     message += 'Name must be provided\n';
//   }
//   if (!reqParams.price) {
//     message += 'Price must be provided\n';
//   }
//
//   if (message) {
//     return res.status(400).json({
//       status: 'fail',
//       message
//     });
//   }
//
//   next();
// };
//middleware that prefills the query params to return for api aliasing

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//route handlers
exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' }); //include the reviews virtual populate
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour); //using the factory deleteOne function

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      //aggregation pipeline helps to calculate specified fields and returns the response
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        //_id: null, // using null here, ensures that the aggregated results are not grouped by any field
        _id: { $toUpper: '$difficulty' }, //returns aggregated results  grouped by difficulty field
        numTours: { $sum: 1 }, //since each documents will be going through the pipeline adding 1 each pass will finally return the total
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' }, //the average rating
        avgPrice: { $avg: '$price' }, //the price
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, //sorting the results of the aggregate pipeline based on properties defined above ( here, sort by avgPrice in ascending order)
    },
    //stages can be repeated. the below snippet is to show that functionality
    // {
    //   $match: { _id: { $ne: 'EASY' } } // this returns results with _id not equal to EASY
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats, //return the stats aggregate
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', //extracts the document into individual documents by splitting the startDates array
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), //make sure we match the full year starting January 1 and ending december 31
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //extract the month from the startdate and group documents in result  by month
        numTourStarts: { $sum: 1 }, //for each tours that match, sum them
        tours: { $push: '$name' }, // push the name of the tours that match into an array with property name 'tours'
      },
    },
    {
      $addFields: { month: '$_id' }, // add a new field called month with value of _id
    },
    {
      $project: {
        _id: 0, //hide the _id field from the result
      },
    },
    {
      $sort: { numTourStarts: -1 }, //sort the result by the numTourStarts field in descending order
    },
    {
      $limit: 12, // limit the results returned to 12
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

//get all tours within :distance radius from :latlng. distance measures in :unit (km/mi)
//tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; //populated using detructuring
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //get the radians by dividing using Earth's radius in mi or km

  if (!lat || !lng) {
    return next(
      new AppError('Please provide a lat and lng in the format lat,lng', 400)
    );
  }

  //GEOSPATIAL FILTERING OF TOUR
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

//Get distances of all tours from a given latlng
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params; //populated using detructuring
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; //get the distance by using multiplier in mi or km

  if (!lat || !lng) {
    return next(
      new AppError('Please provide a lat and lng in the format lat,lng', 400)
    );
  }

  const toursWithDistance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance', //default is in meters
        distanceMultiplier: multiplier, //returning the distance in miles or km based on unit param
        //spherical: true,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      tours: toursWithDistance,
    },
  });
});
