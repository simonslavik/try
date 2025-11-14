import { Router } from 'express';
import { registerUser, loginUser, refreshAccessToken, logoutUser, logoutAllDevices } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const userRoutes = Router();

// Public routes (no authentication required)
userRoutes.post('/auth/register', registerUser);
userRoutes.post('/auth/login', loginUser);
userRoutes.post('/auth/refresh', refreshAccessToken);

// Protected routes (authentication required)
userRoutes.post('/auth/logout', logoutUser);
userRoutes.post('/auth/logout-all', authMiddleware, logoutAllDevices);

export default userRoutes;