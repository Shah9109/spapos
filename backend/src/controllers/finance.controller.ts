import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const createExpenseCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const user = (req as any).user;

    const category = await prisma.expenseCategory.create({
      data: { spaId: user.spaId, name },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getExpenseCategories = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const categories = await prisma.expenseCategory.findMany({
      where: { spaId: user.spaId },
    });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { categoryId, amount, description, expenseDate, paymentMethod } = req.body;
    const user = (req as any).user;

    const expense = await prisma.expense.create({
      data: {
        spaId: user.spaId,
        categoryId,
        amount,
        description,
        expenseDate: new Date(expenseDate),
        paymentMethod,
      },
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getFinanceReport = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { startDate, endDate } = req.query;

    const dateFilter = {
      gte: startDate ? new Date(startDate as string) : undefined,
      lte: endDate ? new Date(endDate as string) : undefined,
    };

    const income = await prisma.spaInvoice.aggregate({
      where: { spaId: user.spaId, status: 'PAID', createdAt: dateFilter },
      _sum: { totalAmount: true },
    });

    const expenses = await prisma.expense.aggregate({
      where: { spaId: user.spaId, expenseDate: dateFilter },
      _sum: { amount: true },
    });

    res.status(200).json({
      success: true,
      data: {
        totalIncome: income._sum.totalAmount || 0,
        totalExpenses: expenses._sum.amount || 0,
        profit: Number(income._sum.totalAmount || 0) - Number(expenses._sum.amount || 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
