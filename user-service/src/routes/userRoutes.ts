import { Router } from 'express';
import { registerUser, loginUser, refreshAccessToken, logoutUser, logoutAllDevices } from '../controllers/userController.js';
import { getMyProfile, updateMyProfile, getUserById, listUsers } from '../controllers/profileController.js';
import { authMiddleware, trustGatewayAuth, requireRole } from '../middleware/authMiddleware.js';

const userRoutes = Router();

// Public routes (no authentication required)
userRoutes.post('/auth/register', registerUser);
userRoutes.post('/auth/login', loginUser);
userRoutes.post('/auth/refresh', refreshAccessToken);

// Protected routes (authentication required)
// Use trustGatewayAuth when behind gateway, falls back to authMiddleware for direct calls
userRoutes.post('/auth/logout', trustGatewayAuth, logoutUser);
userRoutes.post('/auth/logout-all', trustGatewayAuth, logoutAllDevices);

// User profile routes (requires authentication)
userRoutes.get('/profile', trustGatewayAuth, getMyProfile);
userRoutes.put('/profile', trustGatewayAuth, updateMyProfile);

// Admin routes (requires authentication + ADMIN role)
userRoutes.get('/users', trustGatewayAuth, requireRole(['ADMIN']), listUsers);
userRoutes.get('/users/:id', trustGatewayAuth, requireRole(['ADMIN']), getUserById);

export default userRoutes;