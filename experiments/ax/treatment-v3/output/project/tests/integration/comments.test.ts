import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp(prisma);
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.userFavorite.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

async function createUser(username: string, email: string) {
  const response = await request(app)
    .post('/api/users')
    .send({
      user: {
        email,
        username,
        password: 'password123'
      }
    });
  return response.body.user.token;
}

async function createArticle(token: string, title: string) {
  const response = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({
      article: {
        title,
        description: 'Test description',
        body: 'Test body'
      }
    });
  return response.body.article.slug;
}

describe('GET /api/articles/:slug/comments', () => {
  let token: string;
  let slug: string;

  beforeEach(async () => {
    token = await createUser('jake', 'jake@jake.jake');
    slug = await createArticle(token, 'Test Article');
  });

  it('get_comments_for_article_with_no_comments_returns_empty_array', async () => {
    const response = await request(app).get(`/api/articles/${slug}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toEqual([]);
  });

  it('get_comments_returns_array_of_comments_with_author', async () => {
    // Add a comment
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: 'Great article!'
        }
      });

    const response = await request(app).get(`/api/articles/${slug}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0].body).toBe('Great article!');
    expect(response.body.comments[0].author.username).toBe('jake');
    expect(response.body.comments[0].author.following).toBe(false);
    expect(response.body.comments[0].id).toBeDefined();
    expect(response.body.comments[0].createdAt).toBeDefined();
  });

  it('get_comments_with_following_status_shows_following_true', async () => {
    const aliceToken = await createUser('alice', 'alice@alice.alice');
    const bobToken = await createUser('bob', 'bob@bob.bob');

    // Bob creates article
    const bobSlug = await createArticle(bobToken, 'Bob Article');

    // Alice comments
    await request(app)
      .post(`/api/articles/${bobSlug}/comments`)
      .set('Authorization', `Token ${aliceToken}`)
      .send({
        comment: {
          body: 'Nice work Bob!'
        }
      });

    // Bob follows Alice
    await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`);

    // Bob gets comments (should show following=true for Alice)
    const response = await request(app)
      .get(`/api/articles/${bobSlug}/comments`)
      .set('Authorization', `Token ${bobToken}`);

    expect(response.status).toBe(200);
    expect(response.body.comments[0].author.following).toBe(true);
  });

  it('get_comments_for_nonexistent_article_returns_404', async () => {
    const response = await request(app).get('/api/articles/nonexistent-slug/comments');

    expect(response.status).toBe(404);
    expect(response.body.errors.body).toContain('Article not found');
  });
});

describe('POST /api/articles/:slug/comments', () => {
  let token: string;
  let slug: string;

  beforeEach(async () => {
    token = await createUser('jake', 'jake@jake.jake');
    slug = await createArticle(token, 'Test Article');
  });

  it('add_comment_with_valid_data_returns_201_with_comment', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: 'His name was my name too.'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.comment.body).toBe('His name was my name too.');
    expect(response.body.comment.author.username).toBe('jake');
    expect(response.body.comment.id).toBeDefined();
    expect(response.body.comment.createdAt).toBeDefined();
    expect(response.body.comment.updatedAt).toBeDefined();
  });

  it('add_comment_without_auth_returns_401', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({
        comment: {
          body: 'Unauthorized comment'
        }
      });

    expect(response.status).toBe(401);
  });

  it('add_comment_with_empty_body_returns_422', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: ''
        }
      });

    expect(response.status).toBe(422);
  });

  it('add_comment_without_body_field_returns_422', async () => {
    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {}
      });

    expect(response.status).toBe(422);
  });

  it('add_comment_to_nonexistent_article_returns_404', async () => {
    const response = await request(app)
      .post('/api/articles/nonexistent-slug/comments')
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: 'Comment on nothing'
        }
      });

    expect(response.status).toBe(404);
  });

  it('add_multiple_comments_returns_all_in_get_request', async () => {
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: 'First comment'
        }
      });

    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {
          body: 'Second comment'
        }
      });

    const response = await request(app).get(`/api/articles/${slug}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(2);
  });
});

describe('DELETE /api/articles/:slug/comments/:id', () => {
  let authorToken: string;
  let otherToken: string;
  let slug: string;
  let commentId: number;

  beforeEach(async () => {
    authorToken = await createUser('jake', 'jake@jake.jake');
    otherToken = await createUser('alice', 'alice@alice.alice');
    slug = await createArticle(authorToken, 'Test Article');

    const commentResponse = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${authorToken}`)
      .send({
        comment: {
          body: 'Comment to delete'
        }
      });

    commentId = commentResponse.body.comment.id;
  });

  it('delete_comment_by_author_returns_200', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${authorToken}`);

    expect(response.status).toBe(200);

    // Verify deletion
    const getResponse = await request(app).get(`/api/articles/${slug}/comments`);
    expect(getResponse.body.comments).toHaveLength(0);
  });

  it('delete_comment_by_non_author_returns_403', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${otherToken}`);

    expect(response.status).toBe(403);
    expect(response.body.errors.body).toContain('Only the comment author can delete this comment');
  });

  it('delete_comment_without_auth_returns_401', async () => {
    const response = await request(app).delete(`/api/articles/${slug}/comments/${commentId}`);

    expect(response.status).toBe(401);
  });

  it('delete_nonexistent_comment_returns_404', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/99999`)
      .set('Authorization', `Token ${authorToken}`);

    expect(response.status).toBe(404);
    expect(response.body.errors.body).toContain('Comment not found');
  });

  it('delete_comment_from_nonexistent_article_returns_404', async () => {
    const response = await request(app)
      .delete(`/api/articles/nonexistent-slug/comments/${commentId}`)
      .set('Authorization', `Token ${authorToken}`);

    expect(response.status).toBe(404);
    expect(response.body.errors.body).toContain('Article not found');
  });

  it('delete_comment_with_invalid_id_format_returns_422', async () => {
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/not-a-number`)
      .set('Authorization', `Token ${authorToken}`);

    expect(response.status).toBe(422);
  });
});
