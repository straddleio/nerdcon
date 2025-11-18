# Customer Unmask Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure the customer unmask feature correctly calls the Straddle API, displays unmasked SSN/DOB in CustomerCard, and logs all requests/responses to both terminal and developer logs.

**Architecture:** The feature uses a backend GET endpoint (`/api/customers/:id/unmask`) that calls Straddle's `/customers/:id/unmask` endpoint. The frontend CustomerCard component has a SHOW/HIDE button that toggles visibility of unmasked data. All API calls are logged to both the terminal API log panel (via `logStraddleCall`) and the developer log stream (via `addLogEntry`).

**Tech Stack:** Express backend with Straddle SDK, React frontend, SSE for real-time updates, dual logging system (terminal API logs + developer log stream)

---

## Current State Analysis

**What exists:**

- ✅ Backend endpoint: `GET /api/customers/:id/unmask` (server/src/routes/customers.ts:509-576)
- ✅ Frontend API function: `unmaskCustomer()` (web/src/lib/api.ts:244-246)
- ✅ CustomerCard component with unmask button (web/src/components/dashboard/CustomerCard.tsx:70-98, 374-388)
- ✅ Terminal API log system via `logStraddleCall()` (server/src/domain/logs.ts:56-78)
- ✅ Developer log stream via `addLogEntry()` (server/src/domain/log-stream.ts:41-50)

**What's working:**

- Backend endpoint calls `straddleClient.get('/customers/:id/unmask')`
- Logs to terminal API panel via `logStraddleCall()`
- Logs to developer stream via `addLogEntry()` (straddle-req and straddle-res entries)
- Frontend displays masked SSN (**\*-**-XXXX) and DOB by default
- SHOW button triggers `unmaskCustomer()` API call
- HIDE button clears unmasked data

**What needs verification:**

1. Confirm backend is calling correct Straddle endpoint
2. Verify all logging is complete (both terminal and developer logs)
3. Test unmask response displays correctly in CustomerCard
4. Ensure SHOW/HIDE toggle works properly

---

## Task 1: Verify Backend Unmask Endpoint

**Files:**

- Review: `server/src/routes/customers.ts:509-576`
- Review: `server/src/sdk.ts` (Straddle client setup)

**Step 1: Review the unmask endpoint implementation**

Current implementation at `server/src/routes/customers.ts:509-576`:

```typescript
router.get('/:id/unmask', (req: Request, res: Response) => {
  void (async () => {
    try {
      // Log outbound request
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'GET',
        path: `/customers/${req.params.id}/unmask`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const unmaskResponse = await straddleClient.get(`/customers/${req.params.id}/unmask`);
      const duration = Date.now() - startTime;

      // Log inbound response
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: unmaskResponse,
        duration,
        requestId: req.requestId,
      });

      // Log to terminal API panel
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `customers/${req.params.id}/unmask`,
        'GET',
        200,
        duration,
        undefined,
        unmaskResponse
      );

      res.json(unmaskResponse);
    } catch (error: unknown) {
      // Error handling...
    }
  })();
});
```

**Step 2: Verify logging is complete**

Check that:

- ✅ `addLogEntry()` called for straddle-req (line 513-519)
- ✅ `addLogEntry()` called for straddle-res (line 528-535)
- ✅ `logStraddleCall()` called for terminal API log (line 538-547)

Expected: All logging is already in place.

**Step 3: Verify error logging**

Check error path includes logging (lines 551-574):

```typescript
catch (error: unknown) {
  const err = toExpressError(error);
  logger.error('Error unmasking customer', err);

  const statusCode = err.status || 500;
  const errorResponse = {
    error: err.message || 'Failed to unmask customer',
  };

  // Log failed Straddle API call (Terminal API Log Panel)
  const errorData = error as Record<string, unknown>;
  logStraddleCall(
    req.requestId,
    req.correlationId,
    `customers/${req.params.id}/unmask`,
    'GET',
    statusCode,
    0, // duration unknown on error
    undefined,
    errorData.error || errorResponse
  );

  res.status(statusCode).json(errorResponse);
}
```

Expected: Error logging to terminal API panel exists, but missing `addLogEntry()` for error response.

**Step 4: Add missing error log entry**

Add `addLogEntry()` call in error handler before sending response:

