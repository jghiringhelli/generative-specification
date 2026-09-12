import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DependencyContainer } from './DependencyContainer';
import { createUserRoutes } from './presentation/routes/userRoutes';
import { createProfileRoutes } from './presentation/routes/profileRoutes';
import { createArticleRoutes } from './presentation/routes/articleRoutes';
import { createCommentRoutes } from './presentation/routes/commentRoutes';
import { createTagRoutes } from './presentation/routes/tagRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

const container = DependencyContainer.getInstance();

app.use('/api', createUserRoutes(container.userController, container.authMiddleware));
app.use('/api', createProfileRoutes(container.profileController, container.authMiddleware));
app.use('/api', createArticleRoutes(container.articleController, container.authMiddleware));
app.use('/api', createCommentRoutes(container.commentController, container.authMiddleware));
app.use('/api', createTagRoutes(container.tagController));

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
