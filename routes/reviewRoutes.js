const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); //allow access to the params coming from the tourRoutes

router.route('/').get(reviewController.getAllReviews).post(
  authController.protect, //only authenticated users can leave a review
  authController.restrictTo('user'), //only regular users can post reviews
  reviewController.setTourIds, //get the needed params
  reviewController.create
);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
