import { Router } from 'express';
import * as tagController from '../controllers/tagController';

export const tagRoutes = Router();

tagRoutes.get('/', tagController.getTags);
