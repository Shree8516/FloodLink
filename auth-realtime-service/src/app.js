// Builds the Express app: middleware (CORS, JSON, logger), the API routes, Swagger docs and error handling.
// Called once by index.js. The ORDER below matters: middleware runs top to bottom for every request.
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const requestLogger = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const activityRoutes = require('./routes/activityRoutes');
const presenceRoutes = require('./routes/presenceRoutes');
const swaggerDocument = require('./docs/swagger');

function createApp() {
  const app = express();

  // 1. Middleware that runs before every route
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(requestLogger);

  // 2. Routes
  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'UP', service: 'auth-realtime-service', connectedClients: req.app.get('io').engine.clientsCount });
  });
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/events', eventRoutes);
  app.use('/api/v1/activity', activityRoutes);
  app.use('/api/v1/presence', presenceRoutes);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // 3. Nothing matched -> 404; anything threw -> central error handler (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
