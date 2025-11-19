# Production Readiness Audit - Business Customer Feature

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete production-readiness audit of uncommitted business customer feature changes with parallel sub-agent review, comprehensive testing, linting fixes, and production verification.

**Architecture:** Multi-phase approach using parallel sub-agents for independent tasks, followed by integration testing and final verification before commit/PR creation.

**Tech Stack:**

- Testing: Jest (server), Vitest (web), React Testing Library
- Linting: ESLint, TypeScript, Prettier
- Review: superpowers:code-reviewer agent
- CI/CD: Git hooks (pre-commit), GitHub Actions

---

## Phase 1: Fix Critical Linting Errors (BLOCKING)

### Task 1: Fix ReviewDecisionModal.tsx Linting Errors

**Files:**

- Modify: `web/src/components/ReviewDecisionModal.tsx:97-101`

**Step 1: Fix missing curly braces in getCodeColor function**

Current code at lines 97-101:

```typescript
const getCodeColor = (code: string): string => {
  if (code.startsWith('BI')) return 'text-green-500'; // Insight/Verified
  if (code.startsWith('BR')) return 'text-accent-red'; // Risk
  if (code.startsWith('BV')) return 'text-gold'; // Verification/Standing
  return 'text-neutral-400';
};
```

Replace with:

```typescript
const getCodeColor = (code: string): string => {
  if (code.startsWith('BI')) {
    return 'text-green-500'; // Insight/Verified
  }
  if (code.startsWith('BR')) {
    return 'text-accent-red'; // Risk
  }
  if (code.startsWith('BV')) {
    return 'text-gold'; // Verification/Standing
  }
  return 'text-neutral-400';
};
```

**Step 2: Verify fix**

Run: `npm run lint --workspace=web`
Expected: No errors in ReviewDecisionModal.tsx

**Step 3: Commit**

```bash
git add web/src/components/ReviewDecisionModal.tsx
git commit -m "fix: add curly braces to if statements in ReviewDecisionModal

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Fix Terminal.tsx Linting Errors

**Files:**

- Modify: `web/src/components/Terminal.tsx:286-298`

**Step 1: Fix unsafe type assertions in handleCustomerSubmit**

Current code at lines 286-298:

```typescript
// Construct name based on type
const name =
  data.type === 'business'
    ? data.first_name // Business name is stored in first_name in form
    : `${data.first_name} ${data.last_name}`.trim();

const payload: Partial<CustomerFormData> & { name: string; outcome: string } = {
  ...data,
  name,
  outcome,
};

// Remove internal form fields that aren't in API
delete (payload as any).first_name;
delete (payload as any).last_name;
```

Replace with properly typed solution:

```typescript
// Construct name based on type
const name =
  data.type === 'business'
    ? data.first_name // Business name is stored in first_name in form
    : `${data.first_name} ${data.last_name}`.trim();

// Build clean payload without form-only fields
const { first_name, last_name, ...restData } = data;
const payload = {
  ...restData,
  name,
  outcome,
};
```

**Step 2: Verify fix**

Run: `npm run lint --workspace=web`
Expected: No errors in Terminal.tsx (lines 297-298)

**Step 3: Commit**

```bash
git add web/src/components/Terminal.tsx
git commit -m "fix: remove unsafe type assertions in Terminal customer submit

Replace 'as any' with proper destructuring and type-safe payload construction.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Fix commands.ts prefer-const Error

**Files:**

- Modify: `web/src/lib/commands.ts:253-265`

**Step 1: Change 'let address' to 'const address'**

Current code at line 253:

```typescript
let address = {
  address1: '1234 Sandbox Street',
  address2: 'PO Box I304', // Default to review
  city: 'Mock City',
  state: 'CA',
  zip: '94105',
};
```

Replace with:

```typescript
// Determine address based on outcome
let address2 = 'PO Box I304'; // Default to review

if (outcome === 'verified') {
  address2 = 'PO Box I301';
} else if (outcome === 'rejected') {
  address2 = 'PO Box I103';
}

const address = {
  address1: '1234 Sandbox Street',
  address2,
  city: 'Mock City',
  state: 'CA',
  zip: '94105',
};
```

**Step 2: Verify fix**

Run: `npm run lint --workspace=web`
Expected: No errors in commands.ts

**Step 3: Commit**

