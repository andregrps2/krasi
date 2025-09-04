import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

// Validation schemas
const stockItemCreateSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  storeId: z.string().min(1, 'ID da loja é obrigatório'),
  quantity: z.number().min(0, 'Quantidade deve ser positiva'),
  minQuantity: z.number().min(0, 'Quantidade mínima deve ser positiva'),
  maxQuantity: z.number().min(0).optional(),
  purchasePrice: z.number().min(0, 'Preço de compra deve ser positivo'),
  salePrice: z.number().min(0, 'Preço de venda deve ser positivo')
});

const stockItemUpdateSchema = stockItemCreateSchema.partial().omit({ productId: true, storeId: true });

// GET /api/stock - Listar itens de estoque
router.get('/', async (req: Request, res: Response) => {
  try {
    const { storeId, productId, lowStock } = req.query;
    
    const where: any = {};
    if (storeId) where.storeId = storeId as string;
    if (productId) where.productId = productId as string;
    
    const stockItems = await prisma.stockItem.findMany({
      where,
      include: {
        product: true,
        store: true
      },
      orderBy: { product: { name: 'asc' } }
    });

    // Filter for low stock if requested
    const filteredItems = lowStock === 'true' 
      ? stockItems.filter((item: any) => item.quantity <= item.minQuantity)
      : stockItems;

    res.json(filteredItems);
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar estoque' });
  }
});

// GET /api/stock/:id - Buscar item de estoque por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const stockItem = await prisma.stockItem.findUnique({
      where: { id },
      include: {
        product: true,
        store: true
      }
    });

    if (!stockItem) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }

    res.json(stockItem);
  } catch (error) {
    console.error('Erro ao buscar item de estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar item de estoque' });
  }
});

// POST /api/stock - Criar item de estoque
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = stockItemCreateSchema.parse(req.body);
    
    // Check if stock item already exists for this product in this store
    const existingStock = await prisma.stockItem.findUnique({
      where: {
        productId_storeId: {
          productId: data.productId,
          storeId: data.storeId
        }
      }
    });

    if (existingStock) {
      return res.status(400).json({ error: 'Item de estoque já existe para este produto nesta loja' });
    }

    const stockItem = await prisma.stockItem.create({
      data,
      include: {
        product: true,
        store: true
      }
    });

    res.status(201).json(stockItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('Erro ao criar item de estoque:', error);
    res.status(500).json({ error: 'Erro ao criar item de estoque' });
  }
});

// PUT /api/stock/:id - Atualizar item de estoque
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = stockItemUpdateSchema.parse(req.body);
    
    const stockItem = await prisma.stockItem.update({
      where: { id },
      data,
      include: {
        product: true,
        store: true
      }
    });

    res.json(stockItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('Erro ao atualizar item de estoque:', error);
    res.status(500).json({ error: 'Erro ao atualizar item de estoque' });
  }
});

// PATCH /api/stock/:id/quantity - Atualizar quantidade do estoque
router.patch('/:id/quantity', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    if (!quantity || typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Quantidade deve ser um número válido' });
    }

    const stockItem = await prisma.stockItem.findUnique({ where: { id } });
    if (!stockItem) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }

    let newQuantity: number;
    
    switch (operation) {
      case 'add':
        newQuantity = stockItem.quantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, stockItem.quantity - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        break;
      default:
        return res.status(400).json({ error: 'Operação inválida. Use: add, subtract ou set' });
    }

    const updatedStockItem = await prisma.stockItem.update({
      where: { id },
      data: { quantity: newQuantity },
      include: {
        product: true,
        store: true
      }
    });

    res.json(updatedStockItem);
  } catch (error) {
    console.error('Erro ao atualizar quantidade do estoque:', error);
    res.status(500).json({ error: 'Erro ao atualizar quantidade do estoque' });
  }
});

// DELETE /api/stock/:id - Deletar item de estoque (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.stockItem.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar item de estoque:', error);
    res.status(500).json({ error: 'Erro ao deletar item de estoque' });
  }
});

export default router;
