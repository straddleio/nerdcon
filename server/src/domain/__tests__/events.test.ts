import { eventBroadcaster } from '../events.js';

describe('SSE Event Broadcaster', () => {
  it('should have broadcast method that accepts event and data', () => {
    // Test that broadcast method exists and accepts any data type
    expect(typeof eventBroadcaster.broadcast).toBe('function');

    // Should not throw when called with event string and data object
    expect(() => {
      eventBroadcaster.broadcast('test', { foo: 'bar' });
    }).not.toThrow();
  });

  it('should have getClientCount method', () => {
    expect(typeof eventBroadcaster.getClientCount).toBe('function');
    expect(typeof eventBroadcaster.getClientCount()).toBe('number');
  });

  it('should have addClient method', () => {
    expect(typeof eventBroadcaster.addClient).toBe('function');
  });
});
