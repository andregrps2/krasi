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
  dueDate: z.string(),
  isDownPayment: z.boolean().optional(),
  isPaid: z.boolean().optional()
});

const saleCreateSchema = z.object({
  storeId: z.string().min(1, 'ID da loja é obrigatório'),
  userId: z.string().optional(),
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
    console.log('📥 [SALES] Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    const data = saleCreateSchema.parse(req.body);
    console.log('✅ [SALES] Validação do schema passou');
    
    // Start transaction
    const result = await prisma.$transaction(async (tx: any) => {
      console.log('🔄 [SALES] Iniciando transação');
      
      // Create sale
      const saleData: any = {
        storeId: data.storeId,
        customerId: data.customerId,
        total: data.total,
        discount: data.discount,
        paymentType: data.paymentType,
        notes: data.notes,
        status: 'COMPLETED'
      };

      // Only include userId if it exists
      if (data.userId) {
        saleData.userId = data.userId;
      }

      console.log('💾 [SALES] Criando venda com dados:', JSON.stringify(saleData, null, 2));
      const sale = await tx.sale.create({
        data: saleData
      });
      console.log('✅ [SALES] Venda criada com ID:', sale.id);

      // Create sale items and update stock
      console.log('📦 [SALES] Processando', data.items.length, 'itens');
      for (const [index, item] of data.items.entries()) {
        console.log(`📦 [SALES] Processando item ${index + 1}:`, JSON.stringify(item, null, 2));
        
        // Verify if product exists
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        
        if (!product) {
          throw new Error(`Produto com ID ${item.productId} não encontrado`);
        }
        console.log('✅ [SALES] Produto encontrado:', product.name);
        
        // Verify if stock item exists
        const stockItem = await tx.stockItem.findUnique({
          where: { id: item.stockItemId }
        });
        
        if (!stockItem) {
          throw new Error(`Item de estoque com ID ${item.stockItemId} não encontrado`);
        }
        console.log('✅ [SALES] Item de estoque encontrado, quantidade atual:', stockItem.quantity);
        
        if (stockItem.quantity < item.quantity) {
          throw new Error(`Quantidade insuficiente em estoque. Disponível: ${stockItem.quantity}, Solicitado: ${item.quantity}`);
        }
        
        // Create sale item
        console.log('💾 [SALES] Criando item da venda');
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
        console.log('📉 [SALES] Atualizando estoque, decrementando', item.quantity);
        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
        console.log('✅ [SALES] Item processado com sucesso');
      }

      // Create installments if payment type is INSTALLMENTS or FIADO
      if (data.installments && data.installments.length > 0) {
        console.log('💳 [SALES] Processando', data.installments.length, 'parcelas');
        for (const [index, installment] of data.installments.entries()) {
          console.log(`💳 [SALES] Processando parcela ${index + 1}:`, JSON.stringify(installment, null, 2));
          
          // Determine status based on isPaid field
          const status = installment.isPaid ? 'PAID' : 'PENDING';
          const paidDate = installment.isPaid ? new Date() : undefined;
          
          await tx.installment.create({
            data: {
              saleId: sale.id,
              customerId: data.customerId!,
              number: installment.number,
              amount: installment.amount,
              dueDate: new Date(installment.dueDate),
              status: status,
              paidDate: paidDate
            }
          });
          console.log('✅ [SALES] Parcela criada com status:', status);
        }
      }

      console.log('✅ [SALES] Transação concluída com sucesso');
      return sale;
    });

    // Fetch complete sale data
    console.log('📊 [SALES] Buscando dados completos da venda');
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

    console.log('🎉 [SALES] Venda finalizada com sucesso:', result.id);
    res.status(201).json(completeSale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [SALES] Erro de validação:', error.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('💥 [SALES] Erro ao criar venda:', error);
    res.status(500).json({ error: 'Erro ao criar venda', details: error instanceof Error ? error.message : 'Erro desconhecido' });
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
