// Entry point of auth-realtime-service (port 5000). Run with `npm start`.
// Connects to MongoDB, then starts one HTTP server that serves both the Express API and Socket.io.
const http = require('http');
const mongoose = require('mongoose');
const config = require('./config');
const createApp = require('./app');
const createSocketServer = require('./socket');

// Express and Socket.io share one HTTP server, so they share one port
async function start() {
  const app = createApp();
  const httpServer = http.createServer(app);
  const io = createSocketServer(httpServer);
  // Routes reach Socket.io through req.app.get('io') to broadcast events
  app.set('io', io);

  try {
    // Fail fast (5 s) with a clear message instead of hanging when MongoDB isn't running
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[db] Connected to MongoDB at ${config.mongoUri}`);
  } catch (error) {
    console.error(`[db] Could not connect to MongoDB (${config.mongoUri}): ${error.message}`);
    console.error('[db] Start MongoDB (or set MONGO_URI in .env) and try again.');
    process.exit(1);
  }

  httpServer.listen(config.port, () => {
    console.log(`[server] auth-realtime-service running on http://localhost:${config.port}`);
    console.log(`[server] Swagger docs at http://localhost:${config.port}/api-docs`);
  });
}

start();
