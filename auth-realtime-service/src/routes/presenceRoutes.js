// GET /api/v1/presence: which volunteers are online right now, with their approximate location if shared.
// The React app gets the same list live as the Socket.io event "presence:changed"; this route is for
// Swagger/Postman and anyone who wants a snapshot without opening a socket.
const express = require('express');
const presence = require('../presence');
const { verifyJwt } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyJwt, (req, res) => {
  res.json(presence.listOnlineVolunteers());
});

module.exports = router;
