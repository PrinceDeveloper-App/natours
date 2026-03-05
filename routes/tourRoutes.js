
const express =require('express');

const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();
//router.param('id', tourController.checkID);

    //POST /tour/234fad4/reviews
//GET /tour/234fad4/reviews
//GET /tour/234fad4/reviews/94887dd
//reviews belong to tours
// router
// .route('/:tourId/reviews')
// .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
// );
//Router itself as a midleware.. Mounting the review router.. Its re-routed to the reviewRouter
router.use('/:tourId/reviews', reviewRouter);

router
   .route('/top-5-cheap')
   .get(tourController.aliasTopTours, 
    tourController.getAllTours);

router
.route('/tour-stats')
.get(tourController.getTourStats);
router
.route('/monthly-plan/:year')
.get(authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router
   .route('/distances/:latlng/unit/:unit')
   .get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour)
  .delete(
    //Here two middle wares protect middle ware and restrictTo middle ware
    authController.protect,
    /// After completing the protect middle ware the current user is on the request objcet
    //restrict middle ware pass all of the roles that allows to intract with these resources
    //restrict to function will run and return the middle ware function itself
    authController.restrictTo('admin', 'lead-guide'),
    //basically which allow to run in deleteTour handler function 
    tourController.deleteTour);


module.exports =router;