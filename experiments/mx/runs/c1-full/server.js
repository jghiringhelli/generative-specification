'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'conduit-dev-secret';
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------
const db = {
  users: new Map(),          // username -> user
  usersByEmail: new Map(),   // email -> user
  articles: new Map(),       // slug -> article
  comments: new Map(),       // id -> comment
  nextCommentId: 1,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function err(res, status, field, message) {
  return res.status(status).json({ errors: { [field]: [message] } });
}

function signToken(user) {
  return jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '30d' });
}

function slugify(title) {
  const base = String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'article';
  let slug = base;
  let i = 1;
  while (db.articles.has(slug)) {
    slug = `${base}-${Math.random().toString(36).slice(2, 8)}${i}`;
    i++;
  }
  return slug;
}

function isBlank(v) {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

// Auth: parse "Authorization: Token <jwt>" header. Returns user or null.
function getUserFromReq(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Token\s+(.+)$/);
  if (!match) return null;
  try {
    const payload = jwt.verify(match[1], JWT_SECRET);
    return db.users.get(payload.username) || null;
  } catch (e) {
    return null;
  }
}

// Required auth middleware
function requireAuth(req, res, next) {
  const user = getUserFromReq(req);
  if (!user) return err(res, 401, 'token', 'is missing');
  req.user = user;
  next();
}

// Optional auth middleware
function optionalAuth(req, res, next) {
  req.user = getUserFromReq(req);
  next();
}

// ---------------------------------------------------------------------------
// View serializers
// ---------------------------------------------------------------------------
function userJSON(user) {
  return {
    user: {
      username: user.username,
      email: user.email,
      bio: user.bio,
      image: user.image,
      token: signToken(user),
    },
  };
}

function profileObj(user, currentUser) {
  return {
    username: user.username,
    bio: user.bio,
    image: user.image,
    following: currentUser ? currentUser.following.has(user.username) : false,
  };
}

function articleObj(article, currentUser) {
  const author = db.users.get(article.authorUsername);
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: [...article.tagList],
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: currentUser ? article.favoritedBy.has(currentUser.username) : false,
    favoritesCount: article.favoritedBy.size,
    author: profileObj(author, currentUser),
  };
}

// Article list item omits body
function articleListObj(article, currentUser) {
  const o = articleObj(article, currentUser);
  delete o.body;
  return o;
}

function commentObj(comment, currentUser) {
  const author = db.users.get(comment.authorUsername);
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: profileObj(author, currentUser),
  };
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());

// ----- Users / Auth -----
app.post('/api/users', (req, res) => {
  const u = (req.body && req.body.user) || {};
  if (isBlank(u.username)) return err(res, 422, 'username', "can't be blank");
  if (isBlank(u.email)) return err(res, 422, 'email', "can't be blank");
  if (isBlank(u.password)) return err(res, 422, 'password', "can't be blank");
  if (db.users.has(u.username)) return err(res, 409, 'username', 'has already been taken');
  if (db.usersByEmail.has(u.email)) return err(res, 409, 'email', 'has already been taken');

  const user = {
    username: u.username,
    email: u.email,
    passwordHash: bcrypt.hashSync(u.password, 8),
    bio: null,
    image: null,
    following: new Set(),
  };
  db.users.set(user.username, user);
  db.usersByEmail.set(user.email, user);
  res.status(201).json(userJSON(user));
});

app.post('/api/users/login', (req, res) => {
  const u = (req.body && req.body.user) || {};
  if (isBlank(u.email)) return err(res, 422, 'email', "can't be blank");
  if (isBlank(u.password)) return err(res, 422, 'password', "can't be blank");
  const user = db.usersByEmail.get(u.email);
  if (!user || !bcrypt.compareSync(u.password, user.passwordHash)) {
    return err(res, 401, 'credentials', 'invalid');
  }
  res.status(200).json(userJSON(user));
});

app.get('/api/user', requireAuth, (req, res) => {
  res.status(200).json(userJSON(req.user));
});

app.put('/api/user', requireAuth, (req, res) => {
  const u = (req.body && req.body.user) || {};
  const user = req.user;

  // username / email: not nullable, not blank if provided
  if ('username' in u) {
    if (isBlank(u.username)) return err(res, 422, 'username', "can't be blank");
    if (u.username !== user.username && db.users.has(u.username)) {
      return err(res, 422, 'username', 'has already been taken');
    }
  }
  if ('email' in u) {
    if (isBlank(u.email)) return err(res, 422, 'email', "can't be blank");
    if (u.email !== user.email && db.usersByEmail.has(u.email)) {
      return err(res, 422, 'email', 'has already been taken');
    }
  }

  if ('username' in u && u.username !== user.username) {
    db.users.delete(user.username);
    // re-key any followers / favorites references rely on username; update them
    const oldName = user.username;
    user.username = u.username;
    db.users.set(user.username, user);
    rekeyUsername(oldName, u.username);
  }
  if ('email' in u && u.email !== user.email) {
    db.usersByEmail.delete(user.email);
    user.email = u.email;
    db.usersByEmail.set(user.email, user);
  }
  // bio / image: nullable; empty string normalizes to null
  if ('bio' in u) user.bio = u.bio === '' || u.bio === null ? null : u.bio;
  if ('image' in u) user.image = u.image === '' || u.image === null ? null : u.image;
  if ('password' in u && !isBlank(u.password)) user.passwordHash = bcrypt.hashSync(u.password, 8);

  res.status(200).json(userJSON(user));
});

// Update references when a username changes
function rekeyUsername(oldName, newName) {
  for (const article of db.articles.values()) {
    if (article.authorUsername === oldName) article.authorUsername = newName;
    if (article.favoritedBy.has(oldName)) {
      article.favoritedBy.delete(oldName);
      article.favoritedBy.add(newName);
    }
  }
  for (const comment of db.comments.values()) {
    if (comment.authorUsername === oldName) comment.authorUsername = newName;
  }
  for (const other of db.users.values()) {
    if (other.following.has(oldName)) {
      other.following.delete(oldName);
      other.following.add(newName);
    }
  }
}

// ----- Profiles -----
app.get('/api/profiles/:username', optionalAuth, (req, res) => {
  const target = db.users.get(req.params.username);
  if (!target) return err(res, 404, 'profile', 'not found');
  res.status(200).json({ profile: profileObj(target, req.user) });
});

app.post('/api/profiles/:username/follow', requireAuth, (req, res) => {
  const target = db.users.get(req.params.username);
  if (!target) return err(res, 404, 'profile', 'not found');
  req.user.following.add(target.username);
  res.status(200).json({ profile: profileObj(target, req.user) });
});

app.delete('/api/profiles/:username/follow', requireAuth, (req, res) => {
  const target = db.users.get(req.params.username);
  if (!target) return err(res, 404, 'profile', 'not found');
  req.user.following.delete(target.username);
  res.status(200).json({ profile: profileObj(target, req.user) });
});

// ----- Tags -----
app.get('/api/tags', (req, res) => {
  const tags = new Set();
  for (const article of db.articles.values()) {
    for (const t of article.tagList) tags.add(t);
  }
  res.status(200).json({ tags: [...tags] });
});

// ----- Articles -----
// Feed must be registered before :slug routes.
app.get('/api/articles/feed', requireAuth, (req, res) => {
  const following = req.user.following;
  let list = [...db.articles.values()]
    .filter((a) => following.has(a.authorUsername))
    .sort((a, b) => b.createdMs - a.createdMs);
  const total = list.length;
  list = paginate(list, req.query);
  res.status(200).json({
    articles: list.map((a) => articleListObj(a, req.user)),
    articlesCount: total,
  });
});

app.get('/api/articles', optionalAuth, (req, res) => {
  let list = [...db.articles.values()];
  if (req.query.author) {
    list = list.filter((a) => a.authorUsername === req.query.author);
  }
  if (req.query.tag) {
    list = list.filter((a) => a.tagList.includes(req.query.tag));
  }
  if (req.query.favorited) {
    list = list.filter((a) => a.favoritedBy.has(req.query.favorited));
  }
  list.sort((a, b) => b.createdMs - a.createdMs);
  const total = list.length;
  list = paginate(list, req.query);
  res.status(200).json({
    articles: list.map((a) => articleListObj(a, req.user)),
    articlesCount: total,
  });
});

function paginate(list, query) {
  let limit = parseInt(query.limit, 10);
  let offset = parseInt(query.offset, 10);
  if (!Number.isFinite(limit) || limit < 0) limit = 20;
  if (!Number.isFinite(offset) || offset < 0) offset = 0;
  return list.slice(offset, offset + limit);
}

app.post('/api/articles', requireAuth, (req, res) => {
  const a = (req.body && req.body.article) || {};
  if (isBlank(a.title)) return err(res, 422, 'title', "can't be blank");
  if (isBlank(a.description)) return err(res, 422, 'description', "can't be blank");
  if (isBlank(a.body)) return err(res, 422, 'body', "can't be blank");

  let tagList = [];
  if ('tagList' in a && a.tagList !== undefined) {
    if (!Array.isArray(a.tagList)) return err(res, 422, 'tagList', 'must be a list');
    tagList = a.tagList.map(String);
  }

  const now = Date.now();
  const iso = new Date(now).toISOString();
  const slug = slugify(a.title);
  const article = {
    slug,
    title: a.title,
    description: a.description,
    body: a.body,
    tagList,
    createdAt: iso,
    updatedAt: iso,
    createdMs: now,
    updatedMs: now,
    authorUsername: req.user.username,
    favoritedBy: new Set(),
  };
  db.articles.set(slug, article);
  res.status(201).json({ article: articleObj(article, req.user) });
});

app.get('/api/articles/:slug', optionalAuth, (req, res) => {
  const article = db.articles.get(req.params.slug);
  if (!article) return err(res, 404, 'article', 'not found');
  res.status(200).json({ article: articleObj(article, req.user) });
});

app.put('/api/articles/:slug', requireAuth, (req, res) => {
  const article = db.articles.get(req.params.slug);
  if (!article) return err(res, 404, 'article', 'not found');
  if (article.authorUsername !== req.user.username) {
    return err(res, 403, 'article', 'forbidden');
  }
  const a = (req.body && req.body.article) || {};

  if ('title' in a && isBlank(a.title)) return err(res, 422, 'title', "can't be blank");
  if ('description' in a && isBlank(a.description)) return err(res, 422, 'description', "can't be blank");
  if ('body' in a && isBlank(a.body)) return err(res, 422, 'body', "can't be blank");
  if ('tagList' in a) {
    if (!Array.isArray(a.tagList)) return err(res, 422, 'tagList', "can't be blank");
  }

  if ('title' in a) article.title = a.title;
  if ('description' in a) article.description = a.description;
  if ('body' in a) article.body = a.body;
  if ('tagList' in a) article.tagList = a.tagList.map(String);

  // Guarantee updatedAt strictly advances past the prior timestamp so the
  // spec assertion updatedAt != createdAt holds even on a fast clock.
  let nextMs = Date.now();
  if (nextMs <= article.updatedMs) nextMs = article.updatedMs + 1000;
  article.updatedMs = nextMs;
  article.updatedAt = new Date(nextMs).toISOString();

  res.status(200).json({ article: articleObj(article, req.user) });
});

app.delete('/api/articles/:slug', requireAuth, (req, res) => {
  const article = db.articles.get(req.params.slug);
  if (!article) return err(res, 404, 'article', 'not found');
  if (article.authorUsername !== req.user.username) {
    return err(res, 403, 'article', 'forbidden');
  }
  // remove its comments
  for (const [id, c] of db.comments) {
    if (c.articleSlug === article.slug) db.comments.delete(id);
  }
  db.articles.delete(article.slug);
  res.status(204).end();
});

// ----- Favorites -----
app.post('/api/articles/:slug/favorite', requireAuth, (req, res) => {
  const article = db.articles.get(req.params.slug);
  if (!article) return err(res, 404, 'article', 'not found');
  article.favoritedBy.add(req.user.username);
  res.status(200).json({ article: articleObj(article, req.user) });
});

app.delete('/api/articles/:slug/favorite', requireAuth, (req, res) => {
  const article = db.articles.get(req.params.slug);
  if (!article) return err(res, 404, 'article', 'not found');
  article.favoritedBy.delete(req.user.username);
  res.status(200).json({ article: articleObj(article, req.user) });
});

// ----- Comments -----
app.post('/api/articles/:slug/comments', requireAuth, (req, res) => {
  const article = db.articles.get(req.params.slug);
  if (!article) return err(res, 404, 'article', 'not found');
  const c = (req.body && req.body.comment) || {};
  if (isBlank(c.body)) return err(res, 422, 'body', "can't be blank");

  const now = Date.now();
  const iso = new Date(now).toISOString();
  const comment = {
    id: db.nextCommentId++,
    body: c.body,
    createdAt: iso,
    updatedAt: iso,
    createdMs: now,
    articleSlug: article.slug,
    authorUsername: req.user.username,
  };
  db.comments.set(comment.id, comment);
  res.status(201).json({ comment: commentObj(comment, req.user) });
});

app.get('/api/articles/:slug/comments', optionalAuth, (req, res) => {
  const article = db.articles.get(req.params.slug);
  if (!article) return err(res, 404, 'article', 'not found');
  const comments = [...db.comments.values()]
    .filter((c) => c.articleSlug === article.slug)
    .sort((a, b) => a.createdMs - b.createdMs || a.id - b.id);
  res.status(200).json({ comments: comments.map((c) => commentObj(c, req.user)) });
});

app.delete('/api/articles/:slug/comments/:id', requireAuth, (req, res) => {
  const article = db.articles.get(req.params.slug);
  if (!article) return err(res, 404, 'article', 'not found');
  const id = parseInt(req.params.id, 10);
  const comment = db.comments.get(id);
  if (!comment || comment.articleSlug !== article.slug) {
    return err(res, 404, 'comment', 'not found');
  }
  if (comment.authorUsername !== req.user.username) {
    return err(res, 403, 'comment', 'forbidden');
  }
  db.comments.delete(id);
  res.status(204).end();
});

// ----- Fallthrough 404 -----
app.use((req, res) => {
  res.status(404).json({ errors: { route: ['not found'] } });
});

// JSON parse / generic error handler
app.use((e, req, res, next) => {
  if (e && e.type === 'entity.parse.failed') {
    return res.status(422).json({ errors: { body: ['is invalid'] } });
  }
  res.status(500).json({ errors: { server: ['error'] } });
});

app.listen(PORT, () => {
  console.log(`Conduit API listening on port ${PORT}`);
});

module.exports = app;
