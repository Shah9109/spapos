import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { spaId } = req.user!;
    const { customerId, items, discount, taxAmount, paymentMethod, status } = req.body;

    if (!spaId) return next(new AppError('Unauthorized', 401));

    // Calculate totals
    let subtotal = 0;
    const formattedItems = items.map((item: any) => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      return {
        itemType: item.itemType,
        productId: item.productId,
        serviceId: item.serviceId,
        comboId: item.comboId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      };
    });

    const totalAmount = subtotal - (discount || 0) + (taxAmount || 0);

    // Generate invoice number
    const count = await prisma.spaInvoice.count({ where: { spaId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const invoice = await prisma.spaInvoice.create({
      data: {
        spaId,
        customerId,
        invoiceNumber,
        subtotal,
        discount: discount || 0,
        taxAmount: taxAmount || 0,
        totalAmount,
        status: status || 'PENDING',
        paymentMethod,
        items: {
          create: formattedItems
        }
      },
      include: {
        items: true,
        customer: true
      }
    });

    if (status === 'PAID' && paymentMethod) {
      await prisma.spaPayment.create({
        data: {
          spaInvoiceId: invoice.id,
          amount: totalAmount,
          method: paymentMethod,
          status: 'SUCCESS'
        }
      });
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { spaId } = req.user!;
    if (!spaId) return next(new AppError('Unauthorized', 401));

    const invoices = await prisma.spaInvoice.findMany({
      where: { spaId },
      include: {
        customer: true,
        items: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { spaId } = req.user!;
    const { id } = req.params;

    if (!spaId) return next(new AppError('Unauthorized', 401));

    const invoice = await prisma.spaInvoice.findFirst({
      where: { id, spaId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            service: true,
            combo: true
          }
        },
        payments: true
      }
    });

    if (!invoice) return next(new AppError('Invoice not found', 404));

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};
