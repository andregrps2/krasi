import { Router } from 'express';
import { CustomerController } from '../controllers';

const router = Router();
const customerController = new CustomerController();

// GET /api/customers - Listar clientes
router.get('/', (req, res) => customerController.getAll(req, res));

// GET /api/customers/search - Buscar clientes
router.get('/search', (req, res) => customerController.search(req, res));

// GET /api/customers/:id - Buscar cliente por ID
router.get('/:id', (req, res) => customerController.getById(req, res));

// GET /api/customers/:id/balance - Buscar saldo do cliente
router.get('/:id/balance', (req, res) => customerController.getBalance(req, res));

// POST /api/customers - Criar cliente
router.post('/', (req, res) => customerController.create(req, res));

// PUT /api/customers/:id - Atualizar cliente
router.put('/:id', (req, res) => customerController.update(req, res));

// DELETE /api/customers/:id - Deletar cliente
router.delete('/:id', (req, res) => customerController.delete(req, res));

export default router;
