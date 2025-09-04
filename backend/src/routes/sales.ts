import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

// Validation schemas
const saleItemSchema = z.object({
  productId: z.string().min(1),
  stockItemId: z.string().min(1),
  quantity: z.number().min(1),
  price: z.number().min(0),
  total: z.number().min(0)
});

const installmentSchema = z.object({
  number: z.number().min(1),
  amount: z.number().min(0),
  dueDate: z.string()
});

const saleCreateSchema = z.object({
  storeId: z.string().min(1, 'ID da loja é obrigatório'),
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  customerId: z.string().optional(),
  total: z.number().min(0, 'Total deve ser positivo'),
  discount: z.number().min(0).optional(),
  paymentType: z.enum(['CASH', 'CARD', 'PIX', 'INSTALLMENTS', 'FIADO']),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'Deve ter pelo menos um item'),
  installments: z.array(installmentSchema).optional()
});

// GET /api/sales - Listar vendas
router.get('/', async (req: Request, res: Response) => {
  try {
    const { storeId, customerId, paymentType, status, startDate, endDate } = req.query;
    
    const where: any = {};
    if (storeId) where.storeId = storeId as string;
    if (customerId) where.customerId = customerId as string;
    if (paymentType) where.paymentType = paymentType as string;
    if (status) where.status = status as string;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        store: true,
        user: true,
        saleItems: {
          include: {
            product: true,
            stockItem: true
          }
        },
        installments: {
          orderBy: { number: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(sales);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
});

// GET /api/sales/:id - Buscar venda por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        store: true,
        user: true,
        saleItems: {
          include: {
            product: true,
            stockItem: true
          }
        },
        installments: {
          orderBy: { number: 'asc' }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ error: 'Erro ao buscar venda' });
  }
});

// POST /api/sales - Criar venda
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = saleCreateSchema.parse(req.body);
    
    // Start transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create sale
      const sale = await tx.sale.create({
        data: {
          storeId: data.storeId,
          userId: data.userId,
          customerId: data.customerId,
          total: data.total,
          discount: data.discount,
          paymentType: data.paymentType,
          notes: data.notes,
          status: 'COMPLETED'
        }
      });

      // Create sale items and update stock
      for (const item of data.items) {
        // Create sale item
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          }
        });

        // Update stock quantity
        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      // Create installments if payment type is INSTALLMENTS or FIADO
      if (data.installments && data.installments.length > 0) {
        for (const installment of data.installments) {
          await tx.installment.create({
            data: {
              saleId: sale.id,
              customerId: data.customerId!,
              number: installment.number,
              amount: installment.amount,
              dueDate: new Date(installment.dueDate),
              status: 'PENDING'
            }
          });
        }
      }

      return sale;
    });

    // Fetch complete sale data
    const completeSale = await prisma.sale.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        store: true,
        user: true,
        saleItems: {
          include: {
            product: true,
            stockItem: true
          }
        },
        installments: {
          orderBy: { number: 'asc' }
        }
      }
    });

    res.status(201).json(completeSale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('Erro ao criar venda:', error);
    res.status(500).json({ error: 'Erro ao criar venda' });
  }
});

// PUT /api/sales/:id/status - Atualizar status da venda
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'COMPLETED', 'CANCELLED', 'RETURNED'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const sale = await prisma.sale.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        store: true,
        user: true,
        saleItems: {
          include: {
            product: true,
            stockItem: true
          }
        },
        installments: {
          orderBy: { number: 'asc' }
        }
      }
    });

    res.json(sale);
  } catch (error) {
    console.error('Erro ao atualizar status da venda:', error);
    res.status(500).json({ error: 'Erro ao atualizar status da venda' });
  }
});

export default router;
