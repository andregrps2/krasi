import { Router } from 'express';
import { StockController } from '../controllers';

const router = Router();
const stockController = new StockController();

// GET /api/stock - Listar itens de estoque
router.get('/', (req, res) => stockController.getAll(req, res));

// GET /api/stock/search - Buscar itens de estoque
router.get('/search', (req, res) => stockController.search(req, res));

// GET /api/stock/low-stock - Itens com estoque baixo
router.get('/low-stock', (req, res) => stockController.getLowStock(req, res));

// GET /api/stock/report - Relatório de estoque
router.get('/report', (req, res) => stockController.getReport(req, res));

// GET /api/stock/:id - Buscar item de estoque por ID
router.get('/:id', (req, res) => stockController.getById(req, res));

// GET /api/stock/product/:productId/store/:storeId - Buscar por produto e loja
router.get('/product/:productId/store/:storeId', (req, res) => stockController.getByProductAndStore(req, res));

// POST /api/stock - Criar item de estoque
router.post('/', (req, res) => stockController.create(req, res));

// PUT /api/stock/:id - Atualizar item de estoque
router.put('/:id', (req, res) => stockController.update(req, res));

// PATCH /api/stock/:id/quantity - Atualizar quantidade
router.patch('/:id/quantity', (req, res) => stockController.updateQuantity(req, res));

// DELETE /api/stock/:id - Deletar item de estoque
router.delete('/:id', (req, res) => stockController.delete(req, res));

export default router;
