/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PaykeyCard } from '../PaykeyCard';
import { useDemoStore } from '@/lib/state';

// Mock the store
vi.mock('@/lib/state', () => ({
  useDemoStore: vi.fn(),
}));

describe('PaykeyCard State Management', () => {
  it('should initialize with collapsed verification state', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      review: {
        verification_details: {
          breakdown: {
            account_validation: { decision: 'accept' },
          },
        },
      },
    };

    (useDemoStore as any).mockReturnValue(mockPaykey);

    const { queryByText } = render(<PaykeyCard />);

    // Should show SHOW button, not expanded content
    expect(queryByText('SHOW')).toBeInTheDocument();
    expect(queryByText('HIDE')).not.toBeInTheDocument();
  });

  it('should toggle verification visibility on button click', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      source: 'bank_account',
      review: {
        verification_details: {
          breakdown: {
            account_validation: { decision: 'accept' },
          },
        },
      },
    };

    (useDemoStore as any).mockReturnValue(mockPaykey);

    const { getByText, queryByText } = render(<PaykeyCard />);

    // Click SHOW
    fireEvent.click(getByText('SHOW'));

    // Should now show HIDE and INFO buttons
    expect(queryByText('HIDE')).toBeInTheDocument();
    expect(queryByText('INFO')).toBeInTheDocument();
    expect(queryByText('SHOW')).not.toBeInTheDocument();
  });
});

describe('Review Status Button', () => {
  it('should show pulsing button when status is review', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'review',
      review: {},
    };

    const mockState = { paykey: mockPaykey, customer: null };

    // Mock to return paykey when called with the selector function
    (useDemoStore as any).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        // Explicitly type the return based on selector
        return selector(mockState) as typeof mockPaykey;
      }
      return mockPaykey;
    });

    const { queryByText } = render(<PaykeyCard />);

    // Should show REVIEW as button
    const reviewButton = queryByText('REVIEW');
    expect(reviewButton).toBeInTheDocument();
    expect(reviewButton?.tagName).toBe('BUTTON');

    // Should have pulse animation class
    expect(reviewButton?.className).toContain('animate-pulse');
  });

  it('should show normal badge when status is not review', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      review: {},
    };

    const mockState = { paykey: mockPaykey, customer: null };

    // Mock to return paykey when called with the selector function
    (useDemoStore as any).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        // Explicitly type the return based on selector
        return selector(mockState) as typeof mockPaykey;
      }
      return mockPaykey;
    });

    const { queryByText } = render(<PaykeyCard />);

    const activeLabel = queryByText('ACTIVE');
    expect(activeLabel).toBeInTheDocument();
    expect(activeLabel?.tagName).not.toBe('BUTTON');
  });
});
