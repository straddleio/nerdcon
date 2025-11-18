/**
 * HTTP Client for Straddle Demo Backend
 * Calls backend API at `${API_BASE_URL}/api/*` where API_BASE_URL can be configured via env.
 */

import { useDemoStore } from './state';

/**
 * Type guard for environment variable
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

const envValue: unknown = import.meta.env.VITE_API_BASE_URL;
const API_ORIGIN = isString(envValue) ? envValue.replace(/\/$/, '') : '';
export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

function buildApiUrl(endpoint: string): string {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalized}`;
}

/**
 * Error response structure from API
 */
interface ApiErrorResponse {
  error?: string;
}

/**
 * Type guard for API error response
 */
function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.error === 'string' || obj.error === undefined;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildApiUrl(endpoint);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData: unknown = await response.json().catch(() => ({}));
      const errorMessage =
        isApiErrorResponse(errorData) && errorData.error
          ? errorData.error
          : `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network request failed');
  }
}

/**
 * Customer API
 */
export interface CreateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  outcome?: 'standard' | 'verified' | 'review' | 'rejected';
  first_name?: string;
  last_name?: string;
  type?: 'individual' | 'business';
  address?: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
  };
  compliance_profile?: {
    ssn?: string;
    dob?: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  verification_status: string;
  risk_score?: number;
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
  review?: {
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
        [key: string]: number | undefined;
      };
    };
    network_alerts?: {
      decision: string;
      codes?: string[];
      alerts?: Array<{
        alert_id: string;
        type: string;
        severity?: string;
        message?: string;
      }>;
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
  };
}

export async function createCustomer(data: CreateCustomerRequest = {}): Promise<Customer> {
  return apiFetch<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCustomer(customerId: string): Promise<Customer> {
  useDemoStore.getState().addAPILogEntry({
    type: 'ui-action',
    text: `🔄 Refreshing customer data...`,
  });

  return apiFetch<Customer>(`/customers/${customerId}`);
}

/**
 * Get unmasked customer data (SSN, DOB, etc.)
 * Note: Requires show_sensitive=true permission on API key
 */
export interface UnmaskedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  verification_status?: string;
  risk_score?: number;
  compliance_profile?: {
    ssn?: string; // Unmasked: XXX-XX-XXXX
    dob?: string; // Unmasked: YYYY-MM-DD
  };
  address?: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
  };
  // Allow additional unknown fields from API
  [key: string]: unknown;
}

export async function unmaskCustomer(customerId: string): Promise<UnmaskedCustomer> {
  // Add terminal entry for UI action
  useDemoStore.getState().addAPILogEntry({
    type: 'ui-action',
    text: `🔓 Fetching unmasked customer data...`,
  });

  return apiFetch<UnmaskedCustomer>(`/customers/${customerId}/unmask`);
}

/**
 * Paykey/Bridge API
 */

/**
 * Paykey Review response structure
 * Matches backend PaykeyReview type and Straddle SDK v0.3.0
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

export interface CreatePaykeyRequest {
  customer_id: string;
  method: 'plaid' | 'bank_account';
  outcome?: 'standard' | 'active' | 'review' | 'rejected';
}

export interface Paykey {
  id: string;
  paykey: string; // Token for charges
  customer_id: string;
  status: string;
  label?: string; // Pre-formatted label from API
  institution_name?: string; // Bank name as flat string
  source?: string; // Source tracking (bank_account, plaid, etc.)
  balance?: {
    status?: string; // Balance fetch status
    account_balance?: number; // Balance in CENTS - divide by 100 for display
    updated_at?: string; // Last balance update timestamp
  };
  bank_data?: {
    account_number?: string; // Masked account number
    account_type?: string;
    routing_number?: string;
  };
  created_at?: string;
  updated_at?: string;
  ownership_verified?: boolean;
  review?: PaykeyReview; // Paykey review details
  // Legacy fields for backward compatibility
  account_type?: string; // Deprecated: use bank_data.account_type
  last4?: string; // Deprecated: extract from bank_data.account_number
  institution?: string | { name: string; logo?: string }; // Deprecated: use institution_name
  ownership?: {
    waldo_confidence?: string;
  };
}

export async function createPaykey(data: CreatePaykeyRequest): Promise<Paykey> {
  const endpoint = data.method === 'plaid' ? '/bridge/plaid' : '/bridge/bank-account';

  return apiFetch<Paykey>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPaykey(paykeyId: string): Promise<Paykey> {
  useDemoStore.getState().addAPILogEntry({
    type: 'ui-action',
    text: `🔄 Refreshing paykey data...`,
  });

  return apiFetch<Paykey>(`/paykeys/${paykeyId}`);
}

/**
 * Get paykey review details
 */
export async function getPaykeyReview(paykeyId: string): Promise<PaykeyReview> {
  useDemoStore.getState().addAPILogEntry({
    type: 'ui-action',
    text: `📋 Fetching paykey review details...`,
  });

  return apiFetch<PaykeyReview>(`/paykeys/${paykeyId}/review`);
}

/**
 * Update paykey review decision
 */
export interface UpdatePaykeyReviewRequest {
  decision: 'approved' | 'rejected';
}

export async function updatePaykeyReview(
  paykeyId: string,
  data: UpdatePaykeyReviewRequest
): Promise<PaykeyReview> {
  const action = data.decision === 'approved' ? 'Approving' : 'Rejecting';
  useDemoStore.getState().addAPILogEntry({
    type: 'ui-action',
    text: `✅ ${action} paykey review...`,
  });

  return apiFetch<PaykeyReview>(`/paykeys/${paykeyId}/review`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Charge API
 */
export interface CreateChargeRequest {
  paykey: string; // Token, not ID
  amount?: number; // Cents
  description?: string;
  consent_type?: 'internet' | 'signed';
  outcome?:
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
}

export interface Charge {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  paykey: string;
  payment_rail?: string;
  consent_type?: string;
  balance_check_result?: string;
  failure_reason?: string;
  payment_date?: string;
  status_history?: Array<{
    status: string;
    timestamp: string;
    reason?: string;
    message?: string;
    source?: string;
  }>;
}

export async function createCharge(data: CreateChargeRequest): Promise<Charge> {
  return apiFetch<Charge>('/charges', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCharge(chargeId: string): Promise<Charge> {
  useDemoStore.getState().addAPILogEntry({
    type: 'ui-action',
    text: `🔄 Refreshing charge data...`,
  });

  return apiFetch<Charge>(`/charges/${chargeId}`);
}

/**
 * State API
 */
export interface DemoState {
  customer?: Customer;
  paykey?: Paykey;
  charge?: Charge;
}

export async function getState(): Promise<DemoState> {
  return apiFetch<DemoState>('/state');
}

export async function resetState(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/reset', {
    method: 'POST',
  });
}

/**
 * Sandbox Outcomes API
 */
export interface SandboxOutcomes {
  customer: string[];
  paykey: string[];
  charge: string[];
}

export async function getOutcomes(): Promise<SandboxOutcomes> {
  return apiFetch<SandboxOutcomes>('/outcomes');
}

/**
 * Health Check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return apiFetch<{ status: string; timestamp: string }>('/health');
}
