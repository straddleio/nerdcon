# P1 Demo Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 critical P1 issues blocking live demo scriptability and deployment reliability

**Architecture:** Four independent PRs addressing: (1) sandbox outcome propagation, (2) charge flow observability, (3) WALDO confidence display, (4) API configuration consistency

**Tech Stack:** Node.js/Express backend, React/TypeScript frontend, Vite dev server

---

## PR #1: Sandbox Outcome Control

**Branch:** `fix/sandbox-outcome-control`

**Goal:** Enable bank and Plaid paykey creation to respect sandbox_outcome selection

**Issues Fixed:** #1 (Bank paykey inactive ignored), #2 (Plaid outcomes ignored)

### Task 1.1: Fix bank-account outcome handling

**Files:**

- Modify: `server/src/routes/bridge.ts:30-32`

**Step 1: Read current implementation**

Current code at line 30-32:

```typescript
config: {
  sandbox_outcome: outcome === 'inactive' ? undefined : outcome as 'active' | 'rejected' | 'standard'
},
```

This explicitly drops `inactive` by setting it to `undefined`.

**Step 2: Update bank-account route to accept and pass outcome**

In `server/src/routes/bridge.ts`, replace lines 30-32:

```typescript
// OLD (lines 30-32):
config: {
  sandbox_outcome: outcome === 'inactive' ? undefined : outcome as 'active' | 'rejected' | 'standard'
},

// NEW:
config: outcome ? {
  sandbox_outcome: outcome as 'active' | 'inactive' | 'rejected'
} : undefined,
```

**Step 3: Add validation before the linkData object**

Insert validation after line 23 (after extracting request params):

```typescript
// After line 23:
// Validate outcome if provided
if (outcome && !['active', 'inactive', 'rejected'].includes(outcome)) {
  return res.status(400).json({
    error: `Invalid outcome. Must be one of: active, inactive, rejected`,
  });
}
```

**Step 4: Test bank-account outcome manually**

Run:

```bash
npm run dev:server
# In another terminal:
npm run dev:web
```

Test via terminal:

1. `/create-paykey` with outcome=inactive
2. Verify paykey shows inactive status
3. Test with outcome=rejected
4. Verify default (no outcome) still creates active

**Step 5: Commit bank-account fix**

```bash
git add server/src/routes/bridge.ts
git commit -m "fix(bridge): respect sandbox_outcome for bank-account paykeys

- Remove special case that dropped 'inactive' outcome
- Add validation for active/inactive/rejected values
- Default to 'active' when outcome not specified
- Fixes #1"
```

### Task 1.2: Add Plaid outcome support

**Files:**

- Modify: `server/src/routes/bridge.ts:142-179` (Plaid route)

**Step 1: Extract outcome from request body**

At line 144, update the destructuring to include outcome:

```typescript
// OLD (line 144):
const { customer_id, plaid_token } = req.body;

// NEW:
const { customer_id, plaid_token, outcome } = req.body;
```

**Step 2: Add outcome validation**

After the existing validation (around line 160), add outcome validation:

```typescript
// After line 160:
// Validate outcome if provided
if (outcome && !['active', 'inactive', 'rejected'].includes(outcome)) {
  return res.status(400).json({
    error: `Invalid outcome. Must be one of: active, inactive, rejected`,
  });
}
```

**Step 3: Update linkData to include config**

Update the `linkData` object (currently line 162-165) to include config:

```typescript
// OLD (lines 162-165):
const linkData = {
  customer_id,
  plaid_token: tokenToUse,
};

// NEW:
const linkData = {
  customer_id,
  plaid_token: tokenToUse,
  ...(outcome && {
    config: {
      sandbox_outcome: outcome as 'active' | 'inactive' | 'rejected',
    },
  }),
};
```

**Note:** The Straddle SDK bridge.link.plaid() accepts a config parameter per the TypeScript SDK docs.

**Step 4: Test Plaid outcome manually**

Run dev servers and test:

1. Create customer
2. Link Plaid account with outcome=rejected
3. Verify paykey shows rejected status
4. Test outcome=on-hold
5. Verify default still creates active

