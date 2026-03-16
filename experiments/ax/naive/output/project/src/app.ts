import express from 'express';
import cors from 'cors';
import { userRoutes } from './routes/users';
import { profileRoutes } from './routes/profiles';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    errors: {
      body: [err.message || 'Internal server error']
    }
  });
});
