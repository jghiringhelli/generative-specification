import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { ApplicationError } from "./errors";
import { userRouter } from "./users/routes";
import { profileRouter } from "./profiles/routes";
import { articleRouter } from "./articles/routes";
import { commentRouter } from "./comments/routes";
import { tagRouter } from "./tags/routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", userRouter);
app.use("/api", profileRouter);
app.use("/api", commentRouter);
app.use("/api", articleRouter);
app.use("/api", tagRouter);

app.use((_request, response) => {
  response.status(404).json({ errors: { body: ["Not found"] } });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof ApplicationError) {
    response.status(error.statusCode).json({
      errors: error.details ?? { body: [error.message] },
    });
    return;
  }
  response.status(500).json({ errors: { body: ["Internal server error"] } });
});
