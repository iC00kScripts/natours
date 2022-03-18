const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const key = Object.keys(err.keyValue).join('');
  const message = `The key '${key}' has duplicate value of '${err.keyValue[key]}'`;
  return new AppError(message, 400);
  // const value = err.errmsg.match(/(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/);
  // console.log(value);
  // const message = `Duplicate field value: Please use another value`;
  //return new AppError(message, 400);
};

const handleValidationError = (err) => {
  //we can also extract the message by looping the errors object: Object.values(err.errors).map(el => el.message)
  return new AppError(err.message.replace(',', '.'), 400);
};

const handleJWTError = () =>
  new AppError('Invalid token, Please login again', 401);
const handleTokenExpiredError = () =>
  new AppError('Token has expired Please login again', 403);

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      error: err,
    });
  }
  console.error('ERROR::', err);
  //Rendered Website
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: `Error Message: ${err.message}\nError Status: ${err.status}\nError Statuscode: ${err.statusCode}\nError Stack: ${err.stack}`,
  });
};

const sendErrorProd = (err, req, res) => {
  const message = err.isOperational ? err.message : 'Please try again later!';

  if (req.originalUrl.startsWith('/api')) {
    //is operational error, send to client
    return res.status(err.statusCode).json({
      status: err.status,
      message,
    });
  }

  console.error('ERROR::', err);
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: message,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode ?? 500;
  err.status = err.status ?? 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err }; //desctructure and make a copy of the error.
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();
    if (err.name === 'ValidationError') error = handleValidationError(error);
    sendErrorProd(error, req, res);
  }
};
