import { describe, it, expect, beforeEach } from 'vitest';
import { useDemoStore } from '../state';
import type { Customer, Paykey, Charge } from '../api';

describe('Demo Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useDemoStore.setState({
      customer: null,
      paykey: null,
      charge: null,
      terminalHistory: [],
      isExecuting: false,
      apiLogs: [],
      isConnected: false,
      connectionError: null,
    });
  });

  it('should initialize with null resource state', () => {
    const state = useDemoStore.getState();

    expect(state.customer).toBeNull();
    expect(state.paykey).toBeNull();
    expect(state.charge).toBeNull();
  });

  it('should initialize with empty API logs', () => {
    const state = useDemoStore.getState();

    expect(state.apiLogs).toEqual([]);
  });

  it('should initialize as disconnected', () => {
    const state = useDemoStore.getState();

    expect(state.isConnected).toBe(false);
    expect(state.connectionError).toBeNull();
  });

  it('should update customer state', () => {
    const customer: Customer = {
      id: 'cust_123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+12125550123',
      verification_status: 'verified',
    };

    useDemoStore.getState().setCustomer(customer);
    const state = useDemoStore.getState();

    expect(state.customer).toEqual(customer);
  });

  it('should update paykey state', () => {
    const paykey: Paykey = {
      id: 'paykey_123',
      paykey: 'token_abc',
      customer_id: 'cust_123',
      status: 'active',
      institution_name: 'Chase Bank',
      bank_data: {
        account_number: '*****1234',
        account_type: 'checking',
        routing_number: '021000021',
      },
    };

    useDemoStore.getState().setPaykey(paykey);
    const state = useDemoStore.getState();

    expect(state.paykey).toEqual(paykey);
  });

  it('should update charge state', () => {
    const charge: Charge = {
      id: 'charge_123',
      amount: 5000,
      currency: 'USD',
      status: 'paid',
      paykey: 'token_abc',
      description: 'Test payment',
    };

    useDemoStore.getState().setCharge(charge);
    const state = useDemoStore.getState();

    expect(state.charge).toEqual(charge);
  });

  it('should add terminal lines with timestamps', () => {
    const lineId = useDemoStore.getState().addTerminalLine({
      text: 'Test command',
      type: 'input',
    });

    const state = useDemoStore.getState();
    const addedLine = state.terminalHistory.find((line) => line.id === lineId);

    expect(addedLine).toBeDefined();
    expect(addedLine?.text).toBe('Test command');
    expect(addedLine?.type).toBe('input');
    expect(addedLine?.timestamp).toBeInstanceOf(Date);
  });

  it('should clear terminal history', () => {
    // Add some lines
    useDemoStore.getState().addTerminalLine({ text: 'Line 1', type: 'output' });
    useDemoStore.getState().addTerminalLine({ text: 'Line 2', type: 'output' });

    // Clear
    useDemoStore.getState().clearTerminal();

    const state = useDemoStore.getState();
    expect(state.terminalHistory).toHaveLength(1);
    expect(state.terminalHistory[0].text).toBe('Terminal cleared');
  });

  it('should manage execution state', () => {
    const state = useDemoStore.getState();

    expect(state.isExecuting).toBe(false);

    useDemoStore.getState().setExecuting(true);
    expect(useDemoStore.getState().isExecuting).toBe(true);

    useDemoStore.getState().setExecuting(false);
    expect(useDemoStore.getState().isExecuting).toBe(false);
  });

  it('should associate API logs with terminal commands', () => {
    const lineId = useDemoStore.getState().addTerminalLine({
      text: '/customer-create',
      type: 'input',
    });

    const apiLogs = [
      {
        requestId: 'req_123',
        correlationId: 'corr_123',
        method: 'POST',
        path: '/api/customers',
        statusCode: 200,
        duration: 250,
        timestamp: new Date().toISOString(),
      },
    ];

    useDemoStore.getState().associateAPILogsWithCommand(lineId, apiLogs);

    const state = useDemoStore.getState();
    const commandLine = state.terminalHistory.find((line) => line.id === lineId);

    expect(commandLine?.apiLogs).toEqual(apiLogs);
  });

  it('should update API logs', () => {
    const logs = [
      {
        requestId: 'req_1',
        correlationId: 'corr_1',
        method: 'POST',
        path: '/api/customers',
        statusCode: 200,
        duration: 100,
        timestamp: new Date().toISOString(),
      },
      {
        requestId: 'req_2',
        correlationId: 'corr_2',
        method: 'GET',
        path: '/api/state',
        statusCode: 200,
        duration: 50,
        timestamp: new Date().toISOString(),
      },
    ];

    useDemoStore.getState().setApiLogs(logs);

    expect(useDemoStore.getState().apiLogs).toEqual(logs);
    expect(useDemoStore.getState().apiLogs).toHaveLength(2);
  });

  it('should manage connection state', () => {
    useDemoStore.getState().setConnected(true);
    expect(useDemoStore.getState().isConnected).toBe(true);

    useDemoStore.getState().setConnected(false);
    expect(useDemoStore.getState().isConnected).toBe(false);
  });

  it('should manage connection errors', () => {
    useDemoStore.getState().setConnectionError('Failed to connect');
    expect(useDemoStore.getState().connectionError).toBe('Failed to connect');

    useDemoStore.getState().setConnectionError(null);
    expect(useDemoStore.getState().connectionError).toBeNull();
  });

  it('should reset all state', () => {
    // Set some state
    const customer: Customer = {
      id: 'cust_123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+12125550123',
      verification_status: 'verified',
    };

    const paykey: Paykey = {
      id: 'paykey_123',
      paykey: 'token_abc',
      customer_id: 'cust_123',
      status: 'active',
    };

    const charge: Charge = {
      id: 'charge_123',
      amount: 5000,
      currency: 'USD',
      status: 'paid',
      paykey: 'token_abc',
    };

    useDemoStore.getState().setCustomer(customer);
    useDemoStore.getState().setPaykey(paykey);
    useDemoStore.getState().setCharge(charge);
    useDemoStore.getState().setExecuting(true);
    useDemoStore.getState().addTerminalLine({ text: 'Test', type: 'output' });
    useDemoStore.getState().setApiLogs([
      {
        requestId: 'req_1',
        correlationId: 'corr_1',
        method: 'GET',
        path: '/test',
        statusCode: 200,
        duration: 100,
        timestamp: new Date().toISOString(),
      },
    ]);
    useDemoStore.getState().setConnectionError('Error');

    // Reset
    useDemoStore.getState().reset();

    const state = useDemoStore.getState();
    expect(state.customer).toBeNull();
    expect(state.paykey).toBeNull();
    expect(state.charge).toBeNull();
    expect(state.isExecuting).toBe(false);
    expect(state.apiLogs).toEqual([]);
    expect(state.connectionError).toBeNull();
    expect(state.terminalHistory).toHaveLength(1);
    expect(state.terminalHistory[0].text).toContain('State reset');
  });

  it('should handle setting null values for resources', () => {
    // Set initial values
    const customer: Customer = {
      id: 'cust_123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+12125550123',
      verification_status: 'verified',
    };

    useDemoStore.getState().setCustomer(customer);
    expect(useDemoStore.getState().customer).not.toBeNull();

    // Clear values
    useDemoStore.getState().setCustomer(null);
    useDemoStore.getState().setPaykey(null);
    useDemoStore.getState().setCharge(null);

    const state = useDemoStore.getState();
    expect(state.customer).toBeNull();
    expect(state.paykey).toBeNull();
    expect(state.charge).toBeNull();
  });
});

