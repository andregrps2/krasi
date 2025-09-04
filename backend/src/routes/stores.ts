import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

// Validation schemas
const storeCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().optional().transform(val => val === '' ? undefined : val),
  phone: z.string().optional().transform(val => val === '' ? undefined : val),
  email: z.string().email().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  companyId: z.string().min(1, 'ID da empresa é obrigatório')
});

const storeUpdateSchema = storeCreateSchema.partial().omit({ companyId: true });

// GET /api/stores - Listar lojas
router.get('/', async (req: Request, res: Response) => {
  try {
    const { active } = req.query;
    
    const where: any = {};
    if (active !== undefined) where.isActive = active === 'true';

    const stores = await prisma.store.findMany({
      where,
      include: {
        company: true,
        _count: {
          select: {
            stockItems: true,
            customers: true,
            sales: true,
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(stores);
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    res.status(500).json({ error: 'Erro ao buscar lojas' });
  }
});

// GET /api/stores/:id - Buscar loja por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        company: true,
        stockItems: {
          include: {
            product: true
          }
        },
        customers: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        },
        sales: {
          include: {
            customer: true,
            saleItems: {
              include: {
                product: true
              }
            },
            installments: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Últimas 10 vendas
        },
        _count: {
          select: {
            stockItems: true,
            customers: true,
            sales: true,
            users: true
          }
        }
      }
    });

    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    res.json(store);
  } catch (error) {
    console.error('Erro ao buscar loja:', error);
    res.status(500).json({ error: 'Erro ao buscar loja' });
  }
});

// GET /api/stores/:id/dashboard - Dashboard da loja
router.get('/:id/dashboard', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vendas de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Vendas do mês
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      salesToday,
      salesMonth,
      lowStockItems,
      pendingInstallments,
      customersCount,
      topProducts
    ] = await Promise.all([
      // Vendas de hoje
      prisma.sale.aggregate({
        where: {
          storeId: id,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        _sum: { total: true },
        _count: true
      }),
      
      // Vendas do mês
      prisma.sale.aggregate({
        where: {
          storeId: id,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: { total: true },
        _count: true
      }),
      
      // Produtos com estoque baixo
      prisma.stockItem.findMany({
        where: {
          storeId: id,
          isActive: true
        },
        include: {
          product: true
        }
      }).then((items: any) => items.filter((item: any) => item.quantity <= item.minQuantity)),
      
      // Parcelas pendentes
      prisma.installment.findMany({
        where: {
          sale: { storeId: id },
          status: 'PENDING',
          dueDate: { lte: new Date() }
        },
        include: {
          customer: true,
          sale: true
        }
      }),
      
      // Total de clientes
      prisma.customer.count({
        where: {
          storeId: id,
          isActive: true
        }
      }),
      
      // Produtos mais vendidos
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: {
            storeId: id,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        },
        _sum: {
          quantity: true,
          total: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      }).then(async (items: any) => {
        const productIds = items.map((item: any) => item.productId);
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } }
        });
        
        return items.map((item: any) => {
          const product = products.find((p: any) => p.id === item.productId);
          return {
            product,
            quantity: item._sum.quantity,
            total: item._sum.total
          };
        });
      })
    ]);

    const dashboard = {
      salestoday: {
        total: salesToday._sum.total || 0,
        count: salesToday._count
      },
      salesMonth: {
        total: salesMonth._sum.total || 0,
        count: salesMonth._count
      },
      lowStockItems,
      pendingInstallments,
      customersCount,
      topProducts
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Erro ao buscar dashboard da loja:', error);
    res.status(500).json({ error: 'Erro ao buscar dashboard da loja' });
  }
});

// POST /api/stores - Criar loja
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = storeCreateSchema.parse(req.body);
    
    const store = await prisma.store.create({
      data,
      include: {
        company: true,
        _count: {
          select: {
            stockItems: true,
            customers: true,
            sales: true,
            users: true
          }
        }
      }
    });

    res.status(201).json(store);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('Erro ao criar loja:', error);
    res.status(500).json({ error: 'Erro ao criar loja' });
  }
});

// PUT /api/stores/:id - Atualizar loja
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = storeUpdateSchema.parse(req.body);
    
    const store = await prisma.store.update({
      where: { id },
      data,
      include: {
        company: true,
        _count: {
          select: {
            stockItems: true,
            customers: true,
            sales: true,
            users: true
          }
        }
      }
    });

    res.json(store);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('Erro ao atualizar loja:', error);
    res.status(500).json({ error: 'Erro ao atualizar loja' });
  }
});

// DELETE /api/stores/:id - Deletar loja (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.store.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar loja:', error);
    res.status(500).json({ error: 'Erro ao deletar loja' });
  }
});

export default router;
