import { Router } from 'express';
import { markAttendance, getAttendance, createPayroll } from '../controllers/hr.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/attendance', authorize('MANAGER', 'SPA_OWNER'), markAttendance);
router.get('/attendance', authorize('MANAGER', 'SPA_OWNER'), getAttendance);
router.post('/payroll', authorize('MANAGER', 'SPA_OWNER'), createPayroll);

export default router;
