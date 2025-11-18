# Paykey Review UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add paykey verification details display to PaykeyCard with progressive disclosure UI matching CustomerCard patterns.

**Architecture:** Enhance PaykeyCard to display account validation or name match verification data from paykey review API. Uses existing SHOW/HIDE/INFO pattern for consistency with CustomerCard.

**Tech Stack:** React, TypeScript, Tailwind CSS, Zustand state management, Express backend (already has review endpoints)

---

## Task 1: Write Tests for Helper Functions

**Files:**

- Create: `web/src/components/dashboard/__tests__/PaykeyCard.helpers.test.tsx`
- Create: `web/src/components/dashboard/PaykeyCard.helpers.ts`

**Step 1: Write the failing test for correlation bucket mapping**

```typescript
// web/src/components/dashboard/__tests__/PaykeyCard.helpers.test.tsx
import { describe, it, expect } from 'vitest';
import {
  getCorrelationBucket,
  getDecisionLabel,
  getDecisionColor,
  hasVerificationData,
} from '../PaykeyCard.helpers';

describe('PaykeyCard Helpers', () => {
  describe('getCorrelationBucket', () => {
    it('should return EXACT for score of 1.0', () => {
      expect(getCorrelationBucket(1.0)).toBe('EXACT');
    });

    it('should return HIGH for score > 0.8', () => {
      expect(getCorrelationBucket(0.9)).toBe('HIGH');
      expect(getCorrelationBucket(0.81)).toBe('HIGH');
    });

    it('should return MEDIUM for score 0.2 to 0.8', () => {
      expect(getCorrelationBucket(0.8)).toBe('MEDIUM');
      expect(getCorrelationBucket(0.5)).toBe('MEDIUM');
      expect(getCorrelationBucket(0.2)).toBe('MEDIUM');
    });

    it('should return LOW for score < 0.2', () => {
      expect(getCorrelationBucket(0.19)).toBe('LOW');
      expect(getCorrelationBucket(0.1)).toBe('LOW');
      expect(getCorrelationBucket(0)).toBe('LOW');
    });

    it('should return UNKNOWN for null or undefined', () => {
      expect(getCorrelationBucket(null)).toBe('UNKNOWN');
      expect(getCorrelationBucket(undefined)).toBe('UNKNOWN');
    });
  });

  describe('getDecisionLabel', () => {
    it('should map decision values to labels', () => {
      expect(getDecisionLabel('accept')).toBe('PASS');
      expect(getDecisionLabel('review')).toBe('REVIEW');
      expect(getDecisionLabel('reject')).toBe('FAIL');
      expect(getDecisionLabel('unknown')).toBe('UNKNOWN');
      expect(getDecisionLabel('invalid')).toBe('UNKNOWN');
    });
  });

  describe('getDecisionColor', () => {
    it('should return correct color classes for decisions', () => {
      expect(getDecisionColor('accept')).toBe('text-green-500');
      expect(getDecisionColor('review')).toBe('text-gold');
      expect(getDecisionColor('reject')).toBe('text-accent');
      expect(getDecisionColor('unknown')).toBe('text-neutral-400');
      expect(getDecisionColor('invalid')).toBe('text-neutral-400');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test PaykeyCard.helpers.test.tsx`
Expected: FAIL with "Cannot find module '../PaykeyCard.helpers'"

**Step 3: Write minimal implementation**

