import { createApp } from './app';
import { loadConfig } from './config';

/**
 * Application entry point. Loads configuration, builds the Express app, and
 * starts the HTTP server.
 */
function main(): void {
  const config = loadConfig();
  const app = createApp();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Conduit API listening on port ${config.port}`);
  });
}

main();
