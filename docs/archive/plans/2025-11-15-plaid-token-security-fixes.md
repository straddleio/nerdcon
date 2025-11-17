# Plaid Token Security & UX Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical security vulnerability leaking Plaid processor token to browsers and restore ability to edit the token field

**Architecture:** Remove sensitive config endpoint exposure, move token fallback to server-side only, and fix client-side useEffect race condition that prevents field editing

**Tech Stack:** Express.js (backend), React (frontend), TypeScript

---

## Issue Summary

### High Priority - Security Vulnerability

The `/api/config` endpoint at `server/src/routes/state.ts:107-115` exposes the Plaid processor token (`config.plaid.processorToken`) to every browser client. This secret is loaded from `.env` and should never leave the server. Since the frontend calls this endpoint on page load, anyone (including demo attendees) can read the token from browser DevTools network panel and reuse it maliciously.

The token is only needed server-side because `/api/bridge/plaid` already has fallback logic at `server/src/routes/bridge.ts:154` that uses `config.plaid.processorToken` when the client omits a token.

### Medium Priority - UX Bug

The Plaid token input field in `web/src/components/cards/PaykeyCard.tsx:50-64` cannot be edited. A useEffect hook refetches `/api/config` whenever `formData.plaid_token` is falsy and immediately overwrites the form state. When users try to edit (select-all + paste), the field becomes empty momentarily, retriggering the fetch and resetting back to the server default. This makes testing with custom tokens impossible.

---

## Task 1: Remove Plaid Token from /api/config Endpoint

**Files:**

- Modify: `server/src/routes/state.ts:111-115`

**Step 1: Remove plaid_processor_token from response**

In `server/src/routes/state.ts`, update the `/api/config` endpoint to remove the sensitive token:

```typescript
/**
 * GET /api/config
 * Get public server config values (safe to expose to frontend)
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    environment: config.straddle.environment,
  });
});
```

**Rationale:** The `plaid_processor_token` field is removed entirely. The endpoint now only returns non-sensitive configuration. The Plaid token will remain server-side and be used via the fallback in `/api/bridge/plaid`.

**Step 2: Verify server builds without errors**

Run: `npm run build:server`

Expected: Clean build with no TypeScript errors

**Step 3: Commit the security fix**

```bash
git add server/src/routes/state.ts
git commit -m "fix: remove Plaid processor token from /api/config endpoint

The /api/config endpoint was exposing the Plaid processor token
(loaded from PLAID_PROCESSOR_TOKEN env var) to all browser clients.
This created a security risk as anyone could read the token from
the network panel.

Since /api/bridge/plaid already has server-side fallback logic
(server/src/routes/bridge.ts:154), clients never need to know
the token. The fallback uses config.plaid.processorToken when
the client omits plaid_token in the request body.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Fix PaykeyCard Token Field Edit Race Condition

**Files:**

- Modify: `web/src/components/cards/PaykeyCard.tsx:31-64`

**Step 1: Remove the problematic useEffect hook**

The useEffect at lines 50-64 causes the race condition. Since the server no longer exposes the token, we should initialize with empty string and let users paste their own token or rely on server-side fallback:

```typescript
const [formData, setFormData] = useState<PaykeyFormData>(() => ({
  customer_id: customerId || '',
  ...(type === 'plaid'
    ? { plaid_token: '' } // Empty - will use server's fallback
    : {
        account_number: '123456789',
        routing_number: '021000021',
        account_type: 'checking',
      }),
}));

useEffect(() => {
  setFormData((prev) => ({
    ...prev,
    customer_id: customerId || '',
  }));
}, [customerId]);

// REMOVED: useEffect that fetched /api/config and overwrote plaid_token
```

**What changed:**

- Removed lines 49-64 (the entire useEffect that fetches `/api/config`)
- Comment at line 34 updated to clarify the empty string means "use server fallback"
- Field is now freely editable without race conditions

**Step 2: Update the plaid_token input placeholder**

Update the input field to have a helpful placeholder:

```typescript
<div>
  <label className="block text-xs font-pixel text-primary mb-1">Plaid Token</label>
  <input
    type="text"
    value={formData.plaid_token}
    onChange={(e) => updateField('plaid_token', e.target.value)}
    className={cn(
      "w-full px-2 py-1 bg-background-dark border border-primary/30",
      "rounded text-neutral-200 font-body text-sm",
      "focus:border-primary focus:outline-none"
    )}
    placeholder="Leave empty to use server default"
  />
</div>
```

**Step 3: Remove API_BASE_URL import if unused**

Check if `API_BASE_URL` is still used elsewhere in the file. If the only usage was in the removed useEffect:

```typescript
// Remove this line if API_BASE_URL is no longer used:
import { API_BASE_URL } from '@/lib/api';
```

Verify by searching the file. If it appears nowhere after removing the useEffect, delete the import.

**Step 4: Verify web builds without errors**

Run: `npm run build`

Expected: Clean build with no TypeScript or React errors

**Step 5: Commit the UX fix**

```bash
git add web/src/components/cards/PaykeyCard.tsx
git commit -m "fix: allow editing Plaid token field in PaykeyCard

