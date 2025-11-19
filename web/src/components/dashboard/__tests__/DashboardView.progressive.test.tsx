import { render } from '@testing-library/react';
import { DashboardView } from '../DashboardView';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DemoState } from '@/lib/state';

// Mock state for each test
let mockState: Partial<DemoState> = {};

// Mock the Zustand store
vi.mock('@/lib/state', () => ({
  useDemoStore: vi.fn(<T,>(selector?: (state: Partial<DemoState>) => T): T | Partial<DemoState> => {
    if (!selector) {
      return mockState;
    }
    return selector(mockState);
  }),
}));

describe('DashboardView Progressive Disclosure', () => {
  beforeEach(() => {
    // Reset mock state
    mockState = {
      customer: null,
      paykey: null,
      charge: null,
      getCardDisplayState: () => ({
        layout: 'empty',
        customerWidth: 'full',
        paykeyVisible: true,
        paykeyMode: 'empty',
        chargeMode: 'empty',
        showCircularTracker: false,
      }),
    };
  });

  it('empty state shows all empty cards', () => {
    mockState = {
      customer: null,
      paykey: null,
      charge: null,
      getCardDisplayState: () => ({
        layout: 'empty',
        customerWidth: 'full',
        paykeyVisible: true,
        paykeyMode: 'empty',
        chargeMode: 'empty',
        showCircularTracker: false,
      }),
    };

    const { container } = render(<DashboardView />);

    // Should show customer, paykey, charge cards (all empty)
    expect(container.querySelector('[data-layout="empty"]')).toBeInTheDocument();
  });

  it('customer-only state shows full-width customer', () => {
    mockState = {
      customer: { id: 'cust_123', name: 'Test' } as any,
      paykey: null,
      charge: null,
      getCardDisplayState: () => ({
        layout: 'customer-only',
        customerWidth: 'full',
        paykeyVisible: true,
        paykeyMode: 'empty',
        chargeMode: 'empty',
        showCircularTracker: false,
      }),
    };

    const { container } = render(<DashboardView />);
    expect(container.querySelector('[data-layout="customer-only"]')).toBeInTheDocument();
  });

  it('customer-paykey state shows 60/40 split', () => {
    mockState = {
      customer: { id: 'cust_123' } as any,
      paykey: { id: 'pk_123', status: 'active' } as any,
      charge: null,
      getCardDisplayState: () => ({
        layout: 'customer-paykey',
        customerWidth: '60',
        paykeyVisible: true,
        paykeyMode: 'standalone',
        chargeMode: 'empty',
        showCircularTracker: false,
      }),
    };

    const { container } = render(<DashboardView />);
    expect(container.querySelector('[data-layout="customer-paykey"]')).toBeInTheDocument();
  });

  it('customer-charge state shows 50/50 with embedded paykey', () => {
    mockState = {
      customer: { id: 'cust_123' } as any,
      paykey: { id: 'pk_123', status: 'active' } as any,
      charge: { id: 'chg_123', status: 'created', amount: 5000 } as any,
      getCardDisplayState: () => ({
        layout: 'customer-charge',
        customerWidth: '50',
        paykeyVisible: false,
        paykeyMode: 'embedded',
        chargeMode: 'with-embedded-paykey',
        showCircularTracker: false,
      }),
    };

    const { container } = render(<DashboardView />);
    expect(container.querySelector('[data-layout="customer-charge"]')).toBeInTheDocument();
  });

  it('tracker-featured state shows circular tracker', () => {
    mockState = {
      customer: { id: 'cust_123' } as any,
      paykey: { id: 'pk_123', status: 'active' } as any,
      charge: { id: 'chg_123', status: 'scheduled', amount: 5000 } as any,
      getCardDisplayState: () => ({
        layout: 'tracker-featured',
        customerWidth: 'compact',
        paykeyVisible: false,
        paykeyMode: 'in-tracker',
        chargeMode: 'hidden',
        showCircularTracker: true,
      }),
    };

    const { container } = render(<DashboardView />);
    expect(container.querySelector('[data-layout="tracker-featured"]')).toBeInTheDocument();
    expect(container.querySelector('[data-component="circular-tracker"]')).toBeInTheDocument();
  });
});
