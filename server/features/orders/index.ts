
import { Router } from 'express';
import { OrderController } from './order-controller';

const router = Router();
const orderController = new OrderController();

// GET all orders
router.get('/', orderController.getAllOrders);

// GET order by ID
router.get('/:id', orderController.getOrderById);

// POST create new order
router.post('/', orderController.createOrder);

// PUT update order
router.put('/:id', orderController.updateOrder);

// DELETE order
router.delete('/:id', orderController.deleteOrder);

// GET orders by status
router.get('/status/:status', orderController.getOrdersByStatus);

export { router as orderRoutes };
