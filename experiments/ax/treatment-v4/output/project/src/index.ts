import { PrismaClient } from '@prisma/client';
import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

const prisma = new PrismaClient();
const app = createApp(prisma);

const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Process terminated');
    process.exit(0);
  });
});
