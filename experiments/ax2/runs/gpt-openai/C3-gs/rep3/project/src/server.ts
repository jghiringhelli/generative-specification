import 'dotenv/config';
import { Argon2PasswordHasher } from './auth/Argon2PasswordHasher';
import { AuthService } from './auth/AuthService';
import { JwtTokenService } from './auth/JwtTokenService';
import { createApp } from './app';
import { loadEnvironment } from './config/environment';
import { prisma } from './infrastructure/prisma';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository';
import { ProfileService } from './profiles/ProfileService';
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository';
import { ArticleService } from './articles/ArticleService';
import { PrismaCommentRepository } from './repositories/PrismaCommentRepository';
import { CommentService } from './comments/CommentService';
import { PrismaTagRepository } from './repositories/PrismaTagRepository';
import { TagService } from './tags/TagService';

const environment = loadEnvironment();
const userRepository = new PrismaUserRepository(prisma);
const passwordHasher = new Argon2PasswordHasher();
const tokenService = new JwtTokenService(environment.JWT_SECRET);
const authService = new AuthService(userRepository, passwordHasher, tokenService);
const profileService = new ProfileService(new PrismaProfileRepository(prisma));
const articleService = new ArticleService(new PrismaArticleRepository(prisma));
const commentService = new CommentService(
  new PrismaCommentRepository(prisma),
  new PrismaArticleRepository(prisma),
);
const tagService = new TagService(new PrismaTagRepository(prisma));
const app = createApp({
  authService,
  tokenService,
  profileService,
  articleService,
  commentService,
  tagService,
});

app.listen(environment.PORT, () => {
  process.stdout.write(`Conduit API listening on port ${environment.PORT}\n`);
});
