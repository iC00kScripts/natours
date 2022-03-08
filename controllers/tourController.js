const Tour = require('./../models/tourModel'); //import the Tour model
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

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
