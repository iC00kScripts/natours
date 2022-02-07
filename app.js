const express = require('express');
const morgan = require('morgan');

//import our routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); //using the morgan logging middleware
}

app.use(express.json()); //this middleware helps us to modify the request data
app.use(express.static(`${__dirname}/public`)); // middleware to help serve static files in public folder

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //add the current time to the requests using middleware
  next();
});

//mount the routers, defining their home path
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);

module.exports = app;
