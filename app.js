const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
//import our routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//global middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); //using the morgan logging middleware
}

//rate limiting global middleware
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this ip, please try again',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

app.use(express.json()); //this middleware helps us to modify the request data
app.use(express.static(`${__dirname}/public`)); // middleware to help serve static files in public folder

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //add the current time to the requests using middleware
  next();
});

//mount the routers, defining their home path
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);

//handling exception for other routes not declared above
app.all('*', (req, res, next) => {
  //using the new AppError class
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));// this works because express only expects an argumment in the next function if there's an error.
});

//error handling middleware
app.use(globalErrorHandler);

module.exports = app;
