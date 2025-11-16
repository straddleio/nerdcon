// web/src/lib/__tests__/commands-outcomes.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCommand, AVAILABLE_COMMANDS } from '../commands';
import * as api from '../api';

// Mock the API
vi.mock('../api');

describe('/outcomes command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be listed in AVAILABLE_COMMANDS', () => {
    expect(AVAILABLE_COMMANDS).toContain('/outcomes');
  });

  it('should fetch and display sandbox outcomes', async () => {
    const mockOutcomes = {
      customer: ['standard', 'verified', 'review', 'rejected'],
      paykey: ['standard', 'active', 'rejected'],
      charge: ['standard', 'paid', 'failed_insufficient_funds']
    };

    vi.spyOn(api, 'getOutcomes').mockResolvedValue(mockOutcomes);

    const result = await executeCommand('/outcomes');

    expect(result.success).toBe(true);
    expect(result.message).toContain('Customers:');
    expect(result.message).toContain('verified');
    expect(result.message).toContain('Paykeys:');
    expect(result.message).toContain('active');
    expect(result.message).toContain('Charges:');
    expect(result.message).toContain('paid');
  });

  it('should handle API errors gracefully', async () => {
    vi.spyOn(api, 'getOutcomes').mockRejectedValue(new Error('Network error'));

    const result = await executeCommand('/outcomes');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to fetch outcomes');
  });
});
