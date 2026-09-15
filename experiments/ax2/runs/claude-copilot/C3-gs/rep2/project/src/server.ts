import 'dotenv/config';
import { createApp } from './app';
import { createContainer } from './container';
import { loadConfig } from './config';
import { prisma } from './config/prisma';

/**
 * Process entrypoint: load configuration, wire the container, and start the
 * HTTP server.
 */
function main(): void {
  const config = loadConfig();
  const container = createContainer(prisma, config);
  const app = createApp(container);

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${config.port}`);
  });
}

main();
