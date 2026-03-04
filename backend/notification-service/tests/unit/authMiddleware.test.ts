import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../src/middleware/authMiddleware';

const mockRequest = (headers: Record<string, string> = {}): Partial<Request> => ({
  headers,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware', () => {
  it('should return 401 if no x-user-id header', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Authentication required' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach user to request when x-user-id is present', () => {
    const req = mockRequest({
      'x-user-id': 'user-123',
      'x-user-email': 'test@example.com',
      'x-user-name': 'Test User',
    }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('should set defaults for missing optional headers', () => {
    const req = mockRequest({
      'x-user-id': 'user-456',
    }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: 'user-456',
      email: '',
      name: undefined,
    });
  });
});
