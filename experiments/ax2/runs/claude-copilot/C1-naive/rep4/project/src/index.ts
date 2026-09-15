import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Conduit backend listening on port ${PORT}`);
});
