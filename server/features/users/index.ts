
import { Router } from 'express';
import { UserController } from './user-controller';

const router = Router();
const userController = new UserController();

// GET all users
router.get('/', userController.getAllUsers);

// GET user by ID
router.get('/:id', userController.getUserById);

// POST create new user
router.post('/', userController.createUser);

// PUT update user
router.put('/:id', userController.updateUser);

// DELETE user
router.delete('/:id', userController.deleteUser);

export { router as userRoutes };
