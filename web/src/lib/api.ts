/**
 * HTTP Client for Straddle Demo Backend
 * Calls backend API at `${API_BASE_URL}/api/*` where API_BASE_URL can be configured via env.
 *
 * REVIEW DECISION API NAMING CONVENTION:
 * ======================================
 * Review-related functions follow these patterns:
 *
 * 1. GET/READ operations (display review info):
 *    - getPaykeyReview() - Fetch review details for display
 *
 * 2. PATCH/WRITE operations (make decisions):
 *    - customerReviewDecision() - Make customer KYC decision (status: 'verified'|'rejected')
 *    - paykeyReviewDecision() - Make paykey decision (decision: 'approved'|'rejected')
 *    - updatePaykeyReview() - Alternative name for paykeyReviewDecision() (uses object param)
 *
 * IMPORTANT: paykeyReviewDecision() and updatePaykeyReview() are EQUIVALENT functions:
 * - Both make PATCH request to /paykeys/:id/review
 * - Both require the same "review" status
 * - Difference is parameter format: string vs object
 * - Use whichever fits your naming convention
 *
 * PARAMETER NAME DIFFERENCES:
 * - Customer uses: { status: 'verified' | 'rejected' }
 * - Paykey uses: { decision: 'approved' | 'rejected' }
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
    ein?: string;
    legal_business_name?: string;
    website?: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  type?: 'individual' | 'business';
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
    ein?: string; // Masked format: **-*******
    legal_business_name?: string;
    website?: string;
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
      alerts?: string[];
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
 * Initialize Bridge
 */
interface BridgeErrorResponse {
  error?: string;
}

interface BridgeSuccessResponse {
  data: { bridge_token: string };
}

