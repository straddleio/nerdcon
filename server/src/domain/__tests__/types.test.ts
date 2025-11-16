import { SANDBOX_OUTCOMES, CustomerOutcome, PaykeyOutcome, ChargeOutcome } from '../types.js';

describe('Sandbox Outcome Types', () => {
  describe('CustomerOutcome', () => {
    it('should include all documented customer outcomes', () => {
      const expected: CustomerOutcome[] = ['standard', 'verified', 'review', 'rejected'];
      expect(SANDBOX_OUTCOMES.customer).toEqual(expected);
    });

    it('should not include invalid outcomes', () => {
      expect(SANDBOX_OUTCOMES.customer).not.toContain('inactive');
    });
  });

  describe('PaykeyOutcome', () => {
    it('should include all documented paykey outcomes', () => {
      const expected: PaykeyOutcome[] = ['standard', 'active', 'rejected'];
      expect(SANDBOX_OUTCOMES.paykey).toEqual(expected);
    });

    it('should not include inactive as valid outcome', () => {
      expect(SANDBOX_OUTCOMES.paykey).not.toContain('inactive');
    });
  });

  describe('ChargeOutcome', () => {
    it('should include all documented charge outcomes', () => {
      const expected: ChargeOutcome[] = [
        'standard',
        'paid',
        'on_hold_daily_limit',
        'cancelled_for_fraud_risk',
        'cancelled_for_balance_check',
        'failed_insufficient_funds',
        'failed_customer_dispute',
        'failed_closed_bank_account',
        'reversed_insufficient_funds',
        'reversed_customer_dispute',
        'reversed_closed_bank_account',
      ];
      expect(SANDBOX_OUTCOMES.charge.sort()).toEqual(expected.sort());
    });
  });
});
