import { createApp } from "./app";
import { getPort } from "./config";

/**
 * Start the HTTP server on the configured port.
 */
function main(): void {
  const app = createApp();
  const port = getPort();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Conduit API listening on port ${port}`);
  });
}

main();
