const express = require('express');
const tourController = require('./../controllers/tourController');

//TOURS route grouping
const router = express.Router();

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
//the route's home is /api/v1/tours therefore no need to include that in the route path again
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

//export the file as a module so it can be imported into another js file
module.exports = router;
