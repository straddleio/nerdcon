# Logging System Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix and enhance the logging system to show only relevant data: filter logs by current resources, remove duplicate REQUEST logs, fix API logs in terminal, and improve Pizza Tracker to show status_details messages.

**Architecture:** Four-part fix: (1) Filter Logs Tab to show only webhooks for current resources, (2) Remove duplicate REQUEST/RESPONSE logs from log stream, (3) Fix API logs in terminal to populate from /api/logs endpoint, (4) Enhance Pizza Tracker to display status_details.message from charge status_history.

**Tech Stack:** React, TypeScript, Zustand state management, Express backend

---

## Task 1: Filter Logs Tab by Current Resource IDs

**Problem:** Logs Tab shows ALL webhooks ever received, not just for current customer/paykey/charge shown in dashboard cards.

**Files:**
- Modify: `web/src/components/LogsTab.tsx:22-42`
- Read context: `web/src/lib/state.ts` (for resource IDs)

**Step 1: Import state to access current resource IDs**

In `web/src/components/LogsTab.tsx`, add import after line 2:

```typescript
import { useDemoStore } from '@/lib/state';
```

**Step 2: Get current resource IDs from state**

In the `LogsTab` component, after line 24, add:

```typescript
const customer = useDemoStore((state) => state.customer);
const paykey = useDemoStore((state) => state.paykey);
const charge = useDemoStore((state) => state.charge);
```

**Step 3: Filter log stream by current resource IDs**

Replace the log stream mapping starting at line 94 with filtered version:

```typescript
{logStream.length === 0 ? (
  <div className="text-neutral-600">No log entries yet...</div>
) : (
  logStream
    // Filter: Only show webhooks for current resources, or non-webhook entries
    .filter((entry) => {
      if (entry.type !== 'webhook') {
        return true; // Show all non-webhook entries (requests/responses)
      }

      // For webhooks, only show if they match current resource IDs
      const resourceId = entry.webhookPayload?.data?.id;
      if (!resourceId) return false; // Skip webhooks without resource ID

      return (
        resourceId === customer?.id ||
        resourceId === paykey?.id ||
        resourceId === charge?.id
      );
    })
    .map((entry) => (
      // ... existing mapping code
    ))
)}
```

**Step 4: Verify filtering works**

Run: `npm run dev`
Action: Open http://localhost:5173, run `/demo`, check Logs Tab
Expected: Only see webhooks for the current customer/paykey/charge IDs shown in cards

**Step 5: Commit**

```bash
git add web/src/components/LogsTab.tsx
git commit -m "feat: filter logs tab to show only current resource webhooks"
```

---

## Task 2: Remove Duplicate REQUEST/RESPONSE Logs from Log Stream

**Problem:** Log stream shows both application REQUEST/RESPONSE logs (blue) AND Straddle SDK logs (gold/cyan). The REQUEST/RESPONSE logs are redundant since we already show Straddle SDK calls.

**Files:**
- Modify: `server/src/middleware/tracing.ts:45-85`

**Step 1: Remove application-level log stream entries**

In `server/src/middleware/tracing.ts`, find the section that logs incoming requests and responses to the log stream (around lines 45-85). Comment out or remove these `addLogEntry()` calls:

```typescript
// REMOVE THIS BLOCK (around line 52-62):
// Log incoming request to stream
// if (req.path.startsWith('/api/') && !req.path.startsWith('/api/log-stream') && !req.path.startsWith('/api/events')) {
//   addLogEntry({
//     timestamp: new Date().toISOString(),
//     type: 'request',
//     method: req.method,
//     path: req.path,
//     requestBody: req.body,
//     requestId: req.requestId,
//     correlationId: req.correlationId,
//   });
// }

// ALSO REMOVE THIS BLOCK (around line 75-85):
// Log response to stream
// addLogEntry({
//   timestamp: new Date().toISOString(),
//   type: 'response',
//   statusCode: res.statusCode,
//   responseBody,
//   duration,
//   requestId: req.requestId,
// });
```

