import { Router } from 'express';
import { ProductController } from '../controllers';

const router = Router();
const productController = new ProductController();

// GET /api/products - Listar produtos
router.get('/', (req, res) => productController.getAll(req, res));

// GET /api/products/search - Buscar produtos
router.get('/search', (req, res) => productController.search(req, res));

// GET /api/products/barcode/:barcode - Buscar produto por código de barras
router.get('/barcode/:barcode', (req, res) => productController.getByBarcode(req, res));

// GET /api/products/:id - Buscar produto por ID
router.get('/:id', (req, res) => productController.getById(req, res));

// POST /api/products - Criar produto
router.post('/', (req, res) => productController.create(req, res));

// PUT /api/products/:id - Atualizar produto
router.put('/:id', (req, res) => productController.update(req, res));

// DELETE /api/products/:id - Deletar produto
router.delete('/:id', (req, res) => productController.delete(req, res));

export default router;
