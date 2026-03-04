import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// User-facing endpoints (require auth via gateway headers)
router.get('/', authMiddleware, validate(schemas.getNotifications, 'query'), NotificationController.getNotifications);
router.get('/unread-count', authMiddleware, NotificationController.getUnreadCount);
router.get('/preferences', authMiddleware, NotificationController.getPreferences);
router.put('/preferences', authMiddleware, validate(schemas.updatePreferences), NotificationController.updatePreferences);
router.patch('/read-all', authMiddleware, NotificationController.markAllRead);
router.patch('/:id/read', authMiddleware, validate(schemas.notificationId, 'params'), NotificationController.markRead);
router.delete('/:id', authMiddleware, validate(schemas.notificationId, 'params'), NotificationController.dismiss);

// Internal endpoint — called by collab-editor (service-to-service, no user auth)
router.post('/internal/meeting', validate(schemas.meetingEvent), NotificationController.handleMeetingEvent);

export default router;
