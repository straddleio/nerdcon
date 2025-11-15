# Implementation Plan: Fix Demo Flow + KYC/Watchlist Component Design

**Date**: 2025-11-15
**Status**: Ready for Execution
**Approach**: Systematic debugging and redesign using superpowers:systematic-debugging

## Problem Statement

Recent changes introduced several critical issues:
1. `/demo` command fails when trying to create Plaid paykey (missing plaid_token)
2. KYC and Address Watchlist components are not visible in the UI
3. Design of new KYC/Watchlist components doesn't match retro gaming aesthetic
4. Components use standalone card styling instead of integrating into CustomerCard's expandable row format

## Root Cause Analysis

### Issue 1: /demo Command Failure
**Location**: `web/src/lib/commands.ts:334`
**Root Cause**:
- Demo changed to use `plaid` method instead of `bank_account`
- Plaid method requires `plaid_token` parameter
- `handleCreatePaykey` doesn't accept or pass `plaid_token`
- Backend `/api/bridge/plaid` endpoint requires both `customer_id` AND `plaid_token`

**Evidence**:
```typescript
// commands.ts line 334
const paykeyResult = await handleCreatePaykey(['plaid', '--outcome', 'active']);

// api.ts expects this interface:
export interface CreatePaykeyRequest {
  customer_id: string;
  method: 'plaid' | 'bank_account';
  outcome?: 'active' | 'inactive' | 'rejected';
  // Missing: plaid_token field
}

// server/src/routes/bridge.ts line 116
if (!customer_id || !plaid_token) {
  return res.status(400).json({
    error: 'customer_id and plaid_token are required',
  });
}
```

### Issue 2: KYC/Watchlist Components Not Visible
**Location**: `web/src/components/dashboard/CustomerCard.tsx:349-356`
**Root Cause**: Components may not be rendering due to:
1. Conditional rendering based on `customer.review?.kyc` and `customer.review?.watch_list`
2. These fields may not exist in current customer data
3. Need to verify if `/customer-KYC` command actually populates these fields

**Evidence Needed**: Test if review data is actually being fetched and includes kyc/watch_list

### Issue 3: Design System Mismatch
**Location**:
- `web/src/components/dashboard/KYCValidationCard.tsx`
- `web/src/components/dashboard/AddressWatchlistCard.tsx`

**Root Cause**: Components use standard Tailwind instead of retro design system
- Using `bg-yellow-50`, `border-yellow-200` (Tailwind defaults)
- Should use `bg-background-dark`, `border-primary/20`, `text-accent` (retro tokens)
- Using `text-xl`, `font-semibold` instead of `font-pixel`, retro sizing
- Standalone cards instead of integrated expandable rows

**Current Design**:
```tsx
<div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
  <h3 className="font-semibold text-lg">KYC Validation</h3>
```

**Should Be** (matching existing verification modules):
```tsx
<div className="border border-primary/20 rounded-pixel bg-background-dark/50">
  <button className="w-full px-3 py-2 flex items-center justify-between">
    <span className="text-xs font-body text-neutral-200">KYC Validation</span>
    <span className="text-xs font-pixel text-green-500">PASS</span>
```

## Implementation Tasks

### Task 1: Fix /demo Command - Use Configured Plaid Token
**Objective**: Make /demo work with Plaid method using the token from server .env
**Rationale**: Plaid token exists in .env (`processor-sandbox-2f154536-91dd-46ab-a8f3-49b1ca8b50c5`), but backend requires it in request body. Backend should use configured token as fallback.

**Files to Modify**:
- `server/src/routes/bridge.ts` (lines 111-120)

