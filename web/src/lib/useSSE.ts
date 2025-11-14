import { useEffect } from 'react';
import { useDemoStore } from './state';
import type { Customer, Paykey, Charge } from './api';

/**
 * SSE event types from backend
 */
export interface SSEEvent {
  type: 'state:customer' | 'state:paykey' | 'state:charge' | 'state:reset' | 'webhook';
  data: unknown;
}

/**
 * Connect to SSE endpoint for real-time updates
 */
export function useSSE(url: string = 'http://localhost:3001/api/events/stream') {
  const setCustomer = useDemoStore((state) => state.setCustomer);
  const setPaykey = useDemoStore((state) => state.setPaykey);
  const setCharge = useDemoStore((state) => state.setCharge);
  const setConnected = useDemoStore((state) => state.setConnected);
  const setConnectionError = useDemoStore((state) => state.setConnectionError);
  const reset = useDemoStore((state) => state.reset);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('[SSE] Connected');
        setConnected(true);
        setConnectionError(null);
      };

      eventSource.onerror = (error) => {
        console.error('[SSE] Error:', error);
        setConnected(false);
        setConnectionError('Connection lost. Retrying...');
      };

      // Handle state:initial events (sent on connection)
      eventSource.addEventListener('state:initial', (event) => {
        const data = JSON.parse(event.data);
        console.log('[SSE] Initial state received:', data);
        if (data.customer) setCustomer(data.customer);
        if (data.paykey) setPaykey(data.paykey);
        if (data.charge) setCharge(data.charge);
      });

      // Handle state:customer events
      eventSource.addEventListener('state:customer', (event) => {
        const data = JSON.parse(event.data) as Customer;
        console.log('[SSE] Customer updated:', data);
        setCustomer(data);
      });

      // Handle state:paykey events
      eventSource.addEventListener('state:paykey', (event) => {
        const data = JSON.parse(event.data) as Paykey;
        console.log('[SSE] Paykey updated:', data);
        setPaykey(data);
      });

      // Handle state:charge events
      eventSource.addEventListener('state:charge', (event) => {
        const data = JSON.parse(event.data) as Charge;
        console.log('[SSE] Charge updated:', data);
        setCharge(data);
      });

      // Handle state:reset events
      eventSource.addEventListener('state:reset', () => {
        console.log('[SSE] State reset');
        reset();
      });

      // Handle webhook events (just log for now)
      eventSource.addEventListener('webhook', (event) => {
        const data = JSON.parse(event.data);
        console.log('[SSE] Webhook received:', data);
      });
    } catch (error) {
      console.error('[SSE] Failed to connect:', error);
      setConnectionError('Failed to connect to server');
    }

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        console.log('[SSE] Disconnecting');
        eventSource.close();
      }
    };
  }, [url, setCustomer, setPaykey, setCharge, setConnected, setConnectionError, reset]);
}
