import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  unmaskCustomer,
  getCustomer,
  getPaykey,
  getPaykeyReview,
  updatePaykeyReview,
  getCharge,
} from '../api';
import { useDemoStore } from '../state';

// Mock fetch
global.fetch = vi.fn();

describe('API Client - Terminal Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDemoStore.getState().reset();
  });

  it('should create terminal entry when unmasking customer', async () => {
    const mockResponse = {
      compliance_profile: {
        ssn: '123-45-6789',
        dob: '1990-01-01',
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const initialHistoryLength = useDemoStore.getState().terminalHistory.length;

    await unmaskCustomer('customer-123');

    const finalHistory = useDemoStore.getState().terminalHistory;
    expect(finalHistory.length).toBe(initialHistoryLength + 1);

    const lastEntry = finalHistory[finalHistory.length - 1];
    expect(lastEntry.text).toContain('Fetching unmasked customer data');
    expect(lastEntry.type).toBe('info');
  });

  it('should not duplicate terminal entries on error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const initialHistoryLength = useDemoStore.getState().terminalHistory.length;

    await expect(unmaskCustomer('customer-123')).rejects.toThrow('Network error');

    const finalHistory = useDemoStore.getState().terminalHistory;
    // Should have added one entry for the action
    expect(finalHistory.length).toBe(initialHistoryLength + 1);
  });

  it('should create terminal entry when getting customer', async () => {
    const mockResponse = {
      id: 'customer-123',
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '+12125550123',
      verification_status: 'verified',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const initialHistoryLength = useDemoStore.getState().terminalHistory.length;

    await getCustomer('customer-123');

    const finalHistory = useDemoStore.getState().terminalHistory;
    expect(finalHistory.length).toBe(initialHistoryLength + 1);

    const lastEntry = finalHistory[finalHistory.length - 1];
    expect(lastEntry.text).toContain('Refreshing customer data');
    expect(lastEntry.type).toBe('info');
  });

  it('should create terminal entry when getting paykey', async () => {
    const mockResponse = {
      id: 'paykey-123',
      paykey: 'token-abc',
      customer_id: 'customer-123',
      status: 'active',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const initialHistoryLength = useDemoStore.getState().terminalHistory.length;

    await getPaykey('paykey-123');

    const finalHistory = useDemoStore.getState().terminalHistory;
    expect(finalHistory.length).toBe(initialHistoryLength + 1);

    const lastEntry = finalHistory[finalHistory.length - 1];
    expect(lastEntry.text).toContain('Refreshing paykey data');
    expect(lastEntry.type).toBe('info');
  });

  it('should create terminal entry when getting paykey review', async () => {
    const mockResponse = {
      paykey_details: {
        id: 'paykey-123',
        paykey: 'token-abc',
        status: 'review',
      },
      verification_details: {
        id: 'verification-123',
        decision: 'review',
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const initialHistoryLength = useDemoStore.getState().terminalHistory.length;

    await getPaykeyReview('paykey-123');

    const finalHistory = useDemoStore.getState().terminalHistory;
    expect(finalHistory.length).toBe(initialHistoryLength + 1);

    const lastEntry = finalHistory[finalHistory.length - 1];
    expect(lastEntry.text).toContain('Fetching paykey review details');
    expect(lastEntry.type).toBe('info');
  });

  it('should create terminal entry when approving paykey review', async () => {
    const mockResponse = {
      paykey_details: {
        id: 'paykey-123',
        paykey: 'token-abc',
        status: 'active',
      },
      verification_details: {
        id: 'verification-123',
        decision: 'accept',
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const initialHistoryLength = useDemoStore.getState().terminalHistory.length;

    await updatePaykeyReview('paykey-123', { decision: 'approved' });

    const finalHistory = useDemoStore.getState().terminalHistory;
    expect(finalHistory.length).toBe(initialHistoryLength + 1);

    const lastEntry = finalHistory[finalHistory.length - 1];
    expect(lastEntry.text).toContain('Approving paykey review');
    expect(lastEntry.type).toBe('info');
  });

  it('should create terminal entry when rejecting paykey review', async () => {
    const mockResponse = {
      paykey_details: {
        id: 'paykey-123',
        paykey: 'token-abc',
        status: 'rejected',
      },
      verification_details: {
        id: 'verification-123',
        decision: 'reject',
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const initialHistoryLength = useDemoStore.getState().terminalHistory.length;

    await updatePaykeyReview('paykey-123', { decision: 'rejected' });

    const finalHistory = useDemoStore.getState().terminalHistory;
    expect(finalHistory.length).toBe(initialHistoryLength + 1);

    const lastEntry = finalHistory[finalHistory.length - 1];
    expect(lastEntry.text).toContain('Rejecting paykey review');
    expect(lastEntry.type).toBe('info');
  });

  it('should create terminal entry when getting charge', async () => {
    const mockResponse = {
      id: 'charge-123',
      amount: 5000,
      currency: 'USD',
      status: 'paid',
      paykey: 'token-abc',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const initialHistoryLength = useDemoStore.getState().terminalHistory.length;

    await getCharge('charge-123');

    const finalHistory = useDemoStore.getState().terminalHistory;
    expect(finalHistory.length).toBe(initialHistoryLength + 1);

    const lastEntry = finalHistory[finalHistory.length - 1];
    expect(lastEntry.text).toContain('Refreshing charge data');
    expect(lastEntry.type).toBe('info');
  });
});
