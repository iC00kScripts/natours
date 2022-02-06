const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();

const simpleToursFile = `${__dirname}/dev-data/data/tours-simple.json`;
const tours = JSON.parse(fs.readFileSync(simpleToursFile));

//middleware
app.use(morgan('dev')); //using the morgan logging middleware

app.use(express.json()); //this middleware helps us to modify the request data

app.use((req, res, next) => {
  console.log('Hello from the middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //add the current time to the requests using middleware
  next();
});

//route handlers
const getAllTours = (req, res) => {
  console.log(req.requestTime);

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
};

const getTour = (req, res) => {
  const id = req.params.id * 1; //parse the id string to number via multiplying by 1

  const tour = tours.find((element) => element.id === id);
  //if (id > tours.length) {
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid Tour Id',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

const createTour = (req, res) => {
  //console.log(req.body);
  const newID = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newID }, req.body);
  tours.push(newTour);

  fs.writeFile(
    simpleToursFile,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
};

const updateTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid Tour Id',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here ....>',
    },
  });
};

const deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid Tour Id',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not currenty supported',
  });
};

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not currenty supported',
  });
};

const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not currenty supported',
  });
};

const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not currenty supported',
  });
};

const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not currenty supported',
  });
};

//get the tours json
//app.get('/api/v1/tours', getAllTours);
//get a tour by it's id
//app.get('/api/v1/tours/:id', getTour);
//save a tour
//app.post('/api/v1/tours', createTour);
//update tour
//app.patch('/api/v1/tours/:id', updateTour);
//delete tour
//app.delete('/api/v1/tours/:id', deleteTour);

//ROUTES
//TOURS route grouping
const tourRouter = express.Router();
tourRouter.route('/').get(getAllTours).post(createTour);
//the route's home is /api/v1/tours therefore no need to include that in the route path again
tourRouter
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

app.use('/api/v1/tours', tourRouter); //the general tours path

//USERS route grouping
const userRouter = express.Router();

userRouter.route('/').get(getAllUsers).post(createUser);

userRouter
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

app.use('/api/v1/users', userRouter);
//START THE SERVER

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