export async function initializeBridge(customerId: string): Promise<{ bridge_token: string }> {
  const response = await fetch(`${API_BASE_URL}/bridge/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId }),
  });

  if (!response.ok) {
    const error = (await response.json()) as BridgeErrorResponse;
    throw new Error(error.error || 'Failed to initialize bridge');
  }

  const data = (await response.json()) as BridgeSuccessResponse;
  return data.data; // Straddle API returns { data: { bridge_token: ... } }
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
  review?: PaykeyReview; // Paykey review details
  // Legacy fields for backward compatibility
  account_type?: string; // Deprecated: use bank_data.account_type
  last4?: string; // Deprecated: extract from bank_data.account_number
  institution?: string | { name: string; logo?: string }; // Deprecated: use institution_name
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
 * Get paykey review details (READ-ONLY)
 *
 * Fetches verification and review information for a paykey in review status.
 * Use this to display review details to the user (account validation, name matching, etc.)
 *
 * @param paykeyId - The paykey ID to fetch review details for
 * @returns PaykeyReview with verification_details and paykey_details
 *
 * @example
 * const review = await getPaykeyReview('paykey_123');
 * console.log(review.verification_details.breakdown.account_validation);
 */
export async function getPaykeyReview(paykeyId: string): Promise<PaykeyReview> {
  useDemoStore.getState().addAPILogEntry({
    type: 'ui-action',
    text: `📋 Fetching paykey review details...`,
  });

  return apiFetch<PaykeyReview>(`/paykeys/${paykeyId}/review`);
}

/**
 * Update paykey review decision (WRITE - Makes decision: approved/rejected)
 *
 * NAMING CONVENTION:
 * This function has two names that do the same thing. Use whichever fits your context:
 * - `updatePaykeyReview()` - Preferred for explicit "update" semantics (found in updatePaykeyReview)
 * - `paykeyReviewDecision()` - Alternative emphasizing "decision-making" (found in paykeyReviewDecision)
 *
 * Both functions:
 * - PATCH /paykeys/:id/review with { decision: 'approved' | 'rejected' }
 * - Map 'approved' → 'active' status, 'rejected' → 'rejected' status
 * - Return the updated PaykeyReview object
 *
 * Use EITHER function - they are equivalent. `updatePaykeyReview()` is recommended for
 * consistency with the "get" verb pattern (getPaykeyReview → updatePaykeyReview).
 *
 * @param paykeyId - The paykey ID to make a decision on
 * @param data - UpdatePaykeyReviewRequest with decision field
 * @returns PaykeyReview with updated verification status
 *
 * @example
 * // Approve a paykey in review
 * const result = await updatePaykeyReview('paykey_123', { decision: 'approved' });
 *
 * // Reject a paykey in review
 * const result = await updatePaykeyReview('paykey_123', { decision: 'rejected' });
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

/**
 * Make a customer KYC review decision (WRITE - Manual verification approval)
 *
 * NAMING CONVENTION - Review Decision Functions:
 * ===============================================
 * Review decision functions use this pattern: `{entityType}ReviewDecision()`
 * - `customerReviewDecision()` - Make manual decision on customer KYC review
 * - `paykeyReviewDecision()` - Make manual decision on paykey review
 *
 * These functions are for making MANUAL verification decisions. The customer or paykey
 * must be in a "review" status before a decision can be made.
 *
 * RELATED FUNCTIONS (for reference):
 * - `getPaykeyReview()` - Fetches paykey review details (READ-ONLY)
 * - `updatePaykeyReview()` - Updates paykey review decision (WRITE - same as paykeyReviewDecision)
 *
 * KEY DIFFERENCES:
 * ================
 * CUSTOMER:
 * - Uses `status` parameter: 'verified' | 'rejected'
 * - PATCH /customers/:id/review with { status }
 * - SDK call: straddleClient.customers.review.decision(customerId, { status })
 *
 * PAYKEY:
 * - Uses `decision` parameter: 'approved' | 'rejected'
 * - PATCH /paykeys/:id/review with { decision }
 * - SDK call: straddleClient.paykeys.review.decision(paykeyId, { status })
 * - Note: Backend maps 'approved' → 'active', 'rejected' → 'rejected'
 *
 * @param customerId - The customer ID to make a review decision for
 * @param status - The manual verification decision: 'verified' or 'rejected'
 * @returns The updated Customer object with review decision applied
 *
 * @example
 * // Manually approve customer KYC
 * const result = await customerReviewDecision('cust_123', 'verified');
 *
 * // Manually reject customer KYC
 * const result = await customerReviewDecision('cust_123', 'rejected');
 */
export async function customerReviewDecision(
  customerId: string,
  status: 'verified' | 'rejected'
): Promise<unknown> {
  return apiFetch<unknown>(`/customers/${customerId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Make a paykey review decision (WRITE - Manual verification approval)
 *
 * NAMING CONVENTION - Review Decision Functions:
 * ===============================================
 * Review decision functions use this pattern: `{entityType}ReviewDecision()`
 * - `customerReviewDecision()` - Make manual decision on customer KYC review
 * - `paykeyReviewDecision()` - Make manual decision on paykey review
 *
 * These functions are for making MANUAL verification decisions. The paykey must be in
 * a "review" status before a decision can be made.
 *
 * DUPLICATE ALERT - Two ways to update paykey review:
 * ====================================================
 * This function is equivalent to `updatePaykeyReview()` - both make the same API call.
 * Use whichever naming convention fits your context:
 *
 * - `updatePaykeyReview()` - For "get/update" consistency (getPaykeyReview → updatePaykeyReview)
 * - `paykeyReviewDecision()` - For "decision-making" emphasis and parallel with customerReviewDecision()
 *
 * Implementation comparison:
 * ```
 * updatePaykeyReview(id, { decision: 'approved' })  // Same as:
 * paykeyReviewDecision(id, 'approved')              // (but different param name)
 * ```
 *
 * RELATED FUNCTIONS (for reference):
 * - `getPaykeyReview()` - Fetches paykey review details (READ-ONLY)
 * - `updatePaykeyReview()` - Same as paykeyReviewDecision but different parameter format
 *
 * KEY DIFFERENCES (vs customerReviewDecision):
 * =============================================
 * CUSTOMER:
 * - Uses `status` parameter: 'verified' | 'rejected'
 * - PATCH /customers/:id/review with { status }
 *
 * PAYKEY (this function):
 * - Uses `decision` parameter: 'approved' | 'rejected'
 * - PATCH /paykeys/:id/review with { decision }
 * - Backend maps 'approved' → 'active', 'rejected' → 'rejected'
 *
 * @param paykeyId - The paykey ID to make a review decision for
 * @param decision - The manual review decision: 'approved' or 'rejected'
 * @returns The updated PaykeyReview object with decision applied
 *
 * @example
 * // Manually approve paykey in review
 * const result = await paykeyReviewDecision('paykey_123', 'approved');
 *
 * // Manually reject paykey in review
 * const result = await paykeyReviewDecision('paykey_123', 'rejected');
 *
 * @see updatePaykeyReview - Alternative function with same behavior
 */
export async function paykeyReviewDecision(
  paykeyId: string,
  decision: 'approved' | 'rejected'
): Promise<unknown> {
  return apiFetch<unknown>(`/paykeys/${paykeyId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ decision }),
  });
}
