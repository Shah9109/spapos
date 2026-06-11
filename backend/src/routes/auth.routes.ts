import { Router } from 'express';
import { login, registerSuperAdmin, logout } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/register-super-admin', registerSuperAdmin); // Usually disabled in production or protected
authRoutes.post('/logout', authenticate, logout);
