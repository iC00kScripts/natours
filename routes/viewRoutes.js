const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(viewsController.controlCacheHeader);

router.get('/me', authController.protect, viewsController.getAccount);

router.use(authController.isLoggedIn); //use the middleware to check for logged in user in every rendered page

router.get('/', viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLoginForm);
router.post('/submit-user-data', viewsController.updateUserData);

module.exports = router;
