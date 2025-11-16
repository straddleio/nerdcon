# Decision: Keep /api/config Endpoint

**Date:** 2025-11-15
**Context:** Task 6 from Plaid Token Security Fixes Plan
**Decision:** KEEP the /api/config endpoint

## Background

As part of the Plaid token security fixes, we removed the `plaid_processor_token` field from the `/api/config` endpoint (completed in Task 1). This left the endpoint returning only:

```json
{
  "environment": "sandbox"
}
```

Task 6 asked whether to keep or remove the endpoint entirely.

## Analysis

### Current Usage Search Results

Searched the entire web codebase for usages of `/api/config`:

```bash
# grep -r "api/config" web/src/
# Result: No matches found
```

The endpoint is currently **not used by the frontend** after removing the PaykeyCard useEffect hook in Task 2.

### Options Considered

**Option A: Keep the endpoint**
- ✅ Still useful for exposing environment name (sandbox vs production)
- ✅ Frontend can know which environment it's connected to
- ✅ May add other non-sensitive config in the future (e.g., feature flags, UI config)
- ✅ Harmless - only exposes non-sensitive data
- ⚠️ One more endpoint to maintain

**Option B: Remove it entirely**
- ✅ Fewer endpoints = smaller attack surface
- ✅ YAGNI principle (You Aren't Gonna Need It)
- ❌ Would need to re-add if we need public config later
- ❌ Loses ability to display environment in UI
- ❌ Would need alternative way to expose non-sensitive config

## Decision: KEEP

**Rationale:**
1. **Future-proofing:** The endpoint provides a clean pattern for exposing non-sensitive server configuration to the frontend
2. **Environment awareness:** Frontend may want to display environment (e.g., "Sandbox Mode" badge) or adjust behavior based on environment
3. **Low maintenance cost:** Endpoint is simple and secure with the added security comment
4. **Minimal attack surface:** Only exposes environment name, no secrets
5. **Flexibility:** Having the pattern in place makes it easy to add other non-sensitive config later

## Implementation

Added security documentation to the endpoint in `server/src/routes/state.ts`:

```typescript
/**
 * GET /api/config
 * Get public server config values (safe to expose to frontend)
 *
 * SECURITY NOTE: Never add sensitive values here (API keys, tokens, secrets).
 * Those should use server-side fallback logic in route handlers.
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    environment: config.straddle.environment,
  });
});
```

## Future Considerations

If we need to add more public configuration in the future, this endpoint is ready. Examples of appropriate future additions:

- ✅ Feature flags (e.g., `demo_mode_enabled`)
- ✅ UI configuration (e.g., `max_charge_amount`)
- ✅ Public metadata (e.g., `api_version`)
- ❌ NEVER: API keys, tokens, secrets, credentials

## Security Verification

- ✅ Endpoint only returns non-sensitive data
- ✅ Security comment added to prevent future mistakes
- ✅ No frontend code currently relies on this endpoint
- ✅ If needed in future, frontend can safely consume this data

## References

- Plan: `/home/keith/nerdcon/docs/plans/2025-11-15-plaid-token-security-fixes.md` (Task 6)
- Code: `/home/keith/nerdcon/server/src/routes/state.ts` (lines 107-118)
- Related: Task 1 removed `plaid_processor_token` from this endpoint
