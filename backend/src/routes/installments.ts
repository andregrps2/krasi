import { Router } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

// Validation schema
const installmentCreateSchema = z.object({
  saleId: z.string().min(1, 'ID da venda é obrigatório'),
  customerId: z.string().min(1, 'ID do cliente é obrigatório'),
  number: z.number().min(1, 'Número da parcela deve ser positivo'),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  dueDate: z.string().or(z.date()),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).default('PENDING'),
  paidDate: z.string().or(z.date()).optional(),
  notes: z.string().optional()
});

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

// POST /api/installments - Criar parcela
router.post('/', async (req, res) => {
  try {
    console.log('📥 [INSTALLMENTS] Dados recebidos:', req.body);
    
    const data = installmentCreateSchema.parse(req.body);
    console.log('✅ [INSTALLMENTS] Dados validados:', data);

    // Verificar se já existe uma parcela com o mesmo saleId e number
    const existingInstallment = await prisma.installment.findFirst({
      where: {
        saleId: data.saleId,
        number: data.number
      }
    });

    if (existingInstallment) {
      console.warn('⚠️ [INSTALLMENTS] Parcela duplicada detectada:', {
        saleId: data.saleId,
        number: data.number,
        existingId: existingInstallment.id
      });
      
      // Retornar a parcela existente em vez de criar uma nova
      const installmentWithRelations = await prisma.installment.findUnique({
        where: { id: existingInstallment.id },
        include: {
          customer: true,
          sale: {
            include: {
              store: true
            }
          }
        }
      });
      
      return res.status(200).json(installmentWithRelations);
    }

    const installment = await prisma.installment.create({
      data: {
        saleId: data.saleId,
        customerId: data.customerId,
        number: data.number,
        amount: data.amount,
        dueDate: typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate,
        status: data.status,
        paidDate: data.paidDate ? (typeof data.paidDate === 'string' ? new Date(data.paidDate) : data.paidDate) : null,
        notes: data.notes
      },
      include: {
        customer: true,
        sale: {
          include: {
            store: true
          }
        }
      }
    });

    console.log('✅ [INSTALLMENTS] Parcela criada com sucesso:', installment.id);
    res.status(201).json(installment);
  } catch (error) {
    console.error('❌ [INSTALLMENTS] Erro ao criar parcela:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Erro ao criar parcela' });
  }
});

export default router;