```typescript
catch (error: unknown) {
  const err = toExpressError(error);
  logger.error('Error unmasking customer', err);

  const statusCode = err.status || 500;
  const errorResponse = {
    error: err.message || 'Failed to unmask customer',
  };

  // ADD THIS: Log error response to stream
  addLogEntry({
    timestamp: new Date().toISOString(),
    type: 'straddle-res',
    statusCode,
    responseBody: errorResponse,
    requestId: req.requestId,
  });

  // Log failed Straddle API call (Terminal API Log Panel)
  const errorData = error as Record<string, unknown>;
  logStraddleCall(
    req.requestId,
    req.correlationId,
    `customers/${req.params.id}/unmask`,
    'GET',
    statusCode,
    0,
    undefined,
    errorData.error || errorResponse
  );

  res.status(statusCode).json(errorResponse);
}
```

**Step 5: Commit backend logging fix**

Run:

```bash
git add server/src/routes/customers.ts
git commit -m "fix: add error log entry for customer unmask failures

- Add addLogEntry() call in unmask error handler
- Ensures developer log stream captures failed unmask attempts
- Matches logging pattern used in other endpoints"
```

Expected: Clean commit with no test failures.

---

## Task 2: Verify Frontend Unmask Implementation

**Files:**

- Review: `web/src/components/dashboard/CustomerCard.tsx:70-98, 356-389`
- Review: `web/src/lib/api.ts:222-246`

**Step 1: Review unmask button and state management**

Current implementation in CustomerCard.tsx:

```typescript
const [unmaskedData, setUnmaskedData] = useState<UnmaskedCustomer | null>(null);
const [isUnmasking, setIsUnmasking] = useState(false);

// Reset unmasked data when customer changes
useEffect(() => {
  setUnmaskedData(null);
}, [customer?.id]);

// Toggle unmask customer data
const handleUnmask = (): void => {
  void (async (): Promise<void> => {
    if (isUnmasking) {
      return;
    }

    // If already unmasked, hide it
    if (unmaskedData) {
      setUnmaskedData(null);
      return;
    }

    // Otherwise, fetch unmasked data
    if (!customer?.id) {
      return;
    }

    setIsUnmasking(true);
    try {
      const data = await unmaskCustomer(customer.id);
      setUnmaskedData(data);
    } catch (error) {
      console.error('Error unmasking customer data:', error);
      // TODO: Show user-friendly error message
    } finally {
      setIsUnmasking(false);
    }
  })();
};
```

Expected: Logic looks correct. Button toggles between show/hide states.

**Step 2: Review SSN/DOB display logic**

Current display logic (lines 356-389):

```typescript
{/* SSN and DOB Row with Unmask */}
{customer.compliance_profile?.ssn && (
  <div className="pt-2 border-t border-primary/10 relative">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <p className="text-xs text-neutral-500 font-body mb-0.5">SSN</p>
        <p className="text-xs text-neutral-100 font-body font-mono">
          {unmaskedData?.compliance_profile?.ssn ||
            `***-**-${customer.compliance_profile.ssn.slice(-4)}`}
        </p>
      </div>
      <div className="pr-16">
        <p className="text-xs text-neutral-500 font-body mb-0.5">Date of Birth</p>
        <p className="text-xs text-neutral-100 font-body font-mono">
          {unmaskedData?.compliance_profile?.dob || customer.compliance_profile.dob}
        </p>
      </div>
    </div>
    <button
      onClick={handleUnmask}
      disabled={isUnmasking}
      className={...}
      title={unmaskedData ? 'Hide sensitive data' : 'Show unmasked data'}
    >
      {unmaskedData ? 'HIDE' : 'SHOW'}
    </button>
  </div>
)}
```

**Issue:** DOB display logic assumes `customer.compliance_profile.dob` is already masked. According to the API type definitions, the customer response has masked SSN (`***-**-XXXX`) but the DOB masking format is `****-**-**`.

Expected: DOB should display masked format by default, not the raw value from `customer.compliance_profile.dob`.

**Step 3: Fix DOB display logic**

Update DOB display to properly show masked format when not unmasked:

```typescript
<div className="pr-16">
  <p className="text-xs text-neutral-500 font-body mb-0.5">Date of Birth</p>
  <p className="text-xs text-neutral-100 font-body font-mono">
    {unmaskedData?.compliance_profile?.dob ||
     (customer.compliance_profile.dob ? '****-**-**' : 'N/A')}
  </p>
</div>
```

Wait - this needs verification. Let me check what the actual API returns for masked DOB.

**Step 4: Verify API response format**

Before making changes, we need to verify what the Straddle API actually returns for masked vs unmasked DOB:

- Masked response from `/customers/:id` endpoint: What format?
- Unmasked response from `/customers/:id/unmask` endpoint: Full DOB (YYYY-MM-DD)

According to `server/src/domain/types.ts:22-24`:

```typescript
compliance_profile?: {
  ssn?: string; // Masked format: ***-**-****
  dob?: string; // Masked format: ****-**-**
}
```

