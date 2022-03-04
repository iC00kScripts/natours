const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController');

//TOURS route grouping
const router = express.Router();

//router.param('id', tourController.checkID); //validate ID by running the middleware

//CREATING AN API ALIASING FOR THE TOP 5, CHEAPEST TOURS USING A MIDDLEWARE THAT PREFILLS SPECIFIC VARIABLES
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours) //protect this endpoint
  .post(tourController.createTour); // to use a middleware on this path alone, use something like.post(tourController.checkBody, tourController.createTour);

//get the stats using its own route.
router.route('/tour-stats').get(tourController.getTourStats);

//get monthly plan by year.
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

//the route's home is /api/v1/tours therefore no need to include that in the route path again
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), //adding user authorization middleware
    tourController.deleteTour
  );

//export the file as a module, so it can be imported into another js file
module.exports = router;
