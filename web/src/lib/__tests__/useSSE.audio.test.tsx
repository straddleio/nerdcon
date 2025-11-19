import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSSE } from '../useSSE';
import * as sounds from '../sounds';
import { useDemoStore } from '../state';

// Mock the sounds module
vi.mock('../sounds', () => ({
  playReviewAlertSound: vi.fn().mockResolvedValue(true),
  playChargeStatusSound: vi.fn().mockResolvedValue(true),
}));

describe('useSSE review alert audio', () => {
  let mockEventSource: {
    addEventListener: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onopen: (() => void) | null;
    onerror: ((error: Event) => void) | null;
  };

  beforeEach(() => {
    // Reset Zustand store
    useDemoStore.setState({
      customer: null,
      paykey: null,
      charge: null,
    });

    // Mock EventSource
    mockEventSource = {
      addEventListener: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onerror: null,
    };

    // Use vi.fn(function() {}) pattern for constructor mock
    global.EventSource = vi.fn(function (this: typeof mockEventSource) {
      return mockEventSource;
    }) as unknown as typeof EventSource;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should play review alert when customer status changes to review', async () => {
    renderHook(() => useSSE());

    // Get the state:customer event handler
    const customerHandler = mockEventSource.addEventListener.mock.calls.find(
      (call) => call[0] === 'state:customer'
    )?.[1];

    expect(customerHandler).toBeDefined();

    // Simulate customer with review status
    const mockEvent = {
      data: JSON.stringify({
        id: 'cust_123',
        verification_status: 'review',
        name: 'Test Customer',
      }),
    } as MessageEvent;

    customerHandler?.(mockEvent);

    await waitFor(() => {
      expect(sounds.playReviewAlertSound).toHaveBeenCalled();
    });
  });

  it('should play review alert when paykey status changes to review', async () => {
    renderHook(() => useSSE());

    // Get the state:paykey event handler
    const paykeyHandler = mockEventSource.addEventListener.mock.calls.find(
      (call) => call[0] === 'state:paykey'
    )?.[1];

    expect(paykeyHandler).toBeDefined();

    // Simulate paykey with review status
    const mockEvent = {
      data: JSON.stringify({
        id: 'paykey_123',
        status: 'review',
      }),
    } as MessageEvent;

    paykeyHandler?.(mockEvent);

    await waitFor(() => {
      expect(sounds.playReviewAlertSound).toHaveBeenCalled();
    });
  });

  it('should not play alert for non-review statuses', async () => {
    renderHook(() => useSSE());

    const customerHandler = mockEventSource.addEventListener.mock.calls.find(
      (call) => call[0] === 'state:customer'
    )?.[1];

    // Simulate customer with verified status
    const mockEvent = {
      data: JSON.stringify({
        id: 'cust_123',
        verification_status: 'verified',
        name: 'Test Customer',
      }),
    } as MessageEvent;

    customerHandler?.(mockEvent);

    await waitFor(
      () => {
        expect(sounds.playReviewAlertSound).not.toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should only play review alert once per review status change', async () => {
    const { unmount } = renderHook(() => useSSE());

    const customerHandler = mockEventSource.addEventListener.mock.calls.find(
      (call) => call[0] === 'state:customer'
    )?.[1];

    // First review event
    const mockEvent1 = {
      data: JSON.stringify({
        id: 'cust_123',
        verification_status: 'review',
        name: 'Test Customer',
      }),
    } as MessageEvent;

    customerHandler?.(mockEvent1);

    await waitFor(() => {
      expect(sounds.playReviewAlertSound).toHaveBeenCalledTimes(1);
    });

    // Same customer, still in review (no status change)
    // Store should prevent the SSE from treating this as new data
    const mockEvent2 = {
      data: JSON.stringify({
        id: 'cust_123',
        verification_status: 'review',
        name: 'Test Customer',
      }),
    } as MessageEvent;

    customerHandler?.(mockEvent2);

    // Should still only have been called once
    await waitFor(
      () => {
        expect(sounds.playReviewAlertSound).toHaveBeenCalledTimes(1);
      },
      { timeout: 500 }
    );

    unmount();
  });

  describe('charge status sound', () => {
    it('should play charge status sound for successful charge status', async () => {
      renderHook(() => useSSE());

      const chargeHandler = mockEventSource.addEventListener.mock.calls.find(
        (call) => call[0] === 'state:charge'
      )?.[1];

      expect(chargeHandler).toBeDefined();

      // Simulate charge with paid status
      const mockEvent = {
        data: JSON.stringify({
          id: 'charge_123',
          status: 'paid',
          amount: 5000,
        }),
      } as MessageEvent;

      chargeHandler?.(mockEvent);

      await waitFor(() => {
        expect(sounds.playChargeStatusSound).toHaveBeenCalled();
      });
    });

    it('should not play charge status sound for failed charge', async () => {
      renderHook(() => useSSE());

      const chargeHandler = mockEventSource.addEventListener.mock.calls.find(
        (call) => call[0] === 'state:charge'
      )?.[1];

      // Simulate charge with failed status
      const mockEvent = {
        data: JSON.stringify({
          id: 'charge_123',
          status: 'failed_insufficient_funds',
          amount: 5000,
        }),
      } as MessageEvent;

      chargeHandler?.(mockEvent);

      await waitFor(
        () => {
          expect(sounds.playChargeStatusSound).not.toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });

    it('should not play charge status sound for reversed charge', async () => {
      renderHook(() => useSSE());

      const chargeHandler = mockEventSource.addEventListener.mock.calls.find(
        (call) => call[0] === 'state:charge'
      )?.[1];

      // Simulate charge with reversed status
      const mockEvent = {
        data: JSON.stringify({
          id: 'charge_123',
          status: 'reversed_insufficient_funds',
          amount: 5000,
        }),
      } as MessageEvent;

      chargeHandler?.(mockEvent);

      await waitFor(
        () => {
          expect(sounds.playChargeStatusSound).not.toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });

    it('should play charge status sound for on_hold status', async () => {
      renderHook(() => useSSE());

      const chargeHandler = mockEventSource.addEventListener.mock.calls.find(
        (call) => call[0] === 'state:charge'
      )?.[1];

      // Simulate charge with on_hold status (not failed/reversed)
      const mockEvent = {
        data: JSON.stringify({
          id: 'charge_123',
          status: 'on_hold_daily_limit',
          amount: 5000,
        }),
      } as MessageEvent;

      chargeHandler?.(mockEvent);

      await waitFor(() => {
        expect(sounds.playChargeStatusSound).toHaveBeenCalled();
      });
    });

    it('should play charge status sound for cancelled status', async () => {
      renderHook(() => useSSE());

      const chargeHandler = mockEventSource.addEventListener.mock.calls.find(
        (call) => call[0] === 'state:charge'
      )?.[1];

      // Simulate charge with cancelled status (not failed/reversed)
      const mockEvent = {
        data: JSON.stringify({
          id: 'charge_123',
          status: 'cancelled_for_fraud_risk',
          amount: 5000,
        }),
      } as MessageEvent;

      chargeHandler?.(mockEvent);

      await waitFor(() => {
        expect(sounds.playChargeStatusSound).toHaveBeenCalled();
      });
    });
  });
});
