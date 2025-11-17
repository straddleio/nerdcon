interface PaykeyWithReview {
  source?: string;
  review?: {
    verification_details?: {
      breakdown?: {
        account_validation?: {
          decision: string;
        };
        name_match?: {
          decision: string;
        };
      };
    };
  };
}

export const getCorrelationBucket = (score?: number | null): string => {
  if (!score && score !== 0) {
    return 'UNKNOWN';
  }
  if (score === 1.0) {
    return 'EXACT';
  }
  if (score > 0.8) {
    return 'HIGH';
  }
  if (score >= 0.2) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const getDecisionLabel = (decision: string): string => {
  switch (decision) {
    case 'accept':
      return 'PASS';
    case 'review':
      return 'REVIEW';
    case 'reject':
      return 'FAIL';
    default:
      return 'UNKNOWN';
  }
};

export const getDecisionColor = (decision: string): string => {
  switch (decision) {
    case 'accept':
      return 'text-green-500';
    case 'review':
      return 'text-gold';
    case 'reject':
      return 'text-accent';
    default:
      return 'text-neutral-400';
  }
};

export const hasVerificationData = (paykey: PaykeyWithReview): boolean => {
  const verification = paykey?.review?.verification_details;
  if (!verification) {
    return false;
  }

  // Check based on paykey source
  if (paykey?.source === 'bank_account') {
    return verification.breakdown?.account_validation?.decision !== 'unknown';
  } else {
    return verification.breakdown?.name_match?.decision !== 'unknown';
  }
};
