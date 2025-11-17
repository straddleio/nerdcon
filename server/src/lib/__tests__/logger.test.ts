import { logger } from '../logger.js';

describe('Logger', () => {
  it('should have debug method', () => {
    expect(typeof logger.debug).toBe('function');
    // Should not throw
    expect(() => logger.debug('test message', { foo: 'bar' })).not.toThrow();
  });

  it('should have info method', () => {
    expect(typeof logger.info).toBe('function');
    // Should not throw
    expect(() => logger.info('test message', { userId: '123' })).not.toThrow();
  });

  it('should have warn method', () => {
    expect(typeof logger.warn).toBe('function');
    // Should not throw
    expect(() => logger.warn('warning message')).not.toThrow();
  });

  it('should have error method', () => {
    expect(typeof logger.error).toBe('function');
    const error = new Error('test error');
    // Should not throw
    expect(() => logger.error('Something failed', error)).not.toThrow();
  });

  it('should handle error method with context', () => {
    const error = new Error('test error');
    expect(() =>
      logger.error('Something failed', error, { customerId: '123' })
    ).not.toThrow();
  });
});
