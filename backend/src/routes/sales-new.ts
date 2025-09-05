import { Router } from 'express';
import { SaleController } from '../controllers';

const router = Router();
const saleController = new SaleController();

// GET /api/sales - Listar vendas
router.get('/', (req, res) => saleController.getAll(req, res));

// GET /api/sales/report - Relatório de vendas
router.get('/report', (req, res) => saleController.getReport(req, res));

// GET /api/sales/:id - Buscar venda por ID
router.get('/:id', (req, res) => saleController.getById(req, res));

// POST /api/sales - Criar venda
router.post('/', (req, res) => saleController.create(req, res));

// PATCH /api/sales/:id/cancel - Cancelar venda
router.patch('/:id/cancel', (req, res) => saleController.cancel(req, res));

export default router;
