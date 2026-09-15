import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

// Mock prisma client for unit/integration tests without live database dependency
jest.mock('../src/prisma', () => {
  return {
    __esModule: true,
    default: {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      follows: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn()
      },
      article: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      comment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn()
      },
      favorite: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn()
      },
      tag: {
        findMany: jest.fn()
      }
    }
  };
});

describe('Conduit API Endpoints', () => {
  const mockUser = {
    id: 1,
    email: 'jake@jake.jake',
    username: 'jake',
    password: '$2b$10$wT55h/o1zYnJzH8vG7vGtuQ6vT2X9gY5kR0lA5P.6p0K8w7y2R8m2', // 'jakejake' bcrypt
    bio: 'I work at statefarm',
    image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockArticle = {
    id: 10,
    slug: 'how-to-train-your-dragon-abc123',
    title: 'How to train your dragon',
    description: 'Ever wonder how?',
    body: 'It takes a Jacobian',
    authorId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: 1,
      username: 'jake',
      bio: 'I work at statefarm',
      image: 'https://api.realworld.io/images/smiley-cyrus.jpg'
    },
    tags: [{ id: 1, name: 'dragons' }]
  };

  let token = '';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication & Users', () => {
    it('POST /api/users - should register a new user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'jake',
            email: 'jake@jake.jake',
            password: 'jakejake'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('token');
      expect(res.body.user.username).toBe('jake');
      expect(res.body.user.email).toBe('jake@jake.jake');
      token = res.body.user.token;
    });

    it('POST /api/users/login - should authenticate a user and return token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'jake@jake.jake',
            password: 'jakejake'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('token');
      token = res.body.user.token;
    });

    it('GET /api/user - should get current user profile with token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('jake');
    });

    it('PUT /api/user - should update current user profile', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        bio: 'Updated bio'
      });

      const res = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${token}`)
        .send({
          user: {
            bio: 'Updated bio'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.user.bio).toBe('Updated bio');
    });
  });

  describe('Profiles', () => {
    it('GET /api/profiles/:username - should get public profile', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/profiles/jake');

      expect(res.status).toBe(200);
      expect(res.body.profile.username).toBe('jake');
      expect(res.body.profile.following).toBe(false);
    });

    it('POST /api/profiles/:username/follow - should follow a user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.follows.upsert as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.following).toBe(true);
    });

    it('DELETE /api/profiles/:username/follow - should unfollow a user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.follows.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const res = await request(app)
        .delete('/api/profiles/jake/follow')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.following).toBe(false);
    });
  });

  describe('Articles', () => {
    it('POST /api/articles - should create an article', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.favorite.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'How to train your dragon',
            description: 'Ever wonder how?',
            body: 'It takes a Jacobian',
            tagList: ['dragons']
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.article.title).toBe('How to train your dragon');
      expect(res.body.article.tagList).toContain('dragons');
    });

    it('GET /api/articles - should list articles', async () => {
      (prisma.article.findMany as jest.Mock).mockResolvedValue([mockArticle]);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.favorite.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app).get('/api/articles');

      expect(res.status).toBe(200);
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles[0].title).toBe('How to train your dragon');
    });

    it('GET /api/articles/:slug - should get single article', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.favorite.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app).get('/api/articles/how-to-train-your-dragon-abc123');

      expect(res.status).toBe(200);
      expect(res.body.article.slug).toBe('how-to-train-your-dragon-abc123');
    });

    it('PUT /api/articles/:slug - should update article', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.article.update as jest.Mock).mockResolvedValue({
        ...mockArticle,
        title: 'Updated title'
      });
      (prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.favorite.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .put('/api/articles/how-to-train-your-dragon-abc123')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Updated title'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.article.title).toBe('Updated title');
    });

    it('POST /api/articles/:slug/favorite - should favorite article', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.favorite.upsert as jest.Mock).mockResolvedValue({});
      (prisma.favorite.findUnique as jest.Mock).mockResolvedValue({ userId: 1, articleId: 10 });
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.favorite.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .post('/api/articles/how-to-train-your-dragon-abc123/favorite')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.article.favorited).toBe(true);
      expect(res.body.article.favoritesCount).toBe(1);
    });

    it('DELETE /api/articles/:slug/favorite - should unfavorite article', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.favorite.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.favorite.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .delete('/api/articles/how-to-train-your-dragon-abc123/favorite')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.article.favorited).toBe(false);
      expect(res.body.article.favoritesCount).toBe(0);
    });

    it('DELETE /api/articles/:slug - should delete article', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.article.delete as jest.Mock).mockResolvedValue(mockArticle);

      const res = await request(app)
        .delete('/api/articles/how-to-train-your-dragon-abc123')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Comments', () => {
    const mockComment = {
      id: 5,
      body: 'Great article!',
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: 1,
      articleId: 10,
      author: mockUser
    };

    it('POST /api/articles/:slug/comments - should add comment', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/articles/how-to-train-your-dragon-abc123/comments')
        .set('Authorization', `Token ${token}`)
        .send({
          comment: {
            body: 'Great article!'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.comment.body).toBe('Great article!');
    });

    it('GET /api/articles/:slug/comments - should get comments', async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([mockComment]);
      (prisma.follows.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/articles/how-to-train-your-dragon-abc123/comments');

      expect(res.status).toBe(200);
      expect(res.body.comments.length).toBe(1);
    });

    it('DELETE /api/articles/:slug/comments/:id - should delete comment', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);
      (prisma.comment.delete as jest.Mock).mockResolvedValue(mockComment);

      const res = await request(app)
        .delete('/api/articles/how-to-train-your-dragon-abc123/comments/5')
        .set('Authorization', `Token ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Tags', () => {
    it('GET /api/tags - should return list of tags', async () => {
      (prisma.tag.findMany as jest.Mock).mockResolvedValue([{ name: 'dragons' }, { name: 'training' }]);

      const res = await request(app).get('/api/tags');

      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual(['dragons', 'training']);
    });
  });
});
