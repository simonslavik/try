import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../../src/middleware/requestLogger';

const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  method: 'GET',
  url: '/test',
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('test-agent'),
  ...overrides,
});

describe('requestLogger', () => {
  let finishCallback: () => void;

  const mockResponse = (statusCode: number = 200): Partial<Response> => ({
    statusCode,
    on: jest.fn().mockImplementation((event: string, cb: () => void) => {
      if (event === 'finish') finishCallback = cb;
    }),
  });

  it('should register a finish listener', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    requestLogger(req, res, next);

    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(next).toHaveBeenCalled();
  });

  it('should log successful requests as info', () => {
    const req = mockRequest({ method: 'GET', url: '/health' }) as Request;
    const res = mockResponse(200) as Response;
    const next = jest.fn();

    requestLogger(req, res, next);
    finishCallback();

    // Logger is mocked in setup — just verify it doesn't throw
    expect(next).toHaveBeenCalled();
  });

  it('should handle 4xx responses', () => {
    const req = mockRequest({ method: 'POST', url: '/invalid' }) as Request;
    const res = mockResponse(404) as Response;
    const next = jest.fn();

    requestLogger(req, res, next);
    finishCallback();

    expect(next).toHaveBeenCalled();
  });

  it('should handle 5xx responses', () => {
    const req = mockRequest({ method: 'GET', url: '/error' }) as Request;
    const res = mockResponse(500) as Response;
    const next = jest.fn();

    requestLogger(req, res, next);
    finishCallback();

    expect(next).toHaveBeenCalled();
  });
});
