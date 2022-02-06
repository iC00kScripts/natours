const fs = require('fs');
const express = require('express');

const app = express();

const port = 3000;
const simpleToursFile = `${__dirname}/dev-data/data/tours-simple.json`;

//middleware
app.use(express.json()); //this middleware helps us to modify the request data

app.use((req, res, next) => {
  console.log('Hello from the middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //add the current time to the requests using middleware
  next();
});

//ROUTES

const tours = JSON.parse(fs.readFileSync(simpleToursFile));

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

//route grouping
app
  .route('/api/v1/tours')
  .get(getAllTours)
  .post(createTour);

app
  .route('/api/v1/tours/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

//START THE APP
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
