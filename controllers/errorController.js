const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const key = Object.keys(err.keyValue).join('');
  const message = `The key '${key}' has duplicate value of '${err.keyValue[key]}'`;
  return new AppError(message, 400);
  // const value = err.errmsg.match(/(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/);
  // console.log(value);
  // const message = `Duplicate field value: Please use another value`;
  //return new AppError(message, 400);
};

const handleValidationError = err => {
  //we can also extract the message by looping the errors object: Object.values(err.errors).map(el => el.message)
  return new AppError(err.message.replace(',', '.'), 400);
};

const handleJWTError = () => new AppError('Invalid token, Please login again', 401);
const handleTokenExpiredError = () => new AppError('Token has expired Please login again', 403);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    error: err
  });
};

const sendErrorProd = (err, res) => {
  //is operational error, send to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    //programming or unknown error: don't leak details to the client but log to console and send generic message
    console.error('ERROR::', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }

};


module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode ?? 500;
  err.status = err.status ?? 'error';


  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };//desctructure and make a copy of the error.

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();
    if (err.name === 'ValidationError') error = handleValidationError(err); //since destructuring loses some property using the original err object here to preserve the message property.

    sendErrorProd(error, res);
  }

};