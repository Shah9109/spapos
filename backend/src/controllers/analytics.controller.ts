import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalSpas = await prisma.spa.count();
    const activeSpas = await prisma.spa.count({ where: { status: 'ACTIVE' } });
    const suspendedSpas = await prisma.spa.count({ where: { status: 'SUSPENDED' } });
    
    // Revenue calculations
    const payments = await prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      select: { amount: true, paymentDate: true }
    });

    const totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    
    // Monthly Revenue (Current Month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyRevenue = payments
      .filter((p: any) => {
        const date = new Date(p.paymentDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const recentSpas = await prisma.spa.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true, createdAt: true }
    });

    res.status(200).json({
      success: true,
      data: {
        totalSpas,
        activeSpas,
        suspendedSpas,
        totalRevenue,
        monthlyRevenue,
        recentSpas
      }
    });
  } catch (error) {
    next(error);
  }
};
