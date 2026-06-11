import { Router } from 'express';
import { createCampaign, getCampaigns } from '../controllers/marketing.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('MANAGER', 'SPA_OWNER'), createCampaign);
router.get('/', authorize('MANAGER', 'SPA_OWNER'), getCampaigns);

export default router;
