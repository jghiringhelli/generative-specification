'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// ── In-memory store ──────────────────────────────────────────────────────────
// keyed by email (lower-cased); secondary index by username
const users = new Map();       // email → user object
const byUsername = new Map();  // username → email

const JWT_SECRET = process.env.JWT_SECRET || 'realworld-secret-key';
const SALT_ROUNDS = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeToken(email) {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
}

function userPayload(user) {
  return {
    user: {
      username: user.username,
      email: user.email,
      bio: user.bio,
      image: user.image,
      token: makeToken(user.email),
    },
  };
}

// Normalize empty string → null for nullable fields
function normalizeNullable(val) {
  if (val === '' || val === undefined) return null;
  return val; // null passes through; real strings pass through
}

// Extract and verify JWT from Authorization header
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const match = header.match(/^Token\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ errors: { token: ['is missing'] } });
  }
  try {
    const payload = jwt.verify(match[1], JWT_SECRET);
    const user = users.get(payload.email);
    if (!user) {
      return res.status(401).json({ errors: { token: ['is invalid'] } });
    }
    req.currentUser = user;
    next();
  } catch {
    return res.status(401).json({ errors: { token: ['is invalid'] } });
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/users — register
app.post('/api/users', async (req, res) => {
  const body = (req.body && req.body.user) || {};
  const { username, email, password } = body;

  const errs = {};

  if (!username || typeof username !== 'string' || !username.trim()) {
    errs.username = ["can't be blank"];
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    errs.email = ["can't be blank"];
  }
  if (!password || typeof password !== 'string' || !password.trim()) {
    errs.password = ["can't be blank"];
  }

  if (Object.keys(errs).length) {
    return res.status(422).json({ errors: errs });
  }

  const emailKey = email.toLowerCase();

  // Check duplicates — 409 per contract
  if (byUsername.has(username)) {
    return res.status(409).json({ errors: { username: ['has already been taken'] } });
  }
  if (users.has(emailKey)) {
    return res.status(409).json({ errors: { email: ['has already been taken'] } });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = { username, email: emailKey, passwordHash: hash, bio: null, image: null };
  users.set(emailKey, user);
  byUsername.set(username, emailKey);

  return res.status(201).json(userPayload(user));
});

// POST /api/users/login — login
app.post('/api/users/login', async (req, res) => {
  const body = (req.body && req.body.user) || {};
  const { email, password } = body;

  const errs = {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    errs.email = ["can't be blank"];
  }
  if (!password || typeof password !== 'string' || !password.trim()) {
    errs.password = ["can't be blank"];
  }

  if (Object.keys(errs).length) {
    return res.status(422).json({ errors: errs });
  }

  const emailKey = email.toLowerCase();
  const user = users.get(emailKey);

  if (!user) {
    return res.status(401).json({ errors: { credentials: ['invalid'] } });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ errors: { credentials: ['invalid'] } });
  }

  return res.status(200).json(userPayload(user));
});

// GET /api/user — current user
app.get('/api/user', requireAuth, (req, res) => {
  return res.status(200).json(userPayload(req.currentUser));
});

// PUT /api/user — update current user
app.put('/api/user', requireAuth, async (req, res) => {
  const body = (req.body && req.body.user) || {};
  const user = req.currentUser;
  const errs = {};

  // username: present in body but null or empty → 422
  if ('username' in body) {
    if (body.username === null || body.username === '') {
      errs.username = ["can't be blank"];
    }
  }
  // email: present in body but null or empty → 422
  if ('email' in body) {
    if (body.email === null || body.email === '') {
      errs.email = ["can't be blank"];
    }
  }

  if (Object.keys(errs).length) {
    return res.status(422).json({ errors: errs });
  }

  // Check uniqueness for username change
  if ('username' in body && body.username !== user.username) {
    if (byUsername.has(body.username)) {
      return res.status(409).json({ errors: { username: ['has already been taken'] } });
    }
  }
  // Check uniqueness for email change
  if ('email' in body && body.email.toLowerCase() !== user.email) {
    if (users.has(body.email.toLowerCase())) {
      return res.status(409).json({ errors: { email: ['has already been taken'] } });
    }
  }

  // Apply updates
  if ('username' in body && body.username !== user.username) {
    byUsername.delete(user.username);
    user.username = body.username;
    byUsername.set(user.username, user.email);
  }

  if ('email' in body) {
    const newEmail = body.email.toLowerCase();
    if (newEmail !== user.email) {
      users.delete(user.email);
      user.email = newEmail;
      users.set(newEmail, user);
    }
  }

  if ('bio' in body) {
    user.bio = normalizeNullable(body.bio);
  }

  if ('image' in body) {
    user.image = normalizeNullable(body.image);
  }

  if ('password' in body && body.password) {
    user.passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
  }

  return res.status(200).json(userPayload(user));
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RealWorld auth (C3) listening on port ${PORT}`);
});
