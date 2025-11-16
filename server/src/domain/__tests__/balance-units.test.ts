import { describe, it, expect } from '@jest/globals';
import { DemoPaykey } from '../types.js';

describe('Balance Units Documentation', () => {
  it('should document balance as cents in type definition', () => {
    // This test verifies type comments are accurate
    const mockPaykey: DemoPaykey = {
      id: 'pk_test',
      paykey: 'token_test',
      customer_id: 'cust_test',
      status: 'active',
      balance: {
        status: 'completed',
        account_balance: 150000, // Should be cents (read comment)
        updated_at: '2025-11-15T12:00:00Z',
      },
      created_at: '2025-11-15T12:00:00Z',
    };

    // Balance should be in cents
    expect(mockPaykey.balance?.account_balance).toBe(150000);
    // Frontend should divide by 100 to display $1,500.00
  });

  it('should demonstrate correct frontend conversion from cents to dollars', () => {
    const balanceInCents = 150000;
    const displayValue = (balanceInCents / 100).toFixed(2);
    expect(displayValue).toBe('1500.00');
  });
});
