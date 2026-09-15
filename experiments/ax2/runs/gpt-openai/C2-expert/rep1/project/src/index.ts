import { PrismaClient } from "@prisma/client";
import { createApp } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();
const prisma = new PrismaClient();
const app = createApp({ prisma, jwtSecret: config.JWT_SECRET });

app.listen(config.PORT);
