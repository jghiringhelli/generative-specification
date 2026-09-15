import app from './app';
import { config } from './config';
import { prisma } from './prisma';

const server = app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port} in ${config.nodeEnv} mode`);
});

const shutdown = async (): Promise<void> => {
  console.log('Shutting down server...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server and database disconnected');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
