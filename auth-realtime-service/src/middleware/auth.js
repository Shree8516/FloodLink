// JWT middleware for Express routes. verifyJwt checks a token this service issued;
// requireRole checks the role inside it. Used by every protected route.
const { createHttpError } = require('./errorHandler');
const { verifyToken } = require('../utils/token');

// Reads "Authorization: Bearer <token>", verifies the signature and expiry, puts the payload on req.user
function verifyJwt(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(createHttpError(401, 'Please log in (missing token)'));
  }
  try {
    req.user = verifyToken(header.slice('Bearer '.length));
    return next();
  } catch (error) {
    return next(createHttpError(401, 'Invalid or expired token'));
  }
}

// Returns a middleware that lets only the listed roles through, e.g. requireRole('ADMIN')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(createHttpError(403, `Only ${allowedRoles.join(' or ')} can do this`));
    }
    return next();
  };
}

module.exports = { verifyJwt, requireRole };
