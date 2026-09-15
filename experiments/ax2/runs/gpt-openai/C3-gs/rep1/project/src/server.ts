import { Argon2PasswordHasher } from './auth/Argon2PasswordHasher';
import { JwtTokenService } from './auth/JwtTokenService';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { ArticleController } from './controllers/ArticleController';
import { AuthController } from './controllers/AuthController';
import { CommentController } from './controllers/CommentController';
import { ProfileController } from './controllers/ProfileController';
import { TagController } from './controllers/TagController';
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository';
import { PrismaCommentRepository } from './repositories/PrismaCommentRepository';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository';
import { PrismaTagRepository } from './repositories/PrismaTagRepository';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { ArticleService } from './services/ArticleService';
import { AuthService } from './services/AuthService';
import { CommentService } from './services/CommentService';
import { ProfileService } from './services/ProfileService';
import { TagService } from './services/TagService';

const users = new PrismaUserRepository(prisma);
const profiles = new PrismaProfileRepository(prisma);
const articles = new PrismaArticleRepository(prisma);
const comments = new PrismaCommentRepository(prisma);
const tags = new PrismaTagRepository(prisma);
const passwordHasher = new Argon2PasswordHasher();
const tokenService = new JwtTokenService(env.jwtSecret, env.jwtExpiry);
const app = createApp({
  authController: new AuthController(new AuthService(users, passwordHasher, tokenService)),
  profileController: new ProfileController(new ProfileService(profiles, users)),
  articleController: new ArticleController(new ArticleService(articles)),
  commentController: new CommentController(new CommentService(comments, articles)),
  tagController: new TagController(new TagService(tags)),
  tokenService,
});

app.listen(env.port, () => {
  process.stdout.write(`Conduit API listening on port ${env.port}
`);
});
