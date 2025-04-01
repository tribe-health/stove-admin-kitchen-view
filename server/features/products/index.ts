
import { Router } from 'express';
import { ProductController } from './product-controller';

const router = Router();
const productController = new ProductController();

// GET all products
router.get('/', productController.getAllProducts);

// GET product by ID
router.get('/:id', productController.getProductById);

// POST create new product
router.post('/', productController.createProduct);

// PUT update product
router.put('/:id', productController.updateProduct);

// DELETE product
router.delete('/:id', productController.deleteProduct);

// GET products by type
router.get('/type/:type', productController.getProductsByType);

export { router as productRoutes };
