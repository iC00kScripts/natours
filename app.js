const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
//import our routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug'); //defining the view engine
app.set('views', path.join(__dirname, 'views')); //setting the directory for our views

//global middlewares
app.use(express.static(path.join(__dirname, 'public'))); // middleware to help serve static files in public folder

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://m.stripe.network',
          'https://*.cloudflare.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://m.stripe.network',
        ],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
        ],
        upgradeInsecureRequests: [],
      },
    },
  })
); //added middleware to set security headers

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); //using the morgan logging middleware for development
}

//rate limiting global middleware
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this ip, please try again',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' })); //this middleware helps us to modify the request data (Body-parser) and limit the body size
app.use(cookieParser()); //middleware parses cookie data

//Data Sanitization against NoSQL query injection
app.use(mongoSanitize()); //package: express-mongo-sanitize

//Data Sanitization against Xss attacks
app.use(xss()); //package: xss-clean

//Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ], //these fields are allowed to show multiple times
  })
); //package: hpp

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //add the current time to the requests using middleware
  next();
});

//mount the routers, defining their home path
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);

//handling exception for other routes not declared above
app.all('*', (req, res, next) => {
  //using the new AppError class
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404)); // this works because express only expects an argumment in the next function if there's an error.
});

//error handling middleware
app.use(globalErrorHandler);

module.exports = app;
