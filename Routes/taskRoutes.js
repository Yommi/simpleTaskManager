const express = require('express');
const taskController = require('./../Controllers/taskController');
const authController = require('./../Controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), taskController.getAllTasks)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    taskController.setUserId,
    taskController.createTask
  );

router
  .route('/:Id')
  .get(taskController.getTask)
  .patch(taskController.updateTask)
  .delete(taskController.deleteTask);

module.exports = router;
