import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const server = createApp(config).listen(config.port, () => {
  process.stdout.write(`Conduit API listening on port ${config.port}\n`);
});

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