**Step 5: Commit Plaid fix**

```bash
git add server/src/routes/bridge.ts
git commit -m "fix(bridge): add sandbox_outcome support to Plaid flow

- Extract outcome from request body
- Validate against active/inactive/rejected/on-hold
- Pass config.sandbox_outcome to SDK
- Default to 'active' when not specified
- Fixes #2"
```

### Task 1.3: Final verification and PR

**Step 1: Run full test suite**

```bash
npm run type-check
npm run lint
npm run build
```

Expected: All pass

**Step 2: Manual integration test**

Test complete flow:

1. Bank account with outcome=inactive → verify inactive paykey
2. Plaid with outcome=rejected → verify rejected paykey
3. Bank account with no outcome → verify active paykey (default)
4. Invalid outcome → verify 400 error response

**Step 3: Push branch**

```bash
git push -u origin fix/sandbox-outcome-control
```

**Step 4: Create PR**

Use `gh` CLI or GitHub UI:

```bash
gh pr create --title "fix: Enable sandbox outcome control for bank and Plaid paykeys" --body "$(cat <<'EOF'
## Summary
- Fix bank-account route to respect inactive/rejected outcomes instead of dropping them
- Add sandbox_outcome support to Plaid flow
- Validate outcome values with clear error messages
- Default to 'active' when outcome not specified

## Issues Fixed
- #1 Bank paykey "Inactive" outcome still ignored
- #2 Plaid paykey outcomes ignored

## Test Plan
- [x] Bank account with outcome=inactive creates inactive paykey
- [x] Bank account with outcome=rejected creates rejected paykey
- [x] Plaid with outcome=rejected creates rejected paykey
- [x] Plaid with outcome=on-hold creates on-hold paykey
- [x] Default (no outcome) creates active paykey
- [x] Invalid outcome returns 400 error
- [x] Type checks pass
- [x] Lint passes
- [x] Build succeeds

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## PR #2: Charge Flow Fixes

**Branch:** `fix/charge-flow-observability`

**Goal:** Fix webhook tracker history and consent type selector

**Issues Fixed:** #3 (Webhook tracker drops events), #4 (Consent type ignored)

### Task 2.1: Fix webhook status history tracking

**Files:**

- Modify: `server/src/routes/webhooks.ts:67-90`

**Step 1: Read current webhook handler**

Read `server/src/routes/webhooks.ts` lines 67-90 to understand current status_history logic.

**Step 2: Update webhook handler to preserve all events**

Replace the conditional append with unconditional append:

```typescript
// Current code (around line 67-90) only appends when status changes
// Replace with logic that compares status, message, AND timestamp:

const lastEntry = charge.status_history[charge.status_history.length - 1];
const isDuplicate =
  lastEntry &&
  lastEntry.status === webhook.status &&
  lastEntry.message === webhook.message &&
  lastEntry.timestamp === webhook.timestamp;

if (!isDuplicate) {
  charge.status_history.push({
    status: webhook.status,
    message: webhook.message,
    timestamp: webhook.timestamp,
    changed_at: webhook.changed_at || new Date().toISOString(),
  });
}
```

**Step 3: Verify the webhook payload structure**

Use Grep to find where webhook payloads are typed/defined to ensure we're checking the right fields.

**Step 4: Test webhook history**

```bash
npm run dev:server
npm run dev:web
```

Trigger multiple webhooks with same status but different messages:

1. Create charge
2. Send test webhooks with status=pending, different messages
3. Verify PizzaTracker shows all entries
4. Check that identical webhooks are still deduplicated

**Step 5: Commit webhook fix**

```bash
git add server/src/routes/webhooks.ts
git commit -m "fix(webhooks): preserve all charge status events in history

