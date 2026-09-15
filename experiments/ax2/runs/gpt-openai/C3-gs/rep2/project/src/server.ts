import 'dotenv/config';
import { createApp } from './app';
import { createDependencies } from './compositionRoot';

const dependencies = createDependencies();
const app = createApp(dependencies);

app.listen(dependencies.environment.PORT, () => {
  process.stdout.write(`Conduit API listening on port ${dependencies.environment.PORT}\n`);
});
