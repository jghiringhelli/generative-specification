import cors from "cors";
import express from "express";

import { articleRouter } from "./articles/article.routes";
import { commentRouter } from "./comments/comment.routes";
import { errorHandler } from "./middleware/errors";
import { profileRouter } from "./profiles/profile.routes";
import { tagRouter } from "./tags/tag.routes";
import { userRouter } from "./users/user.routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", userRouter);
app.use("/api", profileRouter);
app.use("/api", articleRouter);
app.use("/api", commentRouter);
app.use("/api", tagRouter);
app.use(errorHandler);
