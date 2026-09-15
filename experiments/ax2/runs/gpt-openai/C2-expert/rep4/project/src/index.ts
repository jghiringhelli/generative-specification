import { createApp } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();
createApp(config).listen(config.port, () => {
  process.stdout.write(`Conduit API listening on port ${config.port}\n`);
});
