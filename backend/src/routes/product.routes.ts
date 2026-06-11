import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createProduct, getProducts } from '../controllers/product.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('SPA_OWNER', 'MANAGER', 'RECEPTIONIST'));

router.post('/', createProduct as any);
router.get('/', getProducts as any);

export default router;
