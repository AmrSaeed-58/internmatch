/**
 * Wraps an async route handler to catch errors and forward to Express error middleware.
 * @param {Function} fn - Async route handler (req, res, next)
 * @returns {Function}
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
