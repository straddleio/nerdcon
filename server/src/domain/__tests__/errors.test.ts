import { describe, it, expect } from '@jest/globals';
import { isStraddleError, toExpressError } from '../errors.js';

describe('Error Type Guards', () => {
  it('should identify Straddle API errors', () => {
    const straddleErr = {
      error: {
        type: 'invalid_request',
        code: 'INVALID_CUSTOMER',
        message: 'Customer not found',
      },
      status: 404,
    };

    expect(isStraddleError(straddleErr)).toBe(true);
    expect(isStraddleError(new Error('regular error'))).toBe(false);
    expect(isStraddleError(null)).toBe(false);
  });

  it('should convert unknown errors to Express errors', () => {
    const regularErr = new Error('Test error');
    const expressErr = toExpressError(regularErr);

    expect(expressErr).toBeInstanceOf(Error);
    expect(expressErr.message).toBe('Test error');
  });

  it('should convert Straddle errors to Express errors', () => {
    const straddleErr = {
      error: {
        type: 'invalid_request',
        code: 'INVALID_CUSTOMER',
        message: 'Customer not found',
      },
      status: 404,
    };

    const expressErr = toExpressError(straddleErr);

    expect(expressErr.message).toBe('Customer not found');
    expect(expressErr.status).toBe(404);
    expect(expressErr.code).toBe('INVALID_CUSTOMER');
  });
});
