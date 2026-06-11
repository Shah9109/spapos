import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createService, getServices } from '../controllers/service.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('SPA_OWNER', 'MANAGER', 'RECEPTIONIST'));

router.post('/', createService as any);
router.get('/', getServices as any);

export default router;
