import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRouter from './routes/users';
import profilesRouter from './routes/profiles';
import articlesRouter from './routes/articles';
import commentsRouter from './routes/comments';
import tagsRouter from './routes/tags';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - accept all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Set Content-Type header for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use('/api', usersRouter);
app.use('/api', profilesRouter);
app.use('/api', articlesRouter);
app.use('/api', commentsRouter);
app.use('/api', tagsRouter);

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
