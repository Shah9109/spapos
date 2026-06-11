import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customerId, therapistId, serviceId, startTime, endTime, notes } = req.body;
    const spaId = req.user?.spaId;

    if (!spaId) return next(new AppError('Spa ID is required', 400));

    const appointment = await prisma.appointment.create({
      data: {
        spaId,
        customerId,
        therapistId,
        serviceId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'SCHEDULED',
        notes,
      },
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const spaId = req.user?.spaId;
    if (!spaId) return next(new AppError('Spa ID is required', 400));

    const { start, end } = req.query; // Optional date filters

    const whereClause: any = { spaId };
    
    if (start && end) {
      whereClause.startTime = {
        gte: new Date(start as string),
        lte: new Date(end as string),
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        therapist: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startTime: 'asc' }
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const spaId = req.user?.spaId;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing || existing.spaId !== spaId) {
      return next(new AppError('Appointment not found', 404));
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};