```bash
git add web/src/lib/commands.ts
git commit -m "fix: use const for immutable address object in create-business

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Verify All Linting Issues Resolved

**Step 1: Run full lint check**

Run: `npm run lint`
Expected: Only warnings (no errors), all related to test files using 'any'

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No errors

**Step 3: Verify success**

If both pass, proceed to Phase 2. If failures occur, fix issues before continuing.

---

## Phase 2: Parallel Code Review and Test Coverage Analysis

### Task 5: Dispatch Code Review Agent

**REQUIRED SUB-SKILL:** Use superpowers:code-reviewer

**Step 1: Launch code-reviewer agent**

Use Task tool with `subagent_type: "superpowers:code-reviewer"`:

```
Prompt: "Review the following modified files for production readiness:

Files to review:
1. web/src/components/ReviewDecisionModal.tsx - Review decision modal UI component
2. web/src/components/Terminal.tsx - Terminal with inline API logging
3. web/src/components/cards/CustomerCard.tsx - Customer creation form with business support
4. web/src/components/cards/PaykeyCard.tsx - Bank account linking form
5. web/src/components/cards/ChargeCard.tsx - Charge creation form
6. web/src/lib/api.ts - API client with comprehensive types
7. web/src/lib/commands.ts - Command parser with business customer support

Review criteria:
- Code quality and maintainability
- TypeScript type safety
- Error handling completeness
- Security vulnerabilities (XSS, injection, etc.)
- Accessibility concerns
- Performance issues
- Production readiness blockers

Return:
- List of issues by severity (critical/high/medium/low)
- Specific file:line references
- Recommended fixes
- Overall production readiness assessment"
```

**Step 2: Wait for agent completion**

Agent will analyze all 7 files and return comprehensive review report.

**Step 3: Document findings**

Save agent output to: `docs/archive/reports/2025-11-18-code-review-business-customers.md`

---

### Task 6: Analyze Test Coverage (Parallel with Task 5)

**Step 1: Run test coverage for web workspace**

Run: `npm run test:coverage --workspace=web`
Expected: Coverage report showing % coverage for modified files

**Step 2: Run test coverage for server workspace**

Run: `npm run test:coverage --workspace=server`
Expected: Coverage report (server files not modified, but verify no regressions)

**Step 3: Identify coverage gaps**

For each modified file in web/src, check if coverage meets 50% threshold:

- ReviewDecisionModal.tsx
- Terminal.tsx
- cards/CustomerCard.tsx
- cards/PaykeyCard.tsx
- cards/ChargeCard.tsx
- lib/api.ts
- lib/commands.ts

**Step 4: Document coverage gaps**

Create list of files needing additional tests to meet threshold.

---

## Phase 3: Write Missing Tests (Based on Coverage Analysis)

### Task 7: Write ReviewDecisionModal Tests

**Files:**

- Read: `web/src/components/__tests__/ReviewDecisionModal.test.tsx` (existing)
- Modify or Create test file based on coverage gaps

**Step 1: Review existing test coverage**

Check if existing tests at `web/src/components/__tests__/ReviewDecisionModal.test.tsx` cover:

- Customer review rendering with business fields
- Paykey review rendering
- Business identity code color coding (BI/BR/BV)
- Approve/reject button interactions
- Animation and sound triggers
- Modal close on backdrop click

**Step 2: Write missing tests (if gaps exist)**

Add tests for uncovered scenarios:

```typescript
describe('ReviewDecisionModal - Business Customer Features', () => {
  it('should display business fields when type is customer with business data', () => {
    const data: CustomerReviewData = {
      type: 'customer',
      id: 'cust_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      status: 'review',
      legal_business_name: 'The Bluth Company',
      website: 'thebananastand.com',
      ein: '12-3456789',
    };

    render(<ReviewDecisionModal isOpen={true} onClose={vi.fn()} onDecision={vi.fn()} data={data} />);

    expect(screen.getByText('BUSINESS: The Bluth Company')).toBeInTheDocument();
    expect(screen.getByText('thebananastand.com')).toBeInTheDocument();
    expect(screen.getByText('EIN: 12-3456789')).toBeInTheDocument();
  });

  it('should color-code business identity codes correctly', () => {
    const data: CustomerReviewData = {
      type: 'customer',
      id: 'cust_123',
      name: 'Test Business',
      status: 'review',
      codes: ['BI001', 'BR002', 'BV003'],
    };

    const { container } = render(<ReviewDecisionModal isOpen={true} onClose={vi.fn()} onDecision={vi.fn()} data={data} />);

    const bi001 = container.querySelector('[title="BI001"]');
    const br002 = container.querySelector('[title="BR002"]');
    const bv003 = container.querySelector('[title="BV003"]');

    expect(bi001).toHaveClass('text-green-500');
    expect(br002).toHaveClass('text-accent-red');
    expect(bv003).toHaveClass('text-gold');
  });
});
```

**Step 3: Run tests**

Run: `npm test --workspace=web -- ReviewDecisionModal.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add web/src/components/__tests__/ReviewDecisionModal.test.tsx
git commit -m "test: add business customer coverage for ReviewDecisionModal

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Write CustomerCard Tests for Business Mode

