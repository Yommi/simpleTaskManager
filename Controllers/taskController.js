const Task = require('../Models/taskModel');
const factory = require('./handlerFactory');

exports.createTask = factory.createOne(Task);

exports.getAllTasks = factory.getAll(Task);

exports.getTask = factory.getOne(Task);

exports.updateTask = factory.updateOne(Task);

exports.deleteTask = factory.deleteOne(Task);

exports.setUserId = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;

  next();
};
