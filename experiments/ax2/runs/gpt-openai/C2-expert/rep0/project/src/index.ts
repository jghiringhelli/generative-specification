import { PrismaClient } from "@prisma/client";
import { createApp } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();
const prisma = new PrismaClient();
const app = createApp(prisma, config);

app.listen(config.port, () => {
  process.stdout.write(`Conduit API listening on port ${config.port}\n`);
});
