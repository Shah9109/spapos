import { Router } from 'express';
import { createAppointment, getAppointments, updateAppointmentStatus } from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const appointmentRoutes = Router();

// Accessible by all internal staff
appointmentRoutes.use(authenticate, authorize('SPA_OWNER', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'));

appointmentRoutes.post('/', createAppointment);
appointmentRoutes.get('/', getAppointments);
appointmentRoutes.patch('/:id/status', updateAppointmentStatus);