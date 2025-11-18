import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useDemoStore } from '../state';

describe('useSSE - UI Action Association', () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should associate API logs with UI actions via info type', () => {
    // Simulate UI action creating terminal entry
    const actionId = useDemoStore.getState().addAPILogEntry({
      type: 'ui-action',
      text: 'Fetching data...',
    });

    // Simulate SSE api_log event arriving
    const mockLog = {
      requestId: 'req-999',
      correlationId: 'corr-999',
      method: 'GET',
      path: '/customers/123/unmask',
      statusCode: 200,
      duration: 450,
      timestamp: new Date().toISOString(),
    };

    // Manually trigger the association logic (simulate SSE event)
    act(() => {
      const store = useDemoStore.getState();
      store.setApiLogs([mockLog, ...store.apiLogs]);

      const recentCommand = store.terminalHistory
        .filter((line) => line.type === 'input' || line.type === 'info')
        .reverse()
        .find((line) => {
          const timeDiff = Date.now() - line.timestamp.getTime();
          return timeDiff < 10000;
        });

      if (recentCommand) {
        store.associateAPILogsWithCommand(recentCommand.id, [mockLog]);
      }
    });

    // Get fresh state after association
    const finalState = useDemoStore.getState();
    const actionLine = finalState.terminalHistory.find((l) => l.id === actionId);
    expect(actionLine?.apiLogs).toBeDefined();
    expect(actionLine?.apiLogs?.length).toBe(1);
  });
});