According to `web/src/lib/api.ts:111-114`:

```typescript
compliance_profile?: {
  ssn?: string; // Masked format: ***-**-****
  dob?: string; // Masked format: ****-**-**
}
```

**Conclusion:** The API already returns masked DOB. The current code is correct IF the API returns masked DOB. However, we need to test this.

**Step 5: Document testing requirements**

Testing checklist:

1. Create customer with `/customer-KYC` command
2. Verify CustomerCard displays:
   - SSN: `***-**-XXXX` (last 4 digits visible)
   - DOB: `****-**-**` (fully masked)
3. Click SHOW button
4. Verify CustomerCard displays:
   - SSN: Full unmasked value (XXX-XX-XXXX)
   - DOB: Full unmasked value (YYYY-MM-DD)
5. Click HIDE button
6. Verify returns to masked display
7. Verify terminal logs show API request
8. Verify developer logs show request/response

No code changes needed yet - current implementation should work if API returns correct format.

---

## Task 3: Manual Testing

**Files:**

- N/A (testing only)

**Step 1: Start the application**

Run:

```bash
npm run dev
```

Expected: Both server (port 3001) and web (port 5173) start successfully.

**Step 2: Create customer with KYC data**

In browser terminal at `http://localhost:5173`, run:

```
/customer-KYC
```

Expected:

- Customer created with SSN and DOB
- CustomerCard displays masked values
- Terminal shows API request logs
- Developer logs (in browser console or separate panel) show request/response

**Step 3: Test SHOW button**

Click the SHOW button in CustomerCard.

Expected:

- Button changes to HIDE
- SSN displays full unmasked value
- DOB displays full unmasked value
- Browser network tab shows GET request to `/api/customers/:id/unmask`
- Terminal shows new API log entry for unmask call
- Developer logs show straddle-req and straddle-res entries

**Step 4: Test HIDE button**

Click the HIDE button.

Expected:

- Button changes to SHOW
- SSN returns to masked format
- DOB returns to masked format
- No API call made (client-side toggle only)

**Step 5: Verify logging**

Check terminal API log panel:

- Should show GET /customers/:id/unmask entry
- Should display request/response details when expanded

Check developer log stream (if accessible in UI):

- Should show straddle-req entry (type: 'straddle-req', method: 'GET', path: '/customers/:id/unmask')
- Should show straddle-res entry (type: 'straddle-res', statusCode: 200, responseBody: {...})

**Step 6: Test error scenario**

Test with invalid customer ID (manually in browser console):

```javascript
await fetch('/api/customers/invalid_id/unmask');
```

Expected:

- Terminal API log shows failed request
- Developer log stream shows error entry
- Error response logged properly

**Step 7: Document test results**

Create test report:

```bash
touch docs/plans/2025-11-17-unmask-test-results.md
```

Document:

- ✅ or ❌ for each test case
- Screenshots of terminal logs
- Screenshots of developer logs
- Any issues found

---

## Task 4: Fix Any Issues Found During Testing

**Files:**

- TBD based on test results

**Step 1: Review test results**

Read `docs/plans/2025-11-17-unmask-test-results.md`

**Step 2: Create fix tasks**

For each issue found:

1. Identify root cause
2. Write failing test (if applicable)
3. Implement fix
4. Verify fix resolves issue
5. Commit with descriptive message

**Step 3: Re-test after fixes**

Run through manual testing steps again.

Expected: All tests pass.

---

## Task 5: Code Review and Cleanup

**Files:**

- `server/src/routes/customers.ts`
- `web/src/components/dashboard/CustomerCard.tsx`

**Step 1: Review error handling**

Check CustomerCard.tsx handleUnmask error handler (line 91-93):

```typescript
catch (error) {
  console.error('Error unmasking customer data:', error);
  // TODO: Show user-friendly error message
}
```

**Step 2: Add user-friendly error display**

Options:

1. Add error state to component
2. Show toast notification
3. Display inline error message

Recommended: Add error state and inline message.

```typescript
const [unmaskError, setUnmaskError] = useState<string | null>(null);

// In handleUnmask:
try {
  setUnmaskError(null); // Clear previous errors
  const data = await unmaskCustomer(customer.id);
  setUnmaskedData(data);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to unmask customer data';
  setUnmaskError(message);
  console.error('Error unmasking customer data:', error);
}

// In JSX, after the button:
{unmaskError && (
  <p className="text-xs text-accent font-body mt-1">
    {unmaskError}
  </p>
)}
```

**Step 3: Remove console.error**

Replace `console.error` with proper logger if available, or remove entirely since error is displayed to user.

**Step 4: Commit error handling improvements**

