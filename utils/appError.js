class AppError extends Error {

  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; //handling only operational errors

    Error.captureStackTrace(this, this.constructor); //prevents this constructor from showing up in the stack trace
  }
}

module.exports = AppError;