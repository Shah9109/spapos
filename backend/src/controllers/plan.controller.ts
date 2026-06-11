import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';

export const createPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, monthlyPrice, yearlyPrice, features } = req.body;

    const plan = await prisma.plan.create({
      data: {
        name,
        type,
        monthlyPrice,
        yearlyPrice,
        features,
      },
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const getPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { monthlyPrice: 'asc' }
    });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Optional: Check if there are active subscriptions before deleting
    const subsCount = await prisma.subscription.count({ where: { planId: id } });
    if (subsCount > 0) {
      return next(new AppError('Cannot delete plan with active subscriptions', 400));
    }

    await prisma.plan.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    next(error);
  }
};
