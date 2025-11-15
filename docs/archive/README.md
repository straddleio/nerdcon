# Archived Documentation

Historical documentation available for reference but excluded from Claude's default context window via `.claudeignore`.

All files here are **read-only historical records**. For current development guidance, see `/CLAUDE.md`.

## Implementation Plans (`plans/`)

Detailed step-by-step implementation plans for each feature:

- **[2025-11-15-kyc-customer-request.md](plans/2025-11-15-kyc-customer-request.md)** (1,222 lines)
  KYC customer request feature with validation cards and watchlist display

- **[2025-11-15-logging-improvements.md](plans/2025-11-15-logging-improvements.md)** (502 lines)
  Request/response logging, tracing headers, and API log display

- **[2025-11-15-fix-demo-and-kyc-components.md](plans/2025-11-15-fix-demo-and-kyc-components.md)** (398 lines)
  Debugging and fixing KYC component rendering issues

- **[2025-11-14-terminal-commands-integration.md](plans/2025-11-14-terminal-commands-integration.md)** (1,337 lines)
  Full terminal command implementation (/demo, /create-customer, etc.)

- **[2025-11-14-fix-typescript-errors-and-polish.md](plans/2025-11-14-fix-typescript-errors-and-polish.md)** (1,119 lines)
  TypeScript error fixes and production build polish

## Test Reports (`testing/`)

Verification and testing documentation:

- **[MANUAL_TEST_KYC_CUSTOMER.md](testing/MANUAL_TEST_KYC_CUSTOMER.md)** (167 lines)
  Manual testing procedure for KYC customer feature

- **[MANUAL_TEST_REPORT_TASK_7.md](testing/MANUAL_TEST_REPORT_TASK_7.md)** (522 lines)
  Comprehensive manual test report for Task 7

- **[TEST_RESULTS_TASK_12.md](testing/TEST_RESULTS_TASK_12.md)** (249 lines)
  Test results for Task 12 implementation

- **[TASK_7_TESTING_SUMMARY.md](testing/TASK_7_TESTING_SUMMARY.md)** (296 lines)
  Summary of Task 7 testing outcomes

- **[TESTING_INSTRUCTIONS_TASK_7.md](testing/TESTING_INSTRUCTIONS_TASK_7.md)** (350 lines)
  Detailed testing instructions for Task 7

- **[QUICK_TEST_CHECKLIST.md](testing/QUICK_TEST_CHECKLIST.md)** (112 lines)
  Quick checklist for smoke testing

- **[2025-11-15-task5-integration-testing.md](testing/2025-11-15-task5-integration-testing.md)**
  Integration testing for Task 5

## Project Reports (`reports/`)

High-level project status and debugging reports:

- **[IMPLEMENTATION_COMPLETE.md](reports/IMPLEMENTATION_COMPLETE.md)** (232 lines)
  Final implementation completion report - all phases done

- **[TASK5_VERIFICATION_REPORT.md](reports/TASK5_VERIFICATION_REPORT.md)** (306 lines)
  Verification report for Task 5 logging improvements

- **[DEBUGGING_REPORT_KYC_COMPONENTS.md](reports/DEBUGGING_REPORT_KYC_COMPONENTS.md)** (257 lines)
  Debugging session for KYC component rendering issues

- **[PRODUCTION_CHECKLIST.md](reports/PRODUCTION_CHECKLIST.md)** (182 lines)
  Production readiness checklist

## Full Changelog

- **[CHANGELOG_FULL.md](CHANGELOG_FULL.md)** (451 lines)
  Complete development history with all changes, additions, and technical details

## Usage

These documents are excluded from Claude Code's automatic indexing to optimize context window usage. They remain fully accessible:

1. **Direct file reads**: Claude can read any file when specifically asked
2. **Reference links**: Use as deep-dive documentation when needed
3. **Historical context**: Understand "why" decisions were made
4. **Debug patterns**: Learn from past troubleshooting sessions

**Example usage:**
```
User: "Why did we implement KYC validation the way we did?"
Claude: *reads docs/archive/plans/2025-11-15-kyc-customer-request.md*
```

## Document Status

✅ All archived documents are **complete and verified**
✅ No active development should reference these files
✅ Current development uses `/CLAUDE.md` as single source of truth
📚 Archive serves as **historical reference only**