- Compare status, message, and timestamp for duplicates
- Append all non-duplicate events regardless of status
- Ensures Pizza Tracker shows full audit trail
- Fixes #3"
```

### Task 2.2: Update PizzaTracker to render all history entries

**Files:**

- Modify: `web/src/components/dashboard/PizzaTracker.tsx:45-147`

**Step 1: Read current PizzaTracker rendering logic**

Read `PizzaTracker.tsx` to understand how it currently filters/renders status_history.

**Step 2: Ensure tracker renders all entries**

Verify the tracker is not filtering out duplicate statuses in its render logic. If it is, remove that filter:

```typescript
// The tracker should map over ALL status_history entries:
{charge.status_history.map((entry, index) => (
  <div key={index} className="tracker-entry">
    <span className="status">{entry.status}</span>
    <span className="message">{entry.message}</span>
    <span className="time">{formatTimestamp(entry.changed_at || entry.timestamp)}</span>
  </div>
))}
```

**Step 3: Test PizzaTracker display**

With dev servers running:

1. Create charge
2. Trigger multiple pending webhooks
3. Verify all appear in tracker UI
4. Verify timestamps show correctly

**Step 4: Commit PizzaTracker update**

```bash
git add web/src/components/dashboard/PizzaTracker.tsx
git commit -m "fix(pizza-tracker): display all status history entries

- Remove any filtering of duplicate statuses
- Render complete webhook audit trail
- Part of #3 fix"
```

### Task 2.3: Wire consent_type from UI to server

**Files:**

- Modify: `web/src/components/cards/ChargeCard.tsx:32-88`
- Modify: `server/src/routes/charges.ts:47-63`

**Step 1: Read ChargeCard to find consent_type selector**

Read `ChargeCard.tsx` lines 32-88 to see how consent_type is captured in the form.

**Step 2: Ensure consent_type is sent in API request**

In `ChargeCard.tsx`, verify the form submission includes consent_type:

```typescript
// In the charge creation handler:
const response = await api.createCharge({
  customer_id: customerId,
  paykey_id: paykeyId,
  amount: amount,
  consent_type: consentType, // Ensure this is included
  // ... other fields
});
```

**Step 3: Update server to read and use consent_type**

In `server/src/routes/charges.ts` around lines 47-63:

```typescript
// Extract consent_type from request body:
const { customer_id, paykey_id, amount, consent_type } = req.body;

// In chargeData object:
const chargeData = {
  customer_id,
  paykey_id,
  amount: {
    value: amount,
    currency: 'USD',
  },
  consent_type: consent_type || 'internet', // Use provided value, default to 'internet'
  // ... other fields
};
```

**Step 4: Test consent type propagation**

```bash
npm run dev:server
npm run dev:web
```

Test flow:

1. Create customer and paykey
2. Create charge with consent_type=telephone
3. Check Straddle API logs to verify consent_type sent
4. Create charge with consent_type=written
5. Verify in logs
6. Create charge without specifying → verify defaults to internet

**Step 5: Commit consent_type fix**

```bash
git add web/src/components/cards/ChargeCard.tsx server/src/routes/charges.ts
git commit -m "fix(charges): respect consent_type selection from UI

- Extract consent_type from request body
- Pass to Straddle charge creation
- Default to 'internet' when not specified
- Fixes #4"
```

### Task 2.4: Final verification and PR

**Step 1: Run full test suite**

```bash
npm run type-check
npm run lint
npm run build
```

Expected: All pass

**Step 2: Integration test**

Complete charge flow test:

1. Create charge → trigger webhooks → verify all appear in tracker
2. Create charge with consent_type=telephone → verify in API logs
3. Create charge with consent_type=written → verify in API logs

**Step 3: Push branch**

```bash
git push -u origin fix/charge-flow-observability
```

**Step 4: Create PR**

```bash
gh pr create --title "fix: Improve charge flow observability and consent handling" --body "$(cat <<'EOF'
## Summary
- Preserve all webhook events in status history (not just status changes)
- Display complete audit trail in Pizza Tracker
- Wire consent_type selection from UI through to Straddle API

## Issues Fixed
- #3 Charge webhook tracker drops repeated pending events
- #4 Consent type selector has no effect

