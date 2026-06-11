import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createService = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { spaId } = req.user!;
    if (!spaId) return next(new AppError('Unauthorized', 401));

    const { name, categoryId, duration, price } = req.body;

    const service = await prisma.service.create({
      data: {
        spaId,
        name,
        categoryId,
        duration,
        price
      }
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const getServices = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { spaId } = req.user!;
    if (!spaId) return next(new AppError('Unauthorized', 401));

    const services = await prisma.service.findMany({
      where: { spaId },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};
