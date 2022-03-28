const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router(); //allow access to the params coming from the tourRoutes

//only authenticated users can create/update/delete  a review
router.use(authController.protect);

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

module.exports = router;
