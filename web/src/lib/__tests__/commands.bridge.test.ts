import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCommand } from '../commands';
import { useDemoStore } from '../state';
import * as api from '../api';

// Mock API
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return {
    ...actual,
    initializeBridge: vi.fn(),
  };
});

describe('Command: /create-paykey-bridge', () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should fail if no customer exists', async () => {
    const result = await executeCommand('/create-paykey-bridge');
    expect(result.success).toBe(false);
    expect(result.message).toContain('No customer found');
  });

  it('should initialize bridge and open modal if customer exists', async () => {
    // Setup state with customer
    useDemoStore.getState().setCustomer({
      id: 'cust_123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-555-5555',
      verification_status: 'verified',
    });

    // Mock API response
    vi.mocked(api.initializeBridge).mockResolvedValue({ bridge_token: 'test_bridge_token' });

    const result = await executeCommand('/create-paykey-bridge');

    expect(result.success).toBe(true);
    expect(result.message).toContain('Bridge initialized');

    // Verify state updates
    const state = useDemoStore.getState();
    expect(state.bridgeToken).toBe('test_bridge_token');
    expect(state.isBridgeModalOpen).toBe(true);

    // Verify API call
    expect(api.initializeBridge).toHaveBeenCalledWith('cust_123');
  });

  it('should handle API errors', async () => {
    // Setup state with customer
    useDemoStore.getState().setCustomer({
      id: 'cust_123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-555-5555',
      verification_status: 'verified',
    });

    // Mock API error
    vi.mocked(api.initializeBridge).mockRejectedValue(new Error('API Error'));

    const result = await executeCommand('/create-paykey-bridge');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to initialize bridge');
  });
});
