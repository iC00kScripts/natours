const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
//import our routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//global middleware
app.use(helmet()); //added middleware to set security headers

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); //using the morgan logging middleware for development
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


app.use(express.json({ limit: '10kb' })); //this middleware helps us to modify the request data (Body-parser) and limit the body size
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
