import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes';

export const app = express();

app.use(cors());
app.use(express.json());

// API root router
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);
