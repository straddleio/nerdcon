# Terminal UI Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve terminal UX with better API logging, copy functionality, sticky menu, and keyboard-driven autocomplete.

**Architecture:**

- Frontend improvements to Terminal.tsx, APILogInline.tsx, LogsTab.tsx, and CommandMenu.tsx
- Backend improvements to error serialization in route handlers
- Maintain existing retro aesthetic and state management patterns

**Tech Stack:** React, TypeScript, Zustand, Express, Tailwind CSS

---

## Task 1: Fix Straddle Response Body Display in Developer Logs

**Problem:** The Logs Tab currently shows request bodies and webhook payloads, but response bodies from Straddle API are not displayed.

**Files:**

- Read: `server/src/routes/customers.ts:243-260` (error handling pattern)
- Read: `server/src/routes/bridge.ts` (error handling pattern)
- Read: `server/src/routes/charges.ts` (error handling pattern)
- Read: `server/src/routes/paykeys.ts` (error handling pattern)
- Modify: All route files with catch blocks
- Test: Manual testing with browser

**Step 1: Understand current error logging**

Read the error handling in `customers.ts` to see current pattern:

```bash
# Review current error handling
grep -A 10 "catch (error" server/src/routes/customers.ts
```

Expected: See that errors use `toExpressError()` but don't log response to log-stream.

**Step 2: Create helper to log Straddle error responses**

Modify: `server/src/domain/log-stream.ts`

Add after line 58:

```typescript
/**
 * Log a Straddle API error response
 */
export function logStraddleError(
  requestId: string,
  statusCode: number,
  responseBody: unknown,
  duration?: number
): void {
  addLogEntry({
    timestamp: new Date().toISOString(),
    type: 'straddle-res',
    statusCode,
    responseBody,
    duration,
    requestId,
  });
}
```

**Step 3: Update error handlers to log response bodies**

Modify: `server/src/routes/customers.ts:243-260`

Replace the catch block (around line 243):

```typescript
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error creating customer', err);

      const statusCode = err.status || 500;

      // Parse and log Straddle error response if available
      let errorResponseBody: unknown = null;
      if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;
        // Try to extract error body from SDK error
        if (errorObj.error) {
          errorResponseBody = errorObj.error;
        } else if (errorObj.message && typeof errorObj.message === 'string') {
          // Handle stringified JSON in error message
          try {
            const match = errorObj.message.match(/^\d+\s+(.+)$/);
            if (match) {
              errorResponseBody = JSON.parse(match[1]);
            }
          } catch {
            errorResponseBody = { message: errorObj.message };
          }
        }
      }

      // Log error response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode,
        responseBody: errorResponseBody || { error: err.message },
        requestId: req.requestId,
      });

      const errorResponse = {
        error: err.message || 'Failed to create customer',
        details: errorResponseBody || null,
      };

      // Log outbound response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'response',
        statusCode,
        responseBody: errorResponse,
        requestId: req.requestId,
      });

      res.status(statusCode).json(errorResponse);
    }
```

**Step 4: Apply same pattern to bridge routes**

Modify: `server/src/routes/bridge.ts`

Find all `catch (error: unknown)` blocks and apply the same error logging pattern from Step 3.

**Step 5: Apply same pattern to paykeys routes**

Modify: `server/src/routes/paykeys.ts`

Find all `catch (error: unknown)` blocks and apply the same error logging pattern from Step 3.

**Step 6: Apply same pattern to charges routes**

Modify: `server/src/routes/charges.ts`

Find all `catch (error: unknown)` blocks and apply the same error logging pattern from Step 3.

**Step 7: Test error response logging**

Run:

```bash
npm run dev
```

In browser:

1. Navigate to `http://localhost:5173`
2. Run `/customer-create` with invalid data to trigger an error
3. Go to "Logs" tab
4. Verify that `STRADDLE RES` entries now show error response bodies

Expected: Error responses appear in Logs tab with properly formatted JSON

