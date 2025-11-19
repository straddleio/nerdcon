import { render, screen, fireEvent } from '@testing-library/react';
import { CircularChargeTracker } from '../CircularChargeTracker';
import { describe, it, expect, vi } from 'vitest';

const mockCharge = {
  id: 'chg_123',
  amount: 5000,
  status: 'scheduled',
  payment_rail: 'ach',
  status_history: [
    { status: 'created', timestamp: '2024-01-01T10:00:00Z' },
    { status: 'scheduled', timestamp: '2024-01-01T10:01:00Z' },
  ],
};

const mockPaykey = {
  id: 'pk_123',
  institution_name: 'Chase Bank',
  last4: '1234',
  balance: { account_balance: 100000 },
  status: 'active',
};

// Mock the Zustand store
vi.mock('@/lib/state', () => ({
  useDemoStore: vi.fn((selector: ((state: unknown) => unknown) | undefined) => {
    const mockState = {
      charge: mockCharge,
      paykey: mockPaykey,
    };
    if (!selector) {
      return mockState;
    }
    return selector(mockState);
  }),
}));

describe('CircularChargeTracker', () => {
  it('renders charge amount in center', () => {
    render(<CircularChargeTracker />);
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('renders current status', () => {
    render(<CircularChargeTracker />);
    expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
  });

  it('renders progress ring', () => {
    const { container } = render(<CircularChargeTracker />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('calculates progress from status history', () => {
    const { container } = render(<CircularChargeTracker />);
    const progressCircle = container.querySelector('circle[stroke-dashoffset]');
    expect(progressCircle).toBeInTheDocument();
  });

  it('shows payment rail badge', () => {
    render(<CircularChargeTracker />);
    expect(screen.getByText('ACH')).toBeInTheDocument();
  });

  it('shows expandable paykey details button', () => {
    render(<CircularChargeTracker />);
    const keyButton = screen.getByRole('button', { name: /payment method/i });
    expect(keyButton).toBeInTheDocument();
  });

  it('expands paykey details when clicked', () => {
    render(<CircularChargeTracker />);

    const keyButton = screen.getByRole('button', { name: /payment method/i });
    fireEvent.click(keyButton);

    expect(screen.getByText('Chase Bank')).toBeInTheDocument();
    expect(screen.getByText(/••••1234/)).toBeInTheDocument();
  });
});
