// Creates the Socket.io server that keeps a live connection to every open browser tab.
// Called by index.js. Routes broadcast through it with io.emit(eventName, data).
// It also tracks which volunteers are online (presence.js) and pushes that list as "presence:changed".
const { Server } = require('socket.io');
const config = require('./config');
const presence = require('./presence');
const { verifyToken } = require('./utils/token');

// Only logged-in users may connect: the browser sends its JWT in the handshake (io(url, { auth: { token } }))
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Missing token'));
  }
  try {
    socket.user = verifyToken(token);
    return next();
  } catch (error) {
    return next(new Error('Invalid token'));
  }
}

// Everyone gets the same list, so every map shows the same volunteer dots and the same "online" count
function broadcastPresence(io) {
  io.emit('presence:changed', presence.listOnlineVolunteers());
}

// Browsers send exactly two things over the socket, both only from volunteers:
// "presence:update" { latitude, longitude } while sharing their location, and "presence:stop" to hide it.
// All changes to help requests still go through the REST API.
function listenForPresence(io, socket) {
  socket.on('presence:update', (location) => {
    const { latitude, longitude } = location || {};
    if (presence.updateLocation(socket.id, Number(latitude), Number(longitude))) {
      broadcastPresence(io);
    }
  });
  socket.on('presence:stop', () => {
    if (presence.clearLocation(socket.id)) broadcastPresence(io);
  });
}

function createSocketServer(httpServer) {
  const io = new Server(httpServer, { cors: { origin: config.corsOrigin } });
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const isVolunteer = socket.user.role === 'VOLUNTEER';
    console.log(`[socket] ${socket.user.name} (${socket.user.role}) connected, ${io.engine.clientsCount} online`);

    if (isVolunteer) {
      presence.addConnection(socket.id, socket.user);
      listenForPresence(io, socket);
      broadcastPresence(io);
    } else {
      // Citizens and admins only watch: send them the current list once, then the broadcasts keep it fresh
      socket.emit('presence:changed', presence.listOnlineVolunteers());
    }

    socket.on('disconnect', () => {
      console.log(`[socket] ${socket.user.name} disconnected`);
      if (isVolunteer && presence.removeConnection(socket.id)) broadcastPresence(io);
    });
  });

  return io;
}

module.exports = createSocketServer;