## Test Plan
- [x] Multiple webhooks with same status but different messages all appear
- [x] Pizza Tracker shows full event sequence
- [x] Consent type=telephone propagates to Straddle
- [x] Consent type=written propagates to Straddle
- [x] Default consent type is 'internet' when not specified
- [x] Type checks pass
- [x] Lint passes
- [x] Build succeeds

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## PR #3: WALDO Confidence Display

**Branch:** `fix/waldo-confidence-display`

**Goal:** Expose and display WALDO ownership confidence in paykey dashboard

**Issues Fixed:** #8 (WALDO confidence never returned to UI)

### Task 3.1: Update DemoPaykey type to include ownership

**Files:**

- Modify: `server/src/domain/types.ts:206-228`

**Step 1: Read current DemoPaykey type**

Read `server/src/domain/types.ts` lines 206-228 to understand the current paykey type definition.

**Step 2: Add ownership field to DemoPaykey**

Update the type (after line 227) to include ownership object:

```typescript
export interface DemoPaykey {
  id: string;
  paykey: string;
  customer_id: string;
  status: string;
  label?: string;
  institution_name?: string;
  source?: string;
  balance?: {
    status?: string;
    account_balance?: number; // Balance in cents (Straddle returns cents)
    updated_at?: string;
  };
  bank_data?: {
    account_number?: string;
    account_type?: string;
    routing_number?: string;
  };
  created_at: string;
  updated_at?: string;
  ownership_verified?: boolean;
  // ADD THIS NEW FIELD:
  ownership?: {
    waldo_confidence?: 'high' | 'medium' | 'low' | 'unknown';
  };
}
```

