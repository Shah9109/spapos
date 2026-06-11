import { Router } from 'express';
import { createCustomer, getCustomers, getCustomerById } from '../controllers/customer.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const customerRoutes = Router();

// Protect all customer routes - accessible by SPA_OWNER, MANAGER, RECEPTIONIST
customerRoutes.use(authenticate, authorize('SPA_OWNER', 'MANAGER', 'RECEPTIONIST'));

customerRoutes.post('/', createCustomer);
customerRoutes.get('/', getCustomers);
customerRoutes.get('/:id', getCustomerById);
