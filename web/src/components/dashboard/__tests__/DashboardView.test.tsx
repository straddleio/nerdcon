import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardView } from '../DashboardView';
import { useDemoStore } from '@/lib/state';

describe('DashboardView', () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
  });

  it('should render all dashboard cards', () => {
    render(<DashboardView />);

    // Check that all major cards are present
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Paykey')).toBeInTheDocument();
    expect(screen.getByText('Payment Charge')).toBeInTheDocument();
  });

  it('should render customer card with no data state', () => {
    render(<DashboardView />);

    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText(/No customer created/i)).toBeInTheDocument();
  });

  it('should render paykey card with no data state', () => {
    render(<DashboardView />);

    expect(screen.getByText('Paykey')).toBeInTheDocument();
    expect(screen.getByText(/No bank account linked/i)).toBeInTheDocument();
  });

  it('should render charge card with no data state', () => {
    render(<DashboardView />);

    expect(screen.getByText('Payment Charge')).toBeInTheDocument();
    expect(screen.getByText(/No charge created/i)).toBeInTheDocument();
  });

  it('should render customer card with customer data', () => {
    useDemoStore.getState().setCustomer({
      id: 'cust_123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+12125551234',
      verification_status: 'verified',
      risk_score: 10,
    });

    render(<DashboardView />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('VERIFIED')).toBeInTheDocument();
  });

  it('should render paykey card with paykey data', () => {
    useDemoStore.getState().setPaykey({
      id: 'pk_123',
      paykey: 'pk_test_123',
      customer_id: 'cust_test_123',
      status: 'active',
      source: 'bank_account',
      label: 'Chase Checking',
      institution_name: 'JPMORGAN CHASE BANK, NA',
      last4: '1234',
      account_type: 'checking',
      balance: {
        account_balance: 500000, // $5000.00
        status: 'completed',
      },
    });

    render(<DashboardView />);

    expect(screen.getByText('JPMORGAN CHASE BANK')).toBeInTheDocument();
    expect(screen.getByText('Checking ••••1234')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('should render charge card with charge data', () => {
    useDemoStore.getState().setCharge({
      id: 'charge_123',
      paykey: 'pk_test_123',
      amount: 5000,
      status: 'paid',
      payment_date: '2025-11-19',
      currency: 'USD',
      description: 'Test charge',
    });

    render(<DashboardView />);

    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('Test charge')).toBeInTheDocument();
  });

  it('should render pizza tracker', () => {
    const { container } = render(<DashboardView />);

    // Pizza tracker should be present (even without charge data)
    // It's in the third animate-pixel-fade-in div
    const animatedContainers = container.querySelectorAll('.animate-pixel-fade-in');
    expect(animatedContainers.length).toBeGreaterThanOrEqual(3);
  });

  it('should render cards in correct layout structure', () => {
    const { container } = render(<DashboardView />);

    // Check for grid layout for paykey and charge cards
    const gridContainer = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should apply animation delays to cards', () => {
    const { container } = render(<DashboardView />);

    // Check for animation classes and delays
    const animatedElements = container.querySelectorAll('.animate-pixel-fade-in');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should render all cards when full demo state is populated', () => {
    // Set full demo state with "created" status to show customer+charge layout
    // (status "paid" would trigger tracker-featured layout)
    useDemoStore.getState().setCustomer({
      id: 'cust_123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+12125551234',
      verification_status: 'verified',
      risk_score: 10,
    });

    useDemoStore.getState().setPaykey({
      id: 'pk_123',
      paykey: 'pk_test_123',
      customer_id: 'cust_123',
      status: 'active',
      source: 'bank_account',
      label: 'Chase Checking',
      institution_name: 'JPMORGAN CHASE BANK, NA',
      last4: '1234',
      account_type: 'checking',
    });

    useDemoStore.getState().setCharge({
      id: 'charge_123',
      paykey: 'pk_test_123',
      amount: 5000,
      status: 'created',
      payment_date: '2025-11-19',
      currency: 'USD',
    });

    render(<DashboardView />);

    // With progressive disclosure: customer+charge layout shows customer and charge cards
    // Paykey is embedded in charge card (not visible in standalone card)
    const testUserElements = screen.getAllByText('Test User');
    expect(testUserElements.length).toBeGreaterThan(0);
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });
});