**Step 8: Commit error response logging**

```bash
git add server/src/domain/log-stream.ts server/src/routes/*.ts
git commit -m "feat(logs): add Straddle error response logging to developer logs

- Log Straddle API error responses to log-stream
- Parse and prettify error bodies from SDK errors
- Ensure all error responses appear in Logs Tab

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Prettify Straddle API Error Responses

**Problem:** Error responses currently show as stringified JSON in error messages (e.g., `"422 {\"error\":...}"`).

**Files:**

- Read: `server/src/domain/errors.ts` (current error handling)
- Modify: `server/src/domain/errors.ts`
- Test: Manual testing with invalid requests

**Step 1: Update toExpressError to parse stringified JSON**

Modify: `server/src/domain/errors.ts`

Replace the entire file:

```typescript
export interface StraddleAPIError {
  error: {
    type: string;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  status?: number;
}

export interface ExpressError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export function isStraddleError(error: unknown): error is StraddleAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as StraddleAPIError).error === 'object'
  );
}

/**
 * Parse stringified JSON error from SDK
 * Handles errors like: "422 {\"error\":{...}}"
 */
export function parseStringifiedError(message: string): {
  statusCode?: number;
  body?: unknown;
} {
  // Try to match "STATUS_CODE JSON_STRING" pattern
  const match = message.match(/^(\d+)\s+(.+)$/);
  if (!match) {
    return {};
  }

  const [, statusStr, jsonStr] = match;
  const statusCode = parseInt(statusStr, 10);

  try {
    const body = JSON.parse(jsonStr);
    return { statusCode, body };
  } catch {
    return { statusCode };
  }
}

export function toExpressError(error: unknown): ExpressError {
  if (error instanceof Error) {
    const err = error as ExpressError;

    // Try to parse stringified JSON from error message
    const parsed = parseStringifiedError(err.message);
    if (parsed.statusCode) {
      err.status = parsed.statusCode;
      err.details = parsed.body;

      // Extract readable message from parsed body
      if (parsed.body && typeof parsed.body === 'object') {
        const bodyObj = parsed.body as Record<string, unknown>;
        if (bodyObj.error && typeof bodyObj.error === 'object') {
          const errorObj = bodyObj.error as Record<string, unknown>;
          if (typeof errorObj.detail === 'string') {
            err.message = errorObj.detail;
          } else if (typeof errorObj.title === 'string') {
            err.message = errorObj.title;
          }
        }
      }
    }

    return err;
  }

  if (isStraddleError(error)) {
    const err = new Error(error.error.message) as ExpressError;
    err.status = error.status || 500;
    err.code = error.error.code;
    err.details = error.error.details;
    return err;
  }

  return new Error('Unknown error occurred') as ExpressError;
}
```

**Step 2: Test error parsing**

Run:

```bash
npm run dev
```

In browser:

1. Create a customer: `/customer-create --outcome verified`
2. Try to create a paykey with rejected customer: `/create-paykey bank --outcome active` (should fail with readable error)
3. Check terminal output and Logs tab for properly formatted error

Expected: Error message is human-readable, not stringified JSON

**Step 3: Commit error prettification**

```bash
git add server/src/domain/errors.ts
git commit -m "feat(errors): prettify Straddle API error responses

- Parse stringified JSON from SDK error messages
- Extract human-readable error details
- Attach structured error body to ExpressError

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add Copy Button to API Logs (Terminal)

**Problem:** Users cannot easily copy JSON from API logs in the terminal.

**Files:**

- Read: `web/src/components/APILogInline.tsx` (current implementation)
- Modify: `web/src/components/APILogInline.tsx`
- Test: Manual testing in browser

**Step 1: Add copy functionality to APILogInline**

Modify: `web/src/components/APILogInline.tsx`

Add after imports (line 3):

```typescript
/**
 * Copy text to clipboard
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};
```

**Step 2: Add CopyButton component**

Add after `highlightJSON` function (after line 75):