**Changes**:
```typescript
// BEFORE (requires plaid_token in request):
const { customer_id, plaid_token } = req.body;

if (!customer_id || !plaid_token) {
  return res.status(400).json({
    error: 'customer_id and plaid_token are required',
  });
}

const linkData = {
  customer_id,
  plaid_token,
};

// AFTER (uses configured token as fallback):
import { config } from '../config.js';

const { customer_id, plaid_token } = req.body;

if (!customer_id) {
  return res.status(400).json({
    error: 'customer_id is required',
  });
}

// Use provided token or fall back to configured token
const tokenToUse = plaid_token || config.plaid.processorToken;

if (!tokenToUse) {
  return res.status(400).json({
    error: 'plaid_token must be provided in request or PLAID_PROCESSOR_TOKEN must be set in environment',
  });
}

const linkData = {
  customer_id,
  plaid_token: tokenToUse,
};
```

**Verification**:
- Run `/demo` command
- Verify customer → Plaid paykey → charge flow completes
- Check terminal shows success messages
- Verify API log shows `/bridge/link/plaid` request

---

### Task 2: Debug KYC Component Visibility
**Objective**: Determine why KYC/Watchlist components aren't rendering
**Approach**: Use superpowers:systematic-debugging

**Investigation Steps**:
1. Run `/customer-KYC` command
2. Inspect customer object in browser console
3. Check if `customer.review.kyc` exists
4. Check if `customer.review.watch_list` exists
5. Verify backend is fetching review data correctly

**Files to Inspect**:
- `server/src/routes/customers.ts` (lines 112-138) - Review data fetching
- Browser DevTools - Network tab for API responses
- Browser Console - Log customer object state

**Expected Findings**:
- Either review data is not being fetched
- Or field names don't match (e.g., `address_watchlist` vs `watch_list`)
- Or conditional rendering logic is incorrect

**Verification**:
- Add console.log to CustomerCard to see actual customer.review structure
- Confirm which fields are populated

---

### Task 3: Redesign KYC Component to Match Retro Style
**Objective**: Make KYCValidationCard match the existing verification module expandable row format
**Reference**: CustomerCard.tsx lines 273-346 (existing verification modules)

**Files to Modify**:
- `web/src/components/dashboard/KYCValidationCard.tsx`

**Design Requirements**:
1. Remove standalone card wrapper
2. Return expandable row that integrates into CustomerCard's module list
3. Use retro design tokens:
   - `border-primary/20` not `border-yellow-200`
   - `bg-background-dark/50` not `bg-yellow-50`
   - `text-neutral-200` not `text-gray-600`
   - `font-pixel` for decisions, `font-body` for labels
   - `text-xs` sizing consistently
4. Match exact structure of existing modules:
   - Clickable button header
   - Left: Module name + optional correlation
   - Right: Decision badge (PASS/REVIEW/REJECT) + expand arrow
   - Expanded section: Risk details in dark background

**New Component Structure**:
```tsx
export const KYCValidationCard: React.FC<KYCValidationCardProps> = ({ customer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const kyc = customer.review?.kyc;

  if (!kyc) return null;

  return (
    <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-primary/5"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-body text-neutral-200">KYC Validation</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-xs font-pixel',
            kyc.decision === 'ACCEPT' ? 'text-green-500' :
            kyc.decision === 'REVIEW' ? 'text-gold' : 'text-accent'
          )}>
            {kyc.decision}
          </span>
          <span className="text-xs text-neutral-500">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-primary/10">
          {/* Validated fields section */}
          <div className="px-3 py-2 bg-background-dark/30">
            {/* Implementation here */}
          </div>
        </div>
      )}
    </div>
  );
};
```

**Verification**:
- Visual inspection matches existing module rows
- Expand/collapse works smoothly
- Colors match retro palette (cyan, gold, accent-red)
- Typography uses font-pixel and font-body correctly

---

### Task 4: Redesign Watchlist Component to Match Retro Style
**Objective**: Make AddressWatchlistCard match verification module format

**Files to Modify**:
- `web/src/components/dashboard/AddressWatchlistCard.tsx`

**Design Requirements**: Same as Task 3 (retro tokens, expandable row format)

