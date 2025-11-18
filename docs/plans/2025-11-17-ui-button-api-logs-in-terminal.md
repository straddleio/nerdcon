# UI Button API Logs in Terminal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure all API requests (from terminal commands OR UI buttons) appear as inline logs in the terminal

**Architecture:** Currently, API logs are associated with terminal commands based on timing (within 10 seconds). Button clicks don't create terminal entries, so their API logs appear in the "Logs" tab but not inline. Solution: Create terminal log entries for button-triggered API calls with a clear indicator they came from UI interactions.

**Tech Stack:** React (Zustand state), TypeScript, SSE (Server-Sent Events)

---

## Current Behavior Analysis

**What Works:**

- Terminal commands trigger API calls → logs appear inline (via `associateAPILogsWithCommand`)
- All API calls appear in "Developer Logs" tab (via SSE `api_log` events)

**What's Broken:**

- UI button clicks (e.g., CustomerCard "SHOW" unmask button) → API logs only in "Logs" tab, not terminal inline

**Root Cause:**

- `useSSE.ts:212-223` associates API logs with "most recent terminal input command"
- Button clicks don't create terminal input entries, so no association happens

---

## Solution Design

**Approach:** When UI buttons trigger API calls, emit a synthetic terminal entry showing the action, then associate subsequent API logs with it.

**Key Decision:** Add terminal logging at the API client layer (not individual components) for scalability.

---

## Task 1: Add Terminal Logging Helper to State

**Files:**

- Modify: `web/src/lib/state.ts`

**Step 1: Write failing test for addAPILogEntry**

Create: `web/src/lib/__tests__/state.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useDemoStore } from '../state';

describe('useDemoStore - API Log Entry', () => {
  beforeEach(() => {
    // Reset store state
    useDemoStore.getState().reset();
  });

  it('should add API log entry with terminal line', () => {
    const store = useDemoStore.getState();

    const commandId = store.addAPILogEntry({
      type: 'ui-action',
      text: 'Fetching unmasked customer data...',
    });

    expect(commandId).toBeDefined();
    expect(store.terminalHistory).toHaveLength(3); // 2 initial + 1 new

    const lastLine = store.terminalHistory[store.terminalHistory.length - 1];
    expect(lastLine.id).toBe(commandId);
    expect(lastLine.text).toBe('Fetching unmasked customer data...');
    expect(lastLine.type).toBe('info');
  });

  it('should allow associating logs with returned command ID', () => {
    const store = useDemoStore.getState();

    const commandId = store.addAPILogEntry({
      type: 'ui-action',
      text: 'Fetching data...',
    });

    const mockLog = {
      requestId: 'req-123',
      correlationId: 'corr-456',
      method: 'GET',
      path: '/customers/123/unmask',
      statusCode: 200,
      duration: 500,
      timestamp: new Date().toISOString(),
    };

    store.associateAPILogsWithCommand(commandId, [mockLog]);

    const line = store.terminalHistory.find((l) => l.id === commandId);
    expect(line?.apiLogs).toHaveLength(1);
    expect(line?.apiLogs?.[0]).toEqual(mockLog);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test -- state.test.ts`

Expected: FAIL with "Property 'addAPILogEntry' does not exist on type 'DemoState'"

**Step 3: Implement addAPILogEntry in state**

Modify: `web/src/lib/state.ts`

Add to `DemoState` interface (after line 75):

```typescript
addAPILogEntry: (entry: { type: 'ui-action'; text: string }) => string;
```

Add to store implementation (after line 145):

```typescript
  addAPILogEntry: (entry) => {
    const id = uuid();
    set((state) => ({
      terminalHistory: [
        ...state.terminalHistory,
        {
          id,
          text: entry.text,
          type: 'info' as const,
          timestamp: new Date(),
        },
      ],
    }));
    return id;
  },
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test -- state.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/state.ts web/src/lib/__tests__/state.test.ts
git commit -m "feat: add addAPILogEntry helper for UI action logging

- Enables associating API logs with UI button clicks
- Returns command ID for log association
- Tests verify terminal entry creation and log association"
```

---

## Task 2: Update API Client to Log UI Actions

**Files:**

- Modify: `web/src/lib/api.ts`

**Step 1: Write failing test for unmaskCustomer logging**

