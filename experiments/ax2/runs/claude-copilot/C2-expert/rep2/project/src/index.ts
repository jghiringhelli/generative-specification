import { createApp } from './app';
import { config } from './config';

/**
 * Application entry point. Boots the HTTP server.
 */
function main(): void {
  const app = createApp();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Conduit API listening on port ${config.port}`);
  });
}

main();
