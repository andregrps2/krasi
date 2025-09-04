import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

// Validation schemas
const companyCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional()
});

// GET /api/companies - Listar empresas
router.get('/', async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            stores: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(companies);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.status(500).json({ error: 'Erro ao buscar empresas' });
  }
});

// POST /api/companies - Criar empresa
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = companyCreateSchema.parse(req.body);
    
    const company = await prisma.company.create({
      data,
      include: {
        _count: {
          select: {
            stores: true
          }
        }
      }
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors 
      });
    }

    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

export default router;