describe('useDemoStore - API Log Entry', () => {
  beforeEach(() => {
    // Reset store state
    useDemoStore.getState().reset();
  });

  it('should add API log entry with terminal line', () => {
    const initialLength = useDemoStore.getState().terminalHistory.length;

    const commandId = useDemoStore.getState().addAPILogEntry({
      type: 'ui-action',
      text: 'Fetching unmasked customer data...',
    });

    const store = useDemoStore.getState();
    expect(commandId).toBeDefined();
    expect(store.terminalHistory).toHaveLength(initialLength + 1);

    const lastLine = store.terminalHistory[store.terminalHistory.length - 1];
    expect(lastLine.id).toBe(commandId);
    expect(lastLine.text).toBe('Fetching unmasked customer data...');
    expect(lastLine.type).toBe('info');
  });

  it('should allow associating logs with returned command ID', () => {
    const commandId = useDemoStore.getState().addAPILogEntry({
      type: 'ui-action',
      text: 'Fetching data...',
    });

    const mockLog = {
      requestId: 'req-123',
      correlationId: 'corr-456',
      method: 'GET',
      path: '/customers/123/unmask',
      statusCode: 200,
      duration: 500,
      timestamp: new Date().toISOString(),
    };

    useDemoStore.getState().associateAPILogsWithCommand(commandId, [mockLog]);

    const store = useDemoStore.getState();
    const line = store.terminalHistory.find((l) => l.id === commandId);
    expect(line?.apiLogs).toHaveLength(1);
    expect(line?.apiLogs?.[0]).toEqual(mockLog);
  });
});

describe('API Log Association with UI Actions', () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
  });

  it('should associate logs with most recent entry regardless of type', () => {
    // Add a terminal command
    useDemoStore.getState().addTerminalLine({ text: '/customer-create', type: 'input' });

    // Add a UI action
    const uiActionId = useDemoStore.getState().addAPILogEntry({
      type: 'ui-action',
      text: 'Fetching data...',
    });

    const mockLog = {
      requestId: 'req-789',
      correlationId: 'corr-789',
      method: 'GET',
      path: '/customers/123',
      statusCode: 200,
      duration: 300,
      timestamp: new Date().toISOString(),
    };

    useDemoStore.getState().associateAPILogsWithCommand(uiActionId, [mockLog]);

    // Get fresh state after all updates
    const finalState = useDemoStore.getState();
    const uiLine = finalState.terminalHistory.find((l) => l.id === uiActionId);
    expect(uiLine).toBeDefined();
    expect(uiLine?.apiLogs).toBeDefined();
    expect(uiLine?.apiLogs).toHaveLength(1);
  });
});
