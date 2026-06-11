import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { name, type, targetAudience, content, scheduledAt } = req.body;
    const user = (req as any).user;

    const campaign = await prisma.marketingCampaign.create({
      data: {
        spaId: user.spaId,
        name,
        type,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        targetAudience,
        content,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const campaigns = await prisma.marketingCampaign.findMany({
      where: { spaId: user.spaId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
