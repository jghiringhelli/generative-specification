import 'dotenv/config';
import { createApp } from './app';
import { loadEnvironment } from './config/env';

const environment = loadEnvironment();
const app = createApp(environment);

app.listen(environment.PORT, () => {
  process.stdout.write(`Conduit API listening on port ${environment.PORT}\n`);
});
