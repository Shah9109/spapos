import { Router } from 'express';
import { createSupplier, getSuppliers, createPurchaseOrder, adjustStock } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/suppliers', authorize('MANAGER', 'SPA_OWNER'), createSupplier);
router.get('/suppliers', authorize('MANAGER', 'SPA_OWNER'), getSuppliers);
router.post('/purchase-orders', authorize('MANAGER', 'SPA_OWNER'), createPurchaseOrder);
router.post('/stock-adjust', authorize('MANAGER', 'SPA_OWNER'), adjustStock);

export default router;
