//this function will serve as the entry point for all endpoints and will catch all errors; since it returns a promise, we can then pass the error to the error handling middeware
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); //we can also use this within the catch  -: err => next(err)
  };
};