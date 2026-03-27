import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository';
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository';
import { PrismaCommentRepository } from './repositories/PrismaCommentRepository';
import { PrismaTagRepository } from './repositories/PrismaTagRepository';
import { UserService } from './services/UserService';
import { ProfileService } from './services/ProfileService';
import { ArticleService } from './services/ArticleService';
import { CommentService } from './services/CommentService';
import { TagService } from './services/TagService';

// §4 Named constant — minimum secret length is a security requirement, not a magic number
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Startup validation: fail fast if required configuration is absent or invalid.
 * A server that starts with a weak JWT secret is a security defect, not a runtime error.
 */
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
  console.error(
    `FATAL: JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters. ` +
      'Set it via environment variable or .env file.',
  );
  process.exit(1);
}

const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Composition root: wire concrete implementations to port interfaces
const prisma = new PrismaClient();
const userRepository = new PrismaUserRepository(prisma);
const profileRepository = new PrismaProfileRepository(prisma);
const articleRepository = new PrismaArticleRepository(prisma);
const commentRepository = new PrismaCommentRepository(prisma);
const tagRepository = new PrismaTagRepository(prisma);
const userService = new UserService(userRepository);
const profileService = new ProfileService(profileRepository);
const articleService = new ArticleService(articleRepository);
const commentService = new CommentService(commentRepository, articleRepository);
const tagService = new TagService(tagRepository);

const app = createApp({ userService, profileService, articleService, commentService, tagService });

const server = app.listen(PORT, () => {
  console.log(`Conduit API server listening on port ${PORT}`);
});

// Graceful shutdown: close HTTP server before disconnecting the database pool
process.on('SIGTERM', () => {
  server.close(() => {
    prisma.$disconnect().catch(console.error);
    process.exit(0);
  });
});
