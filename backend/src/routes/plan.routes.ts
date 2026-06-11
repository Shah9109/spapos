import { Router } from 'express';
import { createPlan, getPlans, updatePlan, deletePlan } from '../controllers/plan.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const planRoutes = Router();

// Protect all plan routes - only SUPER_ADMIN can manage plans
planRoutes.use(authenticate, authorize('SUPER_ADMIN'));

planRoutes.post('/', createPlan);
planRoutes.get('/', getPlans);
planRoutes.put('/:id', updatePlan);
planRoutes.delete('/:id', deletePlan);
