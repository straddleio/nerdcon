# Customer Unmask Feature

## Overview

The Customer Unmask feature allows authorized users to view unmasked customer PII (Social Security Number and Date of Birth) by clicking a SHOW/HIDE toggle button in the CustomerCard component. The feature integrates with Straddle's `/v1/customers/:id/unmasked` endpoint via the `customers.unmasked()` SDK method and requires proper API key permissions.

**IMPORTANT:** This feature requires the Straddle SDK method `customers.unmasked(id)`, NOT a custom GET request. The SDK method automatically handles the `.data` wrapper in responses.

## User Flow

1. Customer is created with KYC data via `/customer-KYC` terminal command
2. CustomerCard displays masked SSN (`***-**-XXXX`) and DOB (`****-**-**`)
3. User clicks **SHOW** button in the CustomerCard's SSN/DOB section
4. Frontend calls `GET /api/customers/:id/unmask`
5. Backend calls Straddle SDK `customers.unmasked(id)` method (maps to `GET /v1/customers/:id/unmasked` endpoint)
6. Unmasked data (full SSN: `XXX-XX-XXXX`, DOB: `YYYY-MM-DD`) is displayed
7. User clicks **HIDE** to return to masked view
8. If unmask fails, error message is displayed below the SHOW button

## API Endpoints

### Backend Route: GET /api/customers/:id/unmask

Located in: `server/src/routes/customers.ts` (lines 509-585)

**Purpose:** Proxy request to Straddle's unmask endpoint and return unmasked customer data.

**Request:**

```http
GET /api/customers/cus_abc123/unmask
```

**Success Response (200):**

```json
{
  "id": "cus_abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+12125550123",
  "verification_status": "verified",
  "risk_score": 0.15,
  "compliance_profile": {
    "ssn": "123-45-6789",
    "dob": "1990-01-15"
  },
  "address": {
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  }
}
```

**Error Response (403):**

```json
{
  "error": "Permission denied: show_sensitive=true required on API key"
}
```

**Error Response (404):**

```json
{
  "error": "Customer not found"
}
```

**Error Response (500):**

```json
{
  "error": "Failed to unmask customer"
}
```

### Straddle SDK Integration

The backend uses the Straddle SDK's `customers.unmasked()` method:

```typescript
const unmaskResponse = await straddleClient.customers.unmasked(req.params.id);
```

**CRITICAL BUG FIX:** The original implementation incorrectly used `straddleClient.get('/customers/:id/unmask')` which resulted in 404 errors. The correct approach is to use the dedicated SDK method `customers.unmasked(id)`.

**Important Details:**

- **Correct Method:** `straddleClient.customers.unmasked(customerId)` ✅
- **Wrong Method:** `straddleClient.get('/customers/:id/unmask')` ❌ (results in 404)
- **Response Wrapper:** Like all standard SDK methods, this wraps the response in a `.data` object
- **Accessing Data:** Use `unmaskResponse.data` to get the unmasked customer object
- **API Endpoint:** This SDK method calls `GET /v1/customers/:id/unmasked` on the Straddle API

## Frontend Implementation

### API Client (web/src/lib/api.ts)

**Type Definition:**

```typescript
export interface UnmaskedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  verification_status?: string;
  risk_score?: number;
  compliance_profile?: {
    ssn?: string; // Unmasked: XXX-XX-XXXX
    dob?: string; // Unmasked: YYYY-MM-DD
  };
  address?: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
  };
  [key: string]: unknown;
}
```

**API Function:**

```typescript
export async function unmaskCustomer(customerId: string): Promise<UnmaskedCustomer> {
  return apiFetch<UnmaskedCustomer>(`/customers/${customerId}/unmask`);
}
```

### CustomerCard Component (web/src/components/dashboard/CustomerCard.tsx)

**State Management:**

```typescript
const [unmaskedData, setUnmaskedData] = useState<UnmaskedCustomer | null>(null);
const [isUnmasking, setIsUnmasking] = useState(false);
const [unmaskError, setUnmaskError] = useState<string | null>(null);
```

**Unmask Handler:**

```typescript
const handleUnmask = (): void => {
  void (async (): Promise<void> => {
    if (isUnmasking) return;

    // Toggle: if already unmasked, hide it
    if (unmaskedData) {
      setUnmaskedData(null);
      setUnmaskError(null);
      return;
    }

    if (!customer?.id) return;

    setIsUnmasking(true);
    try {
      setUnmaskError(null); // Clear previous errors
      const data = await unmaskCustomer(customer.id);
      setUnmaskedData(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unmask customer data';
      setUnmaskError(message);
    } finally {
      setIsUnmasking(false);
    }
  })();
};
```

