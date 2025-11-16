import { render, waitFor } from '@testing-library/react';
import { APILog } from '../APILog';
import { useDemoStore } from '@/lib/state';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the store
vi.mock('@/lib/state');
vi.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost:3001/api',
}));

describe('APILog auto-expand behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch to prevent API calls
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
    );
  });

  it('should auto-expand the newest log entry at index 0', async () => {
    const mockLogs = [
      {
        requestId: 'newest',
        method: 'POST',
        path: '/charges',
        statusCode: 200,
        duration: 150,
        timestamp: '2025-11-15T12:03:00Z',
      },
      {
        requestId: 'older',
        method: 'GET',
        path: '/customers',
        statusCode: 200,
        duration: 100,
        timestamp: '2025-11-15T12:02:00Z',
      },
      {
        requestId: 'oldest',
        method: 'POST',
        path: '/paykeys',
        statusCode: 201,
        duration: 200,
        timestamp: '2025-11-15T12:01:00Z',
      },
    ];

    // Mock the Zustand store selector
    (useDemoStore as any).mockImplementation((selector: any) => {
      const state = {
        apiLogs: mockLogs,
        setApiLogs: vi.fn(),
      };
      return selector(state);
    });

    // Mock getState for the store
    (useDemoStore as any).getState = vi.fn(() => ({
      apiLogs: mockLogs,
      setApiLogs: vi.fn(),
    }));

    const { container } = render(<APILog />);

    await waitFor(() => {
      // The newest entry (index 0) should be expanded
      // Verify by checking for expanded content or data-testid
      const expandedEntry = container.querySelector('[data-expanded="true"]');
      expect(expandedEntry).toBeTruthy();
      expect(expandedEntry?.textContent).toContain('newest');
    });
  });

  it('should not expand the oldest entry at the bottom', async () => {
    const mockLogs = [
      { requestId: 'newest', method: 'POST', path: '/charges', statusCode: 200, duration: 150, timestamp: '2025-11-15T12:03:00Z' },
      { requestId: 'oldest', method: 'GET', path: '/customers', statusCode: 200, duration: 100, timestamp: '2025-11-15T12:01:00Z' },
    ];

    // Mock the Zustand store selector
    (useDemoStore as any).mockImplementation((selector: any) => {
      const state = {
        apiLogs: mockLogs,
        setApiLogs: vi.fn(),
      };
      return selector(state);
    });

    // Mock getState for the store
    (useDemoStore as any).getState = vi.fn(() => ({
      apiLogs: mockLogs,
      setApiLogs: vi.fn(),
    }));

    const { container } = render(<APILog />);

    await waitFor(() => {
      const expandedEntry = container.querySelector('[data-expanded="true"]');
      expect(expandedEntry?.textContent).not.toContain('oldest');
    });
  });
});
