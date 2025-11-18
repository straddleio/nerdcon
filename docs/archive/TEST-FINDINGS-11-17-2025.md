# Test Coverage Findings — 2025-11-17

This document captures the systemic gaps identified during the repo-wide test review.

## Backend (server/)

1. **Webhooks untested**
   - File: `server/src/routes/webhooks.ts`
   - No tests exercise payload validation, event-type branching, duplicate status filtering, or log streaming. Add supertest cases that POST representative `customer`, `paykey`, and `charge` events, assert `stateManager` updates, and verify `addLogEntry` / `eventBroadcaster` interactions.

2. **State & SSE endpoints lack coverage**
   - Files: `server/src/routes/state.ts`, `server/src/domain/state.ts`
   - Only the `/geolocation` proxy is tested. Missing coverage for `/state`, `/reset`, `/logs`, `/log-stream`, and `/events/stream`. Add integration tests that mount the router, spy on `eventBroadcaster`, and assert emitted events/log filters when state changes.

3. **Bridge router tests ineffective**
   - File: `server/src/routes/bridge.ts`
   - Existing `bridge.test.ts` merely reasserts `SANDBOX_OUTCOMES`. Need request-level tests that validate required fields, Plaid token fallbacks, review fetch logging, and error handling for both `/bridge/bank-account` and `/bridge/plaid`.

4. **Charge lifecycle endpoints incomplete**
   - File: `server/src/routes/charges.ts`
   - Suite covers create/get/cancel but not `/hold` or `/release`. Add tests for happy/error paths of both endpoints, including sandbox outcome logging.

5. **Charge error logging test is placeholder**
   - File: `server/src/routes/__tests__/charges-error-logging.test.ts`
   - Currently `expect(true).toBe(true)`. Replace with spies on `addLogEntry` and `logStraddleCall` to assert the catch block emits structured logs.

6. **Logger & SSE broadcaster barely verified**
   - Files: `server/src/lib/logger.ts`, `server/src/domain/events.ts`
   - Tests only assert methods exist. Add coverage for DEV vs PROD logging behavior and `eventBroadcaster.addClient` lifecycle (initial write, heartbeat cleanup, disconnect).

## Frontend (web/)

1. **Command handlers under-tested**
   - File: `web/src/lib/commands.ts`
   - Only alias/outcomes/paykey tests exist. Need Vitest suites for `handleCreateCharge`, `handlePaykeyDecision`, `handlePaykeyReview`, `handleDemo`, `handleInfo`, `handleReset`, and `handleClear`, including arg parsing and error flows.

2. **Terminal UI tests superficial**
   - Files: `web/src/components/Terminal.tsx` tests
   - `Terminal-styling.test.tsx` and part of `Terminal-autocomplete.test.tsx` assert hard-coded strings instead of DOM changes. Expand tests to simulate Tab/Arrow/Esc behavior, ensure suggestions render, and verify API log association logic.

3. **Modal cards never assert submissions**
   - Files: `web/src/components/cards/CustomerCard.tsx`, `PaykeyCard.tsx`, `ChargeCard.tsx`
   - Current tests only verify default fields. Add interaction tests that click the outcome buttons, assert `onSubmit` payload transformations (e.g., removing `plaid_token` for bank), and confirm `onClose` is called.

4. **Dashboard components lack tests**
   - Files: `web/src/components/dashboard/*.tsx` (`AddressWatchlistCard`, `KYCValidationCard`, `ChargeCard`, `PizzaTracker`, etc.)
   - No coverage for watchlist toggles, KYC decision normalization, balance calculations, or status history rendering. Add focused tests for these behaviors.

5. **Hooks and API client untested**
   - Files: `web/src/lib/api.ts`, `web/src/lib/useSSE.ts`, `web/src/lib/useGeolocation.ts`
   - Need tests that mock fetch/EventSource to ensure correct URLs, error handling, and cleanup.

## Coverage Policy Updates

- Adopt realistic coverage thresholds (server ≥70% lines/statements, ≥60% branches; web ≥60% lines/statements, ≥50% branches). Add `coverageThreshold` to `server/jest.config.js` and `test.coverage.thresholds` to `web/vitest.config.ts` so `npm test` fails when coverage regresses.
- Reference: `docs/archive/TESTING.md` (updated) explains the thresholds and clarifies Jest vs Vitest mocking APIs.

## Next Steps

1. Prioritize writing tests for the untested backend surfaces (webhooks, state/SSE, bridge, charge hold/release, error logging).
2. Expand frontend coverage for command handlers, terminal interactions, modal submissions, dashboard cards, and hooks.
3. Wire coverage thresholds into Jest/Vitest configs per the new guidelines.
