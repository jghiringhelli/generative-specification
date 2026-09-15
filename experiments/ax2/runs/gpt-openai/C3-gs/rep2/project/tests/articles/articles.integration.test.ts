import request from 'supertest';
import { ArticleService } from '../../src/articles/ArticleService';
import { SlugifyGenerator } from '../../src/articles/SlugifyGenerator';
import { AuthService } from '../../src/auth/AuthService';
import { createApp } from '../../src/app';
import { ProfileService } from '../../src/profiles/ProfileService';
import { TestPasswordHasher, TestTokenService } from '../support/AuthTestDoubles';
import { InMemoryArticleRepository } from '../support/InMemoryArticleRepository';
import { InMemoryProfileRepository } from '../support/InMemoryProfileRepository';
import { InMemoryUserRepository } from '../support/InMemoryUserRepository';

async function fixture() {
  const users = new InMemoryUserRepository();
  const profilesRepository = new InMemoryProfileRepository(users);
  const articlesRepository = new InMemoryArticleRepository();
  const tokens = new TestTokenService();
  const auth = new AuthService(users, new TestPasswordHasher(), tokens);
  const profiles = new ProfileService(profilesRepository);
  const articles = new ArticleService(
    articlesRepository,
    users,
    profilesRepository,
    new SlugifyGenerator(),
  );
  const app = createApp({
    authService: auth,
    tokenService: tokens,
    profileService: profiles,
    articleService: articles,
  });
  const alice = await auth.register({
    email: 'alice@example.com',
    username: 'alice',
    password: 'password1',
  });
  const bob = await auth.register({
    email: 'bob@example.com',
    username: 'bob',
    password: 'password2',
  });
  articlesRepository.setUsername('1', 'alice');
  articlesRepository.setUsername('2', 'bob');
  return { app, alice, bob, profiles, articlesRepository };
}

async function createArticle(app: ReturnType<typeof createApp>, token: string, title = 'First Post') {
  return request(app).post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({
      article: {
        title,
        description: 'Description',
        body: 'Article body',
        tagList: ['typescript'],
      },
    }).expect(201);
}

describe('article endpoints', () => {
  it('creates and gets an article', async () => {
    const { app, alice } = await fixture();
    const created = await createArticle(app, alice.token);
    await request(app).get(`/api/articles/${created.body.article.slug}`)
      .expect(200)
      .expect(({ body }) => expect(body.article.body).toBe('Article body'));
  });

  it('lists filtered and paginated articles without bodies', async () => {
    const { app, alice } = await fixture();
    await createArticle(app, alice.token, 'First');
    await createArticle(app, alice.token, 'Second');
    await request(app).get('/api/articles?tag=typescript&author=alice&limit=1&offset=1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.articles).toHaveLength(1);
        expect(body.articlesCount).toBe(2);
        expect(body.articles[0].body).toBeUndefined();
      });

      it('filters articles by author and favoriting user', async () => {
        const { app, alice, bob } = await fixture();
        const aliceArticle = await createArticle(app, alice.token, 'Alice Post');
        await createArticle(app, bob.token, 'Bob Post');
        await request(app)
          .post(`/api/articles/${aliceArticle.body.article.slug}/favorite`)
          .set('Authorization', `Token ${bob.token}`)
          .expect(200);

        await request(app).get('/api/articles?author=alice')
          .expect(200)
          .expect(({ body }) => {
            expect(body.articlesCount).toBe(1);
            expect(body.articles[0].author.username).toBe('alice');
          });
        await request(app).get('/api/articles?favorited=bob')
          .expect(200)
          .expect(({ body }) => {
            expect(body.articlesCount).toBe(1);
            expect(body.articles[0].slug).toBe(aliceArticle.body.article.slug);
          });
      });

      it('returns not found for an unknown article', async () => {
        const { app } = await fixture();
        await request(app).get('/api/articles/missing')
          .expect(404)
          .expect({ errors: { body: ['Article not found'] } });
      });
  });

  it('updates and deletes only for the author', async () => {
    const { app, alice, bob } = await fixture();
    const created = await createArticle(app, alice.token);
    const slug = created.body.article.slug as string;
    await request(app).put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${bob.token}`)
      .send({ article: { title: 'Forbidden' } })
      .expect(403);
    const updated = await request(app).put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${alice.token}`)
      .send({ article: { title: 'Updated' } })
      .expect(200);
    await request(app).delete(`/api/articles/${updated.body.article.slug}`)
      .set('Authorization', `Token ${bob.token}`)
      .expect(403);
    await request(app).delete(`/api/articles/${updated.body.article.slug}`)
      .set('Authorization', `Token ${alice.token}`)
      .expect(204);
  });

  it('favorites and unfavorites an article', async () => {
    const { app, alice, bob } = await fixture();
    const created = await createArticle(app, alice.token);
    const path = `/api/articles/${created.body.article.slug}/favorite`;
    await request(app).post(path).set('Authorization', `Token ${bob.token}`)
      .expect(200).expect(({ body }) => expect(body.article.favorited).toBe(true));
    await request(app).delete(path).set('Authorization', `Token ${bob.token}`)
      .expect(200).expect(({ body }) => expect(body.article.favoritesCount).toBe(0));
  });

  it('returns a followed-author feed without bodies', async () => {
    const { app, alice, bob, profiles, articlesRepository } = await fixture();
    await createArticle(app, alice.token);
    await profiles.follow('alice', '2');
    articlesRepository.followAuthor('2', '1');
    await request(app).get('/api/articles/feed')
      .set('Authorization', `Token ${bob.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.articles).toHaveLength(1);
        expect(body.articles[0].body).toBeUndefined();
      });
  });

  it('requires authentication for mutations and feed', async () => {
    const { app } = await fixture();
    await request(app).post('/api/articles').send({ article: {} }).expect(401);
    await request(app).get('/api/articles/feed').expect(401);
  });
});
