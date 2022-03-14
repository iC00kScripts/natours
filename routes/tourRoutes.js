const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

//TOURS route grouping
const router = express.Router();

router.use('/:tourId/reviews', reviewRouter); //mount the reviewRoute onto the tourRoutes to handle requests matching the path

//router.param('id', tourController.checkID); //validate ID by running the middleware

//CREATING AN API ALIASING FOR THE TOP 5, CHEAPEST TOURS USING A MIDDLEWARE THAT PREFILLS SPECIFIC VARIABLES
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

//get the stats using its own route.
router.route('/tour-stats').get(tourController.getTourStats);

//get all tours within :distance radius from :latlng. distance measures in :unit (km/mi)
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
//the route's home is /api/v1/tours therefore no need to include that in the route path again
router.route('/:id').get(tourController.getTour);
router.route('/').get(tourController.getAllTours);

//user must be properly authenticated to use all endpoints below
router.use(authController.protect);

//get monthly plan by year.
router
  .route('/monthly-plan/:year')
  .get(
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

//All endpoints below are restricted to admin and lead-guide
router.use(authController.restrictTo('admin', 'lead-guide'));

router.route('/').post(tourController.createTour); //only admin and lead guides can create new tours

//the route's home is /api/v1/tours therefore no need to include that in the route path again
router
  .route('/:id')
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

//export the file as a module, so it can be imported into another js file
module.exports = router;
