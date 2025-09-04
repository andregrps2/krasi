import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/installments - Listar parcelas
router.get('/', async (req, res) => {
  try {
    const { storeId, customerId, status, overdue } = req.query;
    
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (storeId) {
      where.sale = {
        storeId: storeId as string
      };
    }
    
    // Filter overdue installments
    if (overdue === 'true') {
      where.dueDate = {
        lt: new Date()
      };
      where.status = 'PENDING';
    }

    const installments = await prisma.installment.findMany({
      where,
      include: {
        customer: true,
        sale: {
          include: {
            store: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json(installments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar parcelas' });
  }
});

export default router;
