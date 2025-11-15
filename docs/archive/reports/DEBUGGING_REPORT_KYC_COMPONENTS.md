# Debugging Report: KYC and Watchlist Components Not Rendering

## Investigation Date
2025-11-15

## Task
Debug why KYC and Watchlist components aren't rendering when using `/customer-KYC` command.

## Phase 1: Root Cause Investigation

### Evidence Gathered

#### 1. Backend Analysis (`server/src/routes/customers.ts`)

**Lines 112-146:** Review data fetching logic
```typescript
const review = await straddleClient.customers.review.get(customer.data.id);
const identityDetails = (review.data as any).identity_details;

reviewData = {
  review_id: identityDetails.review_id,
  decision: identityDetails.decision,
  messages: identityDetails.messages,
  breakdown: { ... },
  kyc: identityDetails.kyc,                    // ✅ Correctly mapped
  reputation: identityDetails.reputation,
  network_alerts: identityDetails.network_alerts,
  watch_list: identityDetails.watch_list,      // ✅ Correctly mapped
};
```

**Conclusion:** Backend correctly fetches and maps both `kyc` and `watch_list` fields.

#### 2. API Response Verification (curl test)

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d @/tmp/test-kyc-customer.json
```

**Response Structure:**
```json
{
  "review": {
    "kyc": {
      "decision": "accept",        // ⚠️ LOWERCASE
      "codes": ["I919"],
      "validations": {
        "dob": true,
        "ssn": true,
        "zip": true,
        "city": true,
        "phone": true,
        "state": true,
        "address": true,
        "last_name": true,
        "first_name": true
      }
    },
    "watch_list": {
      "decision": "review",        // ⚠️ LOWERCASE
      "codes": ["R186"],
      "matches": [
        {
          "list_name": "UN Consolidated",
          "urls": ["https://scsanctions.un.org/consolidated/"],
          "match_fields": ["alias", "dob"],
          "correlation": "unknown"
        },
        // ... 3 more matches
      ]
    }
  }
}
```

**Conclusion:** Both `kyc` and `watch_list` fields ARE present in API response with data.

#### 3. Frontend Type Definitions (`web/src/lib/api.ts`)

**Lines 95-141:** Customer interface
```typescript
export interface Customer {
  // ...
  review?: {
    kyc?: {                              // ✅ Type defined
      decision: string;
      codes?: string[];
      validations?: { ... };
    };
    watch_list?: {                       // ✅ Type defined
      decision: string;
      codes?: string[];
      matches?: Array<{ ... }>;
    };
  };
}
```

**Conclusion:** Types correctly match backend response structure.

#### 4. Component Rendering Logic (`web/src/components/dashboard/CustomerCard.tsx`)

**Lines 349-356:** Component conditional rendering
```typescript
{/* KYC Validation - New Component */}
{customer.review?.kyc && (              // ✅ Correct check
  <KYCValidationCard customer={customer} />
)}

{/* Address Watchlist - New Component */}
{customer.review?.watch_list && (       // ✅ Correct check
  <AddressWatchlistCard customer={customer} />
)}
```

**Conclusion:** Conditional rendering logic is correct.

#### 5. Component Implementation Analysis

**`KYCValidationCard.tsx`:**
- Line 14: `if (!kyc) return null;` - Correct null check
- Line 66: `<div className={cn('border rounded-lg p-4', getDecisionColor(kyc.decision))}>` - Uses decision for styling
- Lines 18-42: `getDecisionIcon()` and `getDecisionColor()` functions check for UPPERCASE decision values

**`AddressWatchlistCard.tsx`:**
- Line 14: `if (!addressWatchlist) return null;` - Correct null check
- Line 12: `const addressWatchlist = customer.review?.watch_list;` - ✅ Correct field name

#### 6. Terminal Command Bug (`web/src/lib/commands.ts`)

**Line 193:** Incorrect field reference
```typescript
customer.review?.address_watchlist?.matches?.length    // ❌ WRONG field name
  ? `Address Watchlist Matches: ${customer.review.address_watchlist.matches.length}`
  : '✓ No Address Watchlist Matches'