**Note:** Also fix the balance comment from "in dollars" to "in cents" (this addresses issue #9 partially).

**Step 3: Commit type update**

```bash
git add server/src/domain/types.ts
git commit -m "feat(types): add ownership object to DemoPaykey

- Include ownership.waldo_confidence field
- Prepare for WALDO display in UI
- Part of #8 fix"
```

### Task 3.2: Serialize ownership in bridge route (bank-account)

**Files:**

- Modify: `server/src/routes/bridge.ts:77-98`

**Step 1: Read bridge route serialization**

Current demoPaykey creation at lines 77-98 includes these fields but is missing ownership.

**Step 2: Add ownership to demoPaykey object**

In the bank-account route (around line 97), add ownership field before ownership_verified:

```typescript
// Around line 77-98, add after created_at/updated_at:
const demoPaykey: DemoPaykey = {
  id: paykeyData.id,
  paykey: paykeyData.paykey || '',
  customer_id: paykeyData.customer_id,
  status: paykeyData.status,
  label: paykeyData.label,
  institution_name: paykeyData.institution_name || 'Unknown Bank',
  source: paykeyData.source || 'bank_account',
  balance: paykeyData.balance
    ? {
        status: paykeyData.balance.status,
        account_balance: paykeyData.balance.account_balance || 0, // In cents
        updated_at: paykeyData.balance.updated_at,
      }
    : undefined,
  bank_data: paykeyData.bank_data
    ? {
        account_number: paykeyData.bank_data.account_number,
        account_type: paykeyData.bank_data.account_type,
        routing_number: paykeyData.bank_data.routing_number,
      }
    : undefined,
  created_at: paykeyData.created_at || new Date().toISOString(),
  updated_at: paykeyData.updated_at,
  ownership_verified: paykeyData.ownership_verified || false,
  // ADD THIS:
  ownership: paykeyData.ownership
    ? {
        waldo_confidence: paykeyData.ownership.waldo_confidence || 'unknown',
      }
    : undefined,
};
```

**Note:** Also update the balance comment from "In dollars" to "In cents" on line 87.

**Step 3: Commit bridge serialization**

```bash
git add server/src/routes/bridge.ts
git commit -m "fix(bridge): serialize ownership data in paykey response

- Include ownership.waldo_confidence from Straddle
- Default to 'unknown' when not present
- Part of #8 fix"
```

### Task 3.3: Serialize ownership in bridge route (Plaid)

**Files:**

- Modify: `server/src/routes/bridge.ts:209-230`

**Step 1: Add ownership to Plaid demoPaykey**

In the Plaid route (around line 209-230), add the same ownership field:

```typescript
// Around line 209-230, add after ownership_verified:
const demoPaykey: DemoPaykey = {
  id: paykeyData.id,
  paykey: paykeyData.paykey || '',
  customer_id: paykeyData.customer_id,
  status: paykeyData.status,
  label: paykeyData.label,
  institution_name: paykeyData.institution_name || 'Unknown Bank',
  source: paykeyData.source || 'plaid',
  balance: paykeyData.balance
    ? {
        status: paykeyData.balance.status,
        account_balance: paykeyData.balance.account_balance || 0, // In cents
        updated_at: paykeyData.balance.updated_at,
      }
    : undefined,
  bank_data: paykeyData.bank_data
    ? {
        account_number: paykeyData.bank_data.account_number,
        account_type: paykeyData.bank_data.account_type,
        routing_number: paykeyData.bank_data.routing_number,
      }
    : undefined,
  created_at: paykeyData.created_at || new Date().toISOString(),
  updated_at: paykeyData.updated_at,
  ownership_verified: paykeyData.ownership_verified || false,
  // ADD THIS:
  ownership: paykeyData.ownership
    ? {
        waldo_confidence: paykeyData.ownership.waldo_confidence || 'unknown',
      }
    : undefined,
};
```

**Note:** Also update balance comment from "In dollars" to "In cents" on line 219.

**Step 2: Commit Plaid serialization**

```bash
git add server/src/routes/bridge.ts
git commit -m "fix(bridge/plaid): serialize ownership data in paykey response

- Include ownership.waldo_confidence from Straddle
- Fix balance unit comment (cents not dollars)
- Part of #8 fix"
```

### Task 3.4: Serialize ownership in paykeys route

**Files:**

- Modify: `server/src/routes/paykeys.ts`

**Step 1: Find paykeys GET route**

Use Grep to locate the GET /api/paykeys/:id route in paykeys.ts.

**Step 2: Add ownership serialization**

If paykeys.ts has its own serialization (not reusing bridge data), add ownership field similar to bridge routes. If it returns data from stateManager, the data will already include ownership from bridge routes.

**Step 3: Commit paykeys serialization**

```bash
git add server/src/routes/paykeys.ts
git commit -m "fix(paykeys): serialize ownership data in GET response

- Include ownership.waldo_confidence
- Maintain consistency with bridge route
- Part of #8 fix"
```

### Task 3.5: Update frontend PaykeyCard to display WALDO

**Files:**

- Modify: `web/src/components/dashboard/PaykeyCard.tsx`

**Step 1: Find WALDO confidence display logic**

Use Grep to search for "waldo" or "WALDO" in PaykeyCard.tsx to find where it's rendered.

**Step 2: Verify display logic**

The component likely already has display logic accessing `paykey.ownership?.waldo_confidence`. Verify it works correctly:

```typescript
// Should be something like:
const waldoConfidence = paykey.ownership?.waldo_confidence || 'unknown';

// Display:
<span className="waldo-value">
  {waldoConfidence.toUpperCase()}
</span>
```

If the logic doesn't exist, add it to show the WALDO confidence.

**Step 3: Test in browser**

With dev servers running, create a paykey and verify WALDO confidence appears (should show actual value, not "UNKNOWN").

**Step 4: Commit frontend update**

```bash
git add web/src/components/dashboard/PaykeyCard.tsx
git commit -m "fix(paykey-card): display WALDO confidence from API

- Read ownership.waldo_confidence from paykey data
- Show high/medium/low/unknown confidence level
- Fixes #8"
```

### Task 3.6: Final verification and PR

**Step 1: Run full test suite**

```bash
npm run type-check
npm run lint
npm run build
```

Expected: All pass

**Step 2: Manual test**

```bash
npm run dev:server
npm run dev:web
```

Test:

1. Create bank account paykey
2. Check PaykeyCard shows WALDO confidence (not UNKNOWN)
3. Create Plaid paykey
4. Verify WALDO confidence displays
5. Check API logs to confirm ownership data is flowing

**Step 3: Push branch**

```bash
git push -u origin fix/waldo-confidence-display
```

**Step 4: Create PR**

```bash
gh pr create --title "fix: Display WALDO confidence in paykey dashboard" --body "$(cat <<'EOF'
## Summary
- Add ownership object to DemoPaykey type
- Serialize ownership.waldo_confidence from Straddle API
- Display WALDO confidence in PaykeyCard component
- Update both bridge and paykeys routes consistently

## Issues Fixed
- #8 WALDO confidence is never returned to the UI

## Test Plan
- [x] DemoPaykey type includes ownership field
- [x] Bridge route returns ownership.waldo_confidence
- [x] Paykeys GET route returns ownership.waldo_confidence
- [x] PaykeyCard displays confidence level (not UNKNOWN)
- [x] Type checks pass
- [x] Lint passes
- [x] Build succeeds

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## PR #4: API Configuration & Deployment

**Branch:** `fix/api-config-consistency`

**Goal:** Fix API_BASE_URL usage and align port configuration across code and docs

**Issues Fixed:** #5 (KYC command bypasses API_BASE_URL), #12 (Port mismatch in docs)

### Task 4.1: Fix /customer-KYC to use API_BASE_URL

**Files:**

- Modify: `web/src/lib/commands.ts:166-180`

**Step 1: Read current implementation**

Current code at lines 166-180 uses raw fetch:

```typescript
const response = await fetch('/api/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(customerData),
});
```

This bypasses API_BASE_URL configuration.

**Step 2: Check api.ts helper signature**

Read `web/src/lib/api.ts` to see the signature of `createCustomer()` to ensure it accepts the KYC customer data.

**Step 3: Replace raw fetch with API helper**

In `commands.ts`, replace lines 166-180:

```typescript
// OLD (lines 166-180):
const response = await fetch('/api/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(customerData),
});

