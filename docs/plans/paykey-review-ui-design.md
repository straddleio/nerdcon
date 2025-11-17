# Paykey Review UI Implementation Design

**Date:** 2024-11-16
**Status:** Validated Design
**Location:** `.temp/` (git-ignored, not for PR)

## Executive Summary

Implementation design for adding paykey verification details display to the PaykeyCard component, following established patterns from CustomerCard. The feature shows account validation (bank accounts) or name match/WALDO scores (Plaid/Quiltt/Straddle) with progressive disclosure via SHOW/INFO buttons.

## Requirements

### Functional Requirements

1. Display verification details from `GET /api/paykeys/:id/review` endpoint
2. Support both account_validation (bank_account) and name_match (plaid/quiltt/straddle) verification types
3. Always fetch review data for all paykeys (not just those in 'review' status)
4. Show verification details with progressive disclosure (SHOW → expanded → INFO for details)
5. Display pulsing review button when status is 'review' (functionality deferred)

### Non-Functional Requirements

- Maintain exact consistency with CustomerCard patterns
- Don't overwhelm the UI when paykey is verified
- All review API calls must appear in terminal logs and developer logs
- Handle missing data gracefully (hide section if no data)

## Technical Design

### Data Flow

```typescript
// After any paykey creation or fetch
const paykeyResponse = await createPaykey(...);
const reviewResponse = await fetch(`/api/paykeys/${paykeyResponse.id}/review`);
const review = await reviewResponse.json();

// Store combined data
const enrichedPaykey = {
  ...paykeyResponse,
  review: review
};
```

### API Integration

**Endpoints Used:**

- `GET /api/paykeys/:id/review` - Fetch verification details (already implemented in server)
- Response includes `verification_details` with either:
  - `account_validation` for bank_account paykeys
  - `name_match` for plaid/quiltt/straddle paykeys

**Terminal Log Display:**

```
> /create-paykey bank
Creating bank account paykey...
→ POST /api/bridge/bank-account
← 200 OK (523ms)
→ GET /api/paykeys/pk_abc123/review
← 200 OK (145ms)
✓ Paykey created and verified: Chase Bank ****1234
```

### Component Structure

**File:** `web/src/components/dashboard/PaykeyCard.tsx`

**State Management:**

```typescript
const [showVerification, setShowVerification] = useState(false);
const [showInfoMode, setShowInfoMode] = useState(false);

// Reset states when paykey changes
useEffect(() => {
  setShowVerification(false);
  setShowInfoMode(false);
}, [paykey?.id]);
```

**Helper Functions:**

```typescript
const hasVerificationData = () => {
  const verification = paykey?.review?.verification_details;
  if (!verification) return false;

  // Check based on paykey source
  if (paykey?.source === 'bank_account') {
    return verification.breakdown?.account_validation?.decision !== 'unknown';
  } else {
    return verification.breakdown?.name_match?.decision !== 'unknown';
  }
};

const getCorrelationBucket = (score?: number | null): string => {
  if (!score && score !== 0) return 'UNKNOWN';
  if (score === 1.0) return 'EXACT';
  if (score > 0.8) return 'HIGH';
  if (score >= 0.2) return 'MEDIUM';
  return 'LOW';
};

const getDecisionLabel = (decision: string) => {
  switch (decision) {
    case 'accept':
      return 'PASS';
    case 'review':
      return 'REVIEW';
    case 'reject':
      return 'FAIL';
    default:
      return 'UNKNOWN';
  }
};

const getDecisionColor = (decision: string) => {
  switch (decision) {
    case 'accept':
      return 'text-green-500';
    case 'review':
      return 'text-gold';
    case 'reject':
      return 'text-accent';
    default:
      return 'text-neutral-400';
  }
};
```

### UI Components

#### 1. Status Badge (Review State)

When `paykey.status === 'review'`, replace the normal badge with a pulsing button:

```jsx
{
  paykey.status === 'review' ? (
    <button
      onClick={() => {
        // TODO: Add review action handler in future task
        console.log('Paykey review button clicked - workflow to be implemented');
      }}
      className={cn(
        'px-2 py-1 text-xs font-pixel uppercase transition-all',
        'bg-gold/20 text-gold border border-gold/40 rounded-pixel',
        'hover:bg-gold/30 hover:border-gold/60',
        'animate-pulse',
        'cursor-pointer'
      )}
    >
      REVIEW
    </button>
  ) : (
    <RetroBadge variant={statusColor}>{paykey.status.toUpperCase()}</RetroBadge>
  );
}
```

