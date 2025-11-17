# Complete Quality Remediation Plan

**Date:** 2025-11-16
**Branch:** feature/terminal-and-quality-standards
**Context:** Addressing all issues found in independent code review after closing PR #16

## Overview

Fix all P0 and P1 issues to achieve:

- ✅ All lint checks passing (0 errors)
- ✅ All type checks passing (0 errors)
- ✅ All builds successful
- ✅ All 143 tests passing

## Current State

- **Lint:** 189 violations (141 errors, 48 warnings)
- **Type-Check:** 132 TypeScript compilation errors
- **Build:** FAILED (server workspace)
- **Tests:** 143/143 passing ✅

## Remediation Tasks

### Phase 1: Fix Console Violations (P1)

**Task 1: Remove remaining console.log in commands.ts**

- File: web/src/lib/commands.ts:421
- Replace with logger or remove

**Task 2: Remove console.log in CustomerCard.tsx**

- File: web/src/components/dashboard/CustomerCard.tsx:54, 238
- Replace with proper error handling

### Phase 2: Fix Stale Type Directives (P1)

**Task 3: Remove 27 stale @ts-expect-error directives in test files**

- Files: charges.test.ts (11), customers.test.ts (7), paykeys.test.ts (9)
- All using `as any` which makes directives unnecessary
- Remove directives, keep the `as any` casts (allowed in test files)

### Phase 3: Fix Critical Type Safety Issues (P0)

**Task 4: Fix type safety in server routes - bridge.ts**

- 42 type errors to fix
- Add proper type guards
- Fix unsafe any assignments
- Fix promise misuse in route handlers

**Task 5: Fix type safety in server routes - customers.ts**

- 48 type errors to fix
- Add proper type guards
- Fix unsafe any assignments

**Task 6: Fix type safety in server routes - paykeys.ts**

- 24 type errors to fix
- Add proper type guards
- Fix unsafe any assignments

**Task 7: Fix type safety in server routes - charges.ts**

- 13 type errors to fix
- Add proper type guards
- Fix promise misuse

### Phase 4: Fix Test Issues (P0)

**Task 8: Fix async/await violations in charges-error-logging.test.ts**

- 2 async functions missing await expressions
- Add proper await or remove async keyword

### Phase 5: Fix Missing Type Annotations (P1)

**Task 9: Add return type annotations**

- server/src/middleware/tracing.ts:20
- web/src/lib/useSSE.ts:19

### Phase 6: Final Verification

**Task 10: Run complete verification suite**

- npm run lint (expect 0 errors)
- npm run type-check (expect 0 errors)
- npm test (expect 143/143 passing)
- npm run build (expect both workspaces successful)

**Task 11: Create new PR with all fixes**

- Comprehensive description
- Reference to independent review findings
- All quality gates documented

## Success Criteria

- [ ] 0 ESLint errors
- [ ] 0 TypeScript errors
- [ ] Server builds successfully
- [ ] Web builds successfully
- [ ] All 143 tests passing
- [ ] Pre-commit hooks working
- [ ] New PR created and ready for review
