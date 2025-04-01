
import { Router } from 'express';
import { DeliveryLocationController } from './delivery-location-controller';

const router = Router();
const deliveryLocationController = new DeliveryLocationController();

// GET all delivery locations
router.get('/', deliveryLocationController.getAllDeliveryLocations);

// GET delivery location by ID
router.get('/:id', deliveryLocationController.getDeliveryLocationById);

// POST create new delivery location
router.post('/', deliveryLocationController.createDeliveryLocation);

// PUT update delivery location
router.put('/:id', deliveryLocationController.updateDeliveryLocation);

// DELETE delivery location
router.delete('/:id', deliveryLocationController.deleteDeliveryLocation);

export { router as deliveryLocationRoutes };
