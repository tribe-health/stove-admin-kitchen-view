
import { Router } from 'express';
import { StationController } from './station-controller';

const router = Router();
const stationController = new StationController();

// GET all stations
router.get('/', stationController.getAllStations);

// GET station by ID
router.get('/:id', stationController.getStationById);

// POST create new station
router.post('/', stationController.createStation);

// PUT update station
router.put('/:id', stationController.updateStation);

// DELETE station
router.delete('/:id', stationController.deleteStation);

export { router as stationRoutes };
