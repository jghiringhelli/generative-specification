import { config } from './config/env';
import { prisma } from './config/prisma';
import { buildContainer } from './config/container';
import { createApp } from './app';

/**
 * Application entry point: build the container, create the app, and listen.
 */
function main(): void {
  const container = buildContainer(prisma, config);
  const app = createApp(container);
  app.listen(config.port, () => {
    console.log(`Conduit API listening on port ${config.port}`);
  });
}

main();
