import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';

export const createSpa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, subdomain, address } = req.body;

    const existingSpa = await prisma.spa.findFirst({
      where: { OR: [{ email }, { subdomain }] }
    });

    if (existingSpa) {
      return next(new AppError('Spa with this email or subdomain already exists', 400));
    }

    const spa = await prisma.spa.create({
      data: {
        name,
        email,
        phone,
        subdomain,
        address,
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, data: spa });
  } catch (error) {
    next(error);
  }
};

export const getSpas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spas = await prisma.spa.findMany({
      include: {
        subscription: {
          include: { plan: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: spas });
  } catch (error) {
    next(error);
  }
};

export const getSpaById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const spa = await prisma.spa.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        users: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        licenses: true,
      }
    });

    if (!spa) {
      return next(new AppError('Spa not found', 404));
    }

    res.status(200).json({ success: true, data: spa });
  } catch (error) {
    next(error);
  }
};

export const updateSpaStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // ACTIVE, SUSPENDED, BLOCKED, PENDING

    const spa = await prisma.spa.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({ success: true, data: spa });
  } catch (error) {
    next(error);
  }
};
