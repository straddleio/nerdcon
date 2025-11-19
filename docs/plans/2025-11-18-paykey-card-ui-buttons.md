# PaykeyCard UI Buttons Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task with TDD.

**Goal:** Add UI buttons to the empty PaykeyCard state allowing users to link bank accounts via Bridge Widget, Plaid, or direct bank account entry instead of typing terminal commands.

**Architecture:** Extend the existing empty PaykeyCard state (lines 43-54 of `web/src/components/dashboard/PaykeyCard.tsx`) to include three action buttons that trigger the corresponding `/create-paykey` commands programmatically. Use existing RetroButton component for consistent styling. Buttons will call `executeCommand()` from the commands module to maintain separation of concerns.

**Tech Stack:** React, TypeScript, existing retro-components UI library, Zustand state management

---

## Task 1: Write test for empty PaykeyCard with buttons

**Files:**

- Test: `web/src/components/dashboard/__tests__/PaykeyCard.buttons.test.tsx` (CREATE)

**Step 1: Write failing test for button rendering**

Create test file:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaykeyCard } from '../PaykeyCard';
import { useDemoStore } from '../../../lib/state';
import * as commands from '../../../lib/commands';

// Mock commands module
vi.mock('../../../lib/commands', () => ({
  executeCommand: vi.fn(),
}));

describe('PaykeyCard - UI Buttons', () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('Empty State Buttons', () => {
    it('should render three link buttons when no paykey exists', () => {
      // Setup: No paykey, but customer exists
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      render(<PaykeyCard />);

      // Verify all three buttons are present
      expect(screen.getByRole('button', { name: /Link via Bridge/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Link via Plaid/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Link Direct/i })).toBeInTheDocument();
    });

    it('should call executeCommand with /create-paykey-bridge when Bridge button clicked', async () => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      render(<PaykeyCard />);

      const bridgeButton = screen.getByRole('button', { name: /Link via Bridge/i });
      fireEvent.click(bridgeButton);

      await waitFor(() => {
        expect(commands.executeCommand).toHaveBeenCalledWith('/create-paykey-bridge');
      });
    });

    it('should call executeCommand with /create-paykey plaid when Plaid button clicked', async () => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      render(<PaykeyCard />);

      const plaidButton = screen.getByRole('button', { name: /Link via Plaid/i });
      fireEvent.click(plaidButton);

      await waitFor(() => {
        expect(commands.executeCommand).toHaveBeenCalledWith('/create-paykey plaid');
      });
    });

    it('should call executeCommand with /create-paykey bank when Direct button clicked', async () => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      render(<PaykeyCard />);

      const directButton = screen.getByRole('button', { name: /Link Direct/i });
      fireEvent.click(directButton);

      await waitFor(() => {
        expect(commands.executeCommand).toHaveBeenCalledWith('/create-paykey bank');
      });
    });

    it('should not render buttons when no customer exists', () => {
      // No customer, no paykey
      render(<PaykeyCard />);

      expect(screen.queryByRole('button', { name: /Link via Bridge/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Link via Plaid/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Link Direct/i })).not.toBeInTheDocument();

      // Should show message to create customer first
      expect(screen.getByText(/No bank account linked/i)).toBeInTheDocument();
    });

    it('should disable buttons while command is executing', async () => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      // Mock executeCommand to simulate async operation
      vi.mocked(commands.executeCommand).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ success: true, message: 'Done' }), 100);
        });
      });

      render(<PaykeyCard />);

      const bridgeButton = screen.getByRole('button', { name: /Link via Bridge/i });

      // Click button
      fireEvent.click(bridgeButton);

      // Button should be disabled during execution
      expect(bridgeButton).toBeDisabled();

      // Wait for command to complete
      await waitFor(() => {
        expect(bridgeButton).not.toBeDisabled();
      });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test --workspace=web -- PaykeyCard.buttons