**UI Display:**

```tsx
{
  customer.compliance_profile?.ssn && (
    <div className="pt-2 border-t border-primary/10 relative">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-neutral-500 font-body mb-0.5">SSN</p>
          <p className="text-xs text-neutral-100 font-body font-mono">
            {unmaskedData?.compliance_profile?.ssn || customer.compliance_profile.ssn}
          </p>
        </div>
        <div className="pr-16">
          <p className="text-xs text-neutral-500 font-body mb-0.5">Date of Birth</p>
          <p className="text-xs text-neutral-100 font-body font-mono">
            {unmaskedData?.compliance_profile?.dob || customer.compliance_profile.dob}
          </p>
        </div>
      </div>
      <button
        onClick={handleUnmask}
        disabled={isUnmasking}
        className={cn(
          'absolute top-2 right-0 px-2 py-1 text-xs font-body border rounded-pixel',
          unmaskedData
            ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
            : 'border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary',
          isUnmasking && 'opacity-50 cursor-not-allowed'
        )}
      >
        {unmaskedData ? 'HIDE' : 'SHOW'}
      </button>
      {unmaskError && <p className="text-xs text-accent font-body mt-1">{unmaskError}</p>}
    </div>
  );
}
```

## Security Considerations

### API Key Permissions

The unmask endpoint requires an API key with `show_sensitive=true` permission. Without this permission, the Straddle API returns a 403 error.

**Environment Setup:**

```env
STRADDLE_API_KEY=eyJhbGc...  # Must have show_sensitive=true
```

### Data Handling

- **Client-Side State Only:** Unmasked data is stored only in React component state (`useState`)
- **Not Persisted:** Unmasked data is never written to localStorage, sessionStorage, or any persistent store
- **Automatic Cleanup:** When customer changes (via `useEffect`), unmasked data is cleared
- **Toggle Behavior:** Clicking HIDE immediately clears unmasked data from state

### Request Logging

All unmask requests are logged to both the terminal and backend logs:

**Success Log (Terminal):**

```
> GET /api/customers/cus_abc123/unmask
< 200 OK (245ms)
```

**Success Log (Backend Stream):**

```json
{
  "timestamp": "2025-11-17T16:30:00.000Z",
  "type": "straddle-req",
  "method": "GET",
  "path": "/customers/cus_abc123/unmask",
  "requestId": "req_xyz789"
}
```

**Error Log (Backend Stream):**

```json
{
  "timestamp": "2025-11-17T16:30:00.123Z",
  "type": "straddle-res",
  "statusCode": 403,
  "responseBody": {
    "error": "Permission denied: show_sensitive=true required"
  },
  "requestId": "req_xyz789"
}
```

**Terminal API Log Panel:**

- Displays inline API request/response for unmask calls
- Shows request ID, correlation ID, duration, and status code
- Includes full request/response bodies in expandable sections

## Error Handling

### Frontend Error Display

Errors are displayed inline below the SHOW button with user-friendly messaging:

**Permission Error:**

```
Permission denied: show_sensitive=true required on API key
```

**Network Error:**

```
Failed to unmask customer data
```

**Not Found Error:**

```
Customer not found
```

### Backend Error Handling

The backend route includes comprehensive error handling:

```typescript
try {
  // ✅ CORRECT: Use the dedicated SDK method
  const unmaskResponse = await straddleClient.customers.unmasked(req.params.id);

  // Access data via unmaskResponse.data (SDK wraps response in .data object)
  const unmaskedCustomer = unmaskResponse.data;

  // ... log success and return data
} catch (error: unknown) {
  const err = toExpressError(error);
  logger.error('Error unmasking customer', err);

  const statusCode = err.status || 500;
  const errorResponse = {
    error: err.message || 'Failed to unmask customer',
  };

  // Log error to stream
  addLogEntry({
    timestamp: new Date().toISOString(),
    type: 'straddle-res',
    statusCode,
    responseBody: errorResponse,
    requestId: req.requestId,
  });

  // Log to Terminal API Log Panel
  logStraddleCall(
    req.requestId,
    req.correlationId,
    `customers/${req.params.id}/unmasked`,
    'GET',
    statusCode,
    0,
    undefined,
    errorData.error || errorResponse
  );

  res.status(statusCode).json(errorResponse);
}
```

## Implementation Details

### SDK Method Bug Fix (Critical)

**Problem:** The initial implementation used an incorrect approach to call the Straddle API:

```typescript
// ❌ WRONG: This resulted in 404 errors
const unmaskResponse = await straddleClient.get('/customers/:id/unmask');
```

