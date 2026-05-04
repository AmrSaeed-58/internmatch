const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const authenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }

  const [rows] = await pool.execute(
    'SELECT user_id, full_name, email, role, is_active, token_version FROM users WHERE user_id = ?',
    [decoded.userId]
  );

  if (rows.length === 0) {
    throw new AppError('User no longer exists', 401);
  }

  const user = rows[0];

  if (!user.is_active) {
    throw new AppError('Account deactivated. Please contact an admin.', 403);
  }

  // tokenVersion mismatch means the password was changed since this token was issued.
  if (user.token_version !== decoded.tokenVersion) {
    throw new AppError('Session expired. Please log in again.', 401);
  }

  req.user = {
    userId: user.user_id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
  };

  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
    return next();
  }

  try {
    const [rows] = await pool.execute(
      'SELECT user_id, full_name, email, role, is_active, token_version FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (rows.length === 0 || !rows[0].is_active || rows[0].token_version !== decoded.tokenVersion) {
      req.user = null;
      return next();
    }

    req.user = {
      userId: rows[0].user_id,
      fullName: rows[0].full_name,
      email: rows[0].email,
      role: rows[0].role,
    };
  } catch {
    req.user = null;
  }

  next();
};

module.exports = { authenticate, authorize, optionalAuth };
