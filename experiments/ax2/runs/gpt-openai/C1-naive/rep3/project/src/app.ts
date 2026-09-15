import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { articlesRouter } from './routes/articles';
import { commentsRouter } from './routes/comments';
import { profilesRouter } from './routes/profiles';
import { tagsRouter } from './routes/tags';
import { usersRouter } from './routes/users';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', usersRouter);
app.use('/api', profilesRouter);
app.use('/api', commentsRouter);
app.use('/api', articlesRouter);
app.use('/api', tagsRouter);

app.use((_request: Request, response: Response) => {
  response.status(404).json({ errors: { body: ['Not found'] } });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(500).json({ errors: { body: ['Internal server error'] } });
});
