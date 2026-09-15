import express, { Express } from "express";
import { ArticleRepository } from "./articles/article.repository";
import { createArticleRouter } from "./articles/article.routes";
import { ArticleService } from "./articles/article.service";
import { AppConfig } from "./config";
import { CommentRepository } from "./comments/comment.repository";
import { createCommentRouter } from "./comments/comment.routes";
import { CommentService } from "./comments/comment.service";
import { prisma } from "./infrastructure/prisma";
import { errorHandler } from "./middleware/error-handler";
import { ProfileRepository } from "./profiles/profile.repository";
import { createProfileRouter } from "./profiles/profile.routes";
import { ProfileService } from "./profiles/profile.service";
import { TagRepository } from "./tags/tag.repository";
import { createTagRouter } from "./tags/tag.routes";
import { TagService } from "./tags/tag.service";
import { UserRepository } from "./users/user.repository";
import { createUserRouter } from "./users/user.routes";
import { UserService } from "./users/user.service";
import { NotFoundError } from "./errors";

/** Composes the HTTP application and its dependencies. */
export function createApp(config: AppConfig): Express {
  const app = express();
  const userService = new UserService(new UserRepository(prisma), config.jwtSecret);
  const profileService = new ProfileService(new ProfileRepository(prisma));
  const articleService = new ArticleService(new ArticleRepository(prisma));
  const commentService = new CommentService(new CommentRepository(prisma));
  const tagService = new TagService(new TagRepository(prisma));

  app.use(express.json());
  app.use("/api", createUserRouter(userService, config.jwtSecret));
  app.use("/api/profiles", createProfileRouter(profileService, config.jwtSecret));
  app.use("/api/articles", createArticleRouter(articleService, config.jwtSecret));
  app.use("/api/articles", createCommentRouter(commentService, config.jwtSecret));
  app.use("/api/tags", createTagRouter(tagService));
  app.use((_request, _response, next) => next(new NotFoundError("Route not found")));
  app.use(errorHandler);
  return app;
}
