import { Request, Response, NextFunction } from 'express';

// Mock dependencies
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../../src/services/notification.service', () => ({
  NotificationService: {
    getAll: jest.fn(),
    getUnreadCount: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    dismiss: jest.fn(),
    notifyMultipleUsers: jest.fn(),
    scheduleMeetingReminders: jest.fn(),
    cancelMeetingReminders: jest.fn(),
  },
}));

jest.mock('../../src/services/emailNotification.service', () => ({
  sendMeetingEmails: jest.fn().mockResolvedValue(undefined),
}));

import { NotificationController } from '../../src/controllers/notification.controller';
import { NotificationService } from '../../src/services/notification.service';

const mockAuthRequest = (overrides: Partial<Request> = {}): any => ({
  user: { userId: 'user-123', email: 'test@example.com' },
  query: {},
  params: {},
  body: {},
  ...overrides,
});

const mockResponse = (): any => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('NotificationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return notifications with pagination', async () => {
      const mockResult = {
        notifications: [{ id: '1', title: 'Test' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      (NotificationService.getAll as jest.Mock).mockResolvedValue(mockResult);

      const req = mockAuthRequest({ query: { page: '1', limit: '20' } });
      const res = mockResponse();

      await NotificationController.getNotifications(req, res);

      expect(NotificationService.getAll).toHaveBeenCalledWith('user-123', 1, 20);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
    });

    it('should cap limit at 50', async () => {
      (NotificationService.getAll as jest.Mock).mockResolvedValue({ notifications: [] });

      const req = mockAuthRequest({ query: { limit: '100' } });
      const res = mockResponse();

      await NotificationController.getNotifications(req, res);

      expect(NotificationService.getAll).toHaveBeenCalledWith('user-123', 1, 50);
    });

    it('should return 500 on error', async () => {
      (NotificationService.getAll as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = mockAuthRequest();
      const res = mockResponse();

      await NotificationController.getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(5);

      const req = mockAuthRequest();
      const res = mockResponse();

      await NotificationController.getUnreadCount(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, count: 5 });
    });
  });

  describe('markRead', () => {
    it('should mark a single notification as read', async () => {
      (NotificationService.markRead as jest.Mock).mockResolvedValue(undefined);

      const req = mockAuthRequest({ params: { id: 'notif-1' } });
      const res = mockResponse();

      await NotificationController.markRead(req, res);

      expect(NotificationService.markRead).toHaveBeenCalledWith('notif-1', 'user-123');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('markAllRead', () => {
    it('should mark all notifications as read', async () => {
      (NotificationService.markAllRead as jest.Mock).mockResolvedValue(undefined);

      const req = mockAuthRequest();
      const res = mockResponse();

      await NotificationController.markAllRead(req, res);

      expect(NotificationService.markAllRead).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('dismiss', () => {
    it('should dismiss a notification', async () => {
      (NotificationService.dismiss as jest.Mock).mockResolvedValue(undefined);

      const req = mockAuthRequest({ params: { id: 'notif-1' } });
      const res = mockResponse();

      await NotificationController.dismiss(req, res);

      expect(NotificationService.dismiss).toHaveBeenCalledWith('notif-1', 'user-123');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('handleMeetingEvent', () => {
    it('should process meeting_created event', async () => {
      (NotificationService.notifyMultipleUsers as jest.Mock).mockResolvedValue([{ id: '1' }]);

      const req = mockAuthRequest({
        body: {
          type: 'meeting_created',
          clubId: 'club-1',
          meetingId: 'meeting-1',
          meetingTitle: 'Book Discussion',
          scheduledAt: '2025-01-15T18:00:00.000Z',
          userIds: ['user-1', 'user-2'],
        },
      });
      const res = mockResponse();

      await NotificationController.handleMeetingEvent(req, res);

      expect(NotificationService.scheduleMeetingReminders).toHaveBeenCalled();
      expect(NotificationService.notifyMultipleUsers).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, notified: 1 })
      );
    });

    it('should process meeting_cancelled event and cancel reminders', async () => {
      (NotificationService.notifyMultipleUsers as jest.Mock).mockResolvedValue([]);

      const req = mockAuthRequest({
        body: {
          type: 'meeting_cancelled',
          clubId: 'club-1',
          meetingId: 'meeting-1',
          meetingTitle: 'Cancelled Meeting',
          userIds: ['user-1'],
        },
      });
      const res = mockResponse();

      await NotificationController.handleMeetingEvent(req, res);

      expect(NotificationService.cancelMeetingReminders).toHaveBeenCalledWith('meeting-1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 400 for unknown event type', async () => {
      const req = mockAuthRequest({
        body: {
          type: 'unknown_event',
          clubId: 'club-1',
          meetingId: 'meeting-1',
          userIds: ['user-1'],
        },
      });
      const res = mockResponse();

      await NotificationController.handleMeetingEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
