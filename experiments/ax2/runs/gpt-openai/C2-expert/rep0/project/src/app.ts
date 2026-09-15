import express, { Express } from "express";
import { PrismaClient } from "@prisma/client";
import { AppConfig } from "./config";
import { errorHandler } from "./middleware/errors";
import { UserRepository } from "./users/user.repository";
import { createUserRouter } from "./users/user.routes";
import { UserService } from "./users/user.service";
import { ProfileRepository } from "./profiles/profile.repository";
import { createProfileRouter } from "./profiles/profile.routes";
import { ProfileService } from "./profiles/profile.service";
import { ArticleRepository } from "./articles/article.repository";
import { createArticleRouter } from "./articles/article.routes";
import { ArticleService } from "./articles/article.service";
import { CommentRepository } from "./comments/comment.repository";
import { createCommentRouter } from "./comments/comment.routes";
import { CommentService } from "./comments/comment.service";
import { TagRepository } from "./tags/tag.repository";
import { createTagRouter } from "./tags/tag.routes";
import { TagService } from "./tags/tag.service";

/** Creates the Express application and wires its dependencies. */
export function createApp(prisma: PrismaClient, config: AppConfig): Express {
  const app = express();
  const users = new UserRepository(prisma);
  const userService = new UserService(users, config.jwtSecret);
  const profiles = new ProfileRepository(prisma);
  const profileService = new ProfileService(profiles);
  const articles = new ArticleRepository(prisma);
  const articleService = new ArticleService(articles);
  const comments = new CommentRepository(prisma);
  const commentService = new CommentService(comments);
  const tags = new TagRepository(prisma);
  const tagService = new TagService(tags);

  app.use(express.json());
  app.use("/api", createUserRouter(userService, config.jwtSecret));
  app.use("/api", createProfileRouter(profileService, config.jwtSecret));
  app.use("/api", createArticleRouter(articleService, config.jwtSecret));
  app.use("/api", createCommentRouter(commentService, config.jwtSecret));
  app.use("/api", createTagRouter(tagService));
  app.use(errorHandler);
  return app;
}
