import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    errors: {
      body: [err.message || 'Internal server error']
    }
  });
});

export default app;
