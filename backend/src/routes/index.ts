import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { spaRoutes } from './spa.routes';
import { planRoutes } from './plan.routes';
import { analyticsRoutes } from './analytics.routes';
import { customerRoutes } from './customer.routes';
import { staffRoutes } from './staff.routes';
import { appointmentRoutes } from './appointment.routes';
import posRoutes from './pos.routes';
import productRoutes from './product.routes';
import serviceRoutes from './service.routes';
import inventoryRoutes from './inventory.routes';
import financeRoutes from './finance.routes';
import hrRoutes from './hr.routes';
import branchRoutes from './branch.routes';
import marketingRoutes from './marketing.routes';
import { syncRoutes } from './sync.routes';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/spas', spaRoutes);
routes.use('/plans', planRoutes);
routes.use('/analytics', analyticsRoutes);
routes.use('/customers', customerRoutes);
routes.use('/staff', staffRoutes);
routes.use('/appointments', appointmentRoutes);
routes.use('/pos', posRoutes);
routes.use('/products', productRoutes);
routes.use('/services', serviceRoutes);
routes.use('/inventory', inventoryRoutes);
routes.use('/finance', financeRoutes);
routes.use('/hr', hrRoutes);
routes.use('/branches', branchRoutes);
routes.use('/marketing', marketingRoutes);
routes.use('/sync', syncRoutes);

// Health check
routes.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});
