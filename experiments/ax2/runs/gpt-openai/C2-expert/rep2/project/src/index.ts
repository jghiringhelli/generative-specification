import { createApp } from './app';
import { loadEnvironment } from './config/environment';

const config = loadEnvironment();
const app = createApp(config);

app.listen(config.port, () => {
  process.stdout.write(`Conduit API listening on port ${config.port}\n`);
});
