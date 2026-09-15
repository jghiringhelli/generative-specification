import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.listen(PORT, () => {
  console.log(`Conduit backend listening on port ${PORT}`);
});
