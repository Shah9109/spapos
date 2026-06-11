import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, phone, role, password } = req.body;
    const spaId = req.user?.spaId;

    if (!spaId) return next(new AppError('Spa ID is required', 400));

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return next(new AppError('Email already in use', 400));

    const passwordHash = await bcrypt.hash(password, 12);

    const staff = await prisma.user.create({
      data: {
        spaId,
        firstName,
        lastName,
        email,
        phone,
        role, // e.g., 'THERAPIST', 'MANAGER', 'RECEPTIONIST'
        passwordHash,
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, role: true, isActive: true
      }
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const getStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const spaId = req.user?.spaId;
    if (!spaId) return next(new AppError('Spa ID is required', 400));

    const staff = await prisma.user.findMany({
      where: { 
        spaId,
        role: { not: 'SUPER_ADMIN' }
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isActive: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};
