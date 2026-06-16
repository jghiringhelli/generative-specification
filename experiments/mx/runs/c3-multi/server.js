'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'conduit-secret-c3';
const SALT_ROUNDS = 10;

// ─── In-memory stores ────────────────────────────────────────────────────────
// users: Map<username, { username, email, passwordHash, bio, image }>
const users = new Map();
// emailIndex: Map<email, username>
const emailIndex = new Map();
// articles: Map<slug, article>
//   article: { slug, title, description, body, tagList, createdAt, updatedAt,
//               favoritesCount, authorUsername }
const articles = new Map();
// comments: Map<commentId, comment>
//   comment: { id, articleSlug, body, createdAt, updatedAt, authorUsername }
const comments = new Map();
let commentIdSeq = 1;

// ─── Utilities ───────────────────────────────────────────────────────────────
function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function uniqueSlug(title) {
  const base = slugify(title);
  let slug = base;
  let n = 1;
  while (articles.has(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function isoNow() {
  return new Date().toISOString();
}

function signToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function extractToken(req) {
  const auth = req.headers['authorization'] || '';
  const match = auth.match(/^Token\s+(.+)$/i);
  return match ? match[1] : null;
}

function formatUser(user, token) {
  return {
    username: user.username,
    email: user.email,
    bio: user.bio || null,
    image: user.image || null,
    token,
  };
}

function formatArticleSummary(article, currentUsername) {
  // List shape: no body field
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: article.tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: false,
    favoritesCount: article.favoritesCount,
    author: formatAuthor(article.authorUsername),
  };
}

function formatArticleFull(article, currentUsername) {
  // Single article shape: includes body
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: false,
    favoritesCount: article.favoritesCount,
    author: formatAuthor(article.authorUsername),
  };
}

function formatAuthor(username) {
  const u = users.get(username);
  if (!u) return { username, bio: null, image: null, following: false };
  return {
    username: u.username,
    bio: u.bio || null,
    image: u.image || null,
    following: false,
  };
}

function formatComment(comment) {
  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: formatAuthor(comment.authorUsername),
  };
}

// ─── Middleware ───────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ errors: { token: ['is missing'] } });
  }
  const payload = verifyToken(token);
  if (!payload || !users.has(payload.username)) {
    return res.status(401).json({ errors: { token: ['is invalid'] } });
  }
  req.currentUser = users.get(payload.username);
  req.currentToken = token;
  next();
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload && users.has(payload.username)) {
      req.currentUser = users.get(payload.username);
      req.currentToken = token;
    }
  }
  next();
}

// ─── App ─────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// ── Auth routes ───────────────────────────────────────────────────────────────

// POST /api/users — register
app.post('/api/users', async (req, res) => {
  const u = (req.body && req.body.user) || {};
  const errors = {};

  if (!u.username || u.username === '') errors.username = ["can't be blank"];
  if (!u.email || u.email === '') errors.email = ["can't be blank"];
  if (!u.password || u.password === '') errors.password = ["can't be blank"];

  if (Object.keys(errors).length) return res.status(422).json({ errors });

  if (users.has(u.username)) {
    return res.status(409).json({ errors: { username: ['has already been taken'] } });
  }
  if (emailIndex.has(u.email)) {
    return res.status(409).json({ errors: { email: ['has already been taken'] } });
  }

  const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
  const user = { username: u.username, email: u.email, passwordHash, bio: null, image: null };
  users.set(u.username, user);
  emailIndex.set(u.email, u.username);

  const token = signToken(u.username);
  return res.status(201).json({ user: formatUser(user, token) });
});

// POST /api/users/login — login
app.post('/api/users/login', async (req, res) => {
  const u = (req.body && req.body.user) || {};
  const errors = {};

  if (!u.email || u.email === '') errors.email = ["can't be blank"];
  if (!u.password || u.password === '') errors.password = ["can't be blank"];

  if (Object.keys(errors).length) return res.status(422).json({ errors });

  const username = emailIndex.get(u.email);
  if (!username) {
    return res.status(401).json({ errors: { credentials: ['invalid'] } });
  }
  const user = users.get(username);
  const valid = await bcrypt.compare(u.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ errors: { credentials: ['invalid'] } });
  }

  const token = signToken(username);
  return res.status(200).json({ user: formatUser(user, token) });
});

