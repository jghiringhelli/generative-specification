import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from './repositories/prisma/PrismaUserRepository';
import { PrismaProfileRepository } from './repositories/prisma/PrismaProfileRepository';
import { PrismaArticleRepository } from './repositories/prisma/PrismaArticleRepository';
import { PrismaCommentRepository } from './repositories/prisma/PrismaCommentRepository';
import { PrismaTagRepository } from './repositories/prisma/PrismaTagRepository';
import { AuthService } from './services/AuthService';
import { ProfileService } from './services/ProfileService';
import { ArticleService } from './services/ArticleService';
import { CommentService } from './services/CommentService';
import { TagService } from './services/TagService';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

function startServer(): void {
  let app;
  if (process.env.DATABASE_URL) {
    const prisma = new PrismaClient();
    const userRepository = new PrismaUserRepository(prisma);
    const profileRepository = new PrismaProfileRepository(prisma);
    const articleRepository = new PrismaArticleRepository(prisma);
    const commentRepository = new PrismaCommentRepository(prisma);
    const tagRepository = new PrismaTagRepository(prisma);

    const authService = new AuthService(userRepository);
    const profileService = new ProfileService(profileRepository);
    const articleService = new ArticleService(articleRepository);
    const commentService = new CommentService(commentRepository);
    const tagService = new TagService(tagRepository);

    app = createApp({
      userRepository,
      profileRepository,
      articleRepository,
      commentRepository,
      tagRepository,
      authService,
      profileService,
      articleService,
      commentService,
      tagService,
    });
  } else {
    app = createApp();
  }

  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

startServer();
