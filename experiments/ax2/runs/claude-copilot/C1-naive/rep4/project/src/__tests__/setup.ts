import dotenv from 'dotenv';

dotenv.config();

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
