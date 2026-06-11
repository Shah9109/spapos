import { Router } from 'express';
import { createStaff, getStaff } from '../controllers/staff.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const staffRoutes = Router();

// Staff routes
staffRoutes.use(authenticate, authorize('SPA_OWNER', 'MANAGER'));

staffRoutes.post('/', createStaff);
staffRoutes.get('/', getStaff);