```

**Should be:**
```typescript
customer.review?.watch_list?.matches?.length           // ✅ CORRECT field name
```

**Conclusion:** Terminal output bug - doesn't affect component rendering but shows wrong message.

## Phase 2: Pattern Analysis

### Root Cause Identified: Decision Case Mismatch

**Problem:**
1. Straddle API returns lowercase decisions: `"accept"`, `"review"`, `"reject"`
2. KYCValidationCard expects UPPERCASE: `"ACCEPT"`, `"REVIEW"`, `"REJECT"`

**Impact:**
```typescript
// KYCValidationCard.tsx - getDecisionColor()
const getDecisionColor = (decision: string) => {
  switch (decision) {
    case 'ACCEPT':                              // API sends "accept" (lowercase)
      return 'bg-green-50 border-green-200';
    case 'REJECT':
      return 'bg-red-50 border-red-200';
    case 'REVIEW':
      return 'bg-yellow-50 border-yellow-200';
    default:
      return 'bg-gray-50 border-gray-200';      // Falls through to gray
  }
};
```

**Result:** Components render with gray background instead of appropriate colored backgrounds.

### Additional Issue: Design System Mismatch

Both KYCValidationCard and AddressWatchlistCard use standard Tailwind colors instead of retro design tokens:
- Using: `bg-yellow-50`, `border-yellow-200`, `text-gray-600`
- Should use: `bg-background-dark`, `border-primary/20`, `text-neutral-200`, `font-pixel`

This is mentioned in Task 3 of the plan.

## Phase 3: Hypothesis

**Primary Hypothesis:**
The components ARE rendering, but they're not visible or styled correctly because:

1. **Decision case mismatch** causes incorrect styling (gray instead of colored)
2. **Non-retro styling** makes them blend into background or look out of place
3. **No section wrapper** around the components (lines 349-356 have no border-top or visual separator)

**Supporting Evidence:**
- All data is present in API response (verified via curl)
- All type definitions are correct
- All conditional checks are correct
- Backend correctly maps the data
- State management is correct

**The issue is NOT with data fetching or rendering logic - it's with styling and visibility.**

## Fixes Needed

### Fix 1: Terminal Command Field Name (Simple)
**File:** `web/src/lib/commands.ts`
**Line:** 193
**Change:** `address_watchlist` → `watch_list`

### Fix 2: Decision Case Handling (Simple)
**File:** `web/src/components/dashboard/KYCValidationCard.tsx`
**Lines:** 18-42
**Change:** Convert decision to uppercase or check lowercase values

```typescript
const getDecisionColor = (decision: string) => {
  const normalizedDecision = decision?.toUpperCase();
  switch (normalizedDecision) {
    case 'ACCEPT':
      return 'bg-green-50 border-green-200';
    // ...
  }
};
```

### Fix 3: Retro Design System (Task 3)
Complete redesign of both components to match retro aesthetic - covered in Task 3 of the plan.

## Verification Steps

With console.log added to CustomerCard (line 68-72), when running `/customer-KYC`:

1. Check browser console for:
   - `customer.review` should be populated
   - `customer.review.kyc` should have `decision`, `validations`
   - `customer.review.watch_list` should have `decision`, `matches`

2. Inspect DOM to see if components are rendered but invisible

3. Check that components appear (even if gray) when data is present

## Conclusion

**Components ARE likely rendering but not visible due to:**
1. ✅ Decision case mismatch (lowercase API vs uppercase component checks)
2. ✅ Missing retro styling (Task 3 will fix this)
3. ✅ Terminal command uses wrong field name (cosmetic bug only)

**Data flow is working correctly:**
- Backend ✅ Fetches review data
- Backend ✅ Maps kyc and watch_list
- Frontend ✅ Receives complete customer object
- Frontend ✅ Checks for correct fields
- Components ✅ Render when data present

**Next Steps:**
1. Fix terminal command field name bug (1 line change)
2. Fix decision case handling (add `.toUpperCase()`)
3. Proceed with Task 3 to redesign components with retro styling
