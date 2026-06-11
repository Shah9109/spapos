import { Router } from 'express';
import { createBranch, getBranches, getBranchRevenue } from '../controllers/branch.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('MANAGER', 'SPA_OWNER'), createBranch);
router.get('/', authorize('MANAGER', 'SPA_OWNER'), getBranches);
router.get('/:id/revenue', authorize('MANAGER', 'SPA_OWNER'), getBranchRevenue);

export default router;