// GET /api/user — current user
app.get('/api/user', requireAuth, (req, res) => {
  return res.status(200).json({ user: formatUser(req.currentUser, req.currentToken) });
});

// PUT /api/user — update user
app.put('/api/user', requireAuth, async (req, res) => {
  const u = (req.body && req.body.user) || {};
  const user = req.currentUser;
  const errors = {};

  // Validate fields that must not be empty/null when provided
  if ('username' in u) {
    if (u.username === null || u.username === '') {
      errors.username = ["can't be blank"];
    }
  }
  if ('email' in u) {
    if (u.email === null || u.email === '') {
      errors.email = ["can't be blank"];
    }
  }

  if (Object.keys(errors).length) return res.status(422).json({ errors });

  // Check duplicates (only if values actually change)
  if ('username' in u && u.username !== user.username) {
    if (users.has(u.username)) {
      return res.status(409).json({ errors: { username: ['has already been taken'] } });
    }
  }
  if ('email' in u && u.email !== user.email) {
    if (emailIndex.has(u.email)) {
      return res.status(409).json({ errors: { email: ['has already been taken'] } });
    }
  }

  const oldUsername = user.username;
  const oldEmail = user.email;

  // Apply updates
  if ('username' in u) user.username = u.username;
  if ('email' in u) user.email = u.email;
  // bio/image: empty string → null; null → null; string → string
  if ('bio' in u) user.bio = (u.bio === '' || u.bio === null) ? null : u.bio;
  if ('image' in u) user.image = (u.image === '' || u.image === null) ? null : u.image;
  if ('password' in u && u.password) {
    user.passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
  }

  // Re-index if username or email changed
  if (user.username !== oldUsername) {
    users.delete(oldUsername);
    users.set(user.username, user);
    emailIndex.set(user.email, user.username);
    // Update all articles and comments authored by old username
    for (const art of articles.values()) {
      if (art.authorUsername === oldUsername) art.authorUsername = user.username;
    }
    for (const cmt of comments.values()) {
      if (cmt.authorUsername === oldUsername) cmt.authorUsername = user.username;
    }
  }
  if (user.email !== oldEmail) {
    emailIndex.delete(oldEmail);
    emailIndex.set(user.email, user.username);
  }

  const newToken = signToken(user.username);
  return res.status(200).json({ user: formatUser(user, newToken) });
});

// ── Article routes ────────────────────────────────────────────────────────────

// POST /api/articles — create
app.post('/api/articles', requireAuth, (req, res) => {
  const a = (req.body && req.body.article) || {};
  const errors = {};

  if (!a.title || a.title === '') errors.title = ["can't be blank"];
  if (!a.description || a.description === '') errors.description = ["can't be blank"];
  if (!a.body || a.body === '') errors.body = ["can't be blank"];

  if (Object.keys(errors).length) return res.status(422).json({ errors });

  const now = isoNow();
  const slug = uniqueSlug(a.title);
  const article = {
    slug,
    title: a.title,
    description: a.description,
    body: a.body,
    tagList: Array.isArray(a.tagList) ? [...a.tagList] : [],
    createdAt: now,
    updatedAt: now,
    favoritesCount: 0,
    authorUsername: req.currentUser.username,
  };
  articles.set(slug, article);

  return res.status(201).json({ article: formatArticleFull(article) });
});