**Keep the `logRequest()` calls** - these populate the API logs shown in the terminal below.

**Step 2: Update LogsTab to handle only 3 types**

In `web/src/components/LogsTab.tsx`, update the type definitions and handlers to remove 'request' and 'response':

```typescript
// Line 4: Update type definition
type LogEntryType = 'straddle-req' | 'straddle-res' | 'webhook';

// Lines 44-53: Update getTypeColor to remove request/response cases
const getTypeColor = (type: LogEntryType) => {
  switch (type) {
    case 'straddle-req': return 'text-gold';
    case 'straddle-res': return 'text-primary';
    case 'webhook': return 'text-accent';
    default: return 'text-neutral-400';
  }
};

// Lines 55-64: Update getTypeIcon
const getTypeIcon = (type: LogEntryType) => {
  switch (type) {
    case 'straddle-req': return '⇉';
    case 'straddle-res': return '⇇';
    case 'webhook': return '⚡';
    default: return '•';
  }
};

// Lines 66-75: Update getTypeLabel
const getTypeLabel = (type: LogEntryType) => {
  switch (type) {
    case 'straddle-req': return 'STRADDLE REQ';
    case 'straddle-res': return 'STRADDLE RES';
    case 'webhook': return 'WEBHOOK';
    default: return type;
  }
};
```

**Step 3: Update filter logic to remove request/response check**

In the filter function from Task 1, simplify since we no longer have 'request' and 'response' types:

```typescript
.filter((entry) => {
  // Only show webhooks for current resources
  if (entry.type === 'webhook') {
    const resourceId = entry.webhookPayload?.data?.id;
    if (!resourceId) return false;

    return (
      resourceId === customer?.id ||
      resourceId === paykey?.id ||
      resourceId === charge?.id
    );
  }

  // Show all Straddle request/response entries
  return true;
})
```

**Step 4: Verify no duplicate logs**

Run: `npm run dev`
Action: Run `/demo`, check Logs Tab
Expected: Only see gold "STRADDLE REQ", cyan "STRADDLE RES", and magenta "WEBHOOK" entries. No blue "REQUEST" or green "RESPONSE" entries.

**Step 5: Commit**

```bash
git add server/src/middleware/tracing.ts web/src/components/LogsTab.tsx
git commit -m "feat: remove duplicate request/response logs from stream"
```

---

## Task 3: Fix API Logs in Terminal (Light Logs)

**Problem:** The API logs below the terminal are not populating. The component fetches from `/api/logs` but the endpoint may not be returning data correctly, or the logs are not being created.

**Files:**
- Verify: `server/src/routes/state.ts:25-28` (check endpoint exists)
- Verify: `server/src/middleware/tracing.ts:65-75` (check logRequest is called)
- Debug: `web/src/components/APILog.tsx:17-37` (check fetch logic)

**Step 1: Verify /api/logs endpoint exists and returns data**

Read `server/src/routes/state.ts` and confirm the endpoint:

```typescript
router.get('/logs', (_req: Request, res: Response) => {
  const logs = getRequestLogs();
  res.json(logs);
});
```

**Step 2: Add debug logging to verify logs are being created**

In `server/src/middleware/tracing.ts`, after the `logRequest()` call (around line 75), add:

