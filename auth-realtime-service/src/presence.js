// Who is online right now: an in-memory list of connected VOLUNTEER sockets and, if they chose to share it,
// their approximate location. Used by socket.js (connect/disconnect/location events) and presenceRoutes.js.
// Kept in memory on purpose: presence only means something while the server runs, so it doesn't belong in MongoDB.

// socket.id -> { userId, name, latitude, longitude, updatedAt }. One volunteer can have several tabs open.
const connections = new Map();

// Ignore location updates that arrive faster than this (a phone's GPS can fire several times per second)
const MIN_UPDATE_INTERVAL_MS = 3000;

// 3 decimals = about 100 m. Enough to show "a volunteer is near Velachery", without pinpointing their house.
function roundCoordinate(value) {
  return Math.round(value * 1000) / 1000;
}

function isValidLocation(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

function addConnection(socketId, user) {
  connections.set(socketId, { userId: user.userId, name: user.name, latitude: null, longitude: null, updatedAt: null });
}

// Returns true when the stored location actually changed, so the caller knows whether to broadcast
function updateLocation(socketId, latitude, longitude) {
  const connection = connections.get(socketId);
  if (!connection || !isValidLocation(latitude, longitude)) return false;
  if (connection.updatedAt && Date.now() - connection.updatedAt < MIN_UPDATE_INTERVAL_MS) return false;
  connection.latitude = roundCoordinate(latitude);
  connection.longitude = roundCoordinate(longitude);
  connection.updatedAt = Date.now();
  return true;
}

// The volunteer switched "Share my location" off: they stay online, but their dot disappears
function clearLocation(socketId) {
  const connection = connections.get(socketId);
  if (!connection || connection.latitude === null) return false;
  connection.latitude = null;
  connection.longitude = null;
  connection.updatedAt = null;
  return true;
}

function removeConnection(socketId) {
  return connections.delete(socketId);
}

// One entry per volunteer (not per tab). If several tabs share a location, the most recent one wins.
function listOnlineVolunteers() {
  const byUser = new Map();
  for (const connection of connections.values()) {
    const known = byUser.get(connection.userId);
    if (!known || (connection.updatedAt || 0) > (known.updatedAt || 0)) {
      byUser.set(connection.userId, connection);
    }
  }
  const volunteers = [...byUser.values()].map((v) => ({
    userId: v.userId,
    name: v.name,
    latitude: v.latitude,
    longitude: v.longitude,
    updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : null,
  }));
  return { onlineCount: volunteers.length, volunteers };
}

module.exports = { addConnection, updateLocation, clearLocation, removeConnection, listOnlineVolunteers };
