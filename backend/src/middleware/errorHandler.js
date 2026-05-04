const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, _next) => {
  // Default to 500 internal server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this information already exists';
  }

  // express-validator structured errors
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    const errors = err.array();
    return res.status(statusCode).json({
      success: false,
      message: 'Validation failed',
      errors: errors.map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  // Log in development only
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('ERROR:', err);
  }

  // Never send stack traces to clients
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && !err.isOperational
      ? 'Something went wrong'
      : message,
  });
};

module.exports = errorHandler;