```typescript
logRequest({
  requestId: req.requestId!,
  correlationId: req.correlationId!,
  idempotencyKey: req.idempotencyKey,
  method: req.method,
  path: req.path,
  statusCode: res.statusCode,
  duration,
  timestamp: new Date().toISOString(),
  requestBody: req.body,
  responseBody,
});

// Add debug log
console.log(`📝 Logged request: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
```

**Step 3: Add debug logging to APILog component**

In `web/src/components/APILog.tsx`, update the fetch logic (around line 18-27):

```typescript
const fetchLogs = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/logs');
    if (response.ok) {
      const logs = await response.json();
      console.log('📊 Fetched API logs:', logs.length, 'entries');
      setApiLogs(logs);
    } else {
      console.error('Failed to fetch API logs:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Failed to fetch API logs:', error);
  }
};
```

**Step 4: Test and verify logs appear**

Run: `npm run dev`
Action: Open browser console, run `/create-customer`
Expected:
- Server console shows: `📝 Logged request: POST /api/customers - 201 (XXXms)`
- Browser console shows: `📊 Fetched API logs: 1 entries` (or more)
- API log panel shows the request

**Step 5: Remove debug logs and commit**

Once confirmed working, remove the debug `console.log` statements added in steps 2 and 3.

```bash
git add server/src/middleware/tracing.ts web/src/components/APILog.tsx
git commit -m "fix: ensure api logs populate in terminal panel"
```

---

## Task 4: Enhance Pizza Tracker to Show status_details Messages

**Problem:** Charge API returns multiple "pending" status entries in status_history, each with different `status_details.message` values. The Pizza Tracker currently shows generic messages like "Charge pending" but should show the actual API message for each step.

**Files:**
- Modify: `web/src/components/dashboard/PizzaTracker.tsx:45-58`
- Modify: `server/src/routes/charges.ts:69-87` (to ensure status_details is mapped)

**Step 1: Update backend to include status_details in mapped charge**

In `server/src/routes/charges.ts`, find the `demoCharge` mapping (around line 69-87) and ensure we're capturing the full status_history with messages:

```typescript
const demoCharge: DemoCharge = {
  id: charge.data.id,
  customer_id: undefined,
  paykey: charge.data.paykey || '',
  amount: charge.data.amount,
  currency: charge.data.currency,
  status: charge.data.status,
  payment_date: charge.data.payment_date,
  created_at: charge.data.created_at || new Date().toISOString(),
  scheduled_at: (charge.data as any).scheduled_at || undefined,
  completed_at: (charge.data as any).completed_at || undefined,
  failure_reason: (charge.data as any).failure_reason || undefined,
  status_history: charge.data.status_history?.map((h: any) => ({
    status: h.status,
    timestamp: h.changed_at, // Map changed_at to timestamp
    reason: h.reason,
    message: h.message, // Include the message!
    source: h.source,
  })),
  sandbox_outcome: outcome,
};
```

Apply this same mapping to the GET /api/charges/:id endpoint as well (around line 114-131).

**Step 2: Update PizzaTracker to use real messages from status_history**

In `web/src/components/dashboard/PizzaTracker.tsx`, replace the manual mapping (lines 53-58) with direct usage:

```typescript
// REMOVE this manual mapping:
// const statusHistory: StatusHistoryEntry[] = apiHistory.map((entry) => ({
//   status: entry.status,
//   message: `Charge ${entry.status}`,
//   changed_at: entry.timestamp,
//   timestamp: entry.timestamp,
// }));

