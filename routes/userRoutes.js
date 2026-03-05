const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');


const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
//Which will recieve the email address
router.post('/forgotPassword', authController.forgotPassword);
//Which will recieve the token for new password
router.patch('/resetPassword/:token', authController.resetPassword);

//Authentication - Protect
//Authorisation - RestrictTo
//Protect is a middle ware... if we use the middle ware like the following manner..this will protect all the routes after come this..
//..because middleware runs in sequence
//next middleware is patch..
router.use(authController.protect);

router.patch(
    '/updateMyPassword',///Get the User Id from here
    authController.updatePassword
);

router.get(
    '/me',
    userController.getMe,
    userController.getUser
);

router.patch(
    '/updateMe',
    //upload- is the middleware, single - means holds a single file
    //photo - name of the filed that hold photo
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);

router.delete(
    '/deleteMe',
    userController.deleteMe
);

router.use(authController.restrictTo('admin'));

router
.route('/')
.get(userController.getAllUsers)
.post(userController.CreateUser);

router
.route('/:id')
.get(userController.getUser)
.patch(userController.updateUser)
.delete(userController.deleteUser);

module.exports = router;