import { createApp } from './app';
import { loadConfig } from './config';

/**
 * Application entry point: loads configuration, builds the app and starts the
 * HTTP server.
 */
function main(): void {
  const config = loadConfig();
  const app = createApp(config.jwtSecret);
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Conduit backend listening on port ${config.port}`);
  });
}

main();
