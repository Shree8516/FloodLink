// GET /api/v1/activity: the latest activity log entries, newest first.
// Called by the React live ticker when it first loads (after that, new entries arrive via Socket.io).
const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { verifyJwt } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// The limit is capped so nobody can ask for a million rows at once
async function listActivity(req, res, next) {
  try {
    const requested = Number(req.query.limit) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(requested, 1), MAX_LIMIT);
    const entries = await ActivityLog.find().sort({ createdAt: -1 }).limit(limit);
    res.json(entries);
  } catch (error) {
    next(error);
  }
}

router.get('/', verifyJwt, listActivity);

module.exports = router;