// GET /api/articles — list (with optional ?author= and ?tag= filters)
app.get('/api/articles', optionalAuth, (req, res) => {
  const { author, tag } = req.query;

  let list = Array.from(articles.values());

  if (author) {
    list = list.filter(a => a.authorUsername === author);
  }
  if (tag) {
    list = list.filter(a => a.tagList.includes(tag));
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const currentUsername = req.currentUser ? req.currentUser.username : null;
  const result = list.map(a => formatArticleSummary(a, currentUsername));

  return res.status(200).json({ articles: result, articlesCount: result.length });
});

// GET /api/articles/feed — requires auth (not in core spec but in errors_articles)
app.get('/api/articles/feed', requireAuth, (req, res) => {
  // Minimal: return empty feed (following not implemented beyond auth gate)
  return res.status(200).json({ articles: [], articlesCount: 0 });
});

// GET /api/articles/:slug — single article
app.get('/api/articles/:slug', optionalAuth, (req, res) => {
  const article = articles.get(req.params.slug);
  if (!article) {
    return res.status(404).json({ errors: { article: ['not found'] } });
  }
  const currentUsername = req.currentUser ? req.currentUser.username : null;
  return res.status(200).json({ article: formatArticleFull(article, currentUsername) });
});

// PUT /api/articles/:slug — update article
app.put('/api/articles/:slug', requireAuth, (req, res) => {
  const article = articles.get(req.params.slug);
  if (!article) {
    return res.status(404).json({ errors: { article: ['not found'] } });
  }

  const a = (req.body && req.body.article) || {};

  // tagList: null is explicitly rejected; [] is allowed (clears tags)
  if ('tagList' in a && a.tagList === null) {
    return res.status(422).json({ errors: { tagList: ["can't be null"] } });
  }

  if ('title' in a && (a.title === null || a.title === '')) {
    return res.status(422).json({ errors: { title: ["can't be blank"] } });
  }
  if ('description' in a && (a.description === null || a.description === '')) {
    return res.status(422).json({ errors: { description: ["can't be blank"] } });
  }
  if ('body' in a && (a.body === null || a.body === '')) {
    return res.status(422).json({ errors: { body: ["can't be blank"] } });
  }

  if ('title' in a) article.title = a.title;
  if ('description' in a) article.description = a.description;
  if ('body' in a) article.body = a.body;
  if ('tagList' in a) article.tagList = [...a.tagList];
  article.updatedAt = isoNow();

  return res.status(200).json({ article: formatArticleFull(article) });
});

// DELETE /api/articles/:slug
app.delete('/api/articles/:slug', requireAuth, (req, res) => {
  if (!articles.has(req.params.slug)) {
    return res.status(404).json({ errors: { article: ['not found'] } });
  }
  articles.delete(req.params.slug);
  // Also remove associated comments
  for (const [id, cmt] of comments.entries()) {
    if (cmt.articleSlug === req.params.slug) comments.delete(id);
  }
  return res.status(204).send();
});

// Stub: POST /api/articles/:slug/favorite (auth required)
app.post('/api/articles/:slug/favorite', requireAuth, (req, res) => {
  const article = articles.get(req.params.slug);
  if (!article) return res.status(404).json({ errors: { article: ['not found'] } });
  return res.status(200).json({ article: formatArticleFull(article) });
});

// Stub: DELETE /api/articles/:slug/favorite (auth required)
app.delete('/api/articles/:slug/favorite', requireAuth, (req, res) => {
  const article = articles.get(req.params.slug);
  if (!article) return res.status(404).json({ errors: { article: ['not found'] } });
  return res.status(200).json({ article: formatArticleFull(article) });
});

// ── Comment routes ────────────────────────────────────────────────────────────

// POST /api/articles/:slug/comments — create comment
app.post('/api/articles/:slug/comments', requireAuth, (req, res) => {
  const article = articles.get(req.params.slug);
  if (!article) {
    return res.status(404).json({ errors: { article: ['not found'] } });
  }

  const c = (req.body && req.body.comment) || {};
  if (!c.body || c.body === '') {
    return res.status(422).json({ errors: { body: ["can't be blank"] } });
  }

  const now = isoNow();
  const comment = {
    id: commentIdSeq++,
    articleSlug: req.params.slug,
    body: c.body,
    createdAt: now,
    updatedAt: now,
    authorUsername: req.currentUser.username,
  };
  comments.set(comment.id, comment);

  return res.status(201).json({ comment: formatComment(comment) });
});

// GET /api/articles/:slug/comments — list comments
app.get('/api/articles/:slug/comments', optionalAuth, (req, res) => {
  if (!articles.has(req.params.slug)) {
    return res.status(404).json({ errors: { article: ['not found'] } });
  }

  const list = Array.from(comments.values())
    .filter(c => c.articleSlug === req.params.slug)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return res.status(200).json({ comments: list.map(formatComment) });
});

// DELETE /api/articles/:slug/comments/:id
app.delete('/api/articles/:slug/comments/:id', requireAuth, (req, res) => {
  if (!articles.has(req.params.slug)) {
    return res.status(404).json({ errors: { article: ['not found'] } });
  }

  const id = parseInt(req.params.id, 10);
  const comment = comments.get(id);
  if (!comment || comment.articleSlug !== req.params.slug) {
    return res.status(404).json({ errors: { comment: ['not found'] } });
  }

  comments.delete(id);
  return res.status(204).send();
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Conduit C3 listening on port ${PORT}`);
});
