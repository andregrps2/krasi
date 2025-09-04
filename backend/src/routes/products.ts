import { Router } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

// Validation schemas
const productCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().default('un')
});

const productUpdateSchema = productCreateSchema.partial();

// GET /api/products - Listar produtos
router.get('/', async (req, res) => {
  try {
    const { search, category, brand, active } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
        { barcode: { contains: search as string } }
      ];
    }
    
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (active !== undefined) where.isActive = active === 'true';

    const products = await prisma.product.findMany({
      where,
      include: {
        stockItems: {
          include: {
            store: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// GET /api/products/:id - Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockItems: {
          include: {
            store: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// POST /api/products - Criar produto
router.post('/', async (req, res) => {
  try {
    const data = productCreateSchema.parse(req.body);
    
    const product = await prisma.product.create({
      data,
      include: {
        stockItems: {
          include: {
            store: true
          }
        }
      }
    });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// PUT /api/products/:id - Atualizar produto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = productUpdateSchema.parse(req.body);
    
    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        stockItems: {
          include: {
            store: true
          }
        }
      }
    });

    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// DELETE /api/products/:id - Deletar produto (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

export default router;