Create: `web/src/lib/__tests__/api.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { unmaskCustomer } from '../api';
import { useDemoStore } from '../state';

// Mock fetch
global.fetch = vi.fn();

describe('API Client - Terminal Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDemoStore.getState().reset();
  });

  it('should create terminal entry when unmasking customer', async () => {
    const mockResponse = {
      compliance_profile: {
        ssn: '123-45-6789',
        dob: '1990-01-01',
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const initialHistoryLength = useDemoStore.getState().terminalHistory.length;

    await unmaskCustomer('customer-123');

    const finalHistory = useDemoStore.getState().terminalHistory;
    expect(finalHistory.length).toBe(initialHistoryLength + 1);

    const lastEntry = finalHistory[finalHistory.length - 1];
    expect(lastEntry.text).toContain('Fetching unmasked customer data');
    expect(lastEntry.type).toBe('info');
  });

  it('should not duplicate terminal entries on error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const initialHistoryLength = useDemoStore.getState().terminalHistory.length;

    await expect(unmaskCustomer('customer-123')).rejects.toThrow('Network error');

    const finalHistory = useDemoStore.getState().terminalHistory;
    // Should have added one entry for the action
    expect(finalHistory.length).toBe(initialHistoryLength + 1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test -- api.test.ts`

Expected: FAIL with "expected finalHistory.length to equal initialHistoryLength + 1"

**Step 3: Read current api.ts to understand structure**

Read: `web/src/lib/api.ts` (lines with unmaskCustomer function)

**Step 4: Add terminal logging to unmaskCustomer**

Modify: `web/src/lib/api.ts`

Find the `unmaskCustomer` function and wrap it with terminal logging:

```typescript
export async function unmaskCustomer(customerId: string): Promise<UnmaskedCustomer> {
  // Add terminal entry for UI action
  const commandId = useDemoStore.getState().addAPILogEntry({
    type: 'ui-action',
    text: `🔓 Fetching unmasked customer data...`,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/unmask`);

    if (!response.ok) {
      throw new Error(`Failed to unmask customer: ${response.statusText}`);
    }

    return (await response.json()) as UnmaskedCustomer;
  } catch (error) {
    // Error is propagated, UI will handle display
    throw error;
  }
}
```

Import useDemoStore at top of file if not already imported:

```typescript
import { useDemoStore } from './state';
```

**Step 5: Run test to verify it passes**

Run: `cd web && npm test -- api.test.ts`

Expected: PASS

**Step 6: Test manually in browser**

1. Start dev server: `npm run dev`
2. Open browser: `http://localhost:5173`
3. Run `/demo` to create customer with SSN
4. Click "SHOW" button in Customer card
5. Verify terminal shows "🔓 Fetching unmasked customer data..." with inline API log

**Step 7: Commit**

```bash
git add web/src/lib/api.ts web/src/lib/__tests__/api.test.ts
git commit -m "feat: add terminal logging for unmaskCustomer UI action

- Calls addAPILogEntry before API request
- Subsequent API logs auto-associate via SSE timing logic
- Manual test: click SHOW button → see terminal entry + inline logs"
```

---

## Task 3: Improve SSE Association Logic for UI Actions

**Files:**

- Modify: `web/src/lib/useSSE.ts:212-223`

**Step 1: Write test for improved association**

Add to: `web/src/lib/__tests__/state.test.ts`

```typescript
describe('API Log Association with UI Actions', () => {
  it('should associate logs with most recent entry regardless of type', () => {
    const store = useDemoStore.getState();

    // Add a terminal command
    store.addTerminalLine({ text: '/customer-create', type: 'input' });

    // Add a UI action
    const uiActionId = store.addAPILogEntry({
      type: 'ui-action',
      text: 'Fetching data...',
    });

    const mockLog = {
      requestId: 'req-789',
      correlationId: 'corr-789',
      method: 'GET',
      path: '/customers/123',
      statusCode: 200,
      duration: 300,
      timestamp: new Date().toISOString(),
    };

    store.associateAPILogsWithCommand(uiActionId, [mockLog]);

    const uiLine = store.terminalHistory.find((l) => l.id === uiActionId);
    expect(uiLine?.apiLogs).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `cd web && npm test -- state.test.ts`

Expected: PASS (this should already work with current implementation)

**Step 3: Review useSSE.ts association logic**

Read: `web/src/lib/useSSE.ts:212-223`

Current logic filters by `type === 'input'` which excludes UI action entries. Need to broaden this.

**Step 4: Update association logic to include all recent entries**

Modify: `web/src/lib/useSSE.ts:212-223`

Change from:

```typescript
// Associate with most recent command (within last 10 seconds)
const recentCommand = terminalHistory
  .filter((line) => line.type === 'input')
  .reverse()
  .find((line) => {
    const timeDiff = Date.now() - line.timestamp.getTime();
    return timeDiff < 10000; // Within 10 seconds
  });
