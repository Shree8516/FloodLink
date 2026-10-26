// Everything about JWTs in one file. This service is the ONLY one that SIGNS tokens;
// request-service (Spring) and insights-service (Flask) only VERIFY them with the same JWT_SECRET.
const jwt = require('jsonwebtoken');
const config = require('../config');

// Payload agreed in CONTRACT.md: { userId, name, email, role }. Never put the password (even hashed) in here:
// a JWT is signed, not encrypted, so anyone can read its contents.
function signToken(user) {
  const payload = { userId: user._id.toString(), name: user.name, email: user.email, role: user.role };
  return jwt.sign(payload, config.jwtSecret, { algorithm: 'HS256', expiresIn: config.jwtExpiresIn });
}

// Throws if the token was tampered with, signed with another secret, or has expired
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken };
