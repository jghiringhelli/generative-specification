'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'realworld-secret-key';
const JWT_EXPIRES = '30d';

// ─── In-memory store ─────────────────────────────────────────────────────────

const db = {
  users: [],      // { id, username, email, passwordHash, bio, image }
  follows: [],    // { followerId, followeeId }
  articles: [],   // { id, slug, title, description, body, tagList, authorId, createdAt, updatedAt }
  favorites: [],  // { userId, articleId }
  comments: [],   // { id, body, authorId, articleId, createdAt, updatedAt }
};

let nextUserId = 1;
let nextArticleId = 1;
let nextCommentId = 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function userResponse(user) {
  return {
    username: user.username,
    email: user.email,
    bio: user.bio || null,
    image: user.image || null,
    token: generateToken(user),
  };
}

function slugify(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  // append random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

function articleResponse(article, currentUserId) {
  const author = db.users.find(u => u.id === article.authorId);
  const favorited = currentUserId
    ? db.favorites.some(f => f.userId === currentUserId && f.articleId === article.id)
    : false;
  const favoritesCount = db.favorites.filter(f => f.articleId === article.id).length;
  const following = currentUserId
    ? db.follows.some(f => f.followerId === currentUserId && f.followeeId === author.id)
    : false;

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited,
    favoritesCount,
    author: {
      username: author.username,
      bio: author.bio || null,
      image: author.image || null,
      following,
    },
  };
}

function articleListItem(article, currentUserId) {
  const full = articleResponse(article, currentUserId);
  const { body: _body, ...rest } = full; // list view excludes body
  return rest;
}

function profileResponse(targetUser, currentUserId) {
  const following = currentUserId
    ? db.follows.some(f => f.followerId === currentUserId && f.followeeId === targetUser.id)
    : false;
  return {
    username: targetUser.username,
    bio: targetUser.bio || null,
    image: targetUser.image || null,
    following,
  };
}

function commentResponse(comment, currentUserId) {
  const author = db.users.find(u => u.id === comment.authorId);
  const following = currentUserId
    ? db.follows.some(f => f.followerId === currentUserId && f.followeeId === author.id)
    : false;
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: {
      username: author.username,
      bio: author.bio || null,
      image: author.image || null,
      following,
    },
  };
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Token ')) {
    return res.status(401).json({ errors: { token: ['is missing'] } });
  }
  const payload = verifyToken(header.slice(6));
  if (!payload) {
    return res.status(401).json({ errors: { token: ['is invalid'] } });
  }
  const user = db.users.find(u => u.id === payload.id);
  if (!user) {
    return res.status(401).json({ errors: { token: ['is invalid'] } });
  }
  req.currentUser = user;
  next();
}

function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (header && header.startsWith('Token ')) {
    const payload = verifyToken(header.slice(6));
    if (payload) {
      req.currentUser = db.users.find(u => u.id === payload.id) || null;
    }
  }
  next();
}

// ─── Validation helpers ────────────────────────────────────────────────────────

function normalizeNullable(val) {
  // empty string → null; null → null; undefined → undefined (not provided)
  if (val === '' || val === null) return null;
  return val;
}

// ─── Routes: Users / Auth ─────────────────────────────────────────────────────

// POST /api/users — register
app.post('/api/users', async (req, res) => {
  const { user } = req.body || {};
  if (!user) return res.status(422).json({ errors: { body: ['is required'] } });

  const errors = {};
  if (!user.username || user.username === '') errors.username = ["can't be blank"];
  if (!user.email || user.email === '') errors.email = ["can't be blank"];
  if (!user.password || user.password === '') errors.password = ["can't be blank"];
  if (Object.keys(errors).length) return res.status(422).json({ errors });

  // duplicate checks
  if (db.users.find(u => u.username === user.username)) {
    return res.status(409).json({ errors: { username: ['has already been taken'] } });
  }
  if (db.users.find(u => u.email === user.email)) {
    return res.status(409).json({ errors: { email: ['has already been taken'] } });
  }

  const passwordHash = await bcrypt.hash(user.password, 10);
  const newUser = {
    id: nextUserId++,
    username: user.username,
    email: user.email,
    passwordHash,
    bio: null,
    image: null,
  };
  db.users.push(newUser);
  return res.status(201).json({ user: userResponse(newUser) });
});

// POST /api/users/login
app.post('/api/users/login', async (req, res) => {
  const { user } = req.body || {};
  if (!user) return res.status(422).json({ errors: { body: ['is required'] } });

  const errors = {};
  if (!user.email || user.email === '') errors.email = ["can't be blank"];
  if (!user.password || user.password === '') errors.password = ["can't be blank"];
  if (Object.keys(errors).length) return res.status(422).json({ errors });

  const found = db.users.find(u => u.email === user.email);
  if (!found) {
    return res.status(401).json({ errors: { credentials: ['invalid'] } });
  }
  const valid = await bcrypt.compare(user.password, found.passwordHash);
  if (!valid) {
    return res.status(401).json({ errors: { credentials: ['invalid'] } });
  }
  return res.status(200).json({ user: userResponse(found) });
});

// GET /api/user
app.get('/api/user', requireAuth, (req, res) => {
  return res.status(200).json({ user: userResponse(req.currentUser) });
});

// PUT /api/user
app.put('/api/user', requireAuth, async (req, res) => {
  const { user } = req.body || {};
  if (!user) return res.status(422).json({ errors: { body: ['is required'] } });

  const u = req.currentUser;
  const errors = {};

  // Validate non-nullable fields if explicitly provided
  if ('username' in user) {
    if (user.username === null || user.username === '') {
      errors.username = ["can't be blank"];
    }
  }
  if ('email' in user) {
    if (user.email === null || user.email === '') {
      errors.email = ["can't be blank"];
    }
  }
  if (Object.keys(errors).length) return res.status(422).json({ errors });

  // Apply updates
  if ('username' in user && user.username) {
    if (user.username !== u.username && db.users.find(x => x.username === user.username)) {
      return res.status(409).json({ errors: { username: ['has already been taken'] } });
    }
    u.username = user.username;
  }
  if ('email' in user && user.email) {
    if (user.email !== u.email && db.users.find(x => x.email === user.email)) {
      return res.status(409).json({ errors: { email: ['has already been taken'] } });
    }
    u.email = user.email;
  }
  if ('password' in user && user.password) {
    u.passwordHash = await bcrypt.hash(user.password, 10);
  }
  if ('bio' in user) {
    u.bio = normalizeNullable(user.bio);
  }
  if ('image' in user) {
    u.image = normalizeNullable(user.image);
  }

  return res.status(200).json({ user: userResponse(u) });
});

// ─── Routes: Profiles ─────────────────────────────────────────────────────────

// GET /api/profiles/:username
app.get('/api/profiles/:username', optionalAuth, (req, res) => {
  const target = db.users.find(u => u.username === req.params.username);
  if (!target) return res.status(404).json({ errors: { profile: ['not found'] } });
  const currentUserId = req.currentUser ? req.currentUser.id : null;
  return res.status(200).json({ profile: profileResponse(target, currentUserId) });
});

// POST /api/profiles/:username/follow
app.post('/api/profiles/:username/follow', requireAuth, (req, res) => {
  const target = db.users.find(u => u.username === req.params.username);
  if (!target) return res.status(404).json({ errors: { profile: ['not found'] } });
  const followerId = req.currentUser.id;
  const followeeId = target.id;
  if (!db.follows.some(f => f.followerId === followerId && f.followeeId === followeeId)) {
    db.follows.push({ followerId, followeeId });
  }
  return res.status(200).json({ profile: profileResponse(target, followerId) });
});

// DELETE /api/profiles/:username/follow
app.delete('/api/profiles/:username/follow', requireAuth, (req, res) => {
  const target = db.users.find(u => u.username === req.params.username);
  if (!target) return res.status(404).json({ errors: { profile: ['not found'] } });
  const followerId = req.currentUser.id;
  const followeeId = target.id;
  db.follows = db.follows.filter(
    f => !(f.followerId === followerId && f.followeeId === followeeId)
  );
  return res.status(200).json({ profile: profileResponse(target, followerId) });
});

// ─── Routes: Articles ─────────────────────────────────────────────────────────

// GET /api/articles/feed  (must be before /:slug)
app.get('/api/articles/feed', requireAuth, (req, res) => {
  const currentUserId = req.currentUser.id;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  const followedIds = db.follows
    .filter(f => f.followerId === currentUserId)
    .map(f => f.followeeId);

  const filtered = db.articles
    .filter(a => followedIds.includes(a.authorId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const articlesCount = filtered.length;
  const page = filtered.slice(offset, offset + limit);

  return res.status(200).json({
    articles: page.map(a => articleListItem(a, currentUserId)),
    articlesCount,
  });
});

// GET /api/articles
app.get('/api/articles', optionalAuth, (req, res) => {
  const currentUserId = req.currentUser ? req.currentUser.id : null;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const { author, tag, favorited } = req.query;

  let filtered = db.articles;

  if (author) {
    const authorUser = db.users.find(u => u.username === author);
    if (!authorUser) {
      return res.status(200).json({ articles: [], articlesCount: 0 });
    }
    filtered = filtered.filter(a => a.authorId === authorUser.id);
  }

  if (tag) {
    filtered = filtered.filter(a => a.tagList.includes(tag));
  }

  if (favorited) {
    const favUser = db.users.find(u => u.username === favorited);
    if (!favUser) {
      return res.status(200).json({ articles: [], articlesCount: 0 });
    }
    const favArticleIds = db.favorites
      .filter(f => f.userId === favUser.id)
      .map(f => f.articleId);
    filtered = filtered.filter(a => favArticleIds.includes(a.id));
  }

  filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const articlesCount = filtered.length;
  const page = filtered.slice(offset, offset + limit);

  return res.status(200).json({
    articles: page.map(a => articleListItem(a, currentUserId)),
    articlesCount,
  });
});

// POST /api/articles
app.post('/api/articles', requireAuth, (req, res) => {
  const { article } = req.body || {};
  if (!article) return res.status(422).json({ errors: { body: ['is required'] } });

  const errors = {};
  if (!article.title || article.title === '') errors.title = ["can't be blank"];
  if (!article.description || article.description === '') errors.description = ["can't be blank"];
  if (!article.body || article.body === '') errors.body = ["can't be blank"];
  if (Object.keys(errors).length) return res.status(422).json({ errors });

  const now = new Date().toISOString();
  const newArticle = {
    id: nextArticleId++,
    slug: slugify(article.title),
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: Array.isArray(article.tagList) ? article.tagList : [],
    authorId: req.currentUser.id,
    createdAt: now,
    updatedAt: now,
  };
  db.articles.push(newArticle);
  return res.status(201).json({ article: articleResponse(newArticle, req.currentUser.id) });
});

// GET /api/articles/:slug
app.get('/api/articles/:slug', optionalAuth, (req, res) => {
  const article = db.articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).json({ errors: { article: ['not found'] } });
  const currentUserId = req.currentUser ? req.currentUser.id : null;
  return res.status(200).json({ article: articleResponse(article, currentUserId) });
});

// PUT /api/articles/:slug
app.put('/api/articles/:slug', requireAuth, (req, res) => {
  const article = db.articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).json({ errors: { article: ['not found'] } });
  if (article.authorId !== req.currentUser.id) {
    return res.status(403).json({ errors: { article: ['forbidden'] } });
  }

  const { article: updates } = req.body || {};
  if (!updates) return res.status(422).json({ errors: { body: ['is required'] } });

  // tagList null is rejected; tagList [] clears tags
  if ('tagList' in updates && updates.tagList === null) {
    return res.status(422).json({ errors: { tagList: ["can't be null"] } });
  }

  if ('title' in updates && updates.title !== undefined) article.title = updates.title;
  if ('description' in updates && updates.description !== undefined) article.description = updates.description;
  if ('body' in updates && updates.body !== undefined) article.body = updates.body;
  if ('tagList' in updates && Array.isArray(updates.tagList)) article.tagList = updates.tagList;

  article.updatedAt = new Date().toISOString();

  return res.status(200).json({ article: articleResponse(article, req.currentUser.id) });
});

