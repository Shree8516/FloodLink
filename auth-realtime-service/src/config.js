// All settings for auth-realtime-service in one place, read from .env (via dotenv) with safe defaults.
// Imported by index.js, app.js, socket.js, the JWT helpers and the seed script.
require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/floodlink',
  // Must match request-service and insights-service, otherwise they reject every token
  jwtSecret: process.env.JWT_SECRET || 'floodlink-demo-secret-change-me-0123456789',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  requestServiceUrl: process.env.REQUEST_SERVICE_URL || 'http://localhost:8080',
};
