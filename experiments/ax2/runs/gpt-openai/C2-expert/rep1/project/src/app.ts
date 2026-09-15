import express, { Express } from "express";
import { PrismaClient } from "@prisma/client";
import { ArticleRepository } from "./articles/article.repository";
import { createArticleRouter } from "./articles/article.routes";
import { ArticleService } from "./articles/article.service";
import { CommentRepository } from "./comments/comment.repository";
import { createCommentRouter } from "./comments/comment.routes";
import { CommentService } from "./comments/comment.service";
import { errorHandler } from "./middleware/error.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";
import { FollowRepository } from "./profiles/follow.repository";
import { createProfileRouter } from "./profiles/profile.routes";
import { ProfileService } from "./profiles/profile.service";
import { UserRepository } from "./users/user.repository";
import { createUserRouter } from "./users/user.routes";
import { UserService } from "./users/user.service";
import { TagRepository } from "./tags/tag.repository";
import { createTagRouter } from "./tags/tag.routes";
import { TagService } from "./tags/tag.service";

export interface AppDependencies {
  readonly prisma: PrismaClient;
  readonly jwtSecret: string;
}

/** Composes the Express application and its dependencies. */
export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  const userRepository = new UserRepository(dependencies.prisma);
  const followRepository = new FollowRepository(dependencies.prisma);
  const articleRepository = new ArticleRepository(dependencies.prisma);
  const commentRepository = new CommentRepository(dependencies.prisma);
  const tagRepository = new TagRepository(dependencies.prisma);
  const userService = new UserService(userRepository, dependencies.jwtSecret);
  const profileService = new ProfileService(userRepository, followRepository);
  const articleService = new ArticleService(articleRepository, followRepository);
  const commentService = new CommentService(
    commentRepository,
    articleRepository,
    followRepository
  );
  const tagService = new TagService(tagRepository);

  app.use(express.json());
  app.use("/api", createUserRouter(userService, dependencies.jwtSecret));
  app.use("/api", createProfileRouter(profileService, dependencies.jwtSecret));
  app.use("/api", createArticleRouter(articleService, dependencies.jwtSecret));
  app.use("/api", createCommentRouter(commentService, dependencies.jwtSecret));
  app.use("/api", createTagRouter(tagService));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
