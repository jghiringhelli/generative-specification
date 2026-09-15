import 'dotenv/config';
import { prisma } from './config/prisma';
import { loadConfig } from './config/config';
import { buildContainer } from './config/container';
import { createApp } from './app';

/** Process entry point: load config, wire the container, and start listening. */
function main(): void {
  const config = loadConfig();
  const container = buildContainer(prisma, config);
  const app = createApp(container);

  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

main();