**Component Structure**:
```tsx
export const AddressWatchlistCard: React.FC<AddressWatchlistCardProps> = ({ customer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const watchlist = customer.review?.watch_list;

  if (!watchlist) return null;

  const hasMatches = watchlist.matches && watchlist.matches.length > 0;

  return (
    <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-primary/5"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-body text-neutral-200">Address Watchlist</span>
          {hasMatches && (
            <span className="text-xs text-accent">• {watchlist.matches.length} matches</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-xs font-pixel',
            hasMatches ? 'text-accent' : 'text-green-500'
          )}>
            {hasMatches ? 'FLAGGED' : 'CLEAR'}
          </span>
          <span className="text-xs text-neutral-500">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-primary/10">
          <div className="px-3 py-2 bg-background-dark/30">
            {/* Match details with retro styling */}
          </div>
        </div>
      )}
    </div>
  );
};
```

**Verification**: Same as Task 3

---

### Task 5: Integration Testing
**Objective**: Verify all components work together correctly

**Test Scenarios**:

1. **Demo Flow**:
   ```
   /demo
   Expected: Customer → Bank Account → Charge (all succeed)
   ```

2. **KYC Customer Creation**:
   ```
   /customer-KYC
   Expected:
   - Customer created with Jane Doe
   - KYC Validation row appears in CustomerCard
   - Address Watchlist row appears in CustomerCard
   - Both rows are collapsible
   - Design matches existing verification modules
   ```

3. **Visual Consistency Check**:
   - All verification modules have same height/padding
   - Font sizes consistent (text-xs throughout)
   - Colors from retro palette only
   - Expand/collapse icons aligned
   - Dark backgrounds on expanded sections

**Verification Commands**:
```bash
# Start both servers
npm run dev

# Open browser to http://localhost:5173
# Run commands in terminal
/clear
/demo
/reset
/customer-KYC
```

**Success Criteria**:
- ✅ /demo completes without errors
- ✅ KYC Validation row visible and styled correctly
- ✅ Address Watchlist row visible and styled correctly
- ✅ Both components match existing module design
- ✅ Expand/collapse works for all modules
- ✅ No console errors
- ✅ Retro aesthetic maintained throughout

---

## Design Specification: Retro Module Row Format

**Required CSS Classes** (must use these for consistency):
- Container: `border border-primary/20 rounded-pixel bg-background-dark/50`
- Button: `w-full px-3 py-2 flex items-center justify-between hover:bg-primary/5`
- Label: `text-xs font-body text-neutral-200`
- Decision: `text-xs font-pixel text-green-500|text-gold|text-accent`
- Expanded section: `border-t border-primary/10`
- Expanded content: `px-3 py-2 bg-background-dark/30`
- Arrow: `text-xs text-neutral-500` with `▼` or `▶`

**Color Palette**:
- Primary (cyan): `text-primary`, `border-primary/20`
- Success: `text-green-500`
- Warning: `text-gold`
- Error: `text-accent` (red)
- Neutral: `text-neutral-200`, `text-neutral-400`, `text-neutral-500`

**Typography**:
- Module names: `font-body`
- Decisions/badges: `font-pixel`
- All text: `text-xs` (except card titles which are handled by RetroCardTitle)

---

## Files Modified

1. `web/src/lib/commands.ts` - Revert /demo to use bank method
2. `web/src/components/dashboard/KYCValidationCard.tsx` - Complete redesign
3. `web/src/components/dashboard/AddressWatchlistCard.tsx` - Complete redesign
4. (Possibly) `server/src/routes/customers.ts` - Fix review data fetching if needed

## Testing Checklist

- [ ] Task 1: /demo command runs successfully
- [ ] Task 2: KYC component renders when using /customer-KYC
- [ ] Task 2: Watchlist component renders when using /customer-KYC
- [ ] Task 3: KYC component matches retro design
- [ ] Task 4: Watchlist component matches retro design
- [ ] Task 5: Visual consistency across all modules
- [ ] Task 5: No console errors
- [ ] Task 5: All expand/collapse interactions work

## Notes

- This plan uses superpowers:systematic-debugging approach for Task 2
- Design changes are based on existing working code (verification modules)
- No new functionality added - only fixing existing features
- Priority: Get /demo working first (Task 1), then fix visibility and design
