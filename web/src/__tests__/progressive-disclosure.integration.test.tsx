import { render, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { useDemoStore } from '@/lib/state';

/**
 * Integration test for progressive disclosure flow
 * Tests the complete user journey from empty state to featured tracker
 */
describe('Progressive Disclosure Integration', () => {
  beforeEach(() => {
    // Reset store to empty state
    act(() => {
      useDemoStore.getState().setCustomer(null);
      useDemoStore.getState().setPaykey(null);
      useDemoStore.getState().setCharge(null);
    });
  });

  test('complete flow from empty to featured tracker', async () => {
    const { container, rerender } = render(<DashboardView />);

    // Step 1: Empty state
    expect(container.querySelector('[data-layout="empty"]')).toBeInTheDocument();

    // Step 2: Add customer
    act(() => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'verified',
        risk_score: 0.15,
      } as any);
    });
    rerender(<DashboardView />);

    await waitFor(() => {
      expect(container.querySelector('[data-layout="customer-only"]')).toBeInTheDocument();
    });

    // Step 3: Add paykey - 60/40 split
    act(() => {
      useDemoStore.getState().setPaykey({
        id: 'pk_123',
        status: 'active',
        paykey: 'test_paykey_token',
        institution_name: 'Test Bank',
        balance: { account_balance: 100000 },
      } as any);
    });
    rerender(<DashboardView />);

    await waitFor(() => {
      expect(container.querySelector('[data-layout="customer-paykey"]')).toBeInTheDocument();
      // Verify 60/40 grid
      expect(container.querySelector('.lg\\:col-span-3')).toBeInTheDocument();
      expect(container.querySelector('.lg\\:col-span-2')).toBeInTheDocument();
    });

    // Step 4: Add charge - 50/50 split, embedded paykey
    act(() => {
      useDemoStore.getState().setCharge({
        id: 'chg_123',
        status: 'created',
        amount: 5000,
        payment_rail: 'ach',
        status_history: [{ status: 'created', timestamp: new Date().toISOString() }],
      } as any);
    });
    rerender(<DashboardView />);

    await waitFor(() => {
      expect(container.querySelector('[data-layout="customer-charge"]')).toBeInTheDocument();
      // Verify 50/50 grid
      expect(container.querySelector('.lg\\:grid-cols-2')).toBeInTheDocument();
    });

    // Step 5: Charge scheduled - circular tracker
    act(() => {
      useDemoStore.getState().setCharge({
        id: 'chg_123',
        status: 'scheduled',
        amount: 5000,
        payment_rail: 'ach',
        status_history: [
          { status: 'created', timestamp: new Date().toISOString() },
          { status: 'scheduled', timestamp: new Date().toISOString() },
        ],
      } as any);
    });
    rerender(<DashboardView />);

    await waitFor(() => {
      expect(container.querySelector('[data-layout="tracker-featured"]')).toBeInTheDocument();
      expect(container.querySelector('[data-component="circular-tracker"]')).toBeInTheDocument();
      // Verify circular tracker SVG
      const svg = container.querySelector('[data-component="circular-tracker"] svg');
      expect(svg).toBeInTheDocument();
    });
  });

  test('handles backwards navigation gracefully', async () => {
    const { container, rerender } = render(<DashboardView />);

    // Set up full state
    act(() => {
      useDemoStore.getState().setCustomer({ id: 'cust_123', name: 'Test' } as any);
      useDemoStore.getState().setPaykey({ id: 'pk_123', status: 'active' } as any);
      useDemoStore.getState().setCharge({
        id: 'chg_123',
        status: 'scheduled',
      } as any);
    });
    rerender(<DashboardView />);

    // Remove charge - should revert to customer+paykey (60/40)
    act(() => {
      useDemoStore.getState().setCharge(null);
    });
    rerender(<DashboardView />);

    await waitFor(() => {
      expect(container.querySelector('[data-layout="customer-paykey"]')).toBeInTheDocument();
      expect(
        container.querySelector('[data-component="circular-tracker"]')
      ).not.toBeInTheDocument();
    });

    // Remove paykey - should revert to customer-only
    act(() => {
      useDemoStore.getState().setPaykey(null);
    });
    rerender(<DashboardView />);

    await waitFor(() => {
      expect(container.querySelector('[data-layout="customer-only"]')).toBeInTheDocument();
    });
  });
});
