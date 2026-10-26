// Central error handling: every error ends up here and becomes the shared JSON { status, error, message }.
// Routes call next(error) or throw inside try/catch; app.js registers these handlers last.
const { STATUS_CODES } = require('http');

// Small helper so routes can write: next(createHttpError(400, 'email is required'))
function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Runs when no route matched the URL
function notFoundHandler(req, res, next) {
  next(createHttpError(404, `No route for ${req.method} ${req.originalUrl}`));
}

// Turns errors we didn't create ourselves (Mongoose, JSON parsing) into the right status code
function statusFor(error) {
  if (error.status) return error.status;
  if (error.name === 'ValidationError' || error.type === 'entity.parse.failed') return 400;
  if (error.code === 11000) return 409; // MongoDB "duplicate key", e.g. email already registered
  return 500;
}

// Express knows this is an error handler because it has 4 parameters (so "next" must stay, even unused)
function errorHandler(error, req, res, next) {
  const status = statusFor(error);
  if (status === 500) {
    console.error('[error]', error);
  }
  res.status(status).json({
    status,
    error: STATUS_CODES[status],
    message: status === 500 ? 'Something went wrong in auth-realtime-service' : error.message,
  });
}

module.exports = { createHttpError, notFoundHandler, errorHandler };
