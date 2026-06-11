import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, phone, tags, notes } = req.body;
    const spaId = req.user?.spaId;

    if (!spaId) return next(new AppError('Spa ID is required', 400));

    const customer = await prisma.customer.create({
      data: {
        spaId,
        firstName,
        lastName,
        email,
        phone,
        tags: tags || [],
        notes,
      },
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const spaId = req.user?.spaId;
    if (!spaId) return next(new AppError('Spa ID is required', 400));

    const customers = await prisma.customer.findMany({
      where: { spaId },
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: true,
      }
    });

    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const spaId = req.user?.spaId;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        memberships: true,
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 10,
          include: { therapist: { select: { firstName: true, lastName: true } } }
        }
      }
    });

    if (!customer || customer.spaId !== spaId) {
      return next(new AppError('Customer not found', 404));
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};
