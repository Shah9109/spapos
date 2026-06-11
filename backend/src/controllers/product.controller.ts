import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { spaId } = req.user!;
    if (!spaId) return next(new AppError('Unauthorized', 401));

    const { name, categoryId, sku, barcode, description, price, stockQuantity } = req.body;

    const product = await prisma.product.create({
      data: {
        spaId,
        name,
        categoryId,
        sku,
        barcode,
        description,
        price,
        stockQuantity: stockQuantity || 0
      }
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { spaId } = req.user!;
    if (!spaId) return next(new AppError('Unauthorized', 401));

    const products = await prisma.product.findMany({
      where: { spaId },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};
