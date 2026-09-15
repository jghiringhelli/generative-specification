import { createApp } from './app';
import { loadConfig } from './config/env';
import { prisma } from './lib/prisma';

/**
 * Application entry point. Loads configuration, builds the app and listens.
 */
function main(): void {
  const config = loadConfig();
  const app = createApp(prisma, config);
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Conduit backend listening on port ${config.port}`);
  });
}

main();