// REPLACE with direct usage:
const statusHistory: StatusHistoryEntry[] = apiHistory;
```

**Step 3: Update message display to handle longer text**

In the tracker JSX (around line 146-151), update the message styling to support multi-line text:

```typescript
{/* Message */}
{entry.message && (
  <p className="text-xs text-neutral-400 font-body leading-relaxed mt-2 text-center px-1 break-words">
    {entry.message}
  </p>
)}
```

**Step 4: Test with demo run to see multiple pending steps**

Run: `npm run dev`
Action: Run `/demo` command
Expected: Pizza Tracker shows multiple steps with real API messages like:
- "Payment successfully created and awaiting verification."
- "Payment scheduled for processing."
- "Payment processing initiated."
- etc.

**Step 5: Commit**

```bash
git add server/src/routes/charges.ts web/src/components/dashboard/PizzaTracker.tsx
git commit -m "feat: show real status_details messages in pizza tracker"
```

---

## Task 5: Verify All Improvements Together

**Files:**
- All files from previous tasks

**Step 1: Full reset and demo run**

Run: `npm run dev`
Actions:
1. Open http://localhost:5173
2. Run `/reset`
3. Run `/demo`
4. Switch to "Logs" tab

**Step 2: Verify Logs Tab filtering**

Expected in Logs Tab:
- Gold "STRADDLE REQ" entries for customer, paykey, charge creation
- Cyan "STRADDLE RES" entries for responses
- Magenta "WEBHOOK" entries ONLY for the current customer/paykey/charge IDs
- NO blue "REQUEST" or green "RESPONSE" entries

**Step 3: Verify API logs in terminal**

Expected in left panel below terminal:
- API log entries showing:
  - POST /api/customers
  - POST /api/bridge/bank-account
  - POST /api/charges
- With expandable request/response bodies
- Status codes and timing

**Step 4: Verify Pizza Tracker messages**

Expected in Pizza Tracker:
- Multiple steps showing charge lifecycle
- Each step showing real API message (e.g., "Payment successfully created and awaiting verification.")
- Not generic "Charge created" text

**Step 5: Create a new demo flow to test filtering**

Actions:
1. Run `/reset` again
2. Run `/demo` again (creates NEW customer/paykey/charge IDs)
3. Check Logs Tab

Expected:
- Logs Tab now shows ONLY webhooks for the NEW resource IDs
- Old webhooks from previous demo run are filtered out

**Step 6: Final commit**

If all tests pass:

```bash
git add -A
git commit -m "docs: verify all logging improvements working together"
```

---

## Testing Notes

**Key behaviors to verify:**

1. **Logs Tab filtering:**
   - After `/reset`, Logs Tab should be empty or show only Straddle SDK calls
   - After `/demo`, should show webhooks ONLY for displayed resources
   - After second `/demo`, should show webhooks ONLY for NEW resources (filters out old ones)

2. **No duplicate logs:**
   - Logs Tab should NOT show blue "REQUEST" or green "RESPONSE"
   - Should ONLY show gold "STRADDLE REQ", cyan "STRADDLE RES", magenta "WEBHOOK"

3. **API logs in terminal:**
   - Should populate immediately after commands
   - Should show request/response bodies when expanded
   - Should show timing and status codes

4. **Pizza Tracker messages:**
   - Should show real API messages, not generic text
   - Should handle multi-line messages without breaking layout
   - Should show timestamps for each step

---

## Edge Cases

**What if no resources exist?**
- Logs Tab: Should show "No log entries yet..." (all webhooks filtered out)
- API logs: Should show "No requests yet..."
- Pizza Tracker: Should show "No charge to track. Run /create-charge"

**What if webhook arrives for old resource?**
- Should be filtered out of Logs Tab
- Should still be stored in log stream (for debugging)

**What if status_history is missing message field?**
- Should gracefully handle undefined message
- Should not crash or show "undefined"

**What if API logs endpoint returns error?**
- Should log error to console
- Should not crash component
- Should show "No requests yet..." placeholder

---

## Rollback Plan

If any task causes issues:

1. **Task 1 (filtering):** Remove filter logic, show all entries
2. **Task 2 (duplicate removal):** Re-enable REQUEST/RESPONSE log entries in tracing.ts
3. **Task 3 (API logs fix):** Check server logs for errors, verify endpoint responding
4. **Task 4 (tracker messages):** Revert to generic messages if API doesn't provide them

Each task is independent and can be rolled back separately.

---

## Future Enhancements

**Not in scope for this plan:**

- Add "Clear logs" button to Logs Tab
- Add search/filter by event type in Logs Tab
- Add "Copy JSON" button for webhook payloads
- Add visual indicator when new webhook arrives
- Add pagination for very long log streams
- Add export logs as JSON feature
