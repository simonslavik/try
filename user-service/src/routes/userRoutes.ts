import { Router } from 'express';
import { registerUser, loginUser, refreshAccessToken, logoutUser, logoutAllDevices } from '../controllers/userController.js';
import { getProfileById, updateMyProfile, getUserById, listUsers, getUsersByIds } from '../controllers/profileController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { addProfileImage, deleteProfileImage, upload } from '../controllers/profileImageController.js';

const userRoutes = Router();

// Public routes (no authentication required)
userRoutes.post('/auth/register', registerUser);
userRoutes.post('/auth/login', loginUser);
userRoutes.post('/auth/refresh', refreshAccessToken);

// Batch endpoint for fetching multiple users (used by other services)
userRoutes.post('/users/batch', getUsersByIds);

// Protected routes (authentication required)
// Use trustGatewayAuth when behind gateway, falls back to authMiddleware for direct calls
userRoutes.post('/auth/logout', authMiddleware, logoutUser);
userRoutes.post('/auth/logout-all', authMiddleware, logoutAllDevices);

// User profile routes (requires authentication)
userRoutes.get('/profile/:userId', getProfileById);
userRoutes.put('/profile', authMiddleware, updateMyProfile);
userRoutes.post('/profile/image', authMiddleware, upload.single('image'), addProfileImage);
userRoutes.delete('/profile/image', authMiddleware, deleteProfileImage);

// Admin routes (requires authentication)
userRoutes.get('/users', authMiddleware, listUsers);
userRoutes.get('/users/:id', authMiddleware, getUserById);

export default userRoutes;