Run:

```bash
git add web/src/components/dashboard/CustomerCard.tsx
git commit -m "feat: add user-friendly error display for unmask failures

- Add unmaskError state to CustomerCard
- Display error message below SHOW button when unmask fails
- Clear error on successful unmask
- Remove console.error in favor of inline error display"
```

Expected: Clean commit, no lint errors.

**Step 5: Run linter**

Run:

```bash
npm run lint
```

Expected: No errors or warnings.

**Step 6: Run type checker**

Run:

```bash
npm run type-check
```

Expected: No type errors.

---

## Task 6: Documentation Update

**Files:**

- Create: `docs/features/customer-unmask.md`

**Step 1: Write feature documentation**

```markdown
# Customer Unmask Feature

## Overview

Allows authorized users to view unmasked customer PII (SSN, DOB) by clicking a SHOW button in the CustomerCard component.

## User Flow

1. Customer is created with KYC data via `/customer-KYC` command
2. CustomerCard displays masked SSN (**\*-**-XXXX) and DOB (\***\*-**-\*\*)
3. User clicks SHOW button
4. System calls `GET /api/customers/:id/unmask`
5. Backend calls Straddle `/customers/:id/unmask` endpoint
6. Unmasked data displayed in CustomerCard
7. User clicks HIDE to return to masked view

## API Endpoints

### GET /api/customers/:id/unmask

Returns unmasked customer data including full SSN and DOB.

**Request:**
```

GET /api/customers/cus_abc123/unmask

````

**Response:**
```json
{
  "id": "cus_abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+12125550123",
  "compliance_profile": {
    "ssn": "123-45-6789",
    "dob": "1990-01-15"
  }
}
````

## Security Considerations

- Requires `show_sensitive=true` permission on API key
- Unmask requests are logged to both terminal and developer logs
- Unmasked data only stored in component state (not persisted)
- Unmasked data cleared when customer changes

## Logging

All unmask requests generate:

1. **Terminal API Log:** Expandable entry showing request/response
2. **Developer Log Stream:** straddle-req and straddle-res entries

## Implementation Files

- Backend: `server/src/routes/customers.ts` (lines 509-576)
- Frontend: `web/src/components/dashboard/CustomerCard.tsx` (lines 70-98, 356-389)
- API Client: `web/src/lib/api.ts` (lines 222-246)

````

**Step 2: Save documentation**

Run:
```bash
mkdir -p docs/features
# Write content above to docs/features/customer-unmask.md
````

**Step 3: Commit documentation**

Run:

```bash
git add docs/features/customer-unmask.md
git commit -m "docs: add customer unmask feature documentation

- Document user flow and API endpoints
- Add security considerations
- List implementation files
- Include example request/response"
```

Expected: Clean commit.

---

## Task 7: Final Verification

**Files:**

- N/A (testing only)

**Step 1: Full integration test**

Run complete flow:

1. Reset state: `/reset`
2. Create customer: `/customer-KYC`
3. Verify masked display
4. Click SHOW
5. Verify unmasked display
6. Click HIDE
7. Verify masked display
8. Create new customer
9. Verify previous unmask data cleared

Expected: All steps work correctly.

**Step 2: Verify logging completeness**

Check terminal API log panel:

- ✅ Shows POST /customers (customer creation)
- ✅ Shows GET /customers/:id/review
- ✅ Shows GET /customers/:id/unmask

Check developer log stream (via `/api/logs` endpoint):

- ✅ straddle-req entries for all calls
- ✅ straddle-res entries for all calls
- ✅ Proper request/response bodies

**Step 3: Cross-browser testing**

Test in:

- Chrome
- Firefox
- Safari (if available)

Expected: Works in all browsers.

**Step 4: Performance check**

Verify:

- Unmask call completes in < 500ms
- No memory leaks (unmasked data cleared properly)
- No unnecessary re-renders

**Step 5: Accessibility check**

Verify:

- SHOW/HIDE button has proper title attribute
- Keyboard navigation works
- Screen reader compatibility

---

## Summary

This plan ensures the customer unmask feature:

1. ✅ Calls correct Straddle API endpoint (`/customers/:id/unmask`)
2. ✅ Logs all requests to terminal API panel via `logStraddleCall()`
3. ✅ Logs all requests to developer stream via `addLogEntry()`
4. ✅ Displays unmasked SSN/DOB when SHOW clicked
5. ✅ Hides sensitive data when HIDE clicked
6. ✅ Handles errors gracefully with user-friendly messages
7. ✅ Clears unmasked data when customer changes
8. ✅ Documented for future maintenance

**Total estimated time:** 2-3 hours including testing and documentation.
