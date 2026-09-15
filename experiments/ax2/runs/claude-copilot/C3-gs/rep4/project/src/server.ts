import { loadConfig } from './config/env';
import { prisma } from './config/prisma';
import { buildContainer } from './container/container';
import { buildApp } from './app';

/**
 * Process entry point: load config, wire the container, and start listening.
 */
function main(): void {
  const config = loadConfig();
  const container = buildContainer(prisma, config);
  const app = buildApp(container);

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Conduit API listening on port ${config.port}`);
  });
}

main();
