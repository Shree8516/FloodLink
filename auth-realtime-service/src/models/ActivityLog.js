// Mongoose model for the activity log: one document per event ("Volunteer Priya claimed a request in Velachery").
// Written by eventRoutes.js, read by activityRoutes.js and shown in the React live ticker.
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true },
    requestId: { type: Number },
    actorName: { type: String },
    area: { type: String },
    message: { type: String, required: true },
  },
  // Adds createdAt automatically; log entries are never edited, so no updatedAt
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
