import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

// Validation schemas
const customerCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  storeId: z.string().min(1, 'ID da loja é obrigatório')
});

const customerUpdateSchema = customerCreateSchema.partial().omit({ storeId: true });

// GET /api/customers - Listar clientes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { storeId, search } = req.query;
    
    const where: any = {};
    if (storeId) where.storeId = storeId as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { cpf: { contains: search as string } },
        { phone: { contains: search as string } },
        { email: { contains: search as string } }
      ];
    }
    
    const customers = await prisma.customer.findMany({
      where,
      include: {
        store: true,
        _count: {
          select: {
            sales: true,
            installments: {
              where: { status: 'PENDING' }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(customers);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// GET /api/customers/:id - Buscar cliente por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        store: true,
        sales: {
          include: {
            installments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        installments: {
          where: { status: 'PENDING' },
          include: {
            sale: true
          },
          orderBy: { dueDate: 'asc' }
        },
        _count: {
          select: {
            sales: true,
            installments: {
              where: { status: 'PENDING' }
            }
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

// POST /api/customers - Criar cliente
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = customerCreateSchema.parse(req.body);
    
    // Convert birthDate string to Date if provided
    const customerData: any = { ...data };
    if (data.birthDate) {
      customerData.birthDate = new Date(data.birthDate);
    }
    
    const customer = await prisma.customer.create({
      data: customerData,
      include: {
        store: true,
        _count: {
          select: {
            sales: true,
            installments: {
              where: { status: 'PENDING' }
            }
          }
        }
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// PUT /api/customers/:id - Atualizar cliente
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = customerUpdateSchema.parse(req.body);
    
    // Convert birthDate string to Date if provided
    const customerData: any = { ...data };
    if (data.birthDate) {
      customerData.birthDate = new Date(data.birthDate);
    }
    
    const customer = await prisma.customer.update({
      where: { id },
      data: customerData,
      include: {
        store: true,
        _count: {
          select: {
            sales: true,
            installments: {
              where: { status: 'PENDING' }
            }
          }
        }
      }
    });

    res.json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// DELETE /api/customers/:id - Deletar cliente (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.customer.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

export default router;
