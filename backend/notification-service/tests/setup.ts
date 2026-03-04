// Set test environment variables before anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Suppress winston logging during tests
jest.mock('../src/utils/logger', () => {
  const noop = () => {};
  return {
    __esModule: true,
    default: { info: noop, error: noop, warn: noop, debug: noop, success: noop },
    logger: { info: noop, error: noop, warn: noop, debug: noop, success: noop },
  };
});

export {};
