import { app } from './app';
import { config } from './config/env';

const server = app.listen(config.port, () => {
  console.log(`Conduit server listening on port ${config.port}`);
});

export default server;
