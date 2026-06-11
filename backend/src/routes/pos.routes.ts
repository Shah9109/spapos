import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createInvoice, getInvoices, getInvoiceById } from '../controllers/pos.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('SPA_OWNER', 'MANAGER', 'RECEPTIONIST'));

router.post('/invoices', createInvoice as any);
router.get('/invoices', getInvoices as any);
router.get('/invoices/:id', getInvoiceById as any);

export default router;
