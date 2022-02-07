const fs = require('fs');

const simpleToursFile = `${__dirname}/../dev-data/data/tours-simple.json`;
const tours = JSON.parse(fs.readFileSync(simpleToursFile));

//create middleware function to use in the param middleware to check for valid Id
exports.checkID = (req, res, next, value) => {
  console.log(`Tour id is ${value}`);

  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid Tour Id',
    });
  }
  next();
};

exports.checkBody = (req, res, next) => {
  console.log(`Post body is ${JSON.stringify(req.body)}`);
  const reqParams = req.body;
  let message = '';

  if (!reqParams.name) {
    message += 'Name must be provided\n';
  }
  if (!reqParams.price) {
    message += 'Price must be provided\n';
  }

  if (message) {
    return res.status(400).json({
      status: 'fail',
      message,
    });
  }

  next();
};

//route handlers
exports.getAllTours = (req, res) => {
  //console.log(req.requestTime);

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
};

exports.getTour = (req, res) => {
  const id = req.params.id * 1; //parse the id string to number via multiplying by 1

  const tour = tours.find((element) => element.id === id);

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

exports.createTour = (req, res) => {
  //console.log(req.body);
  const newID = tours[tours.length - 1].id + 1;
  const newTour = { id: newID, ...req.body };
  tours.push(newTour);

  fs.writeFile(simpleToursFile, JSON.stringify(tours), () => {
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  });
};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here ....>',
    },
  });
};

exports.deleteTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