```typescript
// web/src/components/dashboard/PaykeyCard.helpers.ts
export const getCorrelationBucket = (score?: number | null): string => {
  if (!score && score !== 0) return 'UNKNOWN';
  if (score === 1.0) return 'EXACT';
  if (score > 0.8) return 'HIGH';
  if (score >= 0.2) return 'MEDIUM';
  return 'LOW';
};

export const getDecisionLabel = (decision: string): string => {
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

export const getDecisionColor = (decision: string): string => {
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

export const hasVerificationData = (paykey: any): boolean => {
  const verification = paykey?.review?.verification_details;
  if (!verification) return false;

  // Check based on paykey source
  if (paykey?.source === 'bank_account') {
    return verification.breakdown?.account_validation?.decision !== 'unknown';
  } else {
    return verification.breakdown?.name_match?.decision !== 'unknown';
  }
};
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test PaykeyCard.helpers.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/dashboard/__tests__/PaykeyCard.helpers.test.tsx
git add web/src/components/dashboard/PaykeyCard.helpers.ts
git commit -m "test: add helper functions for paykey review UI with TDD"
```

---

## Task 2: Write Tests for hasVerificationData Function

**Files:**

- Modify: `web/src/components/dashboard/__tests__/PaykeyCard.helpers.test.tsx`
- Modify: `web/src/components/dashboard/PaykeyCard.helpers.ts`

**Step 1: Write the failing test for hasVerificationData**

```typescript
// Add to web/src/components/dashboard/__tests__/PaykeyCard.helpers.test.tsx
describe('hasVerificationData', () => {
  it('should return false when no review data', () => {
    expect(hasVerificationData({})).toBe(false);
    expect(hasVerificationData({ review: null })).toBe(false);
  });

  it('should return false when no verification_details', () => {
    expect(hasVerificationData({ review: {} })).toBe(false);
  });

  it('should return true for bank_account with valid account_validation', () => {
    const paykey = {
      source: 'bank_account',
      review: {
        verification_details: {
          breakdown: {
            account_validation: { decision: 'accept' },
          },
        },
      },
    };
    expect(hasVerificationData(paykey)).toBe(true);
  });

  it('should return false for bank_account with unknown decision', () => {
    const paykey = {
      source: 'bank_account',
      review: {
        verification_details: {
          breakdown: {
            account_validation: { decision: 'unknown' },
          },
        },
      },
    };
    expect(hasVerificationData(paykey)).toBe(false);
  });

  it('should return true for plaid with valid name_match', () => {
    const paykey = {
      source: 'plaid',
      review: {
        verification_details: {
          breakdown: {
            name_match: { decision: 'review' },
          },
        },
      },
    };
    expect(hasVerificationData(paykey)).toBe(true);
  });

  it('should return false for plaid with unknown decision', () => {
    const paykey = {
      source: 'plaid',
      review: {
        verification_details: {
          breakdown: {
            name_match: { decision: 'unknown' },
          },
        },
      },
    };
    expect(hasVerificationData(paykey)).toBe(false);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `cd web && npm test PaykeyCard.helpers.test.tsx`
Expected: PASS (already implemented correctly)

**Step 3: Commit**

```bash
git add web/src/components/dashboard/__tests__/PaykeyCard.helpers.test.tsx
git commit -m "test: add comprehensive tests for hasVerificationData"
```

---

## Task 3: Update Command Handlers to Fetch Review Data

**Files:**

- Modify: `web/src/lib/commands.ts:268-340` (handleCreatePaykey function)

**Step 1: Write failing test for review data fetching**

```typescript
// Create: web/src/lib/__tests__/commands.paykey.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCreatePaykey } from '../commands';

// Mock fetch globally
global.fetch = vi.fn();

describe('handleCreatePaykey with review data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch review data after creating paykey', async () => {
    const mockPaykey = { id: 'pk_123', status: 'active' };
    const mockReview = { verification_details: { decision: 'accept' } };

    // Mock paykey creation
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaykey,
    });

    // Mock review fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReview,
    });

    const updatePaykey = vi.fn();
    await handleCreatePaykey('bank', { outcome: 'active' }, updatePaykey);

    // Verify both API calls were made
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/paykeys/pk_123/review')
    );

    // Verify enriched paykey was passed to state
    expect(updatePaykey).toHaveBeenCalledWith({
      ...mockPaykey,
      review: mockReview,
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test commands.paykey.test.ts`
Expected: FAIL - review fetch not implemented

**Step 3: Implement review data fetching**

```typescript
// Modify web/src/lib/commands.ts around line 340
// In handleCreatePaykey function, after successful paykey creation:

// Find the section after successful paykey creation (around line 330-340)
// Replace the updatePaykey call with:

// Fetch review data to get verification details
const reviewResponse = await fetch(`${API_BASE_URL}/paykeys/${paykeyData.id}/review`);
if (!reviewResponse.ok) {
  console.warn(`Failed to fetch paykey review: ${reviewResponse.status}`);
  // Still update with paykey even if review fails
  updatePaykey(paykeyData);
  return success;
}

const reviewData = await reviewResponse.json();

// Add review data to paykey before updating state
const enrichedPaykey: DemoPaykey = {
  ...paykeyData,
  review: reviewData,
};

updatePaykey(enrichedPaykey);
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test commands.paykey.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/__tests__/commands.paykey.test.ts
git add web/src/lib/commands.ts
git commit -m "feat: fetch paykey review data after creation"
```

---

## Task 4: Add State Management to PaykeyCard

**Files:**

- Modify: `web/src/components/dashboard/PaykeyCard.tsx:1-35`

**Step 1: Write failing test for state management**

```typescript
// Create: web/src/components/dashboard/__tests__/PaykeyCard.state.test.tsx
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PaykeyCard } from '../PaykeyCard';
import { useDemoStore } from '@/lib/state';

// Mock the store
vi.mock('@/lib/state', () => ({
  useDemoStore: vi.fn()
}));

describe('PaykeyCard State Management', () => {
  it('should initialize with collapsed verification state', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      review: {
        verification_details: {
          breakdown: {
            account_validation: { decision: 'accept' }
          }
        }
      }
    };

    (useDemoStore as any).mockReturnValue(mockPaykey);

    const { queryByText } = render(<PaykeyCard />);

    // Should show SHOW button, not expanded content
    expect(queryByText('SHOW')).toBeInTheDocument();
    expect(queryByText('HIDE')).not.toBeInTheDocument();
  });

  it('should toggle verification visibility on button click', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      source: 'bank_account',
      review: {
        verification_details: {
          breakdown: {
            account_validation: { decision: 'accept' }
          }
        }
      }
    };

    (useDemoStore as any).mockReturnValue(mockPaykey);

    const { getByText, queryByText } = render(<PaykeyCard />);

    // Click SHOW
    fireEvent.click(getByText('SHOW'));

    // Should now show HIDE and INFO buttons
    expect(queryByText('HIDE')).toBeInTheDocument();
    expect(queryByText('INFO')).toBeInTheDocument();
    expect(queryByText('SHOW')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test PaykeyCard.state.test.tsx`
Expected: FAIL - state hooks not implemented

**Step 3: Add state management hooks**

```typescript
// Add to web/src/components/dashboard/PaykeyCard.tsx after line 10 (imports)
import React, { useState, useEffect } from 'react';
import {
  hasVerificationData,
  getCorrelationBucket,
  getDecisionLabel,
  getDecisionColor,
} from './PaykeyCard.helpers';
import { cn } from '@/components/ui/utils';

// Then inside PaykeyCard component, after line 21 (const customer = ...)
const [showVerification, setShowVerification] = useState(false);
const [showInfoMode, setShowInfoMode] = useState(false);

// Reset states when paykey changes
useEffect(() => {
  setShowVerification(false);
  setShowInfoMode(false);
}, [paykey?.id]);
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test PaykeyCard.state.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/dashboard/__tests__/PaykeyCard.state.test.tsx
git add web/src/components/dashboard/PaykeyCard.tsx
git commit -m "feat: add state management hooks to PaykeyCard"
```

---

## Task 5: Replace Status Badge with Pulsing Review Button

**Files:**

- Modify: `web/src/components/dashboard/PaykeyCard.tsx:80-86`

**Step 1: Write failing test for review button**

```typescript
// Add to web/src/components/dashboard/__tests__/PaykeyCard.state.test.tsx
describe('Review Status Button', () => {
  it('should show pulsing button when status is review', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'review',
      review: {}
    };

    (useDemoStore as any).mockReturnValue({ paykey: mockPaykey });

    const { container, queryByText } = render(<PaykeyCard />);

    // Should show REVIEW as button
    const reviewButton = queryByText('REVIEW');
    expect(reviewButton).toBeInTheDocument();
    expect(reviewButton.tagName).toBe('BUTTON');

    // Should have pulse animation class
    expect(reviewButton.className).toContain('animate-pulse');
  });

  it('should show normal badge when status is not review', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      review: {}
    };

    (useDemoStore as any).mockReturnValue({ paykey: mockPaykey });

    const { queryByText } = render(<PaykeyCard />);

    const activeLabel = queryByText('ACTIVE');
    expect(activeLabel).toBeInTheDocument();
    expect(activeLabel.tagName).not.toBe('BUTTON');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test PaykeyCard.state.test.tsx`
Expected: FAIL - review button not implemented

**Step 3: Replace badge with conditional button**

```typescript
// Replace lines 80-86 in web/src/components/dashboard/PaykeyCard.tsx
// Current code shows: <RetroBadge variant={statusColor}>{paykey.status.toUpperCase()}</RetroBadge>
// Replace with:

{paykey.status === 'review' ? (
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
  <RetroBadge variant={statusColor}>
    {paykey.status.toUpperCase()}
  </RetroBadge>
)}
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test PaykeyCard.state.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/dashboard/PaykeyCard.tsx
git add web/src/components/dashboard/__tests__/PaykeyCard.state.test.tsx
git commit -m "feat: add pulsing review button for review status"
```

---

## Task 6: Replace Ownership Signals with Verification Details Section

**Files:**

- Modify: `web/src/components/dashboard/PaykeyCard.tsx:148-160`

**Step 1: Write failing test for verification section**

```typescript
// Create: web/src/components/dashboard/__tests__/PaykeyCard.verification.test.tsx
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PaykeyCard } from '../PaykeyCard';
import { useDemoStore } from '@/lib/state';

vi.mock('@/lib/state');

describe('Verification Details Section', () => {
  it('should not show section when no verification data', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      review: {}
    };

    (useDemoStore as any).mockReturnValue({ paykey: mockPaykey, customer: null });

    const { queryByText } = render(<PaykeyCard />);
    expect(queryByText('Verification Details')).not.toBeInTheDocument();
  });

  it('should show verification section with SHOW button when data exists', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      source: 'bank_account',
      review: {
        verification_details: {
          breakdown: {
            account_validation: { decision: 'accept' }
          }
        }
      }
    };

    (useDemoStore as any).mockReturnValue({ paykey: mockPaykey, customer: null });

    const { queryByText } = render(<PaykeyCard />);
    expect(queryByText('Verification Details')).toBeInTheDocument();
    expect(queryByText('SHOW')).toBeInTheDocument();
  });

  it('should show HIDE and INFO buttons when expanded', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      source: 'bank_account',
      review: {
        verification_details: {
          breakdown: {
            account_validation: { decision: 'accept' }
          }
        }
      }
    };

    (useDemoStore as any).mockReturnValue({ paykey: mockPaykey, customer: null });

    const { getByText, queryByText } = render(<PaykeyCard />);

    // Click SHOW
    fireEvent.click(getByText('SHOW'));

    expect(queryByText('HIDE')).toBeInTheDocument();
    expect(queryByText('INFO')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test PaykeyCard.verification.test.tsx`
Expected: FAIL - verification section not implemented

**Step 3: Replace Ownership Signals section**

```typescript
// Replace lines 148-160 (Ownership Signals section) in PaykeyCard.tsx with:

{/* Verification Details */}
{hasVerificationData(paykey) && (
  <div className="pt-3 border-t border-secondary/20">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs text-neutral-400 font-body">Verification Details</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowVerification(!showVerification)}
          className={cn(
            "px-2 py-1 text-xs font-body border rounded-pixel transition-all",
            showVerification
              ? "border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
              : "border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary"
          )}
        >
          {showVerification ? 'HIDE' : 'SHOW'}
        </button>
        {showVerification && (
          <button
            onClick={() => setShowInfoMode(!showInfoMode)}
            className={cn(
              "px-2 py-1 text-xs font-body border rounded-pixel transition-all",
              showInfoMode
                ? "border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
                : "border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary"
            )}
          >
            INFO
          </button>
        )}
      </div>
    </div>

    {showVerification && (
      <div className="space-y-2">
        {/* Verification content will be added in next task */}
      </div>
    )}
  </div>
)}
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test PaykeyCard.verification.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/dashboard/__tests__/PaykeyCard.verification.test.tsx
git add web/src/components/dashboard/PaykeyCard.tsx
git commit -m "feat: add verification details section with SHOW/HIDE/INFO buttons"
```

---

## Task 7: Create Name Match Display Component

**Files:**

- Create: `web/src/components/dashboard/PaykeyVerificationDisplay.tsx`
- Modify: `web/src/components/dashboard/PaykeyCard.tsx`

**Step 1: Write failing test for name match display**

```typescript
// Create: web/src/components/dashboard/__tests__/PaykeyVerificationDisplay.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NameMatchDisplay } from '../PaykeyVerificationDisplay';

describe('NameMatchDisplay', () => {
  const mockNameMatch = {
    decision: 'accept',
    correlation_score: 0.95,
    customer_name: 'John Smith',
    matched_name: 'John A Smith',
    names_on_account: ['John A Smith', 'Jane Smith'],
    codes: ['I001'],
    reason: null
  };

  it('should display correlation score with correct bucket', () => {
    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockNameMatch}
        customerName="John Smith"
        showInfoMode={false}
      />
    );

    expect(getByText('Name Correlation')).toBeInTheDocument();
    expect(getByText('HIGH')).toBeInTheDocument();
    expect(getByText('(0.95)')).toBeInTheDocument();
  });

  it('should display customer and matched names', () => {
    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockNameMatch}
        customerName="John Smith"
        showInfoMode={false}
      />
    );

    expect(getByText('Customer Name')).toBeInTheDocument();
    expect(getByText('John Smith')).toBeInTheDocument();
    expect(getByText('Matched Name')).toBeInTheDocument();
    expect(getByText('John A Smith')).toBeInTheDocument();
  });

  it('should display decision as PASS/REVIEW/FAIL', () => {
    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockNameMatch}
        customerName="John Smith"
        showInfoMode={false}
      />
    );

    expect(getByText('Decision')).toBeInTheDocument();
    expect(getByText('PASS')).toBeInTheDocument();
  });

  it('should show all names on account in INFO mode', () => {
    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockNameMatch}
        customerName="John Smith"
        showInfoMode={true}
      />
    );

    expect(getByText('All Names on Account')).toBeInTheDocument();
    expect(getByText('• John A Smith')).toBeInTheDocument();
    expect(getByText('• Jane Smith')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test PaykeyVerificationDisplay.test.tsx`
Expected: FAIL - component doesn't exist

**Step 3: Create NameMatchDisplay component**

```typescript
// Create: web/src/components/dashboard/PaykeyVerificationDisplay.tsx
import React from 'react';
import { getCorrelationBucket, getDecisionLabel, getDecisionColor } from './PaykeyCard.helpers';

interface NameMatchDisplayProps {
  nameMatch: any;
  customerName?: string;
  showInfoMode: boolean;
}

export const NameMatchDisplay: React.FC<NameMatchDisplayProps> = ({
  nameMatch,
  customerName,
  showInfoMode
}) => {
  if (!nameMatch) return null;

  const correlationBucket = getCorrelationBucket(nameMatch.correlation_score);
  const correlationColor = {
    'EXACT': 'text-primary',
    'HIGH': 'text-secondary',
    'MEDIUM': 'text-gold',
    'LOW': 'text-accent',
    'UNKNOWN': 'text-neutral-400'
  }[correlationBucket];

  if (!showInfoMode) {
    return (
      <>
        {/* Correlation Score */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-body">Name Correlation</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-pixel ${correlationColor}`}>
              {correlationBucket}
            </span>
            {nameMatch.correlation_score !== null && nameMatch.correlation_score !== undefined && (
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
              {nameMatch.customer_name || customerName || 'Unknown'}
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
          nameMatch.names_on_account.map((name: string, idx: number) => (
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

**Step 4: Run test to verify it passes**

Run: `cd web && npm test PaykeyVerificationDisplay.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/dashboard/__tests__/PaykeyVerificationDisplay.test.tsx
git add web/src/components/dashboard/PaykeyVerificationDisplay.tsx
git commit -m "feat: create NameMatchDisplay component with TDD"
```

---

## Task 8: Create Account Validation Display Component

**Files:**

- Modify: `web/src/components/dashboard/PaykeyVerificationDisplay.tsx`

**Step 1: Write failing test for account validation display**

```typescript
// Add to web/src/components/dashboard/__tests__/PaykeyVerificationDisplay.test.tsx
describe('AccountValidationDisplay', () => {
  const mockAccountVal = {
    decision: 'review',
    reason: 'Account requires manual review',
    codes: ['R001', 'R002', 'I001'],
  };

  const mockMessages = {
    'R001': 'High risk indicator',
    'R002': 'Velocity check failed',
    'I001': 'Additional verification available'
  };

  it('should display validation decision and reason', () => {
    const { getByText } = render(
      <AccountValidationDisplay
        accountValidation={mockAccountVal}
        messages={mockMessages}
        showInfoMode={false}
      />
    );

    expect(getByText('Account Validation')).toBeInTheDocument();
    expect(getByText('REVIEW')).toBeInTheDocument();
    expect(getByText('Reason')).toBeInTheDocument();
    expect(getByText('Account requires manual review')).toBeInTheDocument();
  });

  it('should display R-codes in default mode', () => {
    const { getByText, queryByText } = render(
      <AccountValidationDisplay
        accountValidation={mockAccountVal}
        messages={mockMessages}
        showInfoMode={false}
      />
    );

    expect(getByText('R001')).toBeInTheDocument();
    expect(getByText('High risk indicator')).toBeInTheDocument();
    expect(getByText('R002')).toBeInTheDocument();
    expect(getByText('Velocity check failed')).toBeInTheDocument();

    // Should not show I-codes in default mode
    expect(queryByText('I001')).not.toBeInTheDocument();
  });

  it('should display I-codes in INFO mode', () => {
    const { getByText, queryByText } = render(
      <AccountValidationDisplay
        accountValidation={mockAccountVal}
        messages={mockMessages}
        showInfoMode={true}
      />
    );

    expect(getByText('Information Codes')).toBeInTheDocument();
    expect(getByText('I001')).toBeInTheDocument();
    expect(getByText('Additional verification available')).toBeInTheDocument();

    // Should not show R-codes in INFO mode
    expect(queryByText('R001')).not.toBeInTheDocument();
    expect(queryByText('R002')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test PaykeyVerificationDisplay.test.tsx`
Expected: FAIL - AccountValidationDisplay not implemented

**Step 3: Add AccountValidationDisplay component**

```typescript
// Add to web/src/components/dashboard/PaykeyVerificationDisplay.tsx

interface AccountValidationDisplayProps {
  accountValidation: any;
  messages?: Record<string, string>;
  showInfoMode: boolean;
}

export const AccountValidationDisplay: React.FC<AccountValidationDisplayProps> = ({
  accountValidation: accountVal,
  messages,
  showInfoMode
}) => {
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
        {accountVal.codes?.filter((code: string) => code.startsWith('R')).map((code: string) => (
          <div key={code} className="flex gap-2">
            <span className="text-xs text-accent font-mono flex-shrink-0">{code}</span>
            <span className="text-xs text-neutral-400 font-body">
              {messages?.[code] || 'Validation signal'}
            </span>
          </div>
        ))}

        {accountVal.codes?.filter((code: string) => code.startsWith('R')).length === 0 && (
          <p className="text-xs text-neutral-500 font-body pl-2">No risk signals</p>
        )}
      </>
    );
  } else {
    // INFO mode - show I-codes (information codes)
    return (
      <>
        <p className="text-xs text-neutral-500 font-body">Information Codes</p>
        {accountVal.codes?.filter((code: string) => !code.startsWith('R')).map((code: string) => (
          <div key={code} className="flex gap-2">
            <span className="text-xs text-primary font-mono flex-shrink-0">{code}</span>
            <span className="text-xs text-neutral-400 font-body">
              {messages?.[code] || 'Information signal'}
            </span>
          </div>
        ))}
        {accountVal.codes?.filter((code: string) => !code.startsWith('R')).length === 0 && (
          <p className="text-xs text-neutral-500 font-body pl-2">No information codes</p>
        )}
      </>
    );
  }
};
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test PaykeyVerificationDisplay.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/dashboard/PaykeyVerificationDisplay.tsx
git add web/src/components/dashboard/__tests__/PaykeyVerificationDisplay.test.tsx
git commit -m "feat: add AccountValidationDisplay component with R/I code toggling"
```

---

## Task 9: Wire Verification Components into PaykeyCard

**Files:**

- Modify: `web/src/components/dashboard/PaykeyCard.tsx`

**Step 1: Write integration test**

```typescript
// Create: web/src/components/dashboard/__tests__/PaykeyCard.integration.test.tsx
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PaykeyCard } from '../PaykeyCard';
import { useDemoStore } from '@/lib/state';

vi.mock('@/lib/state');

describe('PaykeyCard Integration', () => {
  it('should display name match verification for plaid paykey', () => {
    const mockPaykey = {
      id: 'pk_123',
      status: 'active',
      source: 'plaid',
      institution_name: 'Chase Bank',
      review: {
        verification_details: {
          breakdown: {
            name_match: {
              decision: 'accept',
              correlation_score: 0.95,
              customer_name: 'John Smith',
              matched_name: 'John A Smith'
            }
          }
        }
      }
    };

    (useDemoStore as any).mockReturnValue({
      paykey: mockPaykey,
      customer: { name: 'John Smith' }
    });

    const { getByText } = render(<PaykeyCard />);

    // Click SHOW to expand
    fireEvent.click(getByText('SHOW'));

    // Should display name match content
    expect(getByText('Name Correlation')).toBeInTheDocument();
    expect(getByText('HIGH')).toBeInTheDocument();
    expect(getByText('Customer Name')).toBeInTheDocument();
    expect(getByText('Matched Name')).toBeInTheDocument();
  });

  it('should display account validation for bank_account paykey', () => {
    const mockPaykey = {
      id: 'pk_456',
      status: 'review',
      source: 'bank_account',
      institution_name: 'Wells Fargo',
      review: {
        verification_details: {
          breakdown: {
            account_validation: {
              decision: 'review',
              reason: 'Manual review required',
              codes: ['R001']
            }
          },
          messages: {
            'R001': 'Risk indicator detected'
          }
        }
      }
    };

    (useDemoStore as any).mockReturnValue({
      paykey: mockPaykey,
      customer: null
    });

    const { getByText } = render(<PaykeyCard />);

    // Should show pulsing REVIEW button
    const reviewButton = getByText('REVIEW');
    expect(reviewButton.className).toContain('animate-pulse');

    // Click SHOW to expand
    fireEvent.click(getByText('SHOW'));

    // Should display account validation content
    expect(getByText('Account Validation')).toBeInTheDocument();
    expect(getByText('Manual review required')).toBeInTheDocument();
    expect(getByText('R001')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test PaykeyCard.integration.test.tsx`
Expected: FAIL - components not wired

**Step 3: Import and wire verification components**

```typescript
// Add imports at top of web/src/components/dashboard/PaykeyCard.tsx
import { NameMatchDisplay, AccountValidationDisplay } from './PaykeyVerificationDisplay';

// Then in the verification section (inside showVerification && block), replace the comment with:
{showVerification && (
  <div className="space-y-2">
    {paykey.source === 'bank_account' ? (
      <AccountValidationDisplay
        accountValidation={paykey.review?.verification_details?.breakdown?.account_validation}
        messages={paykey.review?.verification_details?.messages}
        showInfoMode={showInfoMode}
      />
    ) : (
      <NameMatchDisplay
        nameMatch={paykey.review?.verification_details?.breakdown?.name_match}
        customerName={customer?.name}
        showInfoMode={showInfoMode}
      />
    )}
  </div>
)}
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test PaykeyCard.integration.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/dashboard/PaykeyCard.tsx
git add web/src/components/dashboard/__tests__/PaykeyCard.integration.test.tsx
git commit -m "feat: integrate verification display components into PaykeyCard"
```

---

## Task 10: Manual Testing and Verification

**Files:**

- None (manual testing task)

**Step 1: Start the development server**

Run: `npm run dev`
Expected: Server starts on port 3001, web on port 5173

**Step 2: Test bank account validation flow**

Open browser to http://localhost:5173
Type in terminal:

```
/reset
/create-customer --outcome verified
/create-paykey bank --outcome review
```

Verify:

- API logs show GET /api/paykeys/:id/review call
- PaykeyCard shows pulsing REVIEW button
- Click SHOW → see Account Validation section
- Click INFO → toggle between R-codes and I-codes

**Step 3: Test name match flow**

Type in terminal:

```
/reset
/create-customer --outcome verified
/create-paykey plaid --outcome active
```

Verify:

- API logs show GET /api/paykeys/:id/review call
- PaykeyCard shows normal ACTIVE badge
- Click SHOW → see Name Correlation with HIGH/MEDIUM/LOW
- Click INFO → see all names on account

**Step 4: Test edge cases**

```
/reset
/create-paykey bank --outcome rejected
```

Verify:

- Shows FAIL decision in verification details
- Proper color coding (red for reject)

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete paykey review UI implementation with verification details

- Added helper functions with correlation score buckets
- Implemented SHOW/HIDE/INFO pattern matching CustomerCard
- Created NameMatchDisplay for plaid/quiltt/straddle paykeys
- Created AccountValidationDisplay for bank_account paykeys
- Added pulsing review button for review status
- All review API calls appear in terminal logs
- Full TDD approach with comprehensive test coverage"
```

---

## Summary

This plan implements the paykey review UI feature in 10 bite-sized tasks:

1. **Helper functions** - Correlation buckets, decision mapping (TDD)
2. **Verification logic** - hasVerificationData tests and implementation
3. **API integration** - Fetch review data after paykey creation
4. **State management** - Add hooks for show/hide/info states
5. **Review button** - Pulsing button for review status
6. **Section replacement** - Replace ownership signals with verification
7. **Name match display** - Component for WALDO correlation
8. **Account validation** - Component for R-codes/I-codes
9. **Integration** - Wire components together
10. **Manual testing** - Verify all flows work correctly

Each task follows TDD with failing test → implementation → passing test → commit.

**Execution:** Ready for @superpowers:subagent-driven-development or @superpowers:executing-plans skill.
