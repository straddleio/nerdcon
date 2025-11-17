import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCommand } from '../commands';
import * as api from '../api';
import type { Customer, Paykey, PaykeyReview } from '../api';
import { useDemoStore } from '../state';

// Mock the API module
vi.mock('../api');

describe('handleCreatePaykey with review data', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup store state with a customer
    const mockCustomer: Partial<Customer> = {
      id: 'cust_123',
      name: 'Test Customer',
    };
    useDemoStore.setState({
      customer: mockCustomer as Customer,
      paykey: null,
      charge: null,
    });
  });

  it('should create paykey with review data included in response', async () => {
    // Server now fetches review data internally and includes it in the response
    const mockReview: Partial<PaykeyReview> = {
      verification_details: {
        id: 'vd_123',
        decision: 'accept',
        created_at: '2025-11-16T00:00:00Z',
        updated_at: '2025-11-16T00:00:00Z',
        messages: {},
        breakdown: {
          account_validation: {
            decision: 'accept',
            codes: [],
            reason: null,
          },
        },
      },
    };

    const mockPaykey: Partial<Paykey> = {
      id: 'pk_123',
      status: 'active',
      paykey: 'token_123',
      source: 'bank_account' as const,
      review: mockReview as PaykeyReview,
    };

    // Mock API call - server returns paykey with review data already attached
    vi.spyOn(api, 'createPaykey').mockResolvedValueOnce(mockPaykey as Paykey);

    // Execute the command
    const result = await executeCommand('/create-paykey bank --outcome active');

    // Verify only createPaykey was called (review fetch happens server-side)
    expect(api.createPaykey).toHaveBeenCalledTimes(1);

    // Verify paykey with review data was passed to state
    const storePaykey = useDemoStore.getState().paykey;
    expect(storePaykey).toEqual(mockPaykey);

    // Verify success result
    expect(result.success).toBe(true);
  });

  it('should handle paykey creation without review data', async () => {
    const mockPaykey: Partial<Paykey> = {
      id: 'pk_456',
      status: 'active',
      paykey: 'token_456',
      source: 'plaid' as const,
      // No review data included
    };

    // Mock paykey creation
    vi.spyOn(api, 'createPaykey').mockResolvedValueOnce(mockPaykey as Paykey);

    // Execute the command
    const result = await executeCommand('/create-paykey plaid --outcome active');

    // Verify paykey was updated
    const storePaykey = useDemoStore.getState().paykey;
    expect(storePaykey).toEqual(mockPaykey);

    // Verify success result
    expect(result.success).toBe(true);
  });
});
