// POST /api/v1/events: request-service (Spring) calls this after every change to a help request,
// forwarding the JWT of the user who made the change. We broadcast the change to every browser via Socket.io,
// save a sentence in the activity log, and broadcast that sentence too (for the live ticker).
const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { verifyJwt } = require('../middleware/auth');
const { createHttpError } = require('../middleware/errorHandler');
const { areaFromAddress } = require('../utils/area');

const router = express.Router();

const ALLOWED_EVENTS = [
  'request:created', 'request:claimed', 'request:resolved', 'request:updated', 'request:deleted', 'request:merged',
];

// Most events carry one HelpRequest. "request:merged" carries { id, original, merged }: the sentence and the
// area are about the original request, the one volunteers keep working on.
function mainRequest(data) {
  return data.original || data;
}

// Turns an event into a sentence for humans, e.g. "Volunteer Priya claimed a request in Velachery".
// The actor comes from the forwarded JWT, so we always know WHO did it.
function describeEvent(event, data, actor) {
  const request = mainRequest(data);
  const area = areaFromAddress(request.address);
  const type = request.type ? request.type.toLowerCase() : '';
  switch (event) {
    case 'request:created':
      return `${actor.name} asked for ${type} help in ${area}`;
    case 'request:claimed':
      return `Volunteer ${actor.name} claimed a ${type} request in ${area}`;
    case 'request:resolved':
      return `${actor.name} resolved a ${type} request in ${area}`;
    case 'request:merged':
      return `${actor.name} merged duplicate #${data.merged.id} into #${request.id} in ${area}`;
    case 'request:updated':
      return `${actor.name} edited request #${data.id}`;
    default:
      return `${actor.name} deleted request #${data.id}`;
  }
}

// "request:merged" must say which request was merged, otherwise the sentence (and the browsers) can't use it
function hasValidData(event, data) {
  if (!data || data.id === undefined) return false;
  return event !== 'request:merged' || Boolean(data.original && data.merged);
}

// Broadcast first, then log: browsers get the map update even if the database write is slow
async function publishEvent(req, res, next) {
  try {
    const { event, data } = req.body;
    if (!ALLOWED_EVENTS.includes(event) || !hasValidData(event, data)) {
      throw createHttpError(400, `"event" must be one of ${ALLOWED_EVENTS.join(', ')} and "data.id" is required`
        + ' ("data.original" and "data.merged" too for request:merged)');
    }
    const io = req.app.get('io');
    io.emit(event, data);
    const request = mainRequest(data);
    const entry = await ActivityLog.create({
      event,
      requestId: data.id,
      actorName: req.user.name,
      area: request.address ? areaFromAddress(request.address) : undefined,
      message: describeEvent(event, data, req.user),
    });
    io.emit('activity:created', entry);
    res.status(202).json({ delivered: true, event });
  } catch (error) {
    next(error);
  }
}

router.post('/', verifyJwt, publishEvent);

module.exports = router;