**Root Cause:** The custom GET request method doesn't properly route to the Straddle API's `/v1/customers/:id/unmasked` endpoint.

**Solution:** Use the dedicated SDK method:

```typescript
// ✅ CORRECT: Use the dedicated SDK method
const unmaskResponse = await straddleClient.customers.unmasked(customerId);
```

**Why This Matters:**

- The SDK method `customers.unmasked()` is explicitly designed for this endpoint
- It automatically handles request routing to `/v1/customers/:id/unmasked`
- It properly wraps the response in the `.data` object
- It includes proper error handling and type safety

**Testing Verification:**
After the fix, the endpoint returns 200 OK with properly unmasked customer data instead of 404 errors.

### State Reset on Customer Change

When the customer ID changes (e.g., user creates a new customer), unmasked data is automatically cleared:

```typescript
useEffect(() => {
  setUnmaskedData(null);
  setUnmaskError(null);
}, [customer?.id]);
```

### SSN Display Fix

**Issue:** Originally, the frontend manually formatted SSN with dashes, but the Straddle API already provides properly formatted masked SSN (`***-**-XXXX`).

**Fix:** Removed manual formatting logic and used API-provided format directly.

**Before:**

```typescript
const maskedSSN = customer.compliance_profile.ssn
  ? `***-**-${customer.compliance_profile.ssn.slice(-4)}`
  : null;
```

**After:**

```typescript
{
  unmaskedData?.compliance_profile?.ssn || customer.compliance_profile.ssn;
}
```

### Logging Improvements

Added comprehensive logging to backend unmask endpoint:

1. **Request Logging:** Logs outbound request to Straddle API
2. **Response Logging:** Logs successful response with duration
3. **Error Logging:** Logs failed requests with error details
4. **Terminal API Log:** Adds inline API log entries for terminal display
5. **Stream Logging:** Broadcasts events via SSE for real-time UI updates

## Files Modified

### Backend Files

- `server/src/routes/customers.ts` (lines 509-585)
  - Added `GET /:id/unmask` endpoint
  - Integrated Straddle SDK `customers.unmasked()` method (FIXED: was incorrectly using custom GET request)
  - Added comprehensive logging and error handling

### Frontend Files

- `web/src/lib/api.ts` (lines 218-246)
  - Added `UnmaskedCustomer` interface
  - Added `unmaskCustomer()` function

- `web/src/components/dashboard/CustomerCard.tsx` (lines 41-102, 361-392)
  - Added unmask state management
  - Added `handleUnmask()` toggle handler
  - Added SHOW/HIDE button UI
  - Added inline error display
  - Added automatic state cleanup on customer change

## Testing

### Manual Test Cases

1. **Happy Path:**
   - Run `/customer-KYC` to create customer with SSN/DOB
   - Verify masked SSN (`***-**-XXXX`) and DOB (`****-**-**`) display
   - Click SHOW button
   - Verify unmasked SSN (`123-45-6789`) and DOB (`1990-01-15`) display
   - Click HIDE button
   - Verify masked values return

2. **Permission Error:**
   - Use API key without `show_sensitive=true`
   - Click SHOW button
   - Verify error message displays: "Permission denied..."

3. **Customer Change:**
   - Unmask customer A
   - Create new customer B via `/customer-KYC`
   - Verify unmasked data from customer A is cleared

4. **Network Error:**
   - Stop backend server
   - Click SHOW button
   - Verify error message displays

5. **Loading State:**
   - Click SHOW button
   - Verify button shows loading state (disabled)
   - Wait for response
   - Verify button returns to interactive state

## Terminal Commands

Users interact with the feature through these commands:

- `/customer-KYC` - Creates customer with full KYC data including SSN and DOB
- `/info` - Shows current customer ID (useful for debugging)
- `/reset` - Clears all state including unmasked data

## Future Enhancements

1. **Audit Trail:** Add database logging of unmask requests for compliance
2. **Time-Limited Display:** Auto-hide unmasked data after X seconds
3. **Redaction in Logs:** Ensure SSN/DOB are redacted from all log outputs
4. **Bulk Unmask:** Support unmasking multiple customers at once
5. **Permission UI:** Show warning badge if API key lacks `show_sensitive=true`

## Related Documentation

- **Straddle API:** https://docs.straddle.io/
- **Customer Review:** `server/src/routes/customers.ts` (GET /:id/review endpoint)
- **KYC Validation:** `web/src/components/dashboard/KYCValidationCard.tsx`
- **API Client:** `web/src/lib/api.ts`
- **State Management:** `web/src/lib/state.ts`
