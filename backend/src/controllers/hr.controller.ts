import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { userId, date, status, checkIn, checkOut } = req.body;
    const user = (req as any).user;

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
      update: { status, checkIn: checkIn ? new Date(checkIn) : null, checkOut: checkOut ? new Date(checkOut) : null },
      create: {
        spaId: user.spaId,
        userId,
        date: new Date(date),
        status,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
      },
    });

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { startDate, endDate } = req.query;

    const attendances = await prisma.attendance.findMany({
      where: {
        spaId: user.spaId,
        date: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        },
      },
      include: { user: { select: { firstName: true, lastName: true, role: true } } },
    });

    res.status(200).json({ success: true, data: attendances });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createPayroll = async (req: Request, res: Response) => {
  try {
    const { userId, month, year, basicSalary, commissions, incentives, deductions, status } = req.body;
    const user = (req as any).user;

    const netSalary = basicSalary + commissions + incentives - deductions;

    const payroll = await prisma.payroll.upsert({
      where: {
        userId_month_year: { userId, month, year },
      },
      update: { basicSalary, commissions, incentives, deductions, netSalary, status },
      create: {
        spaId: user.spaId,
        userId,
        month,
        year,
        basicSalary,
        commissions,
        incentives,
        deductions,
        netSalary,
        status,
      },
    });

    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
