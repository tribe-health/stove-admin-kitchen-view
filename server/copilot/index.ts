
import { Router } from 'express';
import { CopilotController } from './copilot-controller';

const router = Router();
const copilotController = new CopilotController();

// GET all users
router.get('/', copilotController.getCopilot);


export { router as userRoutes };
