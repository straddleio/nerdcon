import { SANDBOX_OUTCOMES, PaykeyOutcome } from '../../domain/types.js';

describe('Bridge Route Validation', () => {
  describe('Paykey Outcome Validation Logic', () => {
    // Simulate the validation logic that will be in bridge.ts
    const validateOutcome = (outcome: string): boolean => {
      return SANDBOX_OUTCOMES.paykey.includes(outcome as PaykeyOutcome);
    };

    it('should accept all valid paykey outcomes from SANDBOX_OUTCOMES', () => {
      for (const outcome of SANDBOX_OUTCOMES.paykey) {
        expect(validateOutcome(outcome)).toBe(true);
      }
    });

    it('should reject "inactive" as invalid paykey outcome', () => {
      expect(validateOutcome('inactive')).toBe(false);
    });

    it('should reject other invalid outcomes', () => {
      expect(validateOutcome('invalid_outcome')).toBe(false);
      expect(validateOutcome('pending')).toBe(false);
      expect(validateOutcome('')).toBe(false);
    });

    it('should confirm SANDBOX_OUTCOMES.paykey does not include inactive', () => {
      expect(SANDBOX_OUTCOMES.paykey).not.toContain('inactive');
    });

    it('should confirm SANDBOX_OUTCOMES.paykey includes standard, active, rejected', () => {
      expect(SANDBOX_OUTCOMES.paykey).toContain('standard');
      expect(SANDBOX_OUTCOMES.paykey).toContain('active');
      expect(SANDBOX_OUTCOMES.paykey).toContain('rejected');
    });
  });
});
