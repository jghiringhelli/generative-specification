/**
 * Composition root: load configuration, construct the concrete adapters, wire
 * the service, and start the HTTP server. This is the only module that touches
 * the environment, the database client, and the network — everything else
 * receives its collaborators by injection.
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md, docs/adrs/ADR-0001-stack.md
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { loadConfig } from './config/env.js';
import { Argon2PasswordHasher } from './adapters/security/Argon2PasswordHasher.js';
import { JwtTokenService } from './adapters/security/JwtTokenService.js';
import { PrismaArticleRepository } from './adapters/persistence/PrismaArticleRepository.js';
import { PrismaCommentRepository } from './adapters/persistence/PrismaCommentRepository.js';
import { PrismaProfileRepository } from './adapters/persistence/PrismaProfileRepository.js';
import { PrismaUserRepository } from './adapters/persistence/PrismaUserRepository.js';
import { ArticleService } from './services/ArticleService.js';
import { CommentService } from './services/CommentService.js';
import { ProfileService } from './services/ProfileService.js';
import { UserService } from './services/UserService.js';
import { createApp } from './http/app.js';

function main(): void {
  const config = loadConfig();

  const prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
  // jest.setup.ts disconnects whatever client is registered here after a run.
  (globalThis as { __PRISMA__?: PrismaClient }).__PRISMA__ = prisma;

  const tokenService = new JwtTokenService(config.jwtSecret, config.jwtExpiry);
  const userRepository = new PrismaUserRepository(prisma);
  const profileRepository = new PrismaProfileRepository(prisma);
  const articleRepository = new PrismaArticleRepository(prisma);
  const userService = new UserService(userRepository, new Argon2PasswordHasher(), tokenService);
  const profileService = new ProfileService(userRepository, profileRepository);
  const articleService = new ArticleService(articleRepository, userRepository, profileRepository);
  const commentService = new CommentService(
    new PrismaCommentRepository(prisma),
    articleRepository,
    userRepository,
    profileRepository,
  );

  const app = createApp({
    userService,
    profileService,
    articleService,
    commentService,
    tokenService,
  });
  app.listen(config.port, () => {
    console.log(`project API listening on port ${config.port}`);
  });
}

main();
