import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { usersRouter } from "./routes/users";
import { profilesRouter } from "./routes/profiles";
import { articlesRouter } from "./routes/articles";
import { commentsRouter } from "./routes/comments";
import { tagsRouter } from "./routes/tags";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", usersRouter);
app.use("/api", profilesRouter);
app.use("/api", articlesRouter);
app.use("/api", commentsRouter);
app.use("/api", tagsRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(422).json({ errors: { body: ["value is already taken"] } });
    return;
  }
  res.status(500).json({ errors: { body: ["Internal server error"] } });
});
