import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes';
import profileRoutes from './routes/profile.routes';
import articleRoutes from './routes/article.routes';
import commentRoutes from './routes/comment.routes';
import tagRoutes from './routes/tag.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', userRoutes);
app.use('/api', profileRoutes);
app.use('/api', articleRoutes);
app.use('/api', commentRoutes);
app.use('/api', tagRoutes);

// Root healthcheck or info
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Conduit API is running' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    errors: {
      message: [err.message || 'An unexpected error occurred']
    }
  });
});

export default app;