```

To:

```typescript
// Associate with most recent command or UI action (within last 10 seconds)
const recentCommand = terminalHistory
  .filter((line) => line.type === 'input' || line.type === 'info')
  .reverse()
  .find((line) => {
    const timeDiff = Date.now() - line.timestamp.getTime();
    return timeDiff < 10000; // Within 10 seconds
  });
```

**Step 5: Write integration test**

Create: `web/src/lib/__tests__/useSSE.integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSSE } from '../useSSE';
import { useDemoStore } from '../state';

describe('useSSE - UI Action Association', () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should associate API logs with UI actions via info type', () => {
    const store = useDemoStore.getState();

    // Simulate UI action creating terminal entry
    const actionId = store.addAPILogEntry({
      type: 'ui-action',
      text: 'Fetching data...',
    });

    // Simulate SSE api_log event arriving
    const mockLog = {
      requestId: 'req-999',
      correlationId: 'corr-999',
      method: 'GET',
      path: '/customers/123/unmask',
      statusCode: 200,
      duration: 450,
      timestamp: new Date().toISOString(),
    };

    // Manually trigger the association logic (simulate SSE event)
    act(() => {
      store.setApiLogs([mockLog, ...store.apiLogs]);

      const recentCommand = store.terminalHistory
        .filter((line) => line.type === 'input' || line.type === 'info')
        .reverse()
        .find((line) => {
          const timeDiff = Date.now() - line.timestamp.getTime();
          return timeDiff < 10000;
        });

      if (recentCommand) {
        store.associateAPILogsWithCommand(recentCommand.id, [mockLog]);
      }
    });

    const actionLine = store.terminalHistory.find((l) => l.id === actionId);
    expect(actionLine?.apiLogs).toBeDefined();
    expect(actionLine?.apiLogs?.length).toBe(1);
  });
});
```

**Step 6: Run integration test**

Run: `cd web && npm test -- useSSE.integration.test.ts`

Expected: PASS

**Step 7: Commit**

```bash
git add web/src/lib/useSSE.ts web/src/lib/__tests__/useSSE.integration.test.ts
git commit -m "feat: associate API logs with UI actions in terminal

- Updated SSE association to include type='info' entries
- UI action logs now appear inline with terminal entry
- Integration test verifies association logic"
```

---

## Task 4: Scale to Other UI Buttons

**Files:**

- Modify: `web/src/lib/api.ts` (add logging to other button-triggered functions)

**Step 1: Identify all button-triggered API functions**

Search codebase for button onClick handlers that call API functions:

```bash
cd web && grep -r "onClick.*api\." src/components/dashboard/
```

Expected: Find functions like `refreshCustomerReview`, `approvePaykey`, `rejectPaykey`, etc.

**Step 2: List functions needing logging**

Document functions in api.ts that are triggered by UI buttons (not terminal commands):

- `refreshCustomerReview()` - CustomerCard refresh button
- `approvePaykey()` / `rejectPaykey()` - PaykeyCard decision buttons
- Any others found in search

**Step 3: Add terminal logging pattern to each function**

For each function identified, wrap with:

```typescript
export async function exampleFunction(id: string): Promise<Response> {
  // Add terminal entry for UI action
  useDemoStore.getState().addAPILogEntry({
    type: 'ui-action',
    text: `📡 [Appropriate action description]...`,
  });

  // ... existing implementation
}
```

Example for refresh:

```typescript
export async function refreshCustomerReview(customerId: string): Promise<CustomerReview> {
  useDemoStore.getState().addAPILogEntry({
    type: 'ui-action',
    text: `🔄 Refreshing customer review...`,
  });

  // ... existing implementation
}
```

**Step 4: Test each function manually**

For each modified function:

1. Find the UI button that triggers it
2. Click the button
3. Verify terminal shows action with inline API logs

**Step 5: Update tests**

For each function, add test similar to Task 2 Step 1 pattern.

**Step 6: Commit**

```bash
git add web/src/lib/api.ts web/src/lib/__tests__/api.test.ts
git commit -m "feat: add terminal logging to all UI-triggered API calls

