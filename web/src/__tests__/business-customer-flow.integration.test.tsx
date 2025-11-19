import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { executeCommand } from '../lib/commands';
import * as api from '../lib/api';
import { useDemoStore } from '../lib/state';

/**
 * End-to-End Integration Tests for Business Customer Flow
 *
 * These tests verify the complete business customer workflow:
 * 1. Create business customer with verified outcome
 * 2. Create paykey (bank account) with active outcome
 * 3. Create charge with paid outcome
 * 4. Verify all API calls made with correct data
 * 5. Verify state updates correctly
 * 6. Verify terminal output shows success messages
 */

// Mock the API module
vi.mock('../lib/api');

describe('Business Customer Flow - End-to-End Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useDemoStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full business customer → paykey → charge flow', async () => {
    // Mock API responses
    const mockBusinessCustomer: api.Customer = {
      id: 'cust_biz_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      phone: '+15558675309',
      verification_status: 'verified',
      address: {
        address1: '1234 Sandbox Street',
        address2: 'PO Box I301',
        city: 'Mock City',
        state: 'CA',
        zip: '94105',
      },
      compliance_profile: {
        ein: '12-3456789',
        legal_business_name: 'The Bluth Company',
        website: 'thebananastand.com',
      },
    };

    const mockPaykey: api.Paykey = {
      id: 'paykey_biz_456',
      paykey: 'token_abc123.02.xyz789',
      customer_id: 'cust_biz_123',
      status: 'active',
      institution_name: 'Citizens Bank',
      source: 'bank_account',
      bank_data: {
        account_number: '****6789',
        account_type: 'checking',
        routing_number: '021000021',
      },
    };

    const mockCharge: api.Charge = {
      id: 'charge_biz_789',
      amount: 5000,
      currency: 'USD',
      status: 'paid',
      paykey: 'token_abc123.02.xyz789',
      description: 'Demo charge - $50.00',
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockBusinessCustomer);
    vi.mocked(api.createPaykey).mockResolvedValue(mockPaykey);
    vi.mocked(api.createCharge).mockResolvedValue(mockCharge);

    // Step 1: Create business customer with verified outcome
    const customerResult = await executeCommand('/create-business --outcome verified');

    expect(customerResult.success).toBe(true);
    expect(customerResult.message).toContain('Business Customer created');
    expect(customerResult.message).toContain('cust_biz_123');

    // Verify API call was made with correct parameters
    expect(vi.mocked(api.createCustomer)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'business',
        name: 'The Bluth Company',
        email: 'tobias@bluemyself.com',
        phone: '+15558675309',
        address: expect.objectContaining({
          address1: '1234 Sandbox Street',
          address2: 'PO Box I301', // Verified address
          city: 'Mock City',
          state: 'CA',
          zip: '94105',
        }),
        compliance_profile: expect.objectContaining({
          ein: '12-3456789',
          legal_business_name: 'The Bluth Company',
          website: 'thebananastand.com',
        }),
      })
    );

    // Verify state updated with customer
    let state = useDemoStore.getState();
    expect(state.customer).toEqual(mockBusinessCustomer);
    expect(state.customer?.id).toBe('cust_biz_123');
    expect(state.customer?.verification_status).toBe('verified');

    // Step 2: Create paykey with active outcome
    const paykeyResult = await executeCommand('/create-paykey bank --outcome active');

    expect(paykeyResult.success).toBe(true);
    expect(paykeyResult.message).toContain('Paykey created');
    expect(paykeyResult.message).toContain('paykey_biz_456');

    // Verify API call was made with correct customer ID
    expect(vi.mocked(api.createPaykey)).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: 'cust_biz_123',
        method: 'bank_account',
        outcome: 'active',
      })
    );

    // Manually set paykey in state (simulates SSE update)
    useDemoStore.getState().setPaykey(mockPaykey);

    // Verify state updated with paykey
    state = useDemoStore.getState();
    expect(state.paykey).toEqual(mockPaykey);
    expect(state.paykey?.id).toBe('paykey_biz_456');
    expect(state.paykey?.status).toBe('active');

    // Step 3: Create charge with paid outcome
    const chargeResult = await executeCommand('/create-charge --amount 5000 --outcome paid');

    expect(chargeResult.success).toBe(true);
    expect(chargeResult.message).toContain('Charge created');
    expect(chargeResult.message).toContain('charge_biz_789');

    // Verify API call was made with correct paykey TOKEN (not ID)
    expect(vi.mocked(api.createCharge)).toHaveBeenCalledWith(
      expect.objectContaining({
        paykey: 'token_abc123.02.xyz789', // Token, not ID
        amount: 5000,
        description: 'Demo charge - $50.00',
        outcome: 'paid',
      })
    );

    // Verify final state has all three resources
    state = useDemoStore.getState();
    expect(state.customer).toEqual(mockBusinessCustomer);
    expect(state.paykey).toEqual(mockPaykey);
    expect(state.charge).toEqual(mockCharge);
  });

  it('should handle business customer with review outcome', async () => {
    const mockReviewCustomer: api.Customer = {
      id: 'cust_review_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      phone: '+15558675309',
      verification_status: 'review',
      address: {
        address1: '1234 Sandbox Street',
        address2: 'PO Box I304', // Review address
        city: 'Mock City',
        state: 'CA',
        zip: '94105',
      },
      compliance_profile: {
        ein: '12-3456789',
        legal_business_name: 'The Bluth Company',
        website: 'thebananastand.com',
      },
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockReviewCustomer);

    const result = await executeCommand('/create-business --outcome review');

    expect(result.success).toBe(true);
    expect(result.message).toContain('Business Customer created');

    // Verify correct address was used for review outcome
    expect(vi.mocked(api.createCustomer)).toHaveBeenCalledWith(
      expect.objectContaining({
        address: expect.objectContaining({
          address2: 'PO Box I304', // Review address
        }),
      })
    );

    // Verify state shows review status
    const state = useDemoStore.getState();
    expect(state.customer?.verification_status).toBe('review');
  });

  it('should handle business customer rejection with rejected outcome', async () => {
    const mockRejectedCustomer: api.Customer = {
      id: 'cust_rejected_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      phone: '+15558675309',
      verification_status: 'rejected',
      address: {
        address1: '1234 Sandbox Street',
        address2: 'PO Box I103', // Rejected address
        city: 'Mock City',
        state: 'CA',
        zip: '94105',
      },
      compliance_profile: {
        ein: '12-3456789',
        legal_business_name: 'The Bluth Company',
        website: 'thebananastand.com',
      },
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockRejectedCustomer);

    const result = await executeCommand('/create-business --outcome rejected');

    expect(result.success).toBe(true);

    // Verify correct address was used for rejected outcome
    expect(vi.mocked(api.createCustomer)).toHaveBeenCalledWith(
      expect.objectContaining({
        address: expect.objectContaining({
          address2: 'PO Box I103', // Rejected address
        }),
      })
    );

    // Verify state shows rejected status
    const state = useDemoStore.getState();
    expect(state.customer?.verification_status).toBe('rejected');
  });

  it('should fail when creating paykey without customer', async () => {
    // Don't create a customer first
    const result = await executeCommand('/create-paykey bank --outcome active');

    expect(result.success).toBe(false);
    expect(result.message).toContain('No customer found');
    expect(vi.mocked(api.createPaykey)).not.toHaveBeenCalled();
  });

  it('should fail when creating charge without paykey', async () => {
    // Don't create a paykey first
    const result = await executeCommand('/create-charge --amount 5000 --outcome paid');

    expect(result.success).toBe(false);
    expect(result.message).toContain('No paykey found');
    expect(vi.mocked(api.createCharge)).not.toHaveBeenCalled();
  });

  it('should fail gracefully when customer API returns error', async () => {
    vi.mocked(api.createCustomer).mockRejectedValue(new Error('Network error'));

    const result = await executeCommand('/create-business --outcome verified');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to create business customer');
    expect(result.message).toContain('Network error');
  });

  it('should fail gracefully when paykey API returns error', async () => {
    const mockCustomer: api.Customer = {
      id: 'cust_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      phone: '+15558675309',
      verification_status: 'verified',
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
    vi.mocked(api.createPaykey).mockRejectedValue(new Error('Invalid customer'));

    // First create customer (succeeds)
    await executeCommand('/create-business --outcome verified');

    // Then try to create paykey (fails)
    const result = await executeCommand('/create-paykey bank --outcome active');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to create paykey');
    expect(result.message).toContain('Invalid customer');
  });

  it('should fail gracefully when charge API returns error', async () => {
    const mockCustomer: api.Customer = {
      id: 'cust_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      phone: '+15558675309',
      verification_status: 'verified',
    };

    const mockPaykey: api.Paykey = {
      id: 'paykey_123',
      paykey: 'token_xyz.02.abc',
      customer_id: 'cust_123',
      status: 'active',
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
    vi.mocked(api.createPaykey).mockResolvedValue(mockPaykey);
    vi.mocked(api.createCharge).mockRejectedValue(new Error('Insufficient funds'));

    // Create customer and paykey
    await executeCommand('/create-business --outcome verified');
    await executeCommand('/create-paykey bank --outcome active');

    // Manually set paykey in state (simulates SSE update)
    useDemoStore.getState().setPaykey(mockPaykey);

    // Try to create charge (fails)
    const result = await executeCommand('/create-charge --amount 5000 --outcome paid');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to create charge');
    expect(result.message).toContain('Insufficient funds');
  });

  it('should handle custom charge amount', async () => {
    const mockCustomer: api.Customer = {
      id: 'cust_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      phone: '+15558675309',
      verification_status: 'verified',
    };

    const mockPaykey: api.Paykey = {
      id: 'paykey_123',
      paykey: 'token_xyz.02.abc',
      customer_id: 'cust_123',
      status: 'active',
    };

    const mockCharge: api.Charge = {
      id: 'charge_123',
      amount: 10000, // $100.00
      currency: 'USD',
      status: 'paid',
      paykey: 'token_xyz.02.abc',
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
    vi.mocked(api.createPaykey).mockResolvedValue(mockPaykey);
    vi.mocked(api.createCharge).mockResolvedValue(mockCharge);

    // Create customer and paykey
    await executeCommand('/create-business --outcome verified');
    await executeCommand('/create-paykey bank --outcome active');

    // Manually set paykey in state (simulates SSE update)
    useDemoStore.getState().setPaykey(mockPaykey);

    // Create charge with custom amount
    const result = await executeCommand('/create-charge --amount 10000 --outcome paid');

    expect(result.success).toBe(true);

    // Verify amount was passed correctly
    expect(vi.mocked(api.createCharge)).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 10000,
        description: 'Demo charge - $100.00', // Should reflect custom amount
      })
    );
  });

  it('should reject invalid charge amount', async () => {
    const mockCustomer: api.Customer = {
      id: 'cust_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      phone: '+15558675309',
      verification_status: 'verified',
    };

    const mockPaykey: api.Paykey = {
      id: 'paykey_123',
      paykey: 'token_xyz.02.abc',
      customer_id: 'cust_123',
      status: 'active',
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
    vi.mocked(api.createPaykey).mockResolvedValue(mockPaykey);

    // Create customer and paykey
    await executeCommand('/create-business --outcome verified');
    await executeCommand('/create-paykey bank --outcome active');

    // Manually set paykey in state (simulates SSE update)
    useDemoStore.getState().setPaykey(mockPaykey);

    // Try to create charge with invalid amount
    const result = await executeCommand('/create-charge --amount invalid --outcome paid');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid amount');
    expect(vi.mocked(api.createCharge)).not.toHaveBeenCalled();
  });

  it('should reject invalid outcome for business customer', async () => {
    const result = await executeCommand('/create-business --outcome invalid_outcome');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid outcome');
    expect(vi.mocked(api.createCustomer)).not.toHaveBeenCalled();
  });

  it('should reject invalid outcome for paykey', async () => {
    const mockCustomer: api.Customer = {
      id: 'cust_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      phone: '+15558675309',
      verification_status: 'verified',
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);

    // Create customer first
    await executeCommand('/create-business --outcome verified');

    // Try to create paykey with invalid outcome
    const result = await executeCommand('/create-paykey bank --outcome invalid_outcome');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid paykey outcome');
    expect(vi.mocked(api.createPaykey)).not.toHaveBeenCalled();
  });

  it('should properly format currency in charge description', async () => {
    const mockCustomer: api.Customer = {
      id: 'cust_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      phone: '+15558675309',
      verification_status: 'verified',
    };

    const mockPaykey: api.Paykey = {
      id: 'paykey_123',
      paykey: 'token_xyz.02.abc',
      customer_id: 'cust_123',
      status: 'active',
    };

    const mockCharge: api.Charge = {
      id: 'charge_123',
      amount: 999, // $9.99
      currency: 'USD',
      status: 'paid',
      paykey: 'token_xyz.02.abc',
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
    vi.mocked(api.createPaykey).mockResolvedValue(mockPaykey);
    vi.mocked(api.createCharge).mockResolvedValue(mockCharge);

    // Create customer and paykey
    await executeCommand('/create-business --outcome verified');
    await executeCommand('/create-paykey bank --outcome active');

    // Manually set paykey in state (simulates SSE update)
    useDemoStore.getState().setPaykey(mockPaykey);

    // Create charge with fractional dollar amount
    const result = await executeCommand('/create-charge --amount 999 --outcome paid');

    expect(result.success).toBe(true);

    // Verify description shows correctly formatted currency
    expect(vi.mocked(api.createCharge)).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 999,
        description: 'Demo charge - $9.99',
      })
    );
  });
});
