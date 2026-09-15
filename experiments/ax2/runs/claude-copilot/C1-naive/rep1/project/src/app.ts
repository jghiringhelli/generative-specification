import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import profileRoutes from './routes/profileRoutes';
import articleRoutes from './routes/articleRoutes';
import tagRoutes from './routes/tagRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api', userRoutes);
app.use('/api', profileRoutes);
app.use('/api', articleRoutes);
app.use('/api', tagRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ errors: { body: ['not found'] } });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ errors: { body: [err.message || 'internal server error'] } });
});

export default app;
