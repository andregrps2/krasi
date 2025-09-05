import { Router } from 'express';
import { InstallmentController } from '../controllers';

const router = Router();
const installmentController = new InstallmentController();

// GET /api/installments - Listar parcelas
router.get('/', (req, res) => installmentController.getAll(req, res));

// GET /api/installments/overdue - Parcelas em atraso
router.get('/overdue', (req, res) => installmentController.getOverdue(req, res));

// GET /api/installments/report - Relatório de parcelas
router.get('/report', (req, res) => installmentController.getReport(req, res));

// GET /api/installments/:id - Buscar parcela por ID
router.get('/:id', (req, res) => installmentController.getById(req, res));

// GET /api/installments/customer/:customerId - Parcelas do cliente
router.get('/customer/:customerId', (req, res) => installmentController.getByCustomer(req, res));

// POST /api/installments - Criar parcela
router.post('/', (req, res) => installmentController.create(req, res));

// PUT /api/installments/:id - Atualizar parcela
router.put('/:id', (req, res) => installmentController.update(req, res));

// PATCH /api/installments/:id/pay - Pagar parcela
router.patch('/:id/pay', (req, res) => installmentController.pay(req, res));

// PATCH /api/installments/:id/cancel - Cancelar parcela
router.patch('/:id/cancel', (req, res) => installmentController.cancel(req, res));

// PATCH /api/installments/update-overdue - Atualizar status de parcelas em atraso
router.patch('/update-overdue', (req, res) => installmentController.updateOverdue(req, res));

export default router;