**Files:**

- Read: `web/src/components/cards/__tests__/CustomerCard.test.tsx` (existing)
- Modify test file to add business customer coverage

**Step 1: Review existing test coverage**

Check if tests cover:

- Individual vs business type toggle
- Business-specific fields (EIN, legal_business_name, website)
- Address auto-fill for different outcomes
- Business name stored in first_name field

**Step 2: Write missing tests**

Add tests for business mode:

```typescript
describe('CustomerCard - Business Mode', () => {
  it('should switch to business mode and populate business fields', () => {
    const onSubmit = vi.fn();
    render(<CustomerCard isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} mode="create" />);

    // Click business toggle
    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    // Verify business fields appear
    expect(screen.getByLabelText('Business Name')).toBeInTheDocument();
    expect(screen.getByLabelText('EIN')).toBeInTheDocument();
    expect(screen.getByLabelText('Website')).toBeInTheDocument();

    // Verify default business data populated
    expect(screen.getByDisplayValue('The Bluth Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12-3456789')).toBeInTheDocument();
  });

  it('should auto-fill review address when business outcome is review', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<CustomerCard isOpen={true} onClose={onClose} onSubmit={onSubmit} mode="create" />);

    // Switch to business
    fireEvent.click(screen.getByText('Business'));

    // Click review outcome
    fireEvent.click(screen.getByText(/⚠ Review/i));

    // Verify submitted data has review address
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        address: expect.objectContaining({
          address2: 'PO Box I304',
        }),
      }),
      'review'
    );
  });
});
```

**Step 3: Run tests**

Run: `npm test --workspace=web -- CustomerCard.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add web/src/components/cards/__tests__/CustomerCard.test.tsx
git commit -m "test: add business mode coverage for CustomerCard

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Write Commands Tests for Business Customer

**Files:**

- Create: `web/src/lib/__tests__/commands-business.test.ts`

**Step 1: Write comprehensive tests for /create-business command**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCommand } from '../commands';
import * as api from '../api';
import { useDemoStore } from '../state';

vi.mock('../api');
vi.mock('../state');

describe('commands - Business Customer (/create-business)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create business customer with standard outcome', async () => {
    const mockCustomer = {
      id: 'cust_business_123',
      name: 'The Bluth Company',
      email: 'tobias@bluemyself.com',
      verification_status: 'standard',
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer as any);
    const setCustomer = vi.fn();
    vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer } as any);

    const result = await executeCommand('/create-business');

    expect(result.success).toBe(true);
    expect(api.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'business',
        name: 'The Bluth Company',
        compliance_profile: expect.objectContaining({
          ein: '12-3456789',
          legal_business_name: 'The Bluth Company',
          website: 'thebananastand.com',
        }),
      })
    );
    expect(setCustomer).toHaveBeenCalledWith(mockCustomer);
  });

  it('should use correct address for verified outcome', async () => {
    vi.mocked(api.createCustomer).mockResolvedValue({} as any);
    vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

    await executeCommand('/create-business --outcome verified');

    expect(api.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        address: expect.objectContaining({
          address2: 'PO Box I301', // Verified address
        }),
      })
    );
  });

  it('should use correct address for rejected outcome', async () => {
    vi.mocked(api.createCustomer).mockResolvedValue({} as any);
    vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

    await executeCommand('/create-business --outcome rejected');

    expect(api.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        address: expect.objectContaining({
          address2: 'PO Box I103', // Rejected address
        }),
      })
    );
  });

  it('should reject invalid outcome values', async () => {
    const result = await executeCommand('/create-business --outcome invalid');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid outcome');
    expect(api.createCustomer).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests**

Run: `npm test --workspace=web -- commands-business.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add web/src/lib/__tests__/commands-business.test.ts
git commit -m "test: add comprehensive coverage for /create-business command

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4: Address Code Review Findings

