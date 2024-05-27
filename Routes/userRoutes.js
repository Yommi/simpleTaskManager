const express = require('express');
const userController = require('./../Controllers/userController');
const authController = require('./../Controllers/authController');

const router = express.Router();

router.route('/login').post(authController.login);
router.route('/signUp').post(authController.signUp);
router.route('/forgotpassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

// LOGGED IN USERS/ADMIN ACCESS
router.use(authController.protect);

router.route('/updatePassword').patch(authController.updatePassword);
router.route('/updateMe').patch(userController.updateMe);
router
  .route('/getMe')
  .get(userController.getOrDeleteMe, userController.getUser);
router
  .route('/deleteMe')
  .delete(userController.getOrDeleteMe, userController.deleteUser);

// ADMIN ONLY ACCESS
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
