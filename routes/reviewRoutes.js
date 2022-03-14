const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); //allow access to the params coming from the tourRoutes

//only authenticated users can create/update/delete  a review
router.use(authController.protect);

router.route('/').get(reviewController.getAllReviews).post(
  authController.restrictTo('user'), //only regular users can post reviews
  reviewController.setTourIds, //get the needed params
  reviewController.create
);

router.route('/:id').get(reviewController.getReview);

router.use(authController.restrictTo('user', 'admin'));

router
  .route('/:id')
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
