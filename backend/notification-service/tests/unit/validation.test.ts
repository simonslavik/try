import { Request, Response, NextFunction } from 'express';
import { validate, schemas } from '../../src/middleware/validation';

const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  query: {} as any,
  params: {} as any,
  ...overrides,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Validation Middleware', () => {
  describe('getNotifications query validation', () => {
    const middleware = validate(schemas.getNotifications, 'query');

    it('should pass with valid query params', () => {
      const req = mockRequest({ query: { page: '2', limit: '10' } as any });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({ page: 2, limit: 10 });
    });

    it('should apply defaults for empty query', () => {
      const req = mockRequest({ query: {} as any });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({ page: 1, limit: 20 });
    });

    it('should reject page < 1', () => {
      const req = mockRequest({ query: { page: '0' } as any });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Validation error' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject limit > 50', () => {
      const req = mockRequest({ query: { limit: '100' } as any });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('notificationId param validation', () => {
    const middleware = validate(schemas.notificationId, 'params');

    it('should pass with valid UUID', () => {
      const req = mockRequest({ params: { id: '550e8400-e29b-41d4-a716-446655440000' } as any });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject non-UUID id', () => {
      const req = mockRequest({ params: { id: 'not-a-uuid' } as any });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updatePreferences body validation', () => {
    const middleware = validate(schemas.updatePreferences);

    it('should pass with valid boolean fields', () => {
      const req = mockRequest({ body: { emailEnabled: false, meetingCreated: true } });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ emailEnabled: false, meetingCreated: true });
    });

    it('should reject empty body (no preferences)', () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should strip unknown fields', () => {
      const req = mockRequest({ body: { emailEnabled: true, hackerField: 'malicious' } });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ emailEnabled: true });
    });
  });

  describe('meetingEvent body validation', () => {
    const middleware = validate(schemas.meetingEvent);
    const validBody = {
      type: 'meeting_created',
      clubId: '550e8400-e29b-41d4-a716-446655440000',
      meetingId: '660e8400-e29b-41d4-a716-446655440001',
      meetingTitle: 'Book Discussion',
      scheduledAt: '2025-01-15T18:00:00.000Z',
      userIds: ['770e8400-e29b-41d4-a716-446655440002'],
    };

    it('should pass with valid meeting event', () => {
      const req = mockRequest({ body: { ...validBody } });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject missing type', () => {
      const { type, ...bodyWithoutType } = validBody;
      const req = mockRequest({ body: bodyWithoutType });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid event type', () => {
      const req = mockRequest({ body: { ...validBody, type: 'invalid_type' } });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject empty userIds array', () => {
      const req = mockRequest({ body: { ...validBody, userIds: [] } });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-UUID clubId', () => {
      const req = mockRequest({ body: { ...validBody, clubId: 'bad-id' } });
      const res = mockResponse() as Response;
      const next = jest.fn();

      middleware(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept all valid event types', () => {
      for (const type of ['meeting_created', 'meeting_updated', 'meeting_cancelled']) {
        const req = mockRequest({ body: { ...validBody, type } });
        const res = mockResponse() as Response;
        const next = jest.fn();

        middleware(req as Request, res, next);

        expect(next).toHaveBeenCalled();
      }
    });
  });
});
