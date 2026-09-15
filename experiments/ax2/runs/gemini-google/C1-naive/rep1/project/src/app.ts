import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import profileRoutes from './routes/profileRoutes';
import articleRoutes from './routes/articleRoutes';
import tagRoutes from './routes/tagRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', userRoutes);
app.use('/api', profileRoutes);
app.use('/api', articleRoutes);
app.use('/api', tagRoutes);

export default app;
