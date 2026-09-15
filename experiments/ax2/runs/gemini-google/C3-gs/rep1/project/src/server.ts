import { app } from './app';
import { config } from './config/env';

const port = config.port;

const server = app.listen(port, () => {
  console.log(`Conduit server listening on port ${port}`);
});

export default server;
