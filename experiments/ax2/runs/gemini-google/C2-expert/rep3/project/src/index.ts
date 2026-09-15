import { createApp } from './app';
import { getEnvConfig } from './config/env';

const { port } = getEnvConfig();
const app = createApp();

app.listen(port, () => {
  console.log(`Conduit API server running on port ${port}`);
});
