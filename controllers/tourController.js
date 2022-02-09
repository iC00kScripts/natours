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

//route handlers
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find(); //retrieve all tours from the database

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