#### 2. Verification Details Section

Replace the current "Ownership Signals" section entirely:

```jsx
{
  hasVerificationData() && (
    <div className="pt-3 border-t border-secondary/20">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-neutral-400 font-body">Verification Details</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVerification(!showVerification)}
            className={cn(
              'px-2 py-1 text-xs font-body border rounded-pixel transition-all',
              showVerification
                ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
                : 'border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary'
            )}
          >
            {showVerification ? 'HIDE' : 'SHOW'}
          </button>
          {showVerification && (
            <button
              onClick={() => setShowInfoMode(!showInfoMode)}
              className={cn(
                'px-2 py-1 text-xs font-body border rounded-pixel transition-all',
                showInfoMode
                  ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
                  : 'border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary'
              )}
            >
              INFO
            </button>
          )}
        </div>
      </div>

      {showVerification && (
        <div className="space-y-2">
          {paykey.source === 'bank_account' ? <AccountValidationDisplay /> : <NameMatchDisplay />}
        </div>
      )}
    </div>
  );
}
```

#### 3. Name Match Display Component

```jsx
const NameMatchDisplay = () => {
  const nameMatch = paykey?.review?.verification_details?.breakdown?.name_match;
  if (!nameMatch) return null;

  const correlationBucket = getCorrelationBucket(nameMatch.correlation_score);
  const correlationColor = {
    EXACT: 'text-primary',
    HIGH: 'text-secondary',
    MEDIUM: 'text-gold',
    LOW: 'text-accent',
    UNKNOWN: 'text-neutral-400',
  }[correlationBucket];

  if (!showInfoMode) {
    return (
      <>
        {/* Correlation Score */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-body">Name Correlation</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-pixel ${correlationColor}`}>{correlationBucket}</span>
            {nameMatch.correlation_score !== null && (
              <span className="text-xs text-neutral-400">
                ({nameMatch.correlation_score.toFixed(2)})
              </span>
            )}
          </div>
        </div>

        {/* Names Display */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-neutral-500 font-body mb-1">Customer Name</p>
            <p className="text-xs text-neutral-100 font-body">
              {nameMatch.customer_name || customer?.name || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-body mb-1">Matched Name</p>
            <p className="text-xs text-neutral-100 font-body">
              {nameMatch.matched_name || 'Not found'}
            </p>
          </div>
        </div>

        {/* Decision */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-neutral-500 font-body">Decision</span>
          <span className={`text-xs font-pixel ${getDecisionColor(nameMatch.decision)}`}>
            {getDecisionLabel(nameMatch.decision)}
          </span>
        </div>
      </>
    );
  } else {
    // INFO mode - show all names on account
    return (
      <>
        <p className="text-xs text-neutral-500 font-body">All Names on Account</p>
        {nameMatch.names_on_account && nameMatch.names_on_account.length > 0 ? (
          nameMatch.names_on_account.map((name, idx) => (
            <div key={idx} className="text-xs text-neutral-100 font-body pl-2">
              • {name}
            </div>
          ))
        ) : (
          <p className="text-xs text-neutral-500 font-body pl-2">No additional names</p>
        )}
      </>
    );
  }
};
```

#### 4. Account Validation Display Component

```jsx
const AccountValidationDisplay = () => {
  const accountVal = paykey?.review?.verification_details?.breakdown?.account_validation;
  const messages = paykey?.review?.verification_details?.messages;
  if (!accountVal) return null;

  if (!showInfoMode) {
    // Show R-codes (risk codes)
    return (
      <>
        {/* Validation Decision */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-body">Account Validation</span>
          <span className={`text-xs font-pixel ${getDecisionColor(accountVal.decision)}`}>
            {getDecisionLabel(accountVal.decision)}
          </span>
        </div>

        {/* Reason if available */}
        {accountVal.reason && (
          <div>
            <p className="text-xs text-neutral-500 font-body mb-1">Reason</p>
            <p className="text-xs text-neutral-100 font-body">{accountVal.reason}</p>
          </div>
        )}

        {/* R-Codes (Risk Codes) */}
        {accountVal.codes
          ?.filter((code) => code.startsWith('R'))
          .map((code) => (
            <div key={code} className="flex gap-2">
              <span className="text-xs text-accent font-mono flex-shrink-0">{code}</span>
              <span className="text-xs text-neutral-400 font-body">
                {messages?.[code] || 'Validation signal'}
              </span>
            </div>
          ))}

        {accountVal.codes?.filter((code) => code.startsWith('R')).length === 0 && (
          <p className="text-xs text-neutral-500 font-body pl-2">No risk signals</p>
        )}
      </>
    );
  } else {
    // INFO mode - show I-codes (information codes)
    return (
      <>
        <p className="text-xs text-neutral-500 font-body">Information Codes</p>
        {accountVal.codes
          ?.filter((code) => !code.startsWith('R'))
          .map((code) => (
            <div key={code} className="flex gap-2">
              <span className="text-xs text-primary font-mono flex-shrink-0">{code}</span>
              <span className="text-xs text-neutral-400 font-body">
                {messages?.[code] || 'Information signal'}
              </span>
            </div>
          ))}
        {accountVal.codes?.filter((code) => !code.startsWith('R')).length === 0 && (
          <p className="text-xs text-neutral-500 font-body pl-2">No information codes</p>
        )}
      </>
    );
  }
};
```

## Implementation Steps

### Step 1: Update Command Handlers

Modify `web/src/lib/commands.ts` to fetch review data after paykey creation:

```typescript
// In handleCreatePaykey function, after successful paykey creation:
const reviewResponse = await fetch(`${API_BASE_URL}/paykeys/${paykeyData.id}/review`);
const reviewData = await reviewResponse.json();

// Add review data to paykey before updating state
const enrichedPaykey = {
  ...paykeyData,
  review: reviewData,
};

updatePaykey(enrichedPaykey);
```

### Step 2: Update PaykeyCard Component

1. Add state management hooks
2. Add helper functions
3. Replace "Ownership Signals" section with "Verification Details"
4. Implement conditional rendering based on data availability
5. Add pulsing review button for review status

### Step 3: Update State Types

Ensure `DemoPaykey` interface includes the `review?: PaykeyReview` field (already exists in server types).

## Testing Plan

### Manual Testing Scenarios

```bash
# 1. Test bank account validation
/create-paykey bank --outcome review
# Verify: Shows account_validation data with codes

# 2. Test name match (Plaid)
/create-paykey plaid --outcome review
# Verify: Shows name_match with WALDO correlation score

# 3. Test active status
/create-paykey bank --outcome active
# Verify: Verification Details available but collapsed

# 4. Test rejected status
/create-paykey plaid --outcome rejected
# Verify: Shows failed verification with reason

# 5. Test INFO toggle
# Click SHOW → INFO
# Verify: Switches between R-codes and I-codes (or names list)
```

### Visual States to Verify

1. **No Paykey:** No card content shown
2. **No Review Data:** Original card layout without Verification Details section
3. **With Review Data (Collapsed):** SHOW button visible, section collapsed
4. **Review Status:** Pulsing gold status badge instead of static badge
5. **Expanded State:** HIDE and INFO buttons visible, content displayed
6. **INFO Mode Toggle:** Content switches appropriately

## Design Decisions

### Why Mirror CustomerCard Pattern?

- **Consistency:** Users already understand the SHOW/INFO interaction pattern
- **Progressive Disclosure:** Prevents UI overwhelm while making details accessible
- **Familiarity:** Reduces cognitive load by reusing established patterns

### Why Unified Display?

- **Simplicity:** One consistent pattern regardless of verification type
- **Maintainability:** Single component handles both verification types
- **Flexibility:** Easy to extend if new verification types are added

### Why Always Fetch Review?

- **Data Availability:** Ensures verification details are ready when needed
- **Consistency:** Matches customer flow which always fetches review
- **Performance:** Minimal overhead, data cached in state

## Future Enhancements

1. **Wire Review Button:** Connect pulsing review button to approval/rejection workflow
2. **Animation:** Add subtle transitions when expanding/collapsing sections
3. **Sound Cues:** Play audio alert when paykey enters review status
4. **Tooltips:** Add hover tooltips explaining correlation scores and codes

## Acceptance Criteria

- [ ] Verification details display for bank_account paykeys (account_validation)
- [ ] Verification details display for plaid/quiltt/straddle paykeys (name_match)
- [ ] SHOW/HIDE toggle functionality works
- [ ] INFO toggle switches between main view and detailed codes/names
- [ ] Review status shows pulsing button (no functionality yet)
- [ ] All review API calls appear in terminal logs
- [ ] Section hidden when no verification data available
- [ ] Correlation scores mapped to EXACT/HIGH/MEDIUM/LOW buckets
- [ ] Decisions shown as PASS/REVIEW/FAIL/UNKNOWN labels
- [ ] Visual styling matches CustomerCard patterns exactly
