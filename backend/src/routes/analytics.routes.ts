import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const analyticsRoutes = Router();

// Protect all analytics routes - only SUPER_ADMIN
analyticsRoutes.use(authenticate, authorize('SUPER_ADMIN'));

analyticsRoutes.get('/dashboard', getDashboardAnalytics);
