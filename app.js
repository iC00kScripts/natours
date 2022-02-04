const fs = require('fs');
const express = require('express');

const app = express();

const port = 3000;
const simpleToursFile = `${__dirname}/dev-data/data/tours-simple.json`;

app.use(express.json()); //this middleware helps us to modify the request data
//ROUTES
// app.get('/', (req, res) => {
//   res.json({ message: 'Hello from the Server side', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint');
// });

const tours = JSON.parse(fs.readFileSync(simpleToursFile));

//get the tours json
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

//get a tour by it's id

app.get('/api/v1/tours/:id', (req, res) => {
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
});

//save a tour
app.post('/api/v1/tours', (req, res) => {
  //console.log(req.body);
  const newID = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newID }, req.body);
  tours.push(newTour);

  fs.writeFile(simpleToursFile, JSON.stringify(tours), (err) => {
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  });
});

app.patch('/api/v1/tours/:id', (req, res) => {
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
});

app.delete('/api/v1/tours/:id', (req, res) => {
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
});

//START THE APP
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
