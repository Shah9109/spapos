import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, location, contactEmail, contactPhone } = req.body;
    const user = (req as any).user;

    const branch = await prisma.branch.create({
      data: {
        spaId: user.spaId,
        name,
        location,
        contactEmail,
        contactPhone,
      },
    });

    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getBranches = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const branches = await prisma.branch.findMany({
      where: { spaId: user.spaId },
      include: {
        _count: {
          select: { users: true, appointments: true, spaInvoices: true },
        },
      },
    });
    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getBranchRevenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const revenue = await prisma.spaInvoice.aggregate({
      where: { spaId: user.spaId, branchId: id, status: 'PAID' },
      _sum: { totalAmount: true },
    });

    res.status(200).json({ success: true, revenue: revenue._sum?.totalAmount || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
