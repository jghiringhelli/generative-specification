import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { env } from './config/env';

const prisma = new PrismaClient();
const app = createApp(prisma);

const PORT = parseInt(env.PORT, 10);

const server = app.listen(PORT, () => {
  console.log(`🚀 Conduit API listening on port ${PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
});

/**
 * Graceful shutdown handler.
 * Stops accepting new requests, drains in-flight requests, closes DB connections.
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    console.log('HTTP server closed');
  });

  await prisma.$disconnect();
  console.log('Database connection closed');

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
