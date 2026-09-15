import request from 'supertest';
import { ArticleService } from '../../src/articles/ArticleService';
import { SlugifyGenerator } from '../../src/articles/SlugifyGenerator';
import { AuthService } from '../../src/auth/AuthService';
import { CommentService } from '../../src/comments/CommentService';
import { createApp } from '../../src/app';
import { ProfileService } from '../../src/profiles/ProfileService';
import { TestPasswordHasher, TestTokenService } from '../support/AuthTestDoubles';
import { InMemoryArticleRepository } from '../support/InMemoryArticleRepository';
import { InMemoryCommentRepository } from '../support/InMemoryCommentRepository';
import { InMemoryProfileRepository } from '../support/InMemoryProfileRepository';
import { InMemoryUserRepository } from '../support/InMemoryUserRepository';

async function fixture() {
  const users = new InMemoryUserRepository();
  const profilesRepository = new InMemoryProfileRepository(users);
  const articlesRepository = new InMemoryArticleRepository();
  const tokens = new TestTokenService();
  const auth = new AuthService(users, new TestPasswordHasher(), tokens);
  const profileService = new ProfileService(profilesRepository);
  const articleService = new ArticleService(
    articlesRepository,
    users,
    profilesRepository,
    new SlugifyGenerator(),
  );
  const commentService = new CommentService(
    new InMemoryCommentRepository(),
    articlesRepository,
    users,
    profilesRepository,
  );
  const app = createApp({
    authService: auth,
    tokenService: tokens,
    profileService,
    articleService,
    commentService,
  });
  const alice = await auth.register({
    email: 'alice@example.com', username: 'alice', password: 'password1',
  });
  const bob = await auth.register({
    email: 'bob@example.com', username: 'bob', password: 'password2',
  });
  const article = await articleService.create({
    title: 'Article', description: 'Description', body: 'Body', tagList: [],
  }, '1');
  return { app, alice, bob, slug: article.slug };
}

describe('comment endpoints', () => {
  it('creates and lists comments', async () => {
    const { app, bob, slug } = await fixture();
    await request(app).post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${bob.token}`)
      .send({ comment: { body: 'Great article' } })
      .expect(201);
    await request(app).get(`/api/articles/${slug}/comments`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.comments).toHaveLength(1);
        expect(body.comments[0].body).toBe('Great article');
      });
  });

  it('allows only the author to delete a comment', async () => {
    const { app, alice, bob, slug } = await fixture();
    const created = await request(app).post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${bob.token}`)
      .send({ comment: { body: 'Great article' } })
      .expect(201);
    const path = `/api/articles/${slug}/comments/${created.body.comment.id}`;
    await request(app).delete(path)
      .set('Authorization', `Token ${alice.token}`)
      .expect(403);
    await request(app).delete(path)
      .set('Authorization', `Token ${bob.token}`)
      .expect(204);
  });

  it('requires authentication to create and delete comments', async () => {
    const { app, slug } = await fixture();
    await request(app).post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: 'No auth' } })
      .expect(401);
    await request(app).delete(`/api/articles/${slug}/comments/1`).expect(401);
  });

  it('returns not found for comments on an unknown article', async () => {
    const { app } = await fixture();
    await request(app).get('/api/articles/missing/comments')
      .expect(404)
      .expect({ errors: { body: ['Article not found'] } });
  });
});
