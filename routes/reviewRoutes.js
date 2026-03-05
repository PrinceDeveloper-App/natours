const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

//In order to get parameters from other routes we use mergeParams
//Here we need to get tourId from tourRoutes in order to mounting reviewRouter on tour router
const router = express.Router({ mergeParams: true });

// POST /tour/234efad4/reviews Note: when we use mergeParams we get the tourId from the tour Router(router.use('/:tourId/reviews', reviewRouter);)
//POST /reviews
//Both cases (with tourId and withOut tourId) createReview function will run
// GET /tour/234efad4/reviews

router.use(authController.protect);

router.route('/')
   .get(reviewController.getAllReviews)
   .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
);

router
   .route('/:id')
   .get(reviewController.getReview)
   .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview)
   .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview);

module.exports =router;