```typescript
/**
 * Copy button for code blocks
 */
const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-0.5 text-[9px] font-pixel bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded transition-colors"
      title={label}
    >
      {copied ? '✓ Copied' : '⧉ Copy'}
    </button>
  );
};
```

**Step 3: Add copy buttons to Request/Response sections**

Modify the expanded details section (around line 132-152):

Replace:

```typescript
      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 space-y-2 text-[10px]">
          {/* Request/Response Split */}
          <div className="grid grid-cols-2 gap-2">
            {/* Request */}
            <div>
              <div className="text-neutral-500 font-pixel mb-1 text-[9px]">Request</div>
              <pre className="p-2 bg-background-dark border border-primary/20 rounded font-mono overflow-x-auto scrollbar-retro text-[10px] leading-relaxed">
                <code>{highlightJSON(formatJSON(entry.requestBody))}</code>
              </pre>
            </div>

            {/* Response */}
            <div>
              <div className="text-neutral-500 font-pixel mb-1 text-[9px]">Response</div>
              <pre className="p-2 bg-background-dark border border-secondary/20 rounded font-mono overflow-x-auto scrollbar-retro text-[10px] leading-relaxed">
                <code>{highlightJSON(formatJSON(entry.responseBody))}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
```

With:

```typescript
      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 space-y-2 text-[10px]">
          {/* Request/Response Split */}
          <div className="grid grid-cols-2 gap-2">
            {/* Request */}
            <div>
              <div className="text-neutral-500 font-pixel mb-1 text-[9px] flex items-center justify-between">
                <span>Request</span>
                <CopyButton text={formatJSON(entry.requestBody)} label="Copy request" />
              </div>
              <pre className="p-2 bg-background-dark border border-primary/20 rounded font-mono overflow-x-auto scrollbar-retro text-[10px] leading-relaxed">
                <code>{highlightJSON(formatJSON(entry.requestBody))}</code>
              </pre>
            </div>

            {/* Response */}
            <div>
              <div className="text-neutral-500 font-pixel mb-1 text-[9px] flex items-center justify-between">
                <span>Response</span>
                <CopyButton text={formatJSON(entry.responseBody)} label="Copy response" />
              </div>
              <pre className="p-2 bg-background-dark border border-secondary/20 rounded font-mono overflow-x-auto scrollbar-retro text-[10px] leading-relaxed">
                <code>{highlightJSON(formatJSON(entry.responseBody))}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
```

**Step 4: Test copy functionality in terminal**

Run:

```bash
npm run dev
```

In browser:

1. Run any command (e.g., `/demo`)
2. Expand an API log entry in the terminal
3. Click the "⧉ Copy" button on Request or Response
4. Paste into a text editor to verify JSON was copied

Expected: JSON is copied to clipboard, button shows "✓ Copied" for 2 seconds

**Step 5: Commit terminal copy feature**

```bash
git add web/src/components/APILogInline.tsx
git commit -m "feat(terminal): add copy buttons to API log code blocks

- Add CopyButton component with visual feedback
- Copy formatted JSON from request/response sections
- 2-second confirmation state after copy

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Add Copy Button to Logs Tab

**Problem:** Logs Tab also needs copy functionality for code blocks.

**Files:**

- Read: `web/src/components/LogsTab.tsx`
- Modify: `web/src/components/LogsTab.tsx`
- Test: Manual testing in browser

**Step 1: Add copy utilities to LogsTab**

Modify: `web/src/components/LogsTab.tsx`

Add after imports (line 4):

```typescript
/**
 * Copy text to clipboard
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Copy button for code blocks
 */
const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label = 'Copy' }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-0.5 text-[9px] font-pixel bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded transition-colors"
      title={label}
    >
      {copied ? '✓ Copied' : '⧉ Copy'}
    </button>
  );
};
```

**Step 2: Add copy buttons to detail panel code blocks**

Modify the detail panel (around lines 203-230):

Replace each code block section:

```typescript
          {/* Request Body */}
          {selectedEntry.requestBody !== undefined && (
            <div className="mb-4">
              <h4 className="text-xs text-neutral-400 mb-2 flex items-center justify-between">
                <span>Request Body:</span>
                <CopyButton
                  text={JSON.stringify(selectedEntry.requestBody, null, 2)}
                  label="Copy request body"
                />
              </h4>
              <pre className="p-3 bg-background-card border border-secondary/20 rounded text-xs text-neutral-300 overflow-x-auto scrollbar-retro">
                {JSON.stringify(selectedEntry.requestBody, null, 2)}
              </pre>
            </div>
          )}

          {/* Response Body */}
          {selectedEntry.responseBody !== undefined && (
            <div className="mb-4">
              <h4 className="text-xs text-neutral-400 mb-2 flex items-center justify-between">
                <span>Response Body:</span>
                <CopyButton
                  text={JSON.stringify(selectedEntry.responseBody, null, 2)}
                  label="Copy response body"
                />
              </h4>
              <pre className="p-3 bg-background-card border border-secondary/20 rounded text-xs text-neutral-300 overflow-x-auto scrollbar-retro">
                {JSON.stringify(selectedEntry.responseBody, null, 2)}
              </pre>
            </div>
          )}

          {/* Webhook Payload */}
          {selectedEntry.webhookPayload && (
            <div className="mb-4">
              <h4 className="text-xs text-neutral-400 mb-2 flex items-center justify-between">
                <span>Webhook Payload:</span>
                <CopyButton
                  text={JSON.stringify(selectedEntry.webhookPayload, null, 2)}
                  label="Copy webhook payload"
                />
              </h4>
              <pre className="p-3 bg-background-card border border-secondary/20 rounded text-xs text-neutral-300 overflow-x-auto scrollbar-retro">
                {JSON.stringify(selectedEntry.webhookPayload, null, 2)}
              </pre>
            </div>
          )}
```

**Step 3: Test copy functionality in Logs tab**

Run:

```bash
npm run dev
```

In browser:

1. Run commands to generate logs
2. Go to "Logs" tab
3. Click on a log entry to open detail panel
4. Click copy button on Request/Response/Webhook payload
5. Paste to verify JSON was copied

Expected: JSON is copied with proper formatting

**Step 4: Commit logs tab copy feature**

```bash
git add web/src/components/LogsTab.tsx
git commit -m "feat(logs): add copy buttons to developer logs code blocks

- Add CopyButton component to LogsTab
- Enable copying request/response/webhook payloads
- Consistent UX with terminal API logs

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Make Command Menu Sticky

**Problem:** Menu auto-closes when user clicks a command card. Should stay open until user manually toggles menu button.

**Files:**

- Read: `web/src/components/Terminal.tsx:589-594` (menu handling)
- Read: `web/src/components/CommandMenu.tsx:56-166` (current implementation)
- Modify: `web/src/components/CommandMenu.tsx`
- Modify: `web/src/components/Terminal.tsx`
- Test: Manual testing

**Step 1: Remove auto-close from CommandMenu**

Modify: `web/src/components/CommandMenu.tsx`

Find all `onClose()` calls in button onClick handlers (lines 84, 91, 106, 113, 127, 134, 148, 155).

Replace each occurrence:

```typescript
// OLD:
onClick={() => {
  onCommandSelect('customer-create');
  onClose();
}}

// NEW:
onClick={() => {
  onCommandSelect('customer-create');
  // Menu stays open until user toggles button
}}
```

Apply this to all command buttons in the menu.

**Step 2: Test sticky menu behavior**

Run:

```bash
npm run dev
```

In browser:

1. Click MENU button to open command menu
2. Click "Create Customer" card
3. Verify menu stays open
4. Click MENU button to close menu
5. Verify menu closes

Expected: Menu only closes when user clicks MENU button, not when selecting commands

**Step 3: Commit sticky menu**