### Task 10: Fix Critical Issues from Code Review

**Prerequisites:** Task 5 (Code Review Agent) must be complete

**Step 1: Review code review findings**

Read: `docs/archive/reports/2025-11-18-code-review-business-customers.md`

**Step 2: Fix all CRITICAL severity issues**

For each critical issue:

- Fix the code
- Add test to prevent regression
- Verify fix with tests
- Commit with reference to review finding

**Step 3: Fix all HIGH severity issues**

Same process as critical issues.

**Step 4: Document MEDIUM/LOW issues as tech debt**

Create GitHub issues or add to backlog for non-blocking items.

---

## Phase 5: Integration Testing

### Task 11: End-to-End Business Customer Flow Test

**Files:**

- Create: `web/src/__tests__/business-customer-flow.integration.test.tsx`

**Step 1: Write full flow integration test**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as api from '../lib/api';

vi.mock('../lib/api');

describe('Business Customer Flow - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete business customer → paykey → charge flow', async () => {
    // Mock API responses
    const mockCustomer = {
      id: 'cust_biz_123',
      name: 'The Bluth Company',
      type: 'business',
      verification_status: 'verified',
    };

    const mockPaykey = {
      id: 'paykey_123',
      paykey: 'token_123',
      status: 'active',
    };

    const mockCharge = {
      id: 'charge_123',
      amount: 5000,
      status: 'paid',
    };

    vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer as any);
    vi.mocked(api.createPaykey).mockResolvedValue(mockPaykey as any);
    vi.mocked(api.createCharge).mockResolvedValue(mockCharge as any);

    render(<App />);

    // Step 1: Create business customer
    const input = screen.getByPlaceholderText('Enter command...');
    fireEvent.change(input, { target: { value: '/create-business --outcome verified' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'business',
          name: 'The Bluth Company',
        })
      );
    });

    // Step 2: Create paykey
    fireEvent.change(input, { target: { value: '/create-paykey bank --outcome active' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(api.createPaykey).toHaveBeenCalled();
    });

    // Step 3: Create charge
    fireEvent.change(input, { target: { value: '/create-charge --amount 5000 --outcome paid' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(api.createCharge).toHaveBeenCalledWith(
        expect.objectContaining({
          paykey: 'token_123',
          amount: 5000,
        })
      );
    });

    // Verify success messages in terminal
    expect(screen.getByText(/Customer created: cust_biz_123/)).toBeInTheDocument();
    expect(screen.getByText(/Paykey created: paykey_123/)).toBeInTheDocument();
    expect(screen.getByText(/Charge created: charge_123/)).toBeInTheDocument();
  });
});
```

**Step 2: Run integration test**

Run: `npm test --workspace=web -- business-customer-flow.integration.test.tsx`
Expected: Test passes

**Step 3: Commit**

```bash
git add web/src/__tests__/business-customer-flow.integration.test.tsx
git commit -m "test: add end-to-end integration test for business customer flow

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 6: Final Verification

### Task 12: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run coverage check**

Run: `npm run test:coverage`
Expected: Coverage meets 50% threshold for all modified files

**Step 3: Verify no test failures**

If any tests fail, fix issues before proceeding.

---

### Task 13: Run All Quality Checks

**Step 1: Lint check**

Run: `npm run lint`
Expected: No errors (only warnings in test files acceptable)

**Step 2: Type check**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 3: Build check**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 4: Format check**

Run: `npm run format`
Expected: All files properly formatted

---

### Task 14: Manual Smoke Test

**Step 1: Start development servers**

Run: `npm run dev`
Expected: Both server (3001) and web (5173) start successfully

**Step 2: Test business customer creation**

1. Open http://localhost:5173
2. Type `/create-business --outcome verified`
3. Verify customer created successfully
4. Verify CustomerCard shows business fields in dashboard

**Step 3: Test review decision flow**

1. Type `/create-business --outcome review`
2. Verify review decision modal appears (if applicable)
3. Test approve/reject buttons
4. Verify animations and sounds work

**Step 4: Test full business flow**

