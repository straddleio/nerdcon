import { create } from 'zustand';
import type { Customer, Paykey, Charge } from './api';

/**
 * Helper function for UUID generation with fallback
 */
const uuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Terminal output line
 */
export interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  timestamp: Date;
  source?: 'command' | 'ui-action'; // Track origin
  // Associated API log entries that occurred during this command
  apiLogs?: APILogEntry[];
}

/**
 * API Log Entry
 */
export interface APILogEntry {
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
 * Demo state
 */
export interface DemoState {
  // Resources
  customer: Customer | null;
  paykey: Paykey | null;
  charge: Charge | null;

  // Terminal
  terminalHistory: TerminalLine[];
  isExecuting: boolean;

  // API Logs
  apiLogs: APILogEntry[];

  // SSE Connection
  isConnected: boolean;
  connectionError: string | null;

  // Actions
  setCustomer: (customer: Customer | null) => void;
  setPaykey: (paykey: Paykey | null) => void;
  setCharge: (charge: Charge | null) => void;

  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => string;
  addAPILogEntry: (entry: { type: 'ui-action'; text: string }) => string;
  clearTerminal: () => void;
  setExecuting: (executing: boolean) => void;
  associateAPILogsWithCommand: (commandId: string, logs: APILogEntry[]) => void;

  setApiLogs: (logs: APILogEntry[]) => void;

  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;

  reset: () => void;
}

/**
 * Global demo store
 */
export const useDemoStore = create<DemoState>((set) => ({
  // Initial state
  customer: null,
  paykey: null,
  charge: null,
  terminalHistory: [
    {
      id: uuid(),
      text: 'STRADDLE DEMO TERMINAL v1.0',
      type: 'success',
      timestamp: new Date(),
    },
    {
      id: uuid(),
      text: 'Type /help for available commands',
      type: 'info',
      timestamp: new Date(),
    },
  ],
  isExecuting: false,
  apiLogs: [],
  isConnected: false,
  connectionError: null,

  // Actions
  setCustomer: (customer) => set({ customer }),
  setPaykey: (paykey) => set({ paykey }),
  setCharge: (charge) => set({ charge }),

  addTerminalLine: (line) => {
    const id = uuid();
    set((state) => ({
      terminalHistory: [
        ...state.terminalHistory,
        {
          ...line,
          id,
          timestamp: new Date(),
        },
      ],
    }));
    return id;
  },

  addAPILogEntry: (entry) => {
    const id = uuid();
    set((state) => ({
      terminalHistory: [
        ...state.terminalHistory,
        {
          id,
          text: entry.text,
          type: 'info' as const,
          timestamp: new Date(),
          source: 'ui-action' as const,
        },
      ],
    }));
    return id;
  },

  clearTerminal: () =>
    set({
      terminalHistory: [
        {
          id: uuid(),
          text: 'Terminal cleared',
          type: 'info',
          timestamp: new Date(),
        },
      ],
    }),

  setExecuting: (isExecuting) => set({ isExecuting }),

  associateAPILogsWithCommand: (commandId: string, logs: APILogEntry[]) =>
    set((state) => {
      const updatedHistory = state.terminalHistory.map((line) =>
        line.id === commandId ? { ...line, apiLogs: [...(line.apiLogs || []), ...logs] } : line
      );
      return { terminalHistory: updatedHistory };
    }),

  setApiLogs: (apiLogs) => set({ apiLogs }),
  setConnected: (isConnected) => set({ isConnected }),
  setConnectionError: (connectionError) => set({ connectionError }),

  reset: () =>
    set({
      customer: null,
      paykey: null,
      charge: null,
      isExecuting: false,
      apiLogs: [],
      terminalHistory: [
        {
          id: uuid(),
          text: 'State reset. Type /help for available commands',
          type: 'info',
          timestamp: new Date(),
        },
      ],
      connectionError: null,
    }),
}));
