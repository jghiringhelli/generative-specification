import { app } from "./app";
import { config } from "./config";
import { prisma } from "./database";

const server = app.listen(config.port, () => {
  console.log(`Conduit API listening on port ${config.port}`);
});

async function shutdown(): Promise<void> {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
