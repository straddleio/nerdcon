import { useEffect } from 'react';
import { useDemoStore } from './state';
import type { Customer, Paykey, Charge } from './api';
import { API_BASE_URL } from './api';
import { playReviewAlertSound, playChargeStatusSound } from './sounds';

/**
 * SSE event types from backend
 */
export interface SSEEvent {
  type: 'state:customer' | 'state:paykey' | 'state:charge' | 'state:reset' | 'webhook' | 'api_log';
  data: unknown;
}

/**
 * Initial state message structure
 */
interface InitialStateMessage {
  customer?: Customer;
  paykey?: Paykey;
  charge?: Charge;
}

/**
 * API log message structure (matches APILogEntry from state.ts)
 */
interface APILogMessage {
  requestId: string;
  correlationId: string;
  idempotencyKey?: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: string;
  straddleEndpoint?: string;
  requestBody?: unknown;
  responseBody?: unknown;
}

/**
 * Type guard for initial state message
 */
function isInitialStateMessage(data: unknown): data is InitialStateMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  return true;
}

/**
 * Type guard for API log message
 */
function isAPILogMessage(data: unknown): data is APILogMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.requestId === 'string' &&
    typeof obj.correlationId === 'string' &&
    typeof obj.method === 'string' &&
    typeof obj.path === 'string' &&
    typeof obj.statusCode === 'number' &&
    typeof obj.duration === 'number' &&
    typeof obj.timestamp === 'string'
  );
}

/**
 * Type guard for Customer
 */
function isCustomer(data: unknown): data is Customer {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return typeof obj.id === 'string';
}

/**
 * Type guard for Paykey
 */
function isPaykey(data: unknown): data is Paykey {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return typeof obj.id === 'string';
}

/**
 * Type guard for Charge
 */
function isCharge(data: unknown): data is Charge {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return typeof obj.id === 'string';
}

/**
 * Safely parse JSON from EventSource message
 */
function parseEventData(event: Event): unknown {
  const messageEvent = event as MessageEvent<string>;
  return JSON.parse(messageEvent.data);
}

/**
 * Connect to SSE endpoint for real-time updates
 */
const DEFAULT_SSE_URL = `${API_BASE_URL}/events/stream`;

export function useSSE(url: string = DEFAULT_SSE_URL): void {
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
        console.info('[SSE] Connected');
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
        const parsed = parseEventData(event);
        console.info('[SSE] Initial state received:', parsed);

        if (isInitialStateMessage(parsed)) {
          if (parsed.customer) {
            setCustomer(parsed.customer);
          }
          if (parsed.paykey) {
            setPaykey(parsed.paykey);
          }
          if (parsed.charge) {
            setCharge(parsed.charge);
          }
        }
      });

      // Handle state:customer events
      eventSource.addEventListener('state:customer', (event) => {
        const parsed = parseEventData(event);

        if (isCustomer(parsed)) {
          console.info('[SSE] Customer updated:', parsed);

          // Get previous status before updating
          const previousCustomer = useDemoStore.getState().customer;
          const previousStatus = previousCustomer?.verification_status;

          // Play review alert if status changed TO review
          if (parsed.verification_status === 'review' && previousStatus !== 'review') {
            void playReviewAlertSound();
          }

          setCustomer(parsed);
        }
      });

      // Handle state:paykey events
      eventSource.addEventListener('state:paykey', (event) => {
        const parsed = parseEventData(event);

        if (isPaykey(parsed)) {
          console.info('[SSE] Paykey updated:', parsed);

          // Get previous status before updating
          const previousPaykey = useDemoStore.getState().paykey;
          const previousStatus = previousPaykey?.status;

          // Play review alert if status changed TO review
          if (parsed.status === 'review' && previousStatus !== 'review') {
            void playReviewAlertSound();
          }

          setPaykey(parsed);
        }
      });

      // Handle state:charge events
      eventSource.addEventListener('state:charge', (event) => {
        const parsed = parseEventData(event);

        if (isCharge(parsed)) {
          console.info('[SSE] Charge updated:', parsed);

          // Play sound for successful charge events (not failed/reversed)
          if (
            parsed.status &&
            !parsed.status.includes('failed') &&
            !parsed.status.includes('reversed')
          ) {
            void playChargeStatusSound();
          }

          setCharge(parsed);
        }
      });

      // Handle state:reset events
      eventSource.addEventListener('state:reset', () => {
        console.info('[SSE] State reset');
        reset();
      });

      // Handle webhook events (just log for now)
      eventSource.addEventListener('webhook', (event) => {
        const parsed = parseEventData(event);
        console.info('[SSE] Webhook received:', parsed);
      });

      // Handle API log events
      eventSource.addEventListener('api_log', (event) => {
        const parsed = parseEventData(event);
        console.info('[SSE] API log received:', parsed);

        if (isAPILogMessage(parsed)) {
          // Add to global logs
          const { apiLogs, setApiLogs, terminalHistory, associateAPILogsWithCommand } =
            useDemoStore.getState();
          setApiLogs([parsed, ...apiLogs]);

          // Associate with most recent command or UI action (within last 10 seconds)
          const recentCommand = terminalHistory
            .filter((line) => line.type === 'input' || line.type === 'info')
            .reverse()
            .find((line) => {
              const timeDiff = Date.now() - line.timestamp.getTime();
              return timeDiff < 10000; // Within 10 seconds
            });

          if (recentCommand) {
            associateAPILogsWithCommand(recentCommand.id, [parsed]);
          }
        }
      });
    } catch (error) {
      console.error('[SSE] Failed to connect:', error);
      setConnectionError('Failed to connect to server');
    }

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        console.info('[SSE] Disconnecting');
        eventSource.close();
      }
    };
  }, [url, setCustomer, setPaykey, setCharge, setConnected, setConnectionError, reset]);
}