Previously, a useEffect hook would refetch /api/config whenever
formData.plaid_token was falsy and immediately overwrite the
form state. This created a race condition: when users tried to
edit the field (select-all + paste), the field would become empty
momentarily, retriggering the fetch and resetting the value.

Since /api/config no longer exposes the Plaid token (security fix),
and /api/bridge/plaid has server-side fallback logic, clients can
now leave the field empty or provide their own token.

Changes:
- Removed useEffect that fetched /api/config (lines 50-64)
- Field now starts empty and is freely editable
- Added placeholder text to explain empty means server default
- Removed unused API_BASE_URL import (if applicable)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Verify Server-Side Fallback Logic

**Files:**

- Read: `server/src/routes/bridge.ts:142-166`

**Step 1: Review the fallback implementation**

Confirm the existing fallback logic at `server/src/routes/bridge.ts:154`:

```typescript
// Use provided token or fall back to configured token
const tokenToUse = plaid_token || config.plaid.processorToken;
```

This line ensures that when `plaid_token` is omitted or empty in the request body, the server uses the environment variable `PLAID_PROCESSOR_TOKEN`.

**Step 2: Verify config module exposes the token**

Check `server/src/config.ts` to ensure `config.plaid.processorToken` is loaded:

Run: `grep -n "processorToken" server/src/config.ts`

Expected: A line like `processorToken: process.env.PLAID_PROCESSOR_TOKEN || ''`

**Step 3: Document the behavior**

No code changes needed. This task confirms the architecture is correct:

1. Frontend sends empty `plaid_token` or custom token
2. Backend receives request at `/api/bridge/plaid`
3. Line 154 uses `plaid_token || config.plaid.processorToken`
4. Token never exposed to client

**Step 4: Commit documentation update**

Update `CLAUDE.md` to reflect the new security posture:

```bash
# No code changes in this step, just verification
# Could add a note to CLAUDE.md if desired, but not required
```

---

## Task 4: Integration Testing

**Files:**

- Test: Manual testing via browser

**Step 1: Start the development servers**

Run: `npm run dev`

Expected: Both server (port 4000) and web (port 5173) start successfully

**Step 2: Test 1 - Verify /api/config no longer leaks token**

1. Open browser to `http://localhost:5173`
2. Open DevTools Network panel
3. Filter for `/api/config`
4. Refresh page
5. Inspect response body

Expected response:

```json
{
  "environment": "sandbox"
}
```

**MUST NOT contain `plaid_processor_token` field**

**Step 3: Test 2 - Verify Plaid token field is editable**

1. In terminal, run `/create-customer` to get a customer ID
2. Open the Paykey card (Plaid type)
3. Observe the Plaid Token field is empty with placeholder text
4. Try to type or paste a custom token (e.g., "test-token-123")
5. Observe the field accepts input without resetting

Expected: Field remains editable, no automatic resets

**Step 4: Test 3 - Verify empty token uses server fallback**

1. In terminal with a verified customer, run:
   ```
   /create-paykey plaid --outcome active
   ```
2. Observe the backend logs (server terminal)
3. Confirm the request to Straddle uses the `PLAID_PROCESSOR_TOKEN` env var

Expected: Backend successfully links account using fallback token from `.env`

**Step 5: Test 4 - Verify custom token is sent to server**

1. In Paykey card, manually enter a custom token in the Plaid Token field
2. Click one of the outcome buttons (e.g., "✓ Active")
3. Observe the network request to `/api/bridge/plaid`
4. Inspect request body

Expected request body:

```json
{
  "customer_id": "customer_xxx",
  "plaid_token": "custom-token-here"
}
```

Backend should use the custom token instead of fallback.

**Step 6: Document test results**

Create test report at `docs/testing/2025-11-15-plaid-token-security-test.md`:

```markdown
# Plaid Token Security & UX Test Report

Date: 2025-11-15

## Test Results

### Test 1: /api/config endpoint security

- ✅ Token no longer exposed in response
- ✅ Only `environment` field returned

### Test 2: Plaid token field editability

- ✅ Field starts empty
- ✅ Placeholder text displayed
- ✅ No race condition when editing
- ✅ Field accepts and retains input

### Test 3: Server-side fallback

- ✅ Empty token falls back to PLAID_PROCESSOR_TOKEN env var
- ✅ Paykey successfully created

### Test 4: Custom token submission

- ✅ Custom token sent in request body
- ✅ Server uses custom token (if provided)

## Security Verification

- ✅ PLAID_PROCESSOR_TOKEN never leaves server
- ✅ Browser DevTools cannot access token
- ✅ Network panel shows no token in /api/config response

## UX Verification

- ✅ Users can paste custom tokens for testing
- ✅ Empty token works via server fallback
- ✅ No confusing auto-reset behavior
```

**Step 7: Commit test documentation**