- refreshCustomerReview, approvePaykey, rejectPaykey, etc.
- Scalable pattern: all button clicks → terminal entries
- Manual tests pass for all dashboard buttons"
```

---

## Task 5: Add Visual Indicator for UI Actions in Terminal

**Files:**

- Modify: `web/src/components/Terminal.tsx`
- Modify: `web/src/lib/state.ts`

**Step 1: Update TerminalLine type to track source**

Modify: `web/src/lib/state.ts`

Add optional field to `TerminalLine` interface (line 22):

```typescript
export interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  timestamp: Date;
  source?: 'command' | 'ui-action'; // Track origin
  // Associated API log entries that occurred during this command
  apiLogs?: APILogEntry[];
}
```

Update `addAPILogEntry` to set source (line ~147):

```typescript
  addAPILogEntry: (entry) => {
    const id = uuid();
    set((state) => ({
      terminalHistory: [
        ...state.terminalHistory,
        {
          id,
          text: entry.text,
          type: 'info' as const,
          timestamp: new Date(),
          source: 'ui-action' as const,
        },
      ],
    }));
    return id;
  },
```

**Step 2: Update Terminal.tsx to style UI actions differently**

Modify: `web/src/components/Terminal.tsx`

Find where terminal lines are rendered and add conditional styling:

```typescript
<div
  className={cn(
    'font-mono',
    line.type === 'input' && 'text-primary',
    line.type === 'error' && 'text-accent',
    line.type === 'success' && 'text-success',
    line.type === 'info' && !line.source && 'text-neutral-400',
    line.type === 'info' && line.source === 'ui-action' && 'text-blue-400 italic'
  )}
>
  {line.text}
</div>
```

**Step 3: Test visual distinction**

1. Run `/demo` to create customer
2. Click "SHOW" button
3. Verify terminal shows italic blue text for UI action
4. Verify normal terminal commands still show as cyan

**Step 4: Commit**

```bash
git add web/src/lib/state.ts web/src/components/Terminal.tsx
git commit -m "feat: visually distinguish UI actions in terminal

- Added 'source' field to TerminalLine type
- UI actions render in italic blue
- Command inputs remain cyan
- Improves terminal readability"
```

---

## Task 6: End-to-End Verification

**Step 1: Manual test all UI buttons**

Test plan:

1. Start fresh: `npm run dev`
2. Open browser: `http://localhost:5173`
3. Run `/demo` to set up full flow
4. Test each button:
   - CustomerCard: SHOW (unmask)
   - CustomerCard: Refresh review button (if exists)
   - PaykeyCard: Review decision buttons (approve/reject)
   - Any other dashboard buttons

Expected: Each button click creates terminal entry with inline API logs

**Step 2: Verify logs tab still works**

1. Check "Developer Logs" tab
2. Verify all API calls appear there
3. Verify chronological order maintained

Expected: No regression in logs tab functionality

**Step 3: Test terminal command logs still work**

1. Run `/customer-create`
2. Verify terminal shows command with inline API logs

Expected: Terminal commands unchanged, still show logs inline

**Step 4: Run full test suite**

```bash
cd web && npm test
cd ../server && npm test
```

Expected: All tests pass

**Step 5: Type check**

```bash
npm run type-check
```

Expected: No TypeScript errors

**Step 6: Create verification report**

Create: `docs/plans/2025-11-17-ui-button-api-logs-verification.md`

```markdown
# UI Button API Logs Verification Report

## Date

2025-11-17

## Summary

All API requests from UI buttons now appear as inline terminal logs.

## Test Results

### UI Button Tests

- [x] CustomerCard SHOW button → terminal entry + API logs
- [x] PaykeyCard review buttons → terminal entries + API logs
- [x] Other dashboard buttons → verified

### Regression Tests

- [x] Terminal commands still show inline logs
- [x] Developer Logs tab shows all API calls
- [x] Chronological order maintained

### Code Quality

- [x] All tests pass (web + server)
- [x] TypeScript type check passes
- [x] No ESLint errors

## Before/After Screenshots

[Describe terminal behavior before and after]

## Conclusion

✅ Feature complete and verified
```

**Step 7: Final commit**

```bash
git add docs/plans/2025-11-17-ui-button-api-logs-verification.md
git commit -m "docs: verification report for UI button API logging

All UI buttons now log to terminal with inline API request details.
Scalable pattern applied across dashboard components."
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2025-11-17-ui-button-api-logs-in-terminal.md`.

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
