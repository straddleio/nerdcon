import { describe, it, expect, vi } from 'vitest';
import { executeCommand, AVAILABLE_COMMANDS } from '../commands';
import * as api from '../api';

vi.mock('../api');

describe('Command aliases', () => {
  it('should include /create-customer in AVAILABLE_COMMANDS', () => {
    expect(AVAILABLE_COMMANDS).toContain('/create-customer');
  });

  it('should execute /create-customer as alias for /customer-create', async () => {
    const mockCustomer = {
      id: 'cust_123',
      verification_status: 'verified',
    };

    vi.spyOn(api, 'createCustomer').mockResolvedValue(mockCustomer as any);

    const result = await executeCommand('/create-customer --outcome verified');

    expect(result.success).toBe(true);
    expect(api.createCustomer).toHaveBeenCalledWith({ outcome: 'verified' });
  });

  it('should include /create-paykey in AVAILABLE_COMMANDS', () => {
    expect(AVAILABLE_COMMANDS).toContain('/create-paykey');
  });

  it('should maintain backward compatibility with /customer-create', async () => {
    const mockCustomer = {
      id: 'cust_456',
      verification_status: 'verified',
    };

    vi.spyOn(api, 'createCustomer').mockResolvedValue(mockCustomer as any);

    const result = await executeCommand('/customer-create --outcome verified');

    expect(result.success).toBe(true);
    expect(api.createCustomer).toHaveBeenCalled();
  });
});
