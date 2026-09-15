import { app } from './app';
import { getEnvironmentConfig } from './config/environment';

const config = getEnvironmentConfig();

app.listen(config.port, () => {
  // Application startup log
  console.log(`Conduit backend server listening on port ${config.port}`);
});
