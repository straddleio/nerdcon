# KYC Customer Request Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a dedicated `/customer-KYC` terminal command and enhanced UI to display KYC validation data (compliance_profile, address, watchlist matches) for customer "Jane Doe" test scenario.

**Architecture:** Leverage existing customer creation flow which already captures KYC review data from Straddle SDK. Add new terminal command with pre-populated KYC fields, create dedicated KYCValidationCard component for detailed validation display, and enhance CustomerCard to show address watchlist matches prominently.

**Tech Stack:** TypeScript, Express.js, React, Zustand, Server-Sent Events, Straddle SDK, Tailwind CSS

---

## Task 1: Create `/customer-KYC` Terminal Command

**Files:**
- Modify: `/home/keith/nerdcon/web/src/lib/commands.ts`

**Step 1: Add KYC customer creation command**

Add this command handler after the existing `/create-customer` command (around line 120):

```typescript
{
  command: '/customer-KYC',
  description: 'Create a KYC test customer (Jane Doe) with compliance profile and address',
  syntax: '/customer-KYC',
  handler: async (args: string[], state: AppState) => {
    // Pre-populated KYC test data
    const customerData = {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+12025551234',
      address: {
        address1: '1600 Pennsylvania Avenue NW',
        city: 'Washington',
        state: 'DC',
        zip: '20500'
      },
      compliance_profile: {
        ssn: '123-45-6789',
        dob: '1990-01-15'
      }
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        const error = await response.json();
        return `❌ Failed to create KYC customer: ${error.message || response.statusText}`;
      }

      const customer = await response.json();

      return [
        `✅ KYC Customer Created`,
        `ID: ${customer.id}`,
        `Name: ${customer.first_name} ${customer.last_name}`,
        `Address: ${customer.address.address1}, ${customer.address.city}, ${customer.address.state} ${customer.address.zip}`,
        `SSN: ***-**-${customer.compliance_profile?.ssn?.slice(-4) || '****'}`,
        `DOB: ${customer.compliance_profile?.dob || 'N/A'}`,
        customer.review ? `\n📋 KYC Decision: ${customer.review.kyc?.decision || 'PENDING'}` : '',
        customer.review?.address_watchlist?.matches?.length
          ? `🚨 Address Watchlist Matches: ${customer.review.address_watchlist.matches.length}`
          : '✅ No Address Watchlist Matches'
      ].filter(Boolean).join('\n');
    } catch (error) {
      return `❌ Error creating KYC customer: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
```

**Step 2: Update help command to include new command**

Modify the `/help` command handler (around line 330) to include the new command in the list.

**Step 3: Test the command**

1. Start the dev server: `npm run dev`
2. Open the web interface
3. Run `/customer-KYC` in the terminal
4. Expected: Customer "Jane Doe" created with full compliance profile and address
5. Expected: Terminal shows KYC decision and any watchlist matches

**Step 4: Commit**

```bash
git add web/src/lib/commands.ts
git commit -m "feat: add /customer-KYC terminal command for testing KYC validation flow"
```

---

## Task 2: Create KYCValidationCard Component

**Files:**
- Create: `/home/keith/nerdcon/web/src/components/dashboard/KYCValidationCard.tsx`

**Step 1: Write the KYC validation card component**

Create a new component that displays detailed KYC validation data:

```typescript
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { DemoCustomer } from '../../../../server/src/domain/types';

interface KYCValidationCardProps {
  customer: DemoCustomer;
}