1. Type `/reset`
2. Type `/create-business --outcome verified`
3. Type `/create-paykey bank --outcome active`
4. Type `/create-charge --amount 5000 --outcome paid`
5. Verify all steps complete successfully

**Step 5: Stop servers**

Ctrl+C to stop dev servers

---

## Phase 7: Documentation and Completion

### Task 15: Update Documentation

**Files:**

- Modify: `CLAUDE.md` (if business customer features need documenting)
- Create: `docs/archive/reports/2025-11-18-production-audit-summary.md`

**Step 1: Document business customer terminal commands**

Verify CLAUDE.md includes `/create-business` in the terminal commands table.

**Step 2: Create audit summary report**

Write summary report:

```markdown
# Production Audit Summary - Business Customer Feature

**Date:** 2025-11-18
**Status:** ✅ PASSED - Ready for Production

## Changes Audited

- ReviewDecisionModal.tsx - Business field display and identity code coloring
- Terminal.tsx - Customer submission with business type support
- CustomerCard.tsx - Business/individual toggle with conditional fields
- PaykeyCard.tsx - Minor updates for consistency
- ChargeCard.tsx - Minor updates for consistency
- api.ts - Enhanced types for business customers
- commands.ts - /create-business command implementation

## Quality Checks

| Check          | Status  | Notes                        |
| -------------- | ------- | ---------------------------- |
| Linting        | ✅ PASS | All errors fixed             |
| Type Check     | ✅ PASS | No TypeScript errors         |
| Tests          | ✅ PASS | All tests passing            |
| Coverage       | ✅ PASS | >50% on all modified files   |
| Code Review    | ✅ PASS | All critical issues resolved |
| Integration    | ✅ PASS | E2E flow tested              |
| Manual Testing | ✅ PASS | All features working         |

## Test Coverage Added

- ReviewDecisionModal business field rendering
- CustomerCard business mode toggle and validation
- /create-business command with all outcomes
- Business customer integration flow

## Issues Resolved

1. ReviewDecisionModal curly brace linting errors
2. Terminal unsafe type assertions
3. commands.ts prefer-const violation
4. [List any code review findings fixed]

## Production Readiness: ✅ APPROVED

All modified files have been reviewed, tested, and verified. Feature is ready for:

- Commit to business-customers branch
- Pull request to master
- Production deployment

## Next Steps

1. Commit all changes
2. Create pull request
3. Request peer review
4. Merge to master
```

**Step 3: Save report**

Save to: `docs/archive/reports/2025-11-18-production-audit-summary.md`

**Step 4: Commit documentation**

```bash
git add CLAUDE.md docs/archive/reports/2025-11-18-production-audit-summary.md
git commit -m "docs: add production audit summary for business customer feature

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 16: Create Final Commit

**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch

**Step 1: Invoke finishing skill**

Use Skill tool with `skill: "superpowers:finishing-a-development-branch"`

**Step 2: Follow skill guidance**

The skill will present options for:

- Creating final commit of remaining changes
- Creating pull request
- Cleanup tasks

**Step 3: Choose appropriate completion path**

Based on user preference (commit, PR, or cleanup).

---

## Success Criteria

**All tasks complete when:**

✅ All linting errors fixed
✅ All TypeScript errors resolved
✅ Code review completed with no critical/high issues
✅ Test coverage ≥50% on all modified files
✅ All tests passing (unit + integration)
✅ Build succeeds
✅ Manual smoke test passed
✅ Documentation updated
✅ Production audit report created
✅ Changes committed or PR created

**Production Readiness Checklist:**

- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] No console.log statements
- [ ] No unsafe type assertions
- [ ] No security vulnerabilities
- [ ] Error handling on all API calls
- [ ] Accessibility attributes on interactive elements
- [ ] All user-facing text is clear
- [ ] All tests passing
- [ ] Coverage threshold met
- [ ] Code review approved
- [ ] Documentation complete
- [ ] Changes committed with proper messages

---

## Rollback Plan

If critical issues discovered:

1. Do NOT merge to master
2. Create GitHub issue with details
3. Revert problematic commits
4. Fix issues in new commits
5. Re-run audit from Task 12

---

## Notes

- Tasks 5 and 6 run in parallel (independent)
- Tasks 1-4 are blocking for all other tasks
- Task 10 depends on Task 5 completion
- Task 16 is final step - requires all prior tasks complete
