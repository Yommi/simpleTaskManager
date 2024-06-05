const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('./../Models/userModel');
const AppError = require('./../Utils/appError');
const catchAsync = require('../Utils/catchAsync');
const sendEmail = require('../Utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  ),
  httpOnly: true,
  sameSite: 'None',
};
const createSendToken = (user, statusCode, res, req) => {
  const token = signToken(user.id);

  user.password = undefined;

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.createSendToken = createSendToken;

const filterObj = (obj, ...unAllowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (!unAllowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.signUp = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'role');
  const newUser = await User.create(filteredBody);

  createSendToken(newUser, 201, res, req);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save({ validateBeforeSave: false });
  createSendToken(user, 200, res, req);
});

exports.protect = catchAsync(async (req, res, next) => {
  // CHECKING IF TOKEN EXISTS
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else {
    token = req.cookies.jwt;
  }

  // IF TOKEN DOESN'T EXIST
  if (!token) {
    return next(
      new AppError(
        'You are not logged in! Please login to get access',
        401
      )
    );
  }

  // VERIFYING THE TOKEN
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // CHECKING IF USER ATTACHED TO TOKEN STILL EXISTS
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user who owns this token no longer exists', 401)
    );
  }

  // CHECKING IF THE PASSWORD HAS BEEN CHANGED SINCE TOKEN'S ISSUED
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed password! Please login again.',
        401
      )
    );
  }

  // STORING CURRENT USER IN THE REQUEST OBJECT
  req.user = currentUser;

  // GRANTING ACCESS TO PROTECTED ROUTE
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not permitted perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError('There is no user with that email address', 404)
    );
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({
    validateBeforeSave: false,
  });

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot password? Submit a PATCH request with your new password and passWordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password Reset Token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.PasswordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save({
      validateBeforeSave: false,
    });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save({ validateBeforeSave: true });

  createSendToken(user, 200, res, req);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordOld, user.password))) {
    return next(new AppError('Your old password is incorrect!', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save({ validateBeforeSave: true });

  createSendToken(user, 200, res, req);
});
