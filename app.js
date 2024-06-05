const express = require('express');
const morgan = require('morgan');
const taskRoutes = require('./Routes/taskRoutes');
const userRoutes = require('./Routes/userRoutes');
const globalErrorHandler = require('./Controllers/errorController');
const User = require('./Models/userModel');
const { createSendToken } = require('./Controllers/authController');
const catchAsync = require('./Utils/catchAsync');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// BODY PARSER
app.use(express.json());

// COOKIE-PARSER
app.use(cookieParser());

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true, // Allow credentials (cookies) to be sent
  })
);

// DEVELOPMENT LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//--- ADMIN SIGNUP ROUTE
app.post(
  '/api/v1/users/adminSignup',
  catchAsync(async (req, res, next) => {
    const user = await User.create(req.body);

    createSendToken(user, 200, res);
  })
);
// ROUTES
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', userRoutes);

// UNHANDLED ROUTE ERROR HANDLER
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