if (!response.ok) {
  const error = await response.json();
  return {
    success: false,
    message: `✗ Failed to create KYC customer: ${error.message || response.statusText}`,
  };
}

const customer = await response.json();

// NEW (use api helper):
const customer = await api.createCustomer(customerData);
```

The api.createCustomer() helper already handles errors and returns the customer data directly.

**Step 4: Test with API_BASE_URL override**

Set API_BASE_URL to test remote scenario:

```bash
# In web/.env or web/.env.local:
VITE_API_BASE_URL=http://localhost:3001

npm run dev:web
```

Test:

1. Run /customer-KYC command
2. Verify it hits the correct API_BASE_URL
3. Test with remote URL (e.g., ngrok)
4. Verify KYC flow works

**Step 5: Commit KYC fix**

```bash
git add web/src/lib/commands.ts
git commit -m "fix(commands): use API helper for customer-KYC command

- Replace raw fetch with api.createCustomer
- Respect VITE_API_BASE_URL configuration
- Enable static build with remote API
- Fixes #5"
```

### Task 4.2: Align port documentation

**Files:**

- Modify: `README.md` (line 56 and any other port 4000 references)
- Modify: `server/.env.example`
- Modify: `CLAUDE.md` (references 4000)
- Review: `server/src/config.ts` (verify actual default)
- Review: `web/vite.config.ts` (verify proxy target)

**Step 1: Determine actual port used**

Check config.ts and vite.config.ts to see what port the code actually uses:

```bash
grep -n "port\|PORT" server/src/config.ts
grep -n "3001\|4000" web/vite.config.ts
```

Expected: Code uses 3001 as default, not 4000.

**Step 2: Update README.md**

Current README line 56 says `PORT=4000`. Update to match reality:

````markdown
## Development

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```
````

Server runs on http://localhost:3001

2. **Start the frontend:**
   ```bash
   cd web
   npm run dev
   ```
   Web UI runs on http://localhost:5173 (proxies /api/\* to localhost:3001)

### Environment Setup

Backend (server/.env):

```bash
PORT=3001  # API server port
STRADDLE_API_KEY=your_key_here
STRADDLE_API_URL=https://sandbox.straddle.io
```