```bash
git add web/src/components/CommandMenu.tsx
git commit -m "feat(terminal): make command menu sticky until manually toggled

- Remove auto-close when command card is selected
- Menu now only closes when user clicks MENU button
- Improves UX for running multiple commands

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Add Command Autocomplete - Data Structure

**Problem:** Need keyboard-driven autocomplete for terminal commands.

**Files:**

- Read: `web/src/lib/commands.ts:16-30` (command list)
- Modify: `web/src/lib/commands.ts`
- Test: TypeScript compilation

**Step 1: Create command registry with descriptions**

Modify: `web/src/lib/commands.ts`

Replace `AVAILABLE_COMMANDS` array (lines 16-30) with:

```typescript
/**
 * Command registry with IDs and descriptions for autocomplete
 */
export interface CommandInfo {
  id: string;
  description: string;
}

export const COMMAND_REGISTRY: CommandInfo[] = [
  { id: '/help', description: 'Show available commands' },
  { id: '/customer-create', description: 'Create customer with identity verification' },
  { id: '/create-customer', description: 'Alias for /customer-create' },
  { id: '/customer-KYC', description: 'Create KYC test customer (Jane Doe)' },
  { id: '/create-paykey', description: 'Link bank account' },
  { id: '/paykey-decision', description: 'Approve or reject paykey in review' },
  { id: '/paykey-review', description: 'Show review details for current paykey' },
  { id: '/create-charge', description: 'Create a payment' },
  { id: '/demo', description: 'Run full happy-path flow' },
  { id: '/info', description: 'Show current demo state' },
  { id: '/outcomes', description: 'Show available sandbox outcomes' },
  { id: '/reset', description: 'Clear all demo data' },
  { id: '/clear', description: 'Clear terminal output' },
];

/**
 * Available terminal commands (for backward compatibility)
 */
export const AVAILABLE_COMMANDS = COMMAND_REGISTRY.map((cmd) => cmd.id);
```

**Step 2: Verify TypeScript compiles**

Run:

```bash
npm run type-check
```

Expected: No type errors

**Step 3: Commit command registry**

```bash
git add web/src/lib/commands.ts
git commit -m "feat(terminal): add command registry with descriptions

- Create CommandInfo interface
- Add descriptions to all commands
- Maintain backward compatibility with AVAILABLE_COMMANDS

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Add Command Autocomplete - UI Component

**Problem:** Need to render autocomplete dropdown with keyboard navigation.

**Files:**

- Create: `web/src/components/CommandAutocomplete.tsx`
- Test: Manual inspection

**Step 1: Create CommandAutocomplete component**

Create: `web/src/components/CommandAutocomplete.tsx`

```typescript
import React from 'react';
import { cn } from '@/components/ui/utils';
import type { CommandInfo } from '@/lib/commands';

interface CommandAutocompleteProps {
  suggestions: CommandInfo[];
  highlightedIndex: number;
  onSelect: (commandId: string) => void;
  isVisible: boolean;
}

/**
 * Autocomplete dropdown for terminal commands
 * Shows suggestions that match user input
 */
export const CommandAutocomplete: React.FC<CommandAutocompleteProps> = ({
  suggestions,
  highlightedIndex,
  onSelect,
  isVisible,
}) => {
  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-background-elevated border-2 border-primary/40 rounded shadow-neon-primary max-h-64 overflow-y-auto scrollbar-retro">
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.id}
          onClick={() => onSelect(suggestion.id)}
          className={cn(
            'px-3 py-2 cursor-pointer transition-colors font-mono text-xs',
            'border-b border-primary/10 last:border-b-0',
            highlightedIndex === index
              ? 'bg-primary/20 text-primary'
              : 'text-neutral-300 hover:bg-background-card/30'
          )}
        >
          <div className="font-bold text-primary">{suggestion.id}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">{suggestion.description}</div>
        </div>
      ))}
    </div>
  );
};
```

**Step 2: Verify component compiles**