// DELETE /api/articles/:slug
app.delete('/api/articles/:slug', requireAuth, (req, res) => {
  const idx = db.articles.findIndex(a => a.slug === req.params.slug);
  if (idx === -1) return res.status(404).json({ errors: { article: ['not found'] } });
  const article = db.articles[idx];
  if (article.authorId !== req.currentUser.id) {
    return res.status(403).json({ errors: { article: ['forbidden'] } });
  }
  // cascade: remove comments and favorites
  db.comments = db.comments.filter(c => c.articleId !== article.id);
  db.favorites = db.favorites.filter(f => f.articleId !== article.id);
  db.articles.splice(idx, 1);
  return res.status(204).send();
});

// ─── Routes: Favorites ────────────────────────────────────────────────────────

// POST /api/articles/:slug/favorite
app.post('/api/articles/:slug/favorite', requireAuth, (req, res) => {
  const article = db.articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).json({ errors: { article: ['not found'] } });
  const userId = req.currentUser.id;
  if (!db.favorites.some(f => f.userId === userId && f.articleId === article.id)) {
    db.favorites.push({ userId, articleId: article.id });
  }
  return res.status(200).json({ article: articleResponse(article, userId) });
});

// DELETE /api/articles/:slug/favorite
app.delete('/api/articles/:slug/favorite', requireAuth, (req, res) => {
  const article = db.articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).json({ errors: { article: ['not found'] } });
  const userId = req.currentUser.id;
  db.favorites = db.favorites.filter(
    f => !(f.userId === userId && f.articleId === article.id)
  );
  return res.status(200).json({ article: articleResponse(article, userId) });
});

// ─── Routes: Comments ─────────────────────────────────────────────────────────

// POST /api/articles/:slug/comments
app.post('/api/articles/:slug/comments', requireAuth, (req, res) => {
  const article = db.articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).json({ errors: { article: ['not found'] } });

  const { comment } = req.body || {};
  if (!comment) return res.status(422).json({ errors: { body: ['is required'] } });
  if (!comment.body || comment.body === '') {
    return res.status(422).json({ errors: { body: ["can't be blank"] } });
  }

  const now = new Date().toISOString();
  const newComment = {
    id: nextCommentId++,
    body: comment.body,
    authorId: req.currentUser.id,
    articleId: article.id,
    createdAt: now,
    updatedAt: now,
  };
  db.comments.push(newComment);
  return res.status(201).json({ comment: commentResponse(newComment, req.currentUser.id) });
});

// GET /api/articles/:slug/comments
app.get('/api/articles/:slug/comments', optionalAuth, (req, res) => {
  const article = db.articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).json({ errors: { article: ['not found'] } });
  const currentUserId = req.currentUser ? req.currentUser.id : null;
  const comments = db.comments
    .filter(c => c.articleId === article.id)
    .map(c => commentResponse(c, currentUserId));
  return res.status(200).json({ comments });
});

// DELETE /api/articles/:slug/comments/:id
app.delete('/api/articles/:slug/comments/:id', requireAuth, (req, res) => {
  const article = db.articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).json({ errors: { article: ['not found'] } });

  const commentId = parseInt(req.params.id);
  const idx = db.comments.findIndex(c => c.id === commentId && c.articleId === article.id);
  if (idx === -1) return res.status(404).json({ errors: { comment: ['not found'] } });

  const comment = db.comments[idx];
  if (comment.authorId !== req.currentUser.id) {
    return res.status(403).json({ errors: { comment: ['forbidden'] } });
  }
  db.comments.splice(idx, 1);
  return res.status(204).send();
});

// ─── Routes: Tags ─────────────────────────────────────────────────────────────

app.get('/api/tags', (req, res) => {
  const tagSet = new Set();
  db.articles.forEach(a => a.tagList.forEach(t => tagSet.add(t)));
  return res.status(200).json({ tags: Array.from(tagSet) });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Conduit API listening on port ${PORT}`);
});
