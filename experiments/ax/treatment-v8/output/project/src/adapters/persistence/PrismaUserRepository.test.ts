/**
 * Real-database integration test for the Prisma persistence adapter.
 *
 * Gated on `RUN_DB_TESTS=1` so it runs only where a Postgres instance is
 * provisioned (CI, or a local `docker compose up db`). It is skipped by default
 * — including in environments without the database on `DATABASE_URL` — so the
 * unit run stays hermetic. Set up the schema first with:
 *   `npx prisma db push --accept-data-loss`
 * (per .claude/standards/protocols.md test-setup note). It verifies the adapter
 * honours the same IUserRepository contract the in-memory fake does, against a
 * real database — including the unique constraints on email and username.
 */
import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from './PrismaUserRepository.js';

const runDbTests = process.env.RUN_DB_TESTS === '1';
const describeDb = runDbTests ? describe : describe.skip;

describeDb('PrismaUserRepository (real database)', () => {
  const prisma = new PrismaClient();
  (globalThis as { __PRISMA__?: PrismaClient }).__PRISMA__ = prisma;
  const repo = new PrismaUserRepository(prisma);

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  const input = {
    email: 'db@example.com',
    username: 'dbuser',
    passwordHash: '$argon2id$fake',
  };

  it('creates and reads back a user by id, email, and username', async () => {
    const created = await repo.create(input);
    expect(created.id).toMatch(/.+/);
    expect(await repo.findById(created.id)).toMatchObject({ email: input.email });
    expect(await repo.findByEmail(input.email)).toMatchObject({ username: input.username });
    expect(await repo.findByUsername(input.username)).toMatchObject({ id: created.id });
  });

  it('reports existence by email and username', async () => {
    await repo.create(input);
    expect(await repo.existsByEmail(input.email)).toBe(true);
    expect(await repo.existsByUsername(input.username)).toBe(true);
    expect(await repo.existsByEmail('nobody@example.com')).toBe(false);
  });

  it('applies a partial update', async () => {
    const created = await repo.create(input);
    const updated = await repo.update(created.id, { bio: 'hello', email: 'new@example.com' });
    expect(updated.bio).toBe('hello');
    expect(updated.email).toBe('new@example.com');
    expect(updated.username).toBe(input.username);
  });

  it('returns null for an unknown id', async () => {
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });
});