Run:

```bash
npm run type-check
```

Expected: No type errors

**Step 3: Commit autocomplete component**

```bash
git add web/src/components/CommandAutocomplete.tsx
git commit -m "feat(terminal): add command autocomplete UI component

- Render suggestion dropdown above input
- Show command ID and description
- Support keyboard highlight state
- Retro styling with neon borders

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Add Command Autocomplete - Integration

**Problem:** Wire autocomplete into Terminal with keyboard navigation.

**Files:**

- Read: `web/src/components/Terminal.tsx:32-199` (current input handling)
- Modify: `web/src/components/Terminal.tsx`
- Test: Manual testing in browser

**Step 1: Add autocomplete state and imports**

Modify: `web/src/components/Terminal.tsx`

Add import after line 6:

```typescript
import { executeCommand, COMMAND_REGISTRY, type CommandInfo } from '@/lib/commands';
import { CommandAutocomplete } from './CommandAutocomplete';
```

Add state after line 35 (after `outputRef`):

```typescript
const [suggestions, setSuggestions] = useState<CommandInfo[]>([]);
const [highlightedIndex, setHighlightedIndex] = useState(-1);
const [showSuggestions, setShowSuggestions] = useState(false);
```

**Step 2: Add input change handler for suggestions**

Add after `handleSubmit` function (after line 132):

```typescript
/**
 * Handle input change to update suggestions
 */
const handleInputChange = (value: string): void => {
  setInput(value);

  const trimmed = value.trim();

  if (!trimmed) {
    // Hide suggestions when input is empty
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    return;
  }

  // Find commands that start with the input (case-insensitive)
  const matches = COMMAND_REGISTRY.filter((cmd) =>
    cmd.id.toLowerCase().startsWith(trimmed.toLowerCase())
  );

  setSuggestions(matches);
  setShowSuggestions(matches.length > 0);
  setHighlightedIndex(matches.length > 0 ? 0 : -1);
};
```

**Step 3: Update keyboard handler for autocomplete**

Replace `handleKeyDown` function (lines 137-199) with:

```typescript
/**
 * Handle arrow key navigation through history, Tab autocomplete, and suggestion navigation
 */
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Handle suggestion navigation
  if (showSuggestions && suggestions.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        const selected = suggestions[highlightedIndex];
        setInput(selected.id);
        setShowSuggestions(false);
        setSuggestions([]);
        setHighlightedIndex(-1);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      setSuggestions([]);
      setHighlightedIndex(-1);
      return;
    }

    // Enter executes current input (fall through)
  }

  // Original history navigation (only when no suggestions showing)
  if (!showSuggestions) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) {
        return;
      }

      const newIndex =
        historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) {
        return;
      }

      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
  }
};
```

**Step 4: Add suggestion selection handler**

Add after `handleKeyDown`:

```typescript
/**
 * Handle suggestion selection from autocomplete dropdown
 */
const handleSuggestionSelect = (commandId: string): void => {
  setInput(commandId);
  setShowSuggestions(false);
  setSuggestions([]);
  setHighlightedIndex(-1);
};
```

**Step 5: Update input onChange**

Modify the input element (around line 568):

Replace:

```typescript
          onChange={(e) => setInput(e.target.value)}
```

With:

```typescript
          onChange={(e) => handleInputChange(e.target.value)}
```

**Step 6: Add autocomplete dropdown to render**

Modify the input form (around line 560-585):

Replace:

```typescript
      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-primary/20 pt-2 mt-2 bg-background-elevated/30 px-2 py-1.5 rounded"
      >
```

With:

```typescript
      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 border-t border-primary/20 pt-2 mt-2 bg-background-elevated/30 px-2 py-1.5 rounded"
      >
        {/* Autocomplete Dropdown */}
        <CommandAutocomplete
          suggestions={suggestions}
          highlightedIndex={highlightedIndex}
          onSelect={handleSuggestionSelect}
          isVisible={showSuggestions}
        />