```bash
git add docs/testing/2025-11-15-plaid-token-security-test.md
git commit -m "docs: add test report for Plaid token security fixes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Update Project Documentation

**Files:**

- Modify: `CLAUDE.md` (multiple sections)

**Step 1: Update Security Notes section**

Add clarity about what NOT to expose:

Find the "## Security Notes" section and update:

```markdown
## Security Notes

- **API keys ONLY in server environment** - never in frontend or `VITE_` variables
- **Sensitive config kept server-side** - /api/config endpoint only exposes non-sensitive values (environment name, etc.). Secrets like PLAID_PROCESSOR_TOKEN use server-side fallback logic
- **No logging of sensitive data** - tokens, account numbers are redacted in logs
- **Input validation** - all terminal commands validate before API calls
- **CORS configured** - only allow specified origin
```

**Step 2: Update Troubleshooting section**

Add common issue about Plaid tokens:

```markdown
### "plaid_token must be provided or PLAID_PROCESSOR_TOKEN must be set"

**Cause:** Neither custom token provided nor env var configured
**Fix:** Either set `PLAID_PROCESSOR_TOKEN` in `server/.env` or provide token in PaykeyCard form
```

**Step 3: Update API Endpoints documentation**

Clarify the `/api/config` endpoint:

Find the **State:** section under "## API Endpoints" and update:

```markdown
**State:**

- `GET /api/state` - Current demo state
- `GET /api/config` - Public config (environment only, no secrets)
- `GET /api/logs` - Request log for UI
- `POST /api/reset` - Clear state
- `GET /api/events/stream` - SSE endpoint
```

**Step 4: Commit documentation updates**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with security and config clarifications

- Clarified /api/config only returns non-sensitive values
- Added troubleshooting for missing Plaid token
- Updated security notes about server-side fallback pattern

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Optional - Consider Removing /api/config Entirely

**Files:**

- Potentially Remove: `server/src/routes/state.ts:107-116`
- Potentially Modify: `server/src/routes/state.ts` (export statement)

**Step 1: Search for other usages of /api/config**

Run: `grep -r "\/api\/config" web/src/`

Expected: Should find no matches now that PaykeyCard.tsx no longer uses it

**Step 2: Decide whether to keep endpoint**

**Option A: Keep it for future non-sensitive config**

- Endpoint still useful for exposing environment name
- Frontend can know if it's in sandbox vs production
- May add other non-sensitive config later

**Option B: Remove it entirely**

- Currently only returns one field (`environment`)
- Environment could be exposed via other means
- Fewer endpoints = smaller attack surface

**Recommendation:** Keep the endpoint for now. It's harmless (only exposes environment name) and may be useful for future config needs.

**Step 3: If keeping, no changes needed**

The endpoint is already secured (Task 1 removed the token). This task is documentation only.

**Step 4: Document the decision**

Add a comment in the code explaining why the endpoint exists:

```typescript
/**
 * GET /api/config
 * Get public server config values (safe to expose to frontend)
 *
 * SECURITY NOTE: Never add sensitive values here (API keys, tokens, secrets).
 * Those should use server-side fallback logic in route handlers.
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    environment: config.straddle.environment,
  });
});
```

**Step 5: Commit if changes made**

```bash
# Only if you added the comment:
git add server/src/routes/state.ts
git commit -m "docs: add security comment to /api/config endpoint

Clarify that this endpoint should never expose sensitive values.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] `/api/config` response does not contain `plaid_processor_token`
- [ ] Plaid token field in PaykeyCard is empty by default
- [ ] Plaid token field can be edited without reset issues
- [ ] Empty token successfully uses server-side `PLAID_PROCESSOR_TOKEN`
- [ ] Custom tokens in the field are sent to backend
- [ ] Both `npm run build:server` and `npm run build` succeed
- [ ] All commits follow conventional commit format
- [ ] Documentation updated in CLAUDE.md
- [ ] Test report created showing security verification

---

## Success Criteria

**Security Fix:**

- ✅ PLAID_PROCESSOR_TOKEN never exposed to browser
- ✅ Network panel shows no token in `/api/config` response
- ✅ Server fallback works correctly

**UX Fix:**

- ✅ Plaid token field accepts paste/type input
- ✅ No race condition or auto-reset behavior
- ✅ Clear placeholder text explains behavior

**Code Quality:**

- ✅ Clean builds (no TypeScript errors)
- ✅ Proper commit messages
- ✅ Documentation updated

---

## Rollback Plan

If issues arise:

1. **Security fix broke Plaid linking:**
   - Check `.env` has `PLAID_PROCESSOR_TOKEN` set
   - Verify fallback logic at `server/src/routes/bridge.ts:154`

2. **UX fix broke form submission:**
   - Revert `web/src/components/cards/PaykeyCard.tsx`
   - Check for accidental deletion of other useEffects

3. **Complete rollback:**
   ```bash
   git log --oneline -6  # Find commit hashes
   git revert <commit-hash> --no-commit  # Revert each commit
   git commit -m "revert: rollback Plaid token security fixes"
   ```
