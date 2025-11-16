/**
 * TypeScript types for Straddle API responses and demo state
 */

export interface DemoCustomer {
  id: string;
  name: string;
  type: 'individual' | 'business';
  email?: string;
  phone?: string;
  verification_status?: string;
  risk_score?: number;
  created_at: string;
  address?: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
  };
  compliance_profile?: {
    ssn?: string; // Masked format: ***-**-****
    dob?: string; // Masked format: ****-**-**
  };
  review?: CustomerReview;
}

export interface CustomerReview {
  review_id: string;
  decision: string;
  messages?: Record<string, string>;
  breakdown: {
    email?: {
      decision: string;
      codes?: string[];
      risk_score?: number;
      correlation_score?: number;
      correlation?: string;
    };
    phone?: {
      decision: string;
      codes?: string[];
      risk_score?: number;
      correlation_score?: number;
      correlation?: string;
    };
    address?: {
      decision: string;
      codes?: string[];
      risk_score?: number;
      correlation_score?: number;
      correlation?: string;
    };
    fraud?: {
      decision: string;
      codes?: string[];
      risk_score?: number;
    };
    synthetic?: {
      decision: string;
      codes?: string[];
      risk_score?: number;
    };
  };
  kyc?: {
    decision: string;
    codes?: string[];
    validations?: {
      address?: boolean;
      city?: boolean;
      dob?: boolean;
      email?: boolean;
      first_name?: boolean;
      last_name?: boolean;
      phone?: boolean;
      ssn?: boolean;
      state?: boolean;
      zip?: boolean;
    };
  };
  reputation?: {
    decision: string;
    codes?: string[];
    risk_score?: number;
    insights?: {
      ach_fraud_transactions_count?: number;
      ach_fraud_transactions_total_amount?: number;
      ach_returned_transactions_count?: number;
      ach_returned_transactions_total_amount?: number;
      card_fraud_transactions_count?: number;
      card_fraud_transactions_total_amount?: number;
      card_disputed_transactions_count?: number;
      card_disputed_transactions_total_amount?: number;
      accounts_count?: number;
      accounts_active_count?: number;
      accounts_fraud_count?: number;
      applications_count?: number;
      [key: string]: any;
    };
  };
  network_alerts?: {
    decision: string;
    codes?: string[];
    alerts?: any[];
  };
  watch_list?: {
    decision: string;
    codes?: string[];
    matches?: Array<{
      correlation: string;
      list_name: string;
      match_fields: string[];
      urls: string[];
    }>;
  };
}

/**
 * Request payload for creating a KYC customer
 */
export interface KYCCustomerRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
  };
  compliance_profile: {
    ssn: string;
    dob: string;  // Format: YYYY-MM-DD
  };
}

/**
 * Validation result for KYC request
 */
export interface KYCValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Helper to validate KYC customer request
 */
export function validateKYCCustomerRequest(data: any): KYCValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Required fields
  if (!data.first_name || typeof data.first_name !== 'string') {
    errors.push({ field: 'first_name', message: 'First name is required' });
  }
  if (!data.last_name || typeof data.last_name !== 'string') {
    errors.push({ field: 'last_name', message: 'Last name is required' });
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!data.phone || !/^\+?[1-9]\d{10,14}$/.test(data.phone)) {
    errors.push({ field: 'phone', message: 'Valid phone number is required (E.164 format)' });
  }

  // Address validation
  if (!data.address) {
    errors.push({ field: 'address', message: 'Address is required' });
  } else {
    if (!data.address.address1) {
      errors.push({ field: 'address.address1', message: 'Address line 1 is required' });
    }
    if (!data.address.city) {
      errors.push({ field: 'address.city', message: 'City is required' });
    }
    if (!data.address.state || data.address.state.length !== 2) {
      errors.push({ field: 'address.state', message: 'Valid 2-letter state code is required' });
    }
    if (!data.address.zip || !/^\d{5}(-\d{4})?$/.test(data.address.zip)) {
      errors.push({ field: 'address.zip', message: 'Valid ZIP code is required' });
    }
  }

  // Compliance profile validation
  if (!data.compliance_profile) {
    errors.push({ field: 'compliance_profile', message: 'Compliance profile is required' });
  } else {
    if (!data.compliance_profile.ssn || !/^\d{3}-\d{2}-\d{4}$/.test(data.compliance_profile.ssn)) {
      errors.push({ field: 'compliance_profile.ssn', message: 'Valid SSN format required (XXX-XX-XXXX)' });
    }
    if (!data.compliance_profile.dob || !/^\d{4}-\d{2}-\d{2}$/.test(data.compliance_profile.dob)) {
      errors.push({ field: 'compliance_profile.dob', message: 'Valid DOB format required (YYYY-MM-DD)' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export interface DemoPaykey {
  id: string;
  paykey: string; // The actual paykey token to use in charges
  customer_id: string;
  status: string;
  label?: string; // Human-readable label from API (e.g., "Chase Bank ****1234")
  institution_name?: string; // Bank name only
  source?: string; // Track source (bank_account, plaid, etc.)
  balance?: {
    status?: string; // Balance fetch status (pending, completed, failed)
    account_balance?: number; // Balance in dollars (not cents)
    updated_at?: string; // When balance was last updated
  };
  bank_data?: {
    account_number?: string; // Masked account number
    account_type?: string;
    routing_number?: string;
  };
  created_at: string; // Timestamp of creation
  updated_at?: string; // Last update timestamp
  // Legacy fields for backward compatibility
  ownership_verified?: boolean;
}

export interface DemoCharge {
  id: string;
  customer_id?: string;
  paykey: string;
  amount: number;
  currency: string;
  status: string;
  payment_date: string;
  created_at: string;
  scheduled_at?: string;
  completed_at?: string;
  failure_reason?: string;
  status_history?: ChargeStatusHistory[];
  sandbox_outcome?: string;
  payment_rail?: string;
  consent_type?: string;
}

export interface ChargeStatusHistory {
  status: string;
  timestamp: string;
  reason?: string;
  message?: string;
  source?: string;
}

/**
 * Sandbox outcome options per Straddle documentation
 * @see https://docs.straddle.io/sandbox-simulation-testing
 */
export type CustomerOutcome = 'standard' | 'verified' | 'review' | 'rejected';

export type PaykeyOutcome = 'standard' | 'active' | 'rejected';

export type ChargeOutcome =
  | 'standard'
  | 'paid'
  | 'on_hold_daily_limit'
  | 'cancelled_for_fraud_risk'
  | 'cancelled_for_balance_check'
  | 'failed_insufficient_funds'
  | 'failed_customer_dispute'
  | 'failed_closed_bank_account'
  | 'reversed_insufficient_funds'
  | 'reversed_customer_dispute'
  | 'reversed_closed_bank_account';

export const SANDBOX_OUTCOMES = {
  customer: ['standard', 'verified', 'review', 'rejected'] as CustomerOutcome[],
  paykey: ['standard', 'active', 'rejected'] as PaykeyOutcome[],
  charge: [
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
  ] as ChargeOutcome[],
} as const;
