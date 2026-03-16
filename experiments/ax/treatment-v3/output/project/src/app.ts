import express, { Express } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { createUserRoutes } from './routes/users';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { UserService } from './services/UserService';
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MINUTES } from './config/constants';

/**
 * Create Express application with all middleware and routes.
 * Dependency injection composition root.
 */
export function createApp(prisma: PrismaClient): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(
    rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
      max: RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  // Dependency injection - composition root
  const userRepository = new PrismaUserRepository(prisma);
  const userService = new UserService(userRepository);

  // Routes
  app.use('/api/users', createUserRoutes(userService));
  
  // Note: /api/user routes are on the same router (singular vs plural distinction)
  const userRouter = createUserRoutes(userService);
  app.use('/api/user', userRouter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
