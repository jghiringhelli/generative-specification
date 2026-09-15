import request from 'supertest';
import type { IPasswordHasher } from '../auth/IPasswordHasher';
import type { ITokenService } from '../auth/ITokenService';
import { createApp } from '../app';
import { AuthController } from '../controllers/AuthController';
import { TagController } from '../controllers/TagController';
import type { ITagRepository } from '../repositories/ITagRepository';
import type { CreateUserRecord, IUserRepository, UpdateUserRecord, UserRecord } from '../repositories/IUserRepository';
import { AuthService } from '../services/AuthService';
import { TagService } from '../services/TagService';

class Tags implements ITagRepository {
  public list() { return Promise.resolve(['javascript', 'typescript']); }
  public replaceArticleTags() { return Promise.resolve(); }
}
class Users implements IUserRepository {
  public findById() { return Promise.resolve(null); }
  public findByEmail() { return Promise.resolve(null); }
  public findByUsername() { return Promise.resolve(null); }
  public create(data: CreateUserRecord): Promise<UserRecord> { return Promise.resolve({ ...data, id: 'user', bio: null, image: null }); }
  public update(_id: string, data: UpdateUserRecord): Promise<UserRecord> { return Promise.resolve({ id: 'user', email: 'a@b.com', username: 'a', passwordHash: 'x', bio: null, image: null, ...data }); }
}

test('GET /api/tags returns all unique tags used by articles', async () => {
  const tokens: ITokenService = { sign: ({ userId }) => userId, verify: (token) => ({ userId: token }) };
  const hasher: IPasswordHasher = { hash: async (value) => value, verify: async () => true };
  const auth = new AuthController(new AuthService(new Users(), hasher, tokens));
  const tag = new TagController(new TagService(new Tags()));
  const response = await request(createApp({ authController: auth, tagController: tag, tokenService: tokens })).get('/api/tags');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ tags: ['javascript', 'typescript'] });
});
