import { app } from './app';

const DEFAULT_PORT = 3000;
const port = Number(process.env.PORT ?? DEFAULT_PORT);

app.listen(port, () => {
  process.stdout.write(`Conduit API listening on port ${port}\n`);
});
