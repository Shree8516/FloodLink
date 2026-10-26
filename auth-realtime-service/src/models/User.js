// Mongoose model for a person who can log in (citizen, volunteer or admin). Stored in the "users" collection.
// Used by authRoutes.js (register/login/me) and scripts/seed.js.
const mongoose = require('mongoose');

const ROLES = ['CITIZEN', 'VOLUNTEER', 'ADMIN'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // unique creates a MongoDB index, so the database itself refuses a second account with the same email
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Always a bcrypt hash, never the plain password
    password: { type: String, required: true },
    phone: { type: String, required: true, match: /^\d{10}$/ },
    role: { type: String, required: true, enum: ROLES },
  },
  { timestamps: true }
);

// The shape we send to the browser: everything except the password hash
function toPublicUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone, role: user.role };
}

module.exports = { User: mongoose.model('User', userSchema), toPublicUser, ROLES };
