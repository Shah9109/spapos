import { Router } from 'express';
import { createExpenseCategory, getExpenseCategories, createExpense, getFinanceReport } from '../controllers/finance.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/categories', authorize('MANAGER', 'SPA_OWNER'), createExpenseCategory);
router.get('/categories', authorize('MANAGER', 'SPA_OWNER'), getExpenseCategories);
router.post('/expenses', authorize('MANAGER', 'SPA_OWNER'), createExpense);
router.get('/report', authorize('MANAGER', 'SPA_OWNER'), getFinanceReport);

export default router;
