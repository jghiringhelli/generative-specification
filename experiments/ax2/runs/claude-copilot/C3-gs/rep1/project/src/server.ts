import { createApp } from './app';
import { loadConfig } from './config/env';

/**
 * Start the HTTP server using validated configuration.
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
