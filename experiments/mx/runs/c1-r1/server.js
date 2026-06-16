'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'conduit-auth-slice-dev-secret';

const app = express();
app.use(express.json());

// In-memory store keyed by user id; secondary lookups by email/username.
const usersById = new Map();
let nextId = 1;

function findByEmail(email) {
  for (const u of usersById.values()) if (u.email === email) return u;
  return null;
}
function findByUsername(username) {
  for (const u of usersById.values()) if (u.username === username) return u;
  return null;
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    user: {
      username: user.username,
      email: user.email,
      bio: user.bio,
      image: user.image,
      token: signToken(user)
    }
  };
}

// Validation errors -> RealWorld 422 shape { errors: { field: [msg] } }
function validationError(res, errors) {
  return res.status(422).json({ errors });
}

// Extract token from "Authorization: Token <jwt>". Returns user or null.
function authUser(req) {
  const header = req.get('Authorization');
  if (!header) return null;
  const match = /^Token\s+(.+)$/.exec(header.trim());
  if (!match) return null;
  try {
    const payload = jwt.verify(match[1], JWT_SECRET);
    return usersById.get(payload.id) || null;
  } catch (e) {
    return null;
  }
}

function requireAuth(req, res) {
  const header = req.get('Authorization');
  if (!header) {
    res.status(401).json({ errors: { token: ['is missing'] } });
    return null;
  }
  const user = authUser(req);
  if (!user) {
    res.status(401).json({ errors: { token: ['is invalid'] } });
    return null;
  }
  return user;
}

// POST /api/users — register
app.post('/api/users', (req, res) => {
  const body = (req.body && req.body.user) || {};
  const username = body.username;
  const email = body.email;
  const password = body.password;

  const errors = {};
  if (username === undefined || username === null || username === '') {
    errors.username = ["can't be blank"];
  }
  if (email === undefined || email === null || email === '') {
    errors.email = ["can't be blank"];
  }
  if (password === undefined || password === null || password === '') {
    errors.password = ["can't be blank"];
  }
  if (Object.keys(errors).length > 0) return validationError(res, errors);

  if (findByUsername(username)) {
    return res.status(409).json({ errors: { username: ['has already been taken'] } });
  }
  if (findByEmail(email)) {
    return res.status(409).json({ errors: { email: ['has already been taken'] } });
  }

  const user = {
    id: nextId++,
    username,
    email,
    bio: null,
    image: null,
    passwordHash: bcrypt.hashSync(password, 10)
  };
  usersById.set(user.id, user);
  return res.status(201).json(publicUser(user));
});

// POST /api/users/login
app.post('/api/users/login', (req, res) => {
  const body = (req.body && req.body.user) || {};
  const email = body.email;
  const password = body.password;

  const errors = {};
  if (email === undefined || email === null || email === '') {
    errors.email = ["can't be blank"];
  }
  if (password === undefined || password === null || password === '') {
    errors.password = ["can't be blank"];
  }
  if (Object.keys(errors).length > 0) return validationError(res, errors);

  const user = findByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ errors: { credentials: ['invalid'] } });
  }
  return res.status(200).json(publicUser(user));
});

// GET /api/user — current user
app.get('/api/user', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  return res.status(200).json(publicUser(user));
});

// PUT /api/user — update current user
app.put('/api/user', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const body = (req.body && req.body.user) || {};
  const errors = {};

  // username/email: required fields — reject empty string or explicit null.
  if ('username' in body) {
    if (body.username === null || body.username === '') {
      errors.username = ["can't be blank"];
    }
  }
  if ('email' in body) {
    if (body.email === null || body.email === '') {
      errors.email = ["can't be blank"];
    }
  }
  if (Object.keys(errors).length > 0) return validationError(res, errors);

  // Uniqueness checks for changed username/email.
  if ('username' in body && body.username !== user.username) {
    if (findByUsername(body.username)) {
      return res.status(409).json({ errors: { username: ['has already been taken'] } });
    }
  }
  if ('email' in body && body.email !== user.email) {
    if (findByEmail(body.email)) {
      return res.status(409).json({ errors: { email: ['has already been taken'] } });
    }
  }

  if ('username' in body) user.username = body.username;
  if ('email' in body) user.email = body.email;
  // bio/image are nullable: empty string normalizes to null.
  if ('bio' in body) user.bio = body.bio === '' || body.bio == null ? null : body.bio;
  if ('image' in body) user.image = body.image === '' || body.image == null ? null : body.image;
  if ('password' in body && body.password) {
    user.passwordHash = bcrypt.hashSync(body.password, 10);
  }

  return res.status(200).json(publicUser(user));
});

app.listen(PORT, () => {
  console.log(`conduit-auth-slice listening on port ${PORT}`);
});