export const KYCValidationCard: React.FC<KYCValidationCardProps> = ({ customer }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const kyc = customer.review?.kyc;

  if (!kyc) {
    return null;
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'ACCEPT':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'REJECT':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'REVIEW':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ACCEPT':
        return 'bg-green-50 border-green-200';
      case 'REJECT':
        return 'bg-red-50 border-red-200';
      case 'REVIEW':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const validationFields = [
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip', label: 'ZIP Code' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'ssn', label: 'SSN' }
  ];

  const validatedFields = validationFields.filter(field =>
    kyc.validations?.includes(field.key as any)
  );

  const failedFields = validationFields.filter(field =>
    !kyc.validations?.includes(field.key as any)
  );

  return (
    <div className={`border rounded-lg p-4 ${getDecisionColor(kyc.decision)}`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {getDecisionIcon(kyc.decision)}
          <div>
            <h3 className="font-semibold text-lg">KYC Validation</h3>
            <p className="text-sm text-gray-600">
              Decision: <span className="font-medium">{kyc.decision}</span>
              {kyc.correlation && <span className="ml-2 text-xs">({kyc.correlation})</span>}
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Validated Fields */}
          {validatedFields.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                ✅ Validated Fields ({validatedFields.length}/{validationFields.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {validatedFields.map(field => (
                  <div key={field.key} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{field.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed/Missing Fields */}
          {failedFields.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                ❌ Not Validated ({failedFields.length}/{validationFields.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {failedFields.map(field => (
                  <div key={field.key} className="flex items-center gap-2 text-sm text-gray-500">
                    <XCircle className="w-4 h-4 text-gray-400" />
                    <span>{field.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Codes */}
          {kyc.risk_codes && kyc.risk_codes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                ⚠️ Risk Codes
              </h4>
              <div className="flex flex-wrap gap-2">
                {kyc.risk_codes.map((code, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

**Step 2: Test the component imports**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add web/src/components/dashboard/KYCValidationCard.tsx
git commit -m "feat: create KYCValidationCard component for detailed KYC display"
```

---

## Task 3: Create AddressWatchlistCard Component

**Files:**
- Create: `/home/keith/nerdcon/web/src/components/dashboard/AddressWatchlistCard.tsx`

**Step 1: Write the address watchlist card component**

```typescript
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { DemoCustomer } from '../../../../server/src/domain/types';

interface AddressWatchlistCardProps {
  customer: DemoCustomer;
}

export const AddressWatchlistCard: React.FC<AddressWatchlistCardProps> = ({ customer }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const addressWatchlist = customer.review?.address_watchlist;

  if (!addressWatchlist) {
    return null;
  }

  const hasMatches = addressWatchlist.matches && addressWatchlist.matches.length > 0;

  return (
    <div className={`border rounded-lg p-4 ${hasMatches ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {hasMatches ? (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          <div>
            <h3 className="font-semibold text-lg">Address Watchlist</h3>
            <p className="text-sm text-gray-600">
              {hasMatches
                ? `${addressWatchlist.matches.length} match${addressWatchlist.matches.length > 1 ? 'es' : ''} found`
                : 'No matches found'
              }
              {addressWatchlist.correlation && (
                <span className="ml-2 text-xs">({addressWatchlist.correlation})</span>
              )}
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>

      {isExpanded && hasMatches && (
        <div className="mt-4 space-y-3">
          {addressWatchlist.matches.map((match, idx) => (
            <div key={idx} className="border border-yellow-300 rounded-lg p-3 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">{match.list_name}</span>
                    {match.correlation && (
                      <span className="text-xs text-gray-500">({match.correlation})</span>
                    )}
                  </div>

                  {match.matched_fields && match.matched_fields.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Matched Fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {match.matched_fields.map((field, fieldIdx) => (
                          <span
                            key={fieldIdx}
                            className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isExpanded && !hasMatches && (
        <div className="mt-4 text-sm text-gray-600">
          <p>✅ Customer address not found on any watchlists</p>
        </div>
      )}
    </div>
  );
};
```

**Step 2: Test the component imports**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add web/src/components/dashboard/AddressWatchlistCard.tsx
git commit -m "feat: create AddressWatchlistCard component for watchlist match display"
```

---

## Task 4: Integrate New Cards into CustomerCard

**Files:**
- Modify: `/home/keith/nerdcon/web/src/components/dashboard/CustomerCard.tsx`

**Step 1: Add imports at top of file**

After existing imports (around line 3), add:

```typescript
import { KYCValidationCard } from './KYCValidationCard';
import { AddressWatchlistCard } from './AddressWatchlistCard';
```

**Step 2: Replace existing KYC section**

Find the existing KYC section (lines 341-369) and replace with:

```typescript
{/* KYC Validation - New Component */}
{customer.review?.kyc && (
  <KYCValidationCard customer={customer} />
)}

{/* Address Watchlist - New Component */}
{customer.review?.address_watchlist && (
  <AddressWatchlistCard customer={customer} />
)}
```

**Step 3: Test the integration**

1. Run: `npm run dev`
2. Create a KYC customer: `/customer-KYC`
3. Expected: New cards display with proper formatting
4. Expected: Expandable/collapsible sections work
5. Expected: Validation checkmarks and watchlist matches show correctly

**Step 4: Commit**

```bash
git add web/src/components/dashboard/CustomerCard.tsx
git commit -m "feat: integrate KYC and AddressWatchlist cards into CustomerCard"
```

---

## Task 5: Add Enhanced Address Display in CustomerCard

**Files:**
- Modify: `/home/keith/nerdcon/web/src/components/dashboard/CustomerCard.tsx`

**Step 1: Enhance the address display section**

Find the basic info section (around lines 200-262) and update the address display:

```typescript
{/* Address - Enhanced */}
{customer.address && (
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-gray-400" />
      <span className="font-medium text-sm">Address</span>
    </div>
    <div className="text-sm text-gray-600 ml-6">
      <p>{customer.address.address1}</p>
      {customer.address.address2 && <p>{customer.address.address2}</p>}
      <p>{customer.address.city}, {customer.address.state} {customer.address.zip}</p>
    </div>
  </div>
)}
```

**Step 2: Add MapPin import**

Add to existing lucide-react imports at top of file:

```typescript
import { ChevronDown, ChevronUp, Mail, Phone, CheckCircle2, XCircle, AlertTriangle, MapPin } from 'lucide-react';
```

**Step 3: Test the enhanced address display**

1. Run: `npm run dev`
2. Create customer: `/customer-KYC`
3. Expected: Full address displays with proper formatting
4. Expected: Multi-line address shows correctly

**Step 4: Commit**

```bash
git add web/src/components/dashboard/CustomerCard.tsx
git commit -m "feat: enhance address display in CustomerCard with full multi-line formatting"
```

---

## Task 6: Add Compliance Profile Display Enhancement

**Files:**
- Modify: `/home/keith/nerdcon/web/src/components/dashboard/CustomerCard.tsx`

**Step 1: Enhance compliance profile section**

Find the compliance info section (around lines 264-290) and enhance:

```typescript
{/* Compliance Profile - Enhanced */}
{customer.compliance_profile && (
  <div className="border-t pt-4 space-y-3">
    <h4 className="font-semibold text-sm text-gray-700">Compliance Information</h4>

    {customer.compliance_profile.ssn && (
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-gray-400" />
        <span className="text-sm">
          SSN: <span className="font-mono">***-**-{customer.compliance_profile.ssn.slice(-4)}</span>
        </span>
      </div>
    )}

    {customer.compliance_profile.dob && (
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm">
          DOB: <span className="font-mono">{customer.compliance_profile.dob}</span>
        </span>
      </div>
    )}
  </div>
)}
```

**Step 2: Add Shield and Calendar imports**

Add to existing lucide-react imports:

```typescript
import { ChevronDown, ChevronUp, Mail, Phone, CheckCircle2, XCircle, AlertTriangle, MapPin, Shield, Calendar } from 'lucide-react';
```

**Step 3: Test compliance profile display**

1. Run: `npm run dev`
2. Create customer: `/customer-KYC`
3. Expected: Masked SSN shows last 4 digits
4. Expected: DOB displays in proper format
5. Expected: Icons display correctly

**Step 4: Commit**

```bash
git add web/src/components/dashboard/CustomerCard.tsx
git commit -m "feat: enhance compliance profile display with icons and formatting"
```

---

## Task 7: Create Manual Test Documentation

**Files:**
- Create: `/home/keith/nerdcon/docs/MANUAL_TEST_KYC_CUSTOMER.md`

**Step 1: Write manual test documentation**

```markdown
# Manual Test Report: KYC Customer Request Feature

**Date:** 2025-11-15
**Tester:** [Your Name]
**Feature:** `/customer-KYC` terminal command and enhanced KYC display

---

## Test Scenario 1: Create KYC Customer via Terminal

**Steps:**
1. Start the application: `npm run dev`
2. Open web interface at http://localhost:5173
3. Run `/customer-KYC` in terminal

**Expected Results:**
- ✅ Customer "Jane Doe" created successfully
- ✅ Terminal shows:
  - Customer ID
  - Full name
  - Full address (1600 Pennsylvania Avenue NW, Washington, DC 20500)
  - Masked SSN (last 4 digits)
  - DOB
  - KYC decision status
  - Address watchlist match count

**Actual Results:**
[To be filled during testing]

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 2: KYCValidationCard Display

**Steps:**
1. After creating KYC customer, view customer card in dashboard
2. Locate KYCValidationCard section
3. Verify all validation fields display

**Expected Results:**
- ✅ Card shows decision (ACCEPT/REJECT/REVIEW) with appropriate icon and color
- ✅ Validated fields section shows checkmarks for passed validations
- ✅ Not validated fields section shows fields that failed/missing
- ✅ Risk codes display if present
- ✅ Card is expandable/collapsible

**Actual Results:**
[To be filled during testing]

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 3: AddressWatchlistCard Display

**Steps:**
1. View customer card for Jane Doe
2. Locate AddressWatchlistCard section
3. Verify watchlist matches display correctly

**Expected Results:**
- ✅ Card shows match count or "No matches found"
- ✅ If matches exist:
  - List name displays
  - Matched fields show as tags
  - Correlation ID shows
- ✅ Card color indicates status (yellow for matches, green for no matches)
- ✅ Card is expandable/collapsible

**Actual Results:**
[To be filled during testing]

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 4: Enhanced Address Display

**Steps:**
1. View customer card for Jane Doe
2. Locate address section in basic info

**Expected Results:**
- ✅ Address line 1: "1600 Pennsylvania Avenue NW"
- ✅ City, State, ZIP: "Washington, DC 20500"
- ✅ Address2 line displays if present
- ✅ MapPin icon displays
- ✅ Proper spacing and formatting

**Actual Results:**
[To be filled during testing]

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 5: Enhanced Compliance Profile Display

**Steps:**
1. View customer card for Jane Doe
2. Locate compliance information section

**Expected Results:**
- ✅ SSN displays as "***-**-6789" (last 4 digits)
- ✅ DOB displays as "1990-01-15"
- ✅ Shield icon for SSN
- ✅ Calendar icon for DOB
- ✅ Proper monospace font for sensitive data

**Actual Results:**
[To be filled during testing]

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 6: Real-time Updates via SSE

**Steps:**
1. Create KYC customer via terminal
2. Observe dashboard updates in real-time
3. Check browser console for SSE events

**Expected Results:**
- ✅ Customer appears in dashboard immediately after creation
- ✅ No page refresh required
- ✅ All review data populated on first render
- ✅ SSE connection active (check DevTools Network tab)

**Actual Results:**
[To be filled during testing]

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 7: Error Handling

**Steps:**
1. Modify `/customer-KYC` command to send invalid data
2. Observe error handling

**Expected Results:**
- ✅ Terminal shows error message
- ✅ Error message is descriptive
- ✅ Application doesn't crash
- ✅ User can retry command

**Actual Results:**
[To be filled during testing]

**Status:** ⬜ Pass / ⬜ Fail

---

## Summary

**Total Tests:** 7
**Passed:** [X]
**Failed:** [X]
**Pass Rate:** [X%]

**Overall Status:** ⬜ Pass / ⬜ Fail

**Notes:**
[Add any additional observations, edge cases discovered, or suggestions for improvement]
```

**Step 2: Review documentation**

Read through to ensure all scenarios are covered.

**Step 3: Commit**

```bash
git add docs/MANUAL_TEST_KYC_CUSTOMER.md
git commit -m "docs: add manual test documentation for KYC customer feature"
```

---

## Task 8: Update CLAUDE.md Documentation

**Files:**
- Modify: `/home/keith/nerdcon/docs/CLAUDE.md`

**Step 1: Add KYC feature documentation**

Add a new section after the existing customer creation section (around line 120):

```markdown
### KYC Customer Request Feature

**Terminal Command:**
```
/customer-KYC
```

Creates a test customer with full compliance profile and address data to demonstrate KYC validation flow.

**Pre-populated Data:**
- Name: Jane Doe
- Email: jane.doe@example.com
- Phone: +12025551234
- Address: 1600 Pennsylvania Avenue NW, Washington, DC 20500
- SSN: 123-45-6789
- DOB: 1990-01-15

**KYC Review Data:**
The command creates a customer and immediately fetches review data including:
- KYC validation results (field-by-field validation)
- Address watchlist matches
- Risk codes and correlation IDs

**Display Components:**

1. **KYCValidationCard** (`web/src/components/dashboard/KYCValidationCard.tsx`)
   - Shows KYC decision (ACCEPT/REJECT/REVIEW) with color-coded background
   - Lists validated fields with checkmarks
   - Shows fields that failed validation
   - Displays risk codes if present
   - Expandable/collapsible interface

2. **AddressWatchlistCard** (`web/src/components/dashboard/AddressWatchlistCard.tsx`)
   - Shows count of watchlist matches
   - Lists match details (list name, matched fields, correlation)
   - Color-coded (yellow for matches, green for clear)
   - Expandable/collapsible interface

3. **Enhanced CustomerCard** (`web/src/components/dashboard/CustomerCard.tsx`)
   - Full multi-line address display with MapPin icon
   - Enhanced compliance profile with Shield and Calendar icons
   - Masked SSN (shows last 4 digits)
   - Formatted DOB display
```

**Step 2: Update command reference table**

Find the command reference table and add:

```markdown
| `/customer-KYC` | Create KYC test customer (Jane Doe) | None | Creates customer with compliance_profile and address |
```

**Step 3: Commit**

```bash
git add docs/CLAUDE.md
git commit -m "docs: document KYC customer request feature and components"
```

---

## Task 9: Update CHANGELOG.md

**Files:**
- Modify: `/home/keith/nerdcon/docs/CHANGELOG.md` (or create if doesn't exist)

**Step 1: Add changelog entry**

Add at the top of the file:

```markdown
# Changelog

## [Unreleased] - 2025-11-15

### Added
- **KYC Customer Request Feature**
  - New `/customer-KYC` terminal command for testing KYC validation flow
  - `KYCValidationCard` component for detailed KYC validation display
  - `AddressWatchlistCard` component for address watchlist match display
  - Enhanced address display with full multi-line formatting
  - Enhanced compliance profile display with icons and masked data
  - Manual test documentation (`docs/MANUAL_TEST_KYC_CUSTOMER.md`)

### Changed
- Updated `CustomerCard` to use new KYC and AddressWatchlist card components
- Enhanced address and compliance profile sections with better visual formatting

### Technical Details
- Pre-populates test customer "Jane Doe" with:
  - Full address (1600 Pennsylvania Avenue NW, Washington, DC 20500)
  - Compliance profile (SSN: 123-45-6789, DOB: 1990-01-15)
  - Email and phone
- Automatically fetches and displays KYC review data
- Color-coded decision indicators (green/yellow/red for ACCEPT/REVIEW/REJECT)
- Real-time updates via SSE
```

**Step 2: Commit**

```bash
git add docs/CHANGELOG.md
git commit -m "docs: add changelog entry for KYC customer request feature"
```

---

## Task 10: Create Integration Test Script

**Files:**
- Create: `/home/keith/nerdcon/test-kyc-integration.sh`

**Step 1: Write integration test script**

```bash
#!/bin/bash

# KYC Integration Test Script
# Tests the full flow of creating a KYC customer and verifying data

set -e  # Exit on error

echo "🧪 Starting KYC Integration Test..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
CUSTOMER_DATA='{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@example.com",
  "phone": "+12025551234",
  "address": {
    "address1": "1600 Pennsylvania Avenue NW",
    "city": "Washington",
    "state": "DC",
    "zip": "20500"
  },
  "compliance_profile": {
    "ssn": "123-45-6789",
    "dob": "1990-01-15"
  }
}'

echo -e "${YELLOW}Test 1: Create KYC Customer${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/customers" \
  -H "Content-Type: application/json" \
  -d "$CUSTOMER_DATA")

# Extract customer ID
CUSTOMER_ID=$(echo "$RESPONSE" | jq -r '.id')

if [ "$CUSTOMER_ID" != "null" ] && [ -n "$CUSTOMER_ID" ]; then
  echo -e "${GREEN}✅ Customer created with ID: $CUSTOMER_ID${NC}"
else
  echo -e "${RED}❌ Failed to create customer${NC}"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

# Verify customer data
echo -e "\n${YELLOW}Test 2: Verify Customer Data${NC}"

FIRST_NAME=$(echo "$RESPONSE" | jq -r '.first_name')
LAST_NAME=$(echo "$RESPONSE" | jq -r '.last_name')
ADDRESS1=$(echo "$RESPONSE" | jq -r '.address.address1')
SSN=$(echo "$RESPONSE" | jq -r '.compliance_profile.ssn')
DOB=$(echo "$RESPONSE" | jq -r '.compliance_profile.dob')

if [ "$FIRST_NAME" = "Jane" ] && [ "$LAST_NAME" = "Doe" ]; then
  echo -e "${GREEN}✅ Name verified: $FIRST_NAME $LAST_NAME${NC}"
else
  echo -e "${RED}❌ Name mismatch${NC}"
  exit 1
fi

if [ "$ADDRESS1" = "1600 Pennsylvania Avenue NW" ]; then
  echo -e "${GREEN}✅ Address verified${NC}"
else
  echo -e "${RED}❌ Address mismatch${NC}"
  exit 1
fi

# Verify review data
echo -e "\n${YELLOW}Test 3: Verify KYC Review Data${NC}"

KYC_DECISION=$(echo "$RESPONSE" | jq -r '.review.kyc.decision')
if [ "$KYC_DECISION" != "null" ] && [ -n "$KYC_DECISION" ]; then
  echo -e "${GREEN}✅ KYC decision received: $KYC_DECISION${NC}"
else
  echo -e "${YELLOW}⚠️  No KYC decision (may be pending)${NC}"
fi

# Check for watchlist data
WATCHLIST_MATCHES=$(echo "$RESPONSE" | jq -r '.review.address_watchlist.matches | length')
if [ "$WATCHLIST_MATCHES" != "null" ]; then
  echo -e "${GREEN}✅ Address watchlist data received: $WATCHLIST_MATCHES match(es)${NC}"
else
  echo -e "${YELLOW}⚠️  No address watchlist data${NC}"
fi

# Test GET endpoint
echo -e "\n${YELLOW}Test 4: Fetch Customer Review${NC}"
REVIEW_RESPONSE=$(curl -s "$API_URL/api/customers/$CUSTOMER_ID/review")

REVIEW_KYC=$(echo "$REVIEW_RESPONSE" | jq -r '.kyc.decision')
if [ "$REVIEW_KYC" != "null" ] && [ -n "$REVIEW_KYC" ]; then
  echo -e "${GREEN}✅ Review endpoint returns KYC data: $REVIEW_KYC${NC}"
else
  echo -e "${RED}❌ Review endpoint missing KYC data${NC}"
  exit 1
fi

echo -e "\n${GREEN}🎉 All tests passed!${NC}"
echo -e "\nCustomer Details:"
echo "$RESPONSE" | jq '{
  id: .id,
  name: "\(.first_name) \(.last_name)",
  address: .address,
  compliance: .compliance_profile,
  kyc_decision: .review.kyc.decision,
  watchlist_matches: (.review.address_watchlist.matches | length)
}'
```

**Step 2: Make script executable**

```bash
chmod +x /home/keith/nerdcon/test-kyc-integration.sh
```

**Step 3: Test the script**

```bash
# Start the server first
npm run dev

# In another terminal:
./test-kyc-integration.sh
```

Expected: All 4 tests pass

**Step 4: Commit**

```bash
git add test-kyc-integration.sh
git commit -m "test: add integration test script for KYC customer flow"
```

---

## Task 11: Add TypeScript Type Safety Improvements

**Files:**
- Modify: `/home/keith/nerdcon/server/src/domain/types.ts`

**Step 1: Add strict validation types**

Add after the existing DemoCustomer interface (around line 109):

```typescript
/**
 * Request payload for creating a KYC customer
 */
export interface KYCCustomerRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
  };
  compliance_profile: {
    ssn: string;
    dob: string;  // Format: YYYY-MM-DD
  };
}

/**
 * Validation result for KYC request
 */
export interface KYCValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Helper to validate KYC customer request
 */
export function validateKYCCustomerRequest(data: any): KYCValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Required fields
  if (!data.first_name || typeof data.first_name !== 'string') {
    errors.push({ field: 'first_name', message: 'First name is required' });
  }
  if (!data.last_name || typeof data.last_name !== 'string') {
    errors.push({ field: 'last_name', message: 'Last name is required' });
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!data.phone || !/^\+?[1-9]\d{10,14}$/.test(data.phone)) {
    errors.push({ field: 'phone', message: 'Valid phone number is required (E.164 format)' });
  }

  // Address validation
  if (!data.address) {
    errors.push({ field: 'address', message: 'Address is required' });
  } else {
    if (!data.address.address1) {
      errors.push({ field: 'address.address1', message: 'Address line 1 is required' });
    }
    if (!data.address.city) {
      errors.push({ field: 'address.city', message: 'City is required' });
    }
    if (!data.address.state || data.address.state.length !== 2) {
      errors.push({ field: 'address.state', message: 'Valid 2-letter state code is required' });
    }
    if (!data.address.zip || !/^\d{5}(-\d{4})?$/.test(data.address.zip)) {
      errors.push({ field: 'address.zip', message: 'Valid ZIP code is required' });
    }
  }

  // Compliance profile validation
  if (!data.compliance_profile) {
    errors.push({ field: 'compliance_profile', message: 'Compliance profile is required' });
  } else {
    if (!data.compliance_profile.ssn || !/^\d{3}-\d{2}-\d{4}$/.test(data.compliance_profile.ssn)) {
      errors.push({ field: 'compliance_profile.ssn', message: 'Valid SSN format required (XXX-XX-XXXX)' });
    }
    if (!data.compliance_profile.dob || !/^\d{4}-\d{2}-\d{2}$/.test(data.compliance_profile.dob)) {
      errors.push({ field: 'compliance_profile.dob', message: 'Valid DOB format required (YYYY-MM-DD)' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

**Step 2: Update customer creation endpoint to use validation**

Modify `/home/keith/nerdcon/server/src/routes/customers.ts` (around line 20):

```typescript
import { DemoCustomer, validateKYCCustomerRequest, KYCCustomerRequest } from '../domain/types';

// In the POST handler, before creating customer:
const validationResult = validateKYCCustomerRequest(req.body);
if (!validationResult.isValid) {
  logStream.addEntry({
    timestamp: new Date().toISOString(),
    level: 'error',
    message: 'KYC validation failed',
    context: { errors: validationResult.errors }
  });

  return res.status(400).json({
    error: 'Validation failed',
    details: validationResult.errors
  });
}
```

**Step 3: Run type check**

```bash
npm run type-check
```

Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add server/src/domain/types.ts server/src/routes/customers.ts
git commit -m "feat: add TypeScript validation for KYC customer requests"
```

---

## Task 12: Final Testing and Verification

**Files:**
- Various (read-only verification)

**Step 1: Run full type check**

```bash
cd /home/keith/nerdcon
npm run type-check
```

Expected: No TypeScript errors across entire codebase

**Step 2: Run integration test script**

```bash
# Make sure server is running
npm run dev

# In another terminal:
./test-kyc-integration.sh
```

Expected: All 4 tests pass

**Step 3: Manual verification checklist**

1. Start the application: `npm run dev`
2. Run `/customer-KYC` in terminal
3. Verify customer "Jane Doe" appears in dashboard
4. Check KYCValidationCard displays properly
5. Check AddressWatchlistCard displays properly
6. Verify address shows full multi-line format
7. Verify compliance profile shows masked SSN and DOB
8. Check expandable/collapsible functionality works
9. Verify real-time updates via SSE work
10. Check browser console for errors (should be none)

**Step 4: Document test results**

Fill in the manual test documentation at:
`/home/keith/nerdcon/docs/MANUAL_TEST_KYC_CUSTOMER.md`

**Step 5: Final commit (if any fixes needed)**

```bash
git add .
git commit -m "fix: address final issues found during testing"
```

**Step 6: Success verification**

Run final check:

```bash
git log --oneline -12
```

Expected: See all 12+ commits from this implementation plan

---

## Summary

This plan implements a complete KYC customer request feature with:

✅ **Terminal Command:** `/customer-KYC` creates test customer "Jane Doe"
✅ **Data Included:** Full address, compliance_profile (SSN, DOB)
✅ **KYC Display:** Dedicated card showing field-by-field validations
✅ **Watchlist Display:** Dedicated card showing address matches
✅ **Enhanced UI:** Better formatting for address and compliance data
✅ **Type Safety:** Full TypeScript validation
✅ **Testing:** Integration test script + manual test documentation
✅ **Documentation:** Updated CLAUDE.md and CHANGELOG.md

**Total Tasks:** 12
**Estimated Time:** 2-3 hours
**Tech Stack:** TypeScript, React, Express, Straddle SDK, Tailwind CSS

**Testing Strategy:**
1. Type checking with `npm run type-check`
2. Automated integration tests via bash script
3. Manual testing with documented checklist
4. Real-time SSE verification

**Deployment Ready:** After Task 12 passes, feature is production-ready
