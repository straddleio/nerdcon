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
  compliance_profile?:
    | {
        // Individual compliance fields
        ssn?: string; // Masked format: ***-**-****
        dob?: string; // Masked format: ****-**-**
      }
    | {
        // Business compliance fields
        ein?: string; // Masked format: **-*******
        legal_business_name?: string;
        website?: string;
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
      [key: string]: unknown;
    };
  };
  network_alerts?: {
    decision: string;
    codes?: string[];
    alerts?: unknown[];
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
 * Matches Straddle SDK CustomerCreateParams structure
 */
export interface KYCCustomerRequest {
  name: string; // Full name (not first_name/last_name - those don't exist in SDK)
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
    dob: string; // Format: YYYY-MM-DD
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
export function validateKYCCustomerRequest(data: unknown): KYCValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Type guard: ensure data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push({ field: 'data', message: 'Request data must be an object' });
    return { isValid: false, errors };
  }

  const obj = data as Record<string, unknown>;

  // Required fields
  if (!obj.name || typeof obj.name !== 'string') {
    errors.push({ field: 'name', message: 'Full name is required' });
  }
  if (
    !obj.email ||
    typeof obj.email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email)
  ) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!obj.phone || typeof obj.phone !== 'string' || !/^\+?[1-9]\d{10,14}$/.test(obj.phone)) {
    errors.push({ field: 'phone', message: 'Valid phone number is required (E.164 format)' });
  }

  // Address validation
  if (!obj.address || typeof obj.address !== 'object' || obj.address === null) {
    errors.push({ field: 'address', message: 'Address is required' });
  } else {
    const address = obj.address as Record<string, unknown>;
    if (!address.address1 || typeof address.address1 !== 'string') {
      errors.push({ field: 'address.address1', message: 'Address line 1 is required' });
    }
    if (!address.city || typeof address.city !== 'string') {
      errors.push({ field: 'address.city', message: 'City is required' });
    }
    if (!address.state || typeof address.state !== 'string' || address.state.length !== 2) {
      errors.push({ field: 'address.state', message: 'Valid 2-letter state code is required' });
    }
    if (!address.zip || typeof address.zip !== 'string' || !/^\d{5}(-\d{4})?$/.test(address.zip)) {
      errors.push({ field: 'address.zip', message: 'Valid ZIP code is required' });
    }
  }

  // Compliance profile validation
  if (
    !obj.compliance_profile ||
    typeof obj.compliance_profile !== 'object' ||
    obj.compliance_profile === null
  ) {
    errors.push({ field: 'compliance_profile', message: 'Compliance profile is required' });
  } else {
    const compliance = obj.compliance_profile as Record<string, unknown>;
    if (
      !compliance.ssn ||
      typeof compliance.ssn !== 'string' ||
      !/^\d{3}-\d{2}-\d{4}$/.test(compliance.ssn)
    ) {
      errors.push({
        field: 'compliance_profile.ssn',
        message: 'Valid SSN format required (XXX-XX-XXXX)',
      });
    }
    if (
      !compliance.dob ||
      typeof compliance.dob !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(compliance.dob)
    ) {
      errors.push({
        field: 'compliance_profile.dob',
        message: 'Valid DOB format required (YYYY-MM-DD)',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
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
    account_balance?: number; // Balance in CENTS (not dollars) - divide by 100 for display
    updated_at?: string; // When balance was last updated
  };
  bank_data?: {
    account_number?: string; // Masked account number
    account_type?: string;
    routing_number?: string;
  };
  created_at: string; // Timestamp of creation
  updated_at?: string; // Last update timestamp
  review?: PaykeyReview; // Paykey review details
}

/**
 * Paykey Review response structure
 * Matches Straddle SDK v0.3.0 ReviewGetResponse.Data structure
 * @see node_modules/@straddlecom/straddle/resources/paykeys/review.d.ts
 */
export interface PaykeyReview {
  paykey_details: {
    id: string;
    config: {
      processing_method?: 'inline' | 'background' | 'skip';
      sandbox_outcome?: 'standard' | 'active' | 'rejected' | 'review';
    };
    created_at: string;
    label: string;
    paykey: string;
    source: 'bank_account' | 'straddle' | 'mx' | 'plaid' | 'tan' | 'quiltt';
    status: 'pending' | 'active' | 'inactive' | 'rejected' | 'review';
    updated_at: string;
    balance?: {
      status: 'pending' | 'completed' | 'failed';
      account_balance?: number | null;
      updated_at?: string | null;
    };
    bank_data?: {
      account_number: string;
      account_type: 'checking' | 'savings';
      routing_number: string;
    };
    customer_id?: string | null;
    expires_at?: string | null;
    external_id?: string | null;
    institution_name?: string | null;
    metadata?: {
      [key: string]: string;
    } | null;
    status_details?: {
      changed_at: string;
      message: string;
      reason:
        | 'insufficient_funds'
        | 'closed_bank_account'
        | 'invalid_bank_account'
        | 'invalid_routing'
        | 'disputed'
        | 'payment_stopped'
        | 'owner_deceased'
        | 'frozen_bank_account'
        | 'risk_review'
        | 'fraudulent'
        | 'duplicate_entry'
        | 'invalid_paykey'
        | 'payment_blocked'
        | 'amount_too_large'
        | 'too_many_attempts'
        | 'internal_system_error'
        | 'user_request'
        | 'ok'
        | 'other_network_return'
        | 'payout_refused';
      source: 'watchtower' | 'bank_decline' | 'customer_dispute' | 'user_action' | 'system';
      code?: string | null;
    };
  };
  verification_details?: {
    id: string;
    breakdown: {
      account_validation?: {
        codes: string[];
        decision: 'unknown' | 'accept' | 'reject' | 'review';
        reason?: string | null;
      };
      name_match?: {
        codes: string[];
        decision: 'unknown' | 'accept' | 'reject' | 'review';
        correlation_score?: number | null;
        customer_name?: string | null;
        matched_name?: string | null;
        names_on_account?: string[] | null;
        reason?: string | null;
      };
    };
    created_at: string;
    decision: 'unknown' | 'accept' | 'reject' | 'review';
    messages: {
      [key: string]: string;
    };
    updated_at: string;
  };
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

export type PaykeyOutcome = 'standard' | 'active' | 'review' | 'rejected';

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
  paykey: ['standard', 'active', 'review', 'rejected'] as PaykeyOutcome[],
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