```

Expected: FAIL - Component doesn't render buttons yet

**Step 3: Export executeCommand from commands module**

Modify: `web/src/lib/commands.ts:1-30`

Verify `executeCommand` is exported (it should already be):

```typescript
export async function executeCommand(input: string): Promise<CommandResult> {
  // ... existing implementation
}
```

**Step 4: Implement UI buttons in PaykeyCard empty state**

Modify: `web/src/components/dashboard/PaykeyCard.tsx:43-54`

Replace empty state with button UI:

```typescript
  const customer = useDemoStore((state) => state.customer);
  const [isExecuting, setIsExecuting] = useState(false);

  // Handler for button clicks
  const handleLinkAccount = async (command: string): Promise<void> => {
    setIsExecuting(true);
    try {
      await executeCommand(command);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!paykey) {
    return (
      <RetroCard variant="blue" className="h-full">
        <RetroCardHeader>
          <RetroCardTitle>Paykey</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent>
          <p className="text-neutral-400 text-sm mb-4">No bank account linked.</p>

          {customer ? (
            <div className="space-y-2">
              <RetroButton
                variant="primary"
                size="sm"
                onClick={() => handleLinkAccount('/create-paykey-bridge')}
                disabled={isExecuting}
                className="w-full"
              >
                🌉 Link via Bridge
              </RetroButton>

              <RetroButton
                variant="secondary"
                size="sm"
                onClick={() => handleLinkAccount('/create-paykey plaid')}
                disabled={isExecuting}
                className="w-full"
              >
                🏦 Link via Plaid
              </RetroButton>

              <RetroButton
                variant="secondary"
                size="sm"
                onClick={() => handleLinkAccount('/create-paykey bank')}
                disabled={isExecuting}
                className="w-full"
              >
                🏛️ Link Direct
              </RetroButton>
            </div>
          ) : (
            <p className="text-neutral-500 text-xs">Create a customer first with /customer-create</p>
          )}
        </RetroCardContent>
      </RetroCard>
    );
  }
```

Add import at top of file:

```typescript
import { executeCommand } from '@/lib/commands';
import { RetroButton } from '@/components/ui/retro-components';
```

**Step 5: Run tests to verify they pass**

Run:

```bash
npm test --workspace=web -- PaykeyCard.buttons
```

Expected: All 6 tests PASS

**Step 6: Run all PaykeyCard tests to ensure no regressions**

Run:

```bash
npm test --workspace=web -- PaykeyCard
```

Expected: All existing tests still pass

**Step 7: Commit**

```bash
git add web/src/components/dashboard/PaykeyCard.tsx
git add web/src/components/dashboard/__tests__/PaykeyCard.buttons.test.tsx
git commit -m "feat: add UI buttons to PaykeyCard empty state for linking accounts

- Add Bridge, Plaid, and Direct link buttons when no paykey exists
- Buttons call executeCommand() to maintain command execution logic
- Only show buttons if customer exists
- Disable buttons during command execution to prevent double-clicks
- Add comprehensive tests for button rendering and behavior"
```

---

## Task 2: Add visual feedback for button interactions

**Files:**

- Test: `web/src/components/dashboard/__tests__/PaykeyCard.buttons.test.tsx` (MODIFY)
- Modify: `web/src/components/dashboard/PaykeyCard.tsx:43-80`

**Step 1: Write test for loading state**

Add to existing test file:

```typescript
describe('Button Interaction Feedback', () => {
  it('should show loading spinner on button during execution', async () => {
    useDemoStore.getState().setCustomer({
      id: 'cust_123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-555-5555',
      verification_status: 'verified',
    });

    // Mock executeCommand with delay
    vi.mocked(commands.executeCommand).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Done' }), 100);
      });
    });

    render(<PaykeyCard />);

    const bridgeButton = screen.getByRole('button', { name: /Link via Bridge/i });

    fireEvent.click(bridgeButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/Linking\.\.\./i)).toBeInTheDocument();
    });

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText(/Linking\.\.\./i)).not.toBeInTheDocument();
    });
  });

  it('should handle command failure gracefully', async () => {
    useDemoStore.getState().setCustomer({
      id: 'cust_123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-555-5555',
      verification_status: 'verified',
    });

    // Mock executeCommand to fail
    vi.mocked(commands.executeCommand).mockRejectedValue(
      new Error('Bridge initialization failed')
    );

    render(<PaykeyCard />);

    const bridgeButton = screen.getByRole('button', { name: /Link via Bridge/i });

    fireEvent.click(bridgeButton);

    // Button should re-enable after error
    await waitFor(() => {
      expect(bridgeButton).not.toBeDisabled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test --workspace=web -- PaykeyCard.buttons
```

Expected: FAIL - No loading state implemented yet

**Step 3: Add loading state to button handler**

Modify: `web/src/components/dashboard/PaykeyCard.tsx`

Update the handler:

```typescript
const [isExecuting, setIsExecuting] = useState(false);
const [executingCommand, setExecutingCommand] = useState<string | null>(null);

const handleLinkAccount = async (command: string, label: string): Promise<void> => {
  setIsExecuting(true);
  setExecutingCommand(label);
  try {
    await executeCommand(command);
  } catch (error) {
    // Error is already logged to terminal by executeCommand
    console.error('Command execution failed:', error);
  } finally {
    setIsExecuting(false);
    setExecutingCommand(null);
  }
};
```

Update buttons to show loading state:

```typescript
<RetroButton
  variant="primary"
  size="sm"
  onClick={() => handleLinkAccount('/create-paykey-bridge', 'Bridge')}
  disabled={isExecuting}
  className="w-full"
>
  {executingCommand === 'Bridge' ? '⏳ Linking...' : '🌉 Link via Bridge'}
</RetroButton>

<RetroButton
  variant="secondary"
  size="sm"
  onClick={() => handleLinkAccount('/create-paykey plaid', 'Plaid')}
  disabled={isExecuting}
  className="w-full"
>
  {executingCommand === 'Plaid' ? '⏳ Linking...' : '🏦 Link via Plaid'}
</RetroButton>

<RetroButton
  variant="secondary"
  size="sm"
  onClick={() => handleLinkAccount('/create-paykey bank', 'Direct')}
  disabled={isExecuting}
  className="w-full"
>
  {executingCommand === 'Direct' ? '⏳ Linking...' : '🏛️ Link Direct'}
</RetroButton>
```

**Step 4: Run tests to verify they pass**

Run:

```bash
npm test --workspace=web -- PaykeyCard.buttons
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add web/src/components/dashboard/PaykeyCard.tsx
git add web/src/components/dashboard/__tests__/PaykeyCard.buttons.test.tsx
git commit -m "feat: add loading state feedback to PaykeyCard link buttons

- Show 'Linking...' spinner when button is clicked
- Disable all buttons during execution
- Handle errors gracefully with proper state cleanup
- Add tests for loading states and error handling"
```

---

## Task 3: Manual integration testing

**Files:**

- None (manual testing only)

**Step 1: Start development servers**

Run:

```bash
npm run dev
```

Expected: Both server (port 3001) and web (port 5173) start successfully

**Step 2: Test Bridge button workflow**

1. Open browser to `http://localhost:5173`
2. In terminal, run `/customer-create`
3. Verify Bridge button appears in PaykeyCard
4. Click "🌉 Link via Bridge" button
5. Verify:
   - Button shows "⏳ Linking..." state
   - Bridge modal opens
   - All other buttons are disabled
6. Close modal or complete linking
7. Verify button returns to normal state

**Step 3: Test Plaid button workflow**

1. Reset state: `/reset`
2. Create customer: `/customer-create`
3. Click "🏦 Link via Plaid" button
4. Verify Plaid form opens (existing modal behavior)
5. Submit or cancel
6. Verify button state resets

**Step 4: Test Direct button workflow**

1. Reset state: `/reset`
2. Create customer: `/customer-create`
3. Click "🏛️ Link Direct" button
4. Verify bank account form opens (existing modal behavior)
5. Submit or cancel
6. Verify button state resets

**Step 5: Test edge cases**

Test scenarios:

- Click button when no customer exists → Should show "Create customer first" message
- Click button while another is processing → Should be disabled
- Rapid clicking same button → Should only execute once
- Click different button while one is processing → Should be disabled

**Step 6: Document any issues found**

If issues found, create bug report in `docs/plans/` with:

- What you did
- What you expected
- What actually happened
- Browser console errors (if any)

---

## Task 4: Final verification and cleanup

**Files:**

- N/A (verification only)

**Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: All tests pass (both web and server)

**Step 2: Run linting**

Run:

```bash
npm run lint
```

Expected: 0 errors (warnings in test files are acceptable)

**Step 3: Run type checking**

Run:

```bash
npm run type-check
```

Expected: No TypeScript errors

**Step 4: Verify git status is clean**

Run:

```bash
git status
```

Expected: All changes committed, working tree clean

**Step 5: Create summary of changes**

Document in terminal:

- Files modified: 2
- Files created: 1
- Tests added: 8
- Lines of code added: ~150
- Breaking changes: None
- Feature complete: UI buttons for PaykeyCard

---

## Verification Checklist

Before marking complete, verify:

- [ ] All tests pass (npm test)
- [ ] No linting errors (npm run lint)
- [ ] No TypeScript errors (npm run type-check)
- [ ] Manual testing completed for all three buttons
- [ ] Buttons only show when customer exists
- [ ] Loading states work correctly
- [ ] Error handling works (buttons re-enable on failure)
- [ ] No regressions in existing PaykeyCard functionality
- [ ] All changes committed with descriptive messages
- [ ] Git working tree is clean

---

## Notes for Engineer

**Key Design Decisions:**

1. **Why not duplicate command logic?** - Buttons call `executeCommand()` to maintain single source of truth for command execution logic. This ensures consistency with terminal commands.

2. **Why disable all buttons during execution?** - Prevents race conditions and confusing state where multiple commands could execute simultaneously.

3. **Why show loading on specific button only?** - Better UX - user knows which action is in progress.

4. **Why require customer first?** - All `/create-paykey` commands require a customer ID. Enforcing this in UI prevents confusing error messages.

**Testing Strategy:**

- Unit tests verify button rendering and click handlers
- Integration with executeCommand() is mocked to test in isolation
- Manual testing verifies end-to-end flow with real modals/widgets
- Error cases covered to ensure robust error handling

**Common Pitfalls:**

- Don't forget to import `executeCommand` from commands module
- Don't forget to import `RetroButton` from retro-components
- Make sure to disable buttons during execution (prevents double-submit)
- Remember to test both success and error paths
- Don't forget the customer existence check

**If You Get Stuck:**

- Check existing PaykeyCard tests for patterns
- Review how other cards handle button interactions
- Look at Terminal component for executeCommand usage examples
- Check RetroButton documentation in retro-components.tsx
