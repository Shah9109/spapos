import { Router } from 'express';
import { createSpa, getSpas, getSpaById, updateSpaStatus } from '../controllers/spa.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const spaRoutes = Router();

// Protect all spa routes - only SUPER_ADMIN can manage spas
spaRoutes.use(authenticate, authorize('SUPER_ADMIN'));

spaRoutes.post('/', createSpa);
spaRoutes.get('/', getSpas);
spaRoutes.get('/:id', getSpaById);
spaRoutes.patch('/:id/status', updateSpaStatus);
