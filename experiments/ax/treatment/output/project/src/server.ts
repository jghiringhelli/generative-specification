import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { logger } from './config/logger';
import { PORT } from './config/constants';

const prisma = new PrismaClient();
const app = createApp(prisma);

const server = app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

/**
 * Graceful shutdown handler.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, starting graceful shutdown`);

  server.close(async () => {
    logger.info('HTTP server closed');

    await prisma.$disconnect();
    logger.info('Database connection closed');

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forceful shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
