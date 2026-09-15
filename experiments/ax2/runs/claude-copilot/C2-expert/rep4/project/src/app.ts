import express, { Express } from "express";
import { errorHandler } from "./middleware/error";
import { buildUserModule, createUserRouter } from "./modules/user/user.routes";
import {
  buildProfileModule,
  createProfileRouter,
} from "./modules/profile/profile.routes";
import {
  buildArticleModule,
  createArticleRouter,
} from "./modules/article/article.routes";
import {
  buildCommentModule,
  createCommentRouter,
} from "./modules/comment/comment.routes";
import { buildTagModule, createTagRouter } from "./modules/tag/tag.routes";

/**
 * Compose the Express application, wiring every module's router under the
 * `/api` prefix and installing the shared error handler.
 * @returns The configured Express application.
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  const api = express.Router();
  api.use(createUserRouter(buildUserModule()));
  api.use(createProfileRouter(buildProfileModule()));
  api.use(createArticleRouter(buildArticleModule()));
  api.use(createCommentRouter(buildCommentModule()));
  api.use(createTagRouter(buildTagModule()));

  app.use("/api", api);
  app.use(errorHandler);

  return app;
}
