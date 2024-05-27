const User = require('./../Models/userModel');
const factory = require('./../Controllers/handlerFactory');
const catchAsync = require('./../Utils/catchAsync');
const AppError = require('../Utils/appError');

exports.createUser = factory.createOne(User);

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User, { path: 'tasks' });

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email', 'photo');

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      data: updatedUser,
    },
  });
});

exports.getOrDeleteMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});
