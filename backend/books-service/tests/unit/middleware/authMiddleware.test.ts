import { Request, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../../../src/middleware/authMiddleware';

jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('authMiddleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockNext = jest.fn();
    mockReq = { headers: {} };
    mockRes = { status: statusMock } as Partial<Response>;
  });

  it('should return 401 when no x-user-id header is present', () => {
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should set req.user and call next() when x-user-id header is present', () => {
    mockReq.headers = {
      'x-user-id': 'user-1',
      'x-user-email': 'test@test.com',
      'x-user-name': 'TestUser',
    };

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      userId: 'user-1',
      email: 'test@test.com',
      role: 'user',
      name: 'TestUser',
    });
  });

  it('should default email to empty string when x-user-email is missing', () => {
    mockReq.headers = { 'x-user-id': 'user-1' };

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user?.email).toBe('');
  });

  it('should always set role to "user"', () => {
    mockReq.headers = { 'x-user-id': 'user-1', 'x-user-email': 'test@test.com' };

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user?.role).toBe('user');
  });

  it('should decode URI-encoded x-user-name header', () => {
    mockReq.headers = {
      'x-user-id': 'user-1',
      'x-user-name': 'John%20Doe',
    };

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user?.name).toBe('John Doe');
  });

  it('should set name to undefined when x-user-name is missing', () => {
    mockReq.headers = { 'x-user-id': 'user-1' };

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user?.name).toBeUndefined();
  });
});
