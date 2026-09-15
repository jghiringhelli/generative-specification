import express from 'express';
import { articleRouter } from './articles/routes';
import { commentRouter } from './comments/routes';
import { profileRouter } from './profiles/routes';
import { tagRouter } from './tags/routes';
import { userRouter } from './users/routes';

export const app = express();
app.use(express.json());
app.use('/api', userRouter);
app.use('/api', profileRouter);
app.use('/api', commentRouter);
app.use('/api', articleRouter);
app.use('/api', tagRouter);
