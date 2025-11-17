import { describe, it, expect } from 'vitest';
import {
  getCorrelationBucket,
  getDecisionLabel,
  getDecisionColor,
  hasVerificationData,
} from '../PaykeyCard.helpers';

describe('PaykeyCard Helpers', () => {
  describe('getCorrelationBucket', () => {
    it('should return EXACT for score of 1.0', () => {
      expect(getCorrelationBucket(1.0)).toBe('EXACT');
    });

    it('should return HIGH for score > 0.8', () => {
      expect(getCorrelationBucket(0.9)).toBe('HIGH');
      expect(getCorrelationBucket(0.81)).toBe('HIGH');
    });

    it('should return MEDIUM for score 0.2 to 0.8', () => {
      expect(getCorrelationBucket(0.8)).toBe('MEDIUM');
      expect(getCorrelationBucket(0.5)).toBe('MEDIUM');
      expect(getCorrelationBucket(0.2)).toBe('MEDIUM');
    });

    it('should return LOW for score < 0.2', () => {
      expect(getCorrelationBucket(0.19)).toBe('LOW');
      expect(getCorrelationBucket(0.1)).toBe('LOW');
      expect(getCorrelationBucket(0)).toBe('LOW');
    });

    it('should return UNKNOWN for null or undefined', () => {
      expect(getCorrelationBucket(null)).toBe('UNKNOWN');
      expect(getCorrelationBucket(undefined)).toBe('UNKNOWN');
    });
  });

  describe('getDecisionLabel', () => {
    it('should map decision values to labels', () => {
      expect(getDecisionLabel('accept')).toBe('PASS');
      expect(getDecisionLabel('review')).toBe('REVIEW');
      expect(getDecisionLabel('reject')).toBe('FAIL');
      expect(getDecisionLabel('unknown')).toBe('UNKNOWN');
      expect(getDecisionLabel('invalid')).toBe('UNKNOWN');
    });
  });

  describe('getDecisionColor', () => {
    it('should return correct color classes for decisions', () => {
      expect(getDecisionColor('accept')).toBe('text-green-500');
      expect(getDecisionColor('review')).toBe('text-gold');
      expect(getDecisionColor('reject')).toBe('text-accent');
      expect(getDecisionColor('unknown')).toBe('text-neutral-400');
      expect(getDecisionColor('invalid')).toBe('text-neutral-400');
    });
  });

  describe('hasVerificationData', () => {
    it('should return false when no review data', () => {
      expect(hasVerificationData({})).toBe(false);
      expect(hasVerificationData({ review: undefined })).toBe(false);
    });

    it('should return false when no verification_details', () => {
      expect(hasVerificationData({ review: {} })).toBe(false);
    });

    it('should return true for bank_account with valid account_validation', () => {
      const paykey = {
        source: 'bank_account',
        review: {
          verification_details: {
            breakdown: {
              account_validation: { decision: 'accept' },
            },
          },
        },
      };
      expect(hasVerificationData(paykey)).toBe(true);
    });

    it('should return false for bank_account with unknown decision', () => {
      const paykey = {
        source: 'bank_account',
        review: {
          verification_details: {
            breakdown: {
              account_validation: { decision: 'unknown' },
            },
          },
        },
      };
      expect(hasVerificationData(paykey)).toBe(false);
    });

    it('should return true for plaid with valid name_match', () => {
      const paykey = {
        source: 'plaid',
        review: {
          verification_details: {
            breakdown: {
              name_match: { decision: 'review' },
            },
          },
        },
      };
      expect(hasVerificationData(paykey)).toBe(true);
    });

    it('should return false for plaid with unknown decision', () => {
      const paykey = {
        source: 'plaid',
        review: {
          verification_details: {
            breakdown: {
              name_match: { decision: 'unknown' },
            },
          },
        },
      };
      expect(hasVerificationData(paykey)).toBe(false);
    });
  });
});
