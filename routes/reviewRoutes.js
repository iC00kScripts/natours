const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(reviewController.getAllReviews).post(
  authController.protect, //only authenticated users can leave a review
  authController.restrictTo('user'), //only regular users can post reviews
  reviewController.create
);

module.exports = router;