Frontend (web/.env):

```bash
VITE_API_BASE_URL=http://localhost:3001  # For production builds
```

Note: In development, Vite proxies /api/\* to localhost:3001 automatically.
In production builds, VITE_API_BASE_URL must point to your deployed API.

````

**Step 4: Update server/.env.example**

```bash
# Server configuration
PORT=3001
HOST=localhost

# Straddle API
STRADDLE_API_KEY=
STRADDLE_API_URL=https://sandbox.straddle.io
````

**Step 5: Verify config.ts and vite.config.ts**

Check that these files already default to 3001. If not, update them:

In `server/src/config.ts`:

```typescript
export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  // ...
};
```

In `web/vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      // ...
    }
  }
}
```

**Step 6: Update CLAUDE.md and AGENTS.md if needed**

Use Grep to find any other port references:

```bash
grep -r "4000" README.md CLAUDE.md AGENTS.md docs/
```

Update any remaining references to use 3001.

**Step 7: Commit documentation alignment**

```bash
git add README.md server/.env.example CLAUDE.md AGENTS.md docs/
git commit -m "docs: align API port to 3001 across all documentation

- Update README to reflect actual port (3001, not 4000)
- Fix .env.example to match code defaults
- Clarify dev vs prod API_BASE_URL usage
- Ensures new contributors can start without debugging
- Fixes #12"
```

### Task 4.3: Final verification and PR

**Step 1: Run full test suite**

```bash
npm run type-check
npm run lint
npm run build
```

Expected: All pass

**Step 2: Test fresh clone scenario**

Simulate new contributor:

```bash
cd /tmp
git clone <repo-url> test-clone
cd test-clone
npm install
cd server && npm install && cd ..
cd web && npm install && cd ..

# Follow README exactly:
cd server
cp .env.example .env
# Add STRADDLE_API_KEY
npm run dev  # Should start on 3001

# In another terminal:
cd web
npm run dev  # Should proxy to 3001
```

Verify:

1. Server starts on 3001
2. Web UI proxies correctly
3. /customer-KYC command works
4. All API calls succeed

**Step 3: Push branch**

```bash
git push -u origin fix/api-config-consistency
```

**Step 4: Create PR**

```bash
gh pr create --title "fix: API configuration consistency and port alignment" --body "$(cat <<'EOF'
## Summary
- Fix /customer-KYC to use API_BASE_URL helper
- Align port documentation to 3001 (actual default)
- Update README, .env.example, and other docs
- Enable static builds with remote API
- Ensure fresh contributors can start without debugging

## Issues Fixed
- #5 /customer-KYC command still bypasses API_BASE_URL
- #12 Docs & proxy disagree on API port

## Test Plan
- [x] /customer-KYC uses api.createCustomer helper
- [x] KYC works with VITE_API_BASE_URL override
- [x] KYC works with remote API (ngrok tested)
- [x] README instructions match actual ports
- [x] .env.example uses 3001
- [x] Fresh clone follows README successfully
- [x] Type checks pass
- [x] Lint passes
- [x] Build succeeds

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Execution Strategy

Each PR should be:

1. Implemented on its own branch
2. Tested independently
3. Committed with clear messages
4. Pushed and PR'd separately
5. Reviewed and merged before starting the next

**Recommended order:**

1. PR #1 (Sandbox Outcome Control) - Core functionality, no dependencies
2. PR #3 (WALDO Confidence) - Independent, type changes only
3. PR #2 (Charge Flow) - UI improvements, depends on webhook flow
4. PR #4 (API Config) - Documentation, can be done anytime

**Dependencies:**

- No PRs depend on each other
- All can be developed in parallel by different engineers
- Merge order doesn't matter (no conflicts expected)

---

## Notes

- **DRY principle:** Each PR touches distinct files/concerns
- **YAGNI:** Only fixing documented issues, no extra features
- **TDD approach:** Manual testing steps included (no automated tests in codebase yet)
- **Commit granularity:** Each logical fix gets its own commit
- **PR size:** Each PR is 2-4 commits, reviewable in 10-15 minutes
