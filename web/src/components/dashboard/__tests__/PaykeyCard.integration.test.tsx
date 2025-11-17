import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PaykeyCard } from '../PaykeyCard';
import { useDemoStore } from '@/lib/state';

vi.mock('@/lib/state');

describe('PaykeyCard Integration', () => {
  it('should display name match verification for plaid paykey', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      source: 'plaid',
      institution_name: 'Chase Bank',
      review: {
        verification_details: {
          breakdown: {
            name_match: {
              decision: 'accept',
              correlation_score: 0.95,
              customer_name: 'John Smith',
              matched_name: 'John A Smith',
            },
          },
        },
      },
    };

    vi.mocked(useDemoStore).mockImplementation(<T,>(selector: (state: any) => T): T => {
      return selector({
        paykey: mockPaykey,
        customer: { name: 'John Smith' },
      });
    });

    const { getByText } = render(<PaykeyCard />);

    // Click SHOW to expand
    fireEvent.click(getByText('SHOW'));

    // Should display name match content
    expect(getByText('Name Match')).toBeInTheDocument();
    expect(
      getByText((_content, element) => {
        return element?.textContent === '• HIGH';
      })
    ).toBeInTheDocument();
    expect(getByText('Correlation Score')).toBeInTheDocument();
    expect(getByText('Customer:')).toBeInTheDocument();
    expect(getByText('Matched:')).toBeInTheDocument();
    expect(getByText('John A Smith')).toBeInTheDocument();
  });

  it('should display account validation for bank_account paykey', () => {
    const mockPaykey = {
      id: 'pk_456',
      status: 'review',
      source: 'bank_account',
      institution_name: 'Wells Fargo',
      review: {
        verification_details: {
          breakdown: {
            account_validation: {
              decision: 'review',
              reason: 'Manual review required',
              codes: ['BR001'],
            },
          },
          messages: {
            BR001: 'Risk indicator detected',
          },
        },
      },
    };

    vi.mocked(useDemoStore).mockImplementation(<T,>(selector: (state: any) => T): T => {
      return selector({
        paykey: mockPaykey,
        customer: null,
      });
    });

    const { getByText, getByRole } = render(<PaykeyCard />);

    // Should show pulsing REVIEW button
    const reviewButton = getByRole('button', { name: 'REVIEW' });
    expect(reviewButton.className).toContain('animate-pulse');

    // Click SHOW to expand
    fireEvent.click(getByText('SHOW'));

    // Should display account validation content
    expect(getByText('Account Validation')).toBeInTheDocument();
    expect(getByText('Manual review required')).toBeInTheDocument();
    expect(getByText('BR001')).toBeInTheDocument();
    expect(getByText('Risk indicator detected')).toBeInTheDocument();
  });
});
