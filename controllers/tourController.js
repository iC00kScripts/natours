const Tour = require('./../models/tourModel');//import the Tour model


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
exports.getAllTours = async (req, res) => {
  try {

    //const queryObject = { ...req.query }; //copy the request queries into a new variable
    //const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //Filtering
    // eslint-disable-next-line no-unused-vars
    const { page, sort, limit, fields, ...queryObject } = req.query; //OR excludedFields.forEach(el => delete
                                                                     // queryObject[el] will  exclude these fields from
                                                                     // the copy of the request queries and save others
                                                                     // into a new variable queryObject
    //Advanced filtering, implementing gte, lt, lte and others as presented within the query params
    let queryString = JSON.stringify((queryObject));
    queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    //const tours = await Tour.find(queryObject); retrieve all tours from the database or filter by query params sent
    // with the request
    let query = Tour.find(JSON.parse(queryString)); //start chaining the queries

    //SORTING THE RESULT
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' '); //allows us to sort by multiple fields e.g sort('price ratingsAverage')
      query.sort(sortBy); //sorts by the given column in ascending order. adding '-' to the sort params ensures that results are sorted in descending order
    } else {
      //adding a default sort to the query to sort by latest items
      query = query.sort('-_id'); //in production, we will sort by -createdAt to show latest items first
    }

    //FIELD LIMITING -  this helps to exclude unneeded fields from the response and reduce bandwidth usage
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields); //this action is referred to as projecting
    } else {
      query = query.select('-__v'); //by default, exclude the __v field from the response
    }

    //PAGINATION
    const pageNum = req.query.page * 1 || 1; //get the page number from query or use the default
    const limitNum = req.query.limit * 1 || 100; //default page limit is 100 if absent in query
    const skipDocs = (pageNum - 1) * limitNum; // algorithm to calculate the number of documents to skip before returning the result

    query = query.skip(skipDocs).limit(limitNum);

    //handles case where page param is greater than results available
    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skipDocs >= numTours) throw new Error('This page does not exist');
    }


    const tours = await query;//execute the chained queries on the database model


    //send response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e.toString()
    });
  }
};

exports.getTour = async (req, res) => {
  try {

    const tour = await Tour.findById(req.params.id); //find the tour using the id passed into the request parameter
    //similarly we can use Tour.findOne({_id:req.params.id}) and it will work just the same way.
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e.toString()
    });
  }


  //
  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tour
  //   }
  // });
};

exports.createTour = async (req, res) => {
  try {
    //one way to save document in mongoose
    // const newTour = new Tour({});
    // newTour.save();

    //another prefered way
    const newTour = await Tour.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });

  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }

  //console.log(req.body);
  // const newID = tours[tours.length - 1].id + 1;
  // const newTour = { id: newID, ...req.body }; //merge the newID property with the existing properties in req.body
  // tours.push(newTour);
  //
  // fs.writeFile(simpleToursFile, JSON.stringify(tours), () => {

  // });
};

exports.updateTour = async (req, res) => {

  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour // this is the same this as writing tour: tour. the shortcut was introduced as part of ES6
      }
    });
  } catch (e) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid Data sent!'
    });
  }

};

exports.deleteTour = async (req, res) => {

  try {

    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });

  } catch (e) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid Data sent!'
    });
  }

};