```

**Step 7: Add unknown command handling**

Modify `handleSubmit` function to detect unknown commands:

Add before `executeCommand` call (around line 113):

```typescript
// Check if command exists
const commandName = command.slice(1).split(/\s+/)[0].toLowerCase();
const knownCommands = COMMAND_REGISTRY.map((cmd) => cmd.id.slice(1).toLowerCase());

if (!knownCommands.includes(commandName)) {
  addTerminalLine({
    text: `Unknown command: ${command}. Type /help to see available commands.`,
    type: 'error',
  });
  setExecuting(false);
  return;
}

// Execute command
const result = await executeCommand(command);
```

**Step 8: Test autocomplete**

Run:

```bash
npm run dev
```

In browser:

1. Start typing `/cus` → should show customer commands
2. Press ↓ to navigate suggestions
3. Press Tab to autocomplete
4. Press Enter to execute
5. Press Esc to close suggestions
6. Type invalid command → should show "Unknown command" error

Expected: Full keyboard-driven autocomplete with visual feedback

**Step 9: Commit autocomplete integration**

```bash
git add web/src/components/Terminal.tsx
git commit -m "feat(terminal): add keyboard-driven command autocomplete

- Show suggestions dropdown as user types
- ↑/↓ to navigate, Tab to accept, Enter to execute, Esc to close
- Mouse click also accepts suggestion
- Unknown command validation with helpful error
- Suggestions filter by prefix match (case-insensitive)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Build and Test All Features

**Files:**

- Test: All components
- Test: Type checking
- Test: Linting

**Step 1: Run type check**

Run:

```bash
npm run type-check
```

Expected: No type errors

**Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: No lint errors (auto-fix if needed)

**Step 3: Build project**

Run:

```bash
npm run build
```

Expected: Clean build

**Step 4: Manual E2E testing**

Run:

```bash
npm run dev
```

Test all features:

1. **Error logging**: Create invalid paykey → check Logs tab for error response
2. **Error prettification**: Verify error messages are readable
3. **Terminal copy**: Expand API log → click copy button → paste JSON
4. **Logs copy**: Go to Logs tab → click entry → copy request/response
5. **Sticky menu**: Open menu → click command → verify menu stays open
6. **Autocomplete**: Type `/cus` → use ↑↓ Tab Enter Esc → verify all work
7. **Unknown command**: Type `/invalid` → verify error message

Expected: All features work correctly

**Step 5: Final commit**

```bash
git add .
git commit -m "feat(terminal): complete terminal UI improvements

Comprehensive UX improvements:
- Straddle error responses now visible in developer logs
- Prettified error messages (no more stringified JSON)
- Copy buttons on all API log code blocks
- Sticky command menu (manual toggle only)
- Keyboard-driven autocomplete with descriptions
- Unknown command validation

All features tested and working.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Verification Checklist

After implementation, verify:

- [ ] Straddle error responses appear in Logs tab
- [ ] Error messages are human-readable (no `"422 {\"error\":...}"`)
- [ ] Copy buttons work in Terminal API logs
- [ ] Copy buttons work in Logs tab detail panel
- [ ] Command menu stays open after clicking command cards
- [ ] Command menu only closes when clicking MENU button
- [ ] Autocomplete shows as user types
- [ ] ↑/↓ navigate suggestions without wrap-around
- [ ] Tab accepts highlighted suggestion (no execution)
- [ ] Enter executes current input exactly
- [ ] Esc closes suggestions dropdown
- [ ] Mouse click on suggestion autocompletes (no execution)
- [ ] Unknown commands show helpful error message
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
- [ ] Build succeeds

---

## Notes for Implementation

- Maintain existing retro aesthetic (cyan, magenta, gold colors, neon effects)
- Use existing Zustand patterns for state management
- Follow existing error handling patterns (`toExpressError()`)
- Keep code DRY - extract shared utilities
- Test in real browser, not just type checks
- Commit frequently with descriptive messages
