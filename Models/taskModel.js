const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: String,
  task: {
    type: String,
    required: [true, 'A task must have tasks'],
  },
  completed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A task must belong to a user'],
  },
});

taskSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'id',
  });
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
