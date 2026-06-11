import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;
    const user = (req as any).user;

    const supplier = await prisma.supplier.create({
      data: {
        spaId: user.spaId,
        name,
        contactPerson,
        email,
        phone,
        address,
      },
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const suppliers = await prisma.supplier.findMany({
      where: { spaId: user.spaId },
    });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { supplierId, items } = req.body; // items: { productId, quantity, unitPrice }[]
    const user = (req as any).user;

    const orderNumber = `PO-${Date.now()}`;
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        spaId: user.spaId,
        supplierId,
        orderNumber,
        status: 'PENDING',
        totalAmount,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json({ success: true, data: po });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { productId, type, quantity, reason } = req.body;
    const user = (req as any).user;

    const product = await prisma.product.findFirst({ where: { id: productId, spaId: user.spaId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newStock = type === 'ADD' ? product.stockQuantity + quantity : product.stockQuantity - quantity;

    await prisma.$transaction([
      prisma.stockAdjustment.create({
        data: {
          spaId: user.spaId,
          productId,
          type,
          quantity,
          reason,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      }),
    ]);

    res.status(200).json({ success: true, message: 'Stock adjusted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
