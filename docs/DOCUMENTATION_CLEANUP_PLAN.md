# Documentation Cleanup Plan
**Date:** 2025-11-15
**Goal:** Optimize Claude Code context window by consolidating documentation

## Problem Statement

Current documentation spans **8,600+ lines** across 20+ files with significant redundancy:
- CLAUDE.md: 700 lines (comprehensive but verbose)
- CHANGELOG.md: 451 lines (detailed history)
- Plans folder: 5 files, ~4,500 lines (historical implementation details)
- Test reports: 8 files, ~2,000 lines (verification logs)
- Debugging reports: 2 files, ~563 lines (troubleshooting sessions)

This causes Claude agents to consume excessive context on historical information rather than current project state.

## Solution Overview

1. **Streamline CLAUDE.md** to ~300-400 lines with essential info only
2. **Create `.claudeignore`** to prevent auto-indexing of archived docs
3. **Archive historical docs** to `docs/archive/` for reference
4. **Keep README.md** minimal for external users
5. **Consolidate useful information** from CHANGELOG into new CLAUDE.md

## Detailed Plan

### Step 1: Create `.claudeignore`

Add these patterns to prevent auto-indexing:
```
# Historical documentation
docs/archive/
docs/plans/
docs/testing/
CHANGELOG.md
DEBUGGING_*.md
TASK*_*.md
*.plan.md

# Build and dependencies
node_modules/
dist/
build/
.git/
coverage/

# Test files
test-*.js
test-*.sh
test_*.py
```

### Step 2: Create New Streamlined CLAUDE.md

**Structure (~300-400 lines):**

```markdown
# Straddle NerdCon Demo - Developer Guide

## Quick Reference
- Project type, stack, status
- What this demo does (1 paragraph)
- How to start: `npm run dev`

## Architecture (50 lines)
- Monorepo structure (server/ + web/)
- Data flow diagram
- Key technologies

## Development Workflow (100 lines)
- Common commands
- How to add features
- Terminal commands reference
- Testing approach

## Straddle SDK Integration (100 lines)
- Client initialization
- Key patterns (customers, paykeys, charges)
- Sandbox outcomes
- Common gotchas

## Troubleshooting (50 lines)
- Top 5 common issues and fixes
- Where to look for logs
- How to debug

## Reference Documentation (20 lines)
- Link to full API docs
- Link to archived implementation plans
- Link to historical test reports
```

### Step 3: Archive Historical Documentation

**Create `docs/archive/` with subdirectories:**

```
docs/
├── archive/
│   ├── plans/               # Move from docs/plans/
│   │   ├── 2025-11-14-fix-typescript-errors-and-polish.md
│   │   ├── 2025-11-14-terminal-commands-integration.md
│   │   ├── 2025-11-15-fix-demo-and-kyc-components.md
│   │   ├── 2025-11-15-kyc-customer-request.md
│   │   └── 2025-11-15-logging-improvements.md
│   ├── testing/             # Move from docs/testing/
│   │   ├── MANUAL_TEST_KYC_CUSTOMER.md
│   │   ├── MANUAL_TEST_REPORT_TASK_7.md
│   │   ├── QUICK_TEST_CHECKLIST.md
│   │   ├── TASK_7_TESTING_SUMMARY.md
│   │   ├── TESTING_INSTRUCTIONS_TASK_7.md
│   │   ├── TEST_RESULTS_TASK_12.md
│   │   └── 2025-11-15-task5-integration-testing.md
│   ├── reports/             # Move from root
│   │   ├── DEBUGGING_REPORT_KYC_COMPONENTS.md
│   │   ├── IMPLEMENTATION_COMPLETE.md
│   │   ├── PRODUCTION_CHECKLIST.md
│   │   └── TASK5_VERIFICATION_REPORT.md
│   └── CHANGELOG_FULL.md    # Move from root (rename)
└── README.md                # Keep: Index of archived docs
```

### Step 4: Update README.md

Keep minimal (~100 lines):
- Project overview
- Quick start
- Scripts reference
- Link to CLAUDE.md for developers

### Step 5: Create Archive Index

**`docs/archive/README.md`:**
```markdown
# Archived Documentation

Historical documentation available for reference but excluded from Claude's default context.

## Implementation Plans
Detailed step-by-step implementation plans for each feature:
- [KYC Customer Request](plans/2025-11-15-kyc-customer-request.md)
- [Logging Improvements](plans/2025-11-15-logging-improvements.md)
- [Terminal Commands](plans/2025-11-14-terminal-commands-integration.md)
- [TypeScript Fixes](plans/2025-11-14-fix-typescript-errors-and-polish.md)
- [Demo and KYC Fixes](plans/2025-11-15-fix-demo-and-kyc-components.md)

## Test Reports
Verification and testing documentation:
- [Task 5 Verification](reports/TASK5_VERIFICATION_REPORT.md)
- [Task 7 Manual Tests](testing/MANUAL_TEST_REPORT_TASK_7.md)
- [Task 12 Results](testing/TEST_RESULTS_TASK_12.md)
- [KYC Manual Test](testing/MANUAL_TEST_KYC_CUSTOMER.md)

## Project Reports
- [Implementation Complete](reports/IMPLEMENTATION_COMPLETE.md)
- [Production Checklist](reports/PRODUCTION_CHECKLIST.md)
- [KYC Debugging](reports/DEBUGGING_REPORT_KYC_COMPONENTS.md)
- [Full Changelog](CHANGELOG_FULL.md)
```

## Benefits

### Context Window Optimization
- **Before:** ~8,600 lines indexed
- **After:** ~500 lines indexed (CLAUDE.md + README.md)
- **Savings:** ~94% reduction in auto-indexed content

### Improved Developer Experience
- New developers see essential info first
- Historical context available on-demand
- Claude focuses on current architecture, not implementation history

### Maintainability
- Single source of truth (CLAUDE.md)
- Clear separation: current vs. historical
- Easy to update without breaking references

## Verification Steps

After implementation:
1. Run `npm run dev` and verify app works
2. Ask Claude Code a question - verify it uses new CLAUDE.md
3. Check that archived docs are still accessible but not auto-indexed
4. Verify .claudeignore patterns work correctly

## Rollback Plan

If issues arise:
1. Git has full history - can revert all changes
2. Archived docs are moved, not deleted
3. CLAUDE.md changes are in version control

## Files to DELETE (Not Archive)

These can be safely removed:
- `test-balance-fix.js` (one-off test script)
- `test-balance-fix.sh` (one-off test script)
- `test-kyc-integration.sh` (one-off test script)
- `test_logging_improvements.py` (one-off test script)
- `.cursor/plans/*.plan.md` (Cursor-specific, not needed)
