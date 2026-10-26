// Accounts: POST /api/v1/auth/register, POST /api/v1/auth/login, GET /api/v1/auth/me.
// Called by the React Login/Register pages. Passwords are hashed with bcrypt; successful logins get a JWT.
const express = require('express');
const bcrypt = require('bcryptjs');
const { User, toPublicUser } = require('../models/User');
const { verifyJwt } = require('../middleware/auth');
const { createHttpError } = require('../middleware/errorHandler');
const { signToken } = require('../utils/token');

const router = express.Router();

// 10 rounds = bcrypt runs 2^10 times: slow enough to stop guessing attacks, fast enough for a login
const BCRYPT_ROUNDS = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;
const SELF_REGISTER_ROLES = ['CITIZEN', 'VOLUNTEER'];

// Same rules as the React form, checked again here because anyone can call the API directly
function validateRegistration({ name, email, password, phone, role }) {
  if (!name || !name.trim()) return 'name is required';
  if (!email || !EMAIL_PATTERN.test(email)) return 'email must be a valid email address';
  if (!password || password.length < 6) return 'password must be at least 6 characters';
  if (!PHONE_PATTERN.test(phone || '')) return 'phone must be a 10-digit phone number';
  // Nobody may make themselves an admin through the public form
  if (!SELF_REGISTER_ROLES.includes(role)) return 'role must be CITIZEN or VOLUNTEER';
  return null;
}

async function register(req, res, next) {
  try {
    const problem = validateRegistration(req.body);
    if (problem) throw createHttpError(400, problem);
    const { name, email, password, phone, role } = req.body;
    if (await User.exists({ email: email.toLowerCase().trim() })) {
      throw createHttpError(409, 'This email is already registered');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ name, email, password: passwordHash, phone, role });
    res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

// Same message for "no such email" and "wrong password", so attackers can't discover which emails exist
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw createHttpError(400, 'email and password are required');
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const passwordMatches = user && (await bcrypt.compare(password, user.password));
    if (!passwordMatches) throw createHttpError(401, 'Wrong email or password');
    res.json({ token: signToken(user), user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

// Lets the frontend re-check who is logged in (e.g. after a page reload)
async function getCurrentUser(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) throw createHttpError(404, 'User not found');
    res.json(toPublicUser(user));
  } catch (error) {
    next(error);
  }
}

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyJwt, getCurrentUser);

module.exports = router;
