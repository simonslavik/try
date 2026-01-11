import { Router } from 'express';
import { registerUser, loginUser, refreshAccessToken, logoutUser, logoutAllDevices } from '../controllers/userController.js';
import { getProfileById, updateMyProfile, getUserById, listUsers, getUsersByIds } from '../controllers/profileController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { addProfileImage, deleteProfileImage, upload } from '../controllers/profileImageController.js';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, listFriends, listFriendRequests} from '../controllers/friendsController.js';
import { getDirectMessages, sendDirectMessage, getConversations } from '../controllers/directMessagesController.js';
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
userRoutes.get('/profile/:userId', optionalAuthMiddleware, getProfileById);
userRoutes.put('/profile', authMiddleware, updateMyProfile);
userRoutes.post('/profile/image', authMiddleware, upload.single('image'), addProfileImage);
userRoutes.delete('/profile/image', authMiddleware, deleteProfileImage);

// Admin routes (requires authentication)
userRoutes.get('/users', authMiddleware, listUsers);
userRoutes.get('/users/:id', authMiddleware, getUserById);


// Friendship and social features
userRoutes.post('/friends/request', authMiddleware, sendFriendRequest);
userRoutes.post('/friends/accept', authMiddleware, acceptFriendRequest );
userRoutes.post('/friends/reject', authMiddleware, rejectFriendRequest );
userRoutes.delete('/friends/remove', authMiddleware, removeFriend);
userRoutes.get('/friends/list', authMiddleware, listFriends);
userRoutes.get('/friends/requests', authMiddleware, listFriendRequests);

// Direct Messages
userRoutes.get('/messages/conversations', authMiddleware, getConversations);
userRoutes.get('/messages/:otherUserId', authMiddleware, getDirectMessages);
userRoutes.post('/messages', sendDirectMessage); // Allow both auth and internal service calls

export default userRoutes;