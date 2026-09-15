import cors from "cors";
import express from "express";
import { errorHandler } from "./errors";
import articlesRouter from "./routes/articles";
import commentsRouter from "./routes/comments";
import profilesRouter from "./routes/profiles";
import tagsRouter from "./routes/tags";
import usersRouter from "./routes/users";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", usersRouter);
app.use("/api", profilesRouter);
app.use("/api", commentsRouter);
app.use("/api", articlesRouter);
app.use("/api", tagsRouter);
app.use(errorHandler);
