# PR Review Fixes - Implementation Plan

**Date:** 2025-11-16
**Branch:** feature/terminal-and-quality-standards
**PR:** #16

## Overview

Address 3 P1 issues identified in code review plus conduct independent review for missed issues.

## Tasks

### Task 1: Fix ESLint parserOptions.project Configuration

**Priority:** P0 (blocks all linting)

**Problem:** `.eslintrc.json` sets `parserOptions.project: true` but @typescript-eslint/parser expects path(s) to tsconfig files. This causes `TypeError: project.endsWith is not a function` preventing any lint rules from running.

**Steps:**

1. Read `.eslintrc.json` to confirm current state
2. Update `parserOptions.project` to point at actual tsconfig files
3. Verify lint runs without parser errors
4. Commit fix

**Expected Output:**

```bash
npm run lint  # Should not crash with TypeError
```

**Commit Message:**

```
fix(lint): point ESLint parser at actual tsconfig files

- Change parserOptions.project from boolean true to array
- Point at server/tsconfig.json and web/tsconfig.json
- Fixes TypeError: project.endsWith is not a function

Addresses PR #16 review comment (P1)
```

---

### Task 2: Remove Console.log Violations in useSSE.ts

**Priority:** P1 (lint failures)

**Problem:** `web/src/lib/useSSE.ts` uses `console.log` throughout SSE event handlers, but new ESLint config enforces `no-console` error for logs (only allows warn/error/info).

**Steps:**

1. Read `web/src/lib/useSSE.ts` to identify all console.log calls
2. Create web-compatible logger (console.info wrapper for browser)
3. Replace all console.log with logger calls
4. Verify lint passes for web workspace
5. Run web tests to ensure no breakage
6. Commit fix

**Expected Output:**

```bash
npm run lint --workspace=web  # Should pass with 0 errors
npm test --workspace=web      # All 83 tests should still pass
```

**Commit Message:**

```
fix(web): replace console.log with console.info in useSSE

- Console.log violates no-console ESLint rule
- Replace with console.info (allowed by ESLint config)
- Maintains same logging behavior in browser

Addresses PR #16 review comment (P1)
```

---

### Task 3: Remove Stale @ts-expect-error in Terminal.tsx

**Priority:** P1 (type-check failures)

**Problem:** `Terminal.tsx` line 88 has `@ts-expect-error` directive above `addTerminalLine` call, but the function now legitimately returns a string ID. TypeScript raises TS2578 for unused directive.

**Steps:**

1. Read `web/src/components/Terminal.tsx` to confirm the issue
2. Remove the `@ts-expect-error` comment and explanation line
3. Verify type-check passes
4. Run web tests to ensure no breakage
5. Commit fix

**Expected Output:**

```bash
npm run type-check --workspace=web  # Should pass with 0 errors
npm test --workspace=web            # All 83 tests should still pass
```

**Commit Message:**

```
fix(web): remove stale ts-expect-error in Terminal submit handler

- addTerminalLine now properly returns string ID
- No longer has type error to suppress
- Fixes TS2578: Unused '@ts-expect-error' directive

Addresses PR #16 review comment (P1)
```

---

### Task 4: Conduct Independent Review

**Priority:** P1 (catch any missed issues)

**Steps:**

1. Run full lint check across entire repo
2. Run full type-check across both workspaces
3. Run all tests (server + web)
4. Run build verification (both workspaces)
5. Check for any remaining console.log/console.error violations
6. Check for any remaining @ts-expect-error directives that might be stale
7. Document findings
8. Fix any additional issues found

**Expected Output:**

```bash
npm run lint              # 0 errors, 0 warnings
npm run type-check        # 0 errors
npm test                  # 143/143 passing
npm run build             # Both workspaces build successfully
```

**Report:** Create findings document if issues found

---

### Task 5: Final Verification

**Priority:** P0 (ensure all fixes work together)

**Steps:**

1. Run complete quality check suite:
   - `npm run lint`
   - `npm run type-check`
   - `npm test`
   - `npm run build`
2. Verify pre-commit hook still works
3. Verify all 143 tests still passing
4. Update PR with fix summary

**Expected Output:**
All checks passing:

- ✅ Lint: 0 errors
- ✅ Type-check: 0 errors
- ✅ Tests: 143/143 passing
- ✅ Build: Both workspaces successful

---

## Success Criteria

- [ ] ESLint parser no longer crashes
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run type-check` passes with 0 errors
- [ ] All 143 tests still passing
- [ ] Both workspaces build successfully
- [ ] No console.log violations remain
- [ ] No stale @ts-expect-error directives remain
- [ ] Independent review completed
- [ ] All commits follow conventional commit format
- [ ] PR updated with fix summary
