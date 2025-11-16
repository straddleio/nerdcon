# Straddle NerdCon Demo - Developer Guide

**Production-Ready** fintech demo showcasing Straddle's unified platform: identity verification, account connectivity, and instant payment processing.

## Quick Start

```bash
npm install
cd server && cp .env.example .env  # Add your STRADDLE_API_KEY
cd ..
npm run dev  # Starts both server:4000 and web:5173
```

Open `http://localhost:5173` and type `/demo` in the terminal.

## What This Does

Split-screen web app demonstrating real-time ACH payments:
- **Left panel**: CLI-style terminal + API request log
- **Right panel**: Live dashboard showing customer verification, bank linking, and payment status
- **Backend**: Real Straddle Sandbox API calls (no mocking, uses `sandbox_outcome` for deterministic results)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (localhost:5173)                           │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │  Terminal    │  │  Dashboard                   │ │
│  │  + API Log   │  │  (Customer, Paykey, Charge)  │ │
│  └──────────────┘  └──────────────────────────────┘ │
└─────────────┬───────────────────────────────────────┘
              │ fetch() API calls
              ▼
┌─────────────────────────────────────────────────────┐
│  Express Server (localhost:4000)                    │
│  ┌──────────┐  ┌────────────┐  ┌─────────────────┐ │
│  │  Routes  │→ │  Straddle  │→ │  Sandbox API    │ │
│  │          │  │  SDK       │  │                 │ │
│  └──────────┘  └────────────┘  └─────────────────┘ │
│       │                                             │
│       ▼ SSE stream                                  │
│  ┌──────────────────┐                               │
│  │  State + Events  │                               │
│  └──────────────────┘                               │
└─────────────────────────────────────────────────────┘
```

**Monorepo Structure:**
- `server/` - Node.js/Express/TypeScript with Straddle SDK
- `web/` - React/Vite/TypeScript with retro 8-bit UI
- `design/` - Retro gaming design system assets

**Key Technologies:**
- Backend: Express, `@straddlecom/straddle` SDK, SSE for real-time updates
- Frontend: React, Zustand (state), EventSource (SSE), Tailwind (retro theme)

## Development Workflow

### Common Commands

```bash
# Development
npm run dev              # Start both server and web
npm run dev:server       # Server only (port 4000)
npm run dev:web          # Web only (port 5173)

# Building
npm run build            # Build both workspaces
npm run type-check       # TypeScript validation

# Code quality
npm run lint             # ESLint all workspaces
npm run format           # Prettier formatting
```

### Environment Setup

**`server/.env`** (required):
```env
STRADDLE_API_KEY=eyJhbGc...      # JWT token from dashboard
STRADDLE_ENV=sandbox             # or production
PORT=4000                        # Default
CORS_ORIGIN=http://localhost:5173
```

**Web has no environment variables** - all API calls go through backend.

### Terminal Commands Available

Type these in the browser terminal at `localhost:5173`:

| Command | Description | Example |
|---------|-------------|---------|
| `/demo` | Full happy-path flow (customer → paykey → charge) | `/demo` |
| `/create-customer` | Create verified customer | `/create-customer --outcome verified` |
| `/customer-KYC` | Create customer with full KYC data | `/customer-KYC` |
| `/create-paykey` | Link bank account | `/create-paykey bank --outcome active` |
| `/create-charge` | Create payment | `/create-charge --amount 5000 --outcome paid` |
| `/info` | Show current state (IDs) | `/info` |
| `/reset` | Clear all demo state | `/reset` |
| `/help` | Show all commands | `/help` |

### Adding New Features

**1. New Terminal Command:**
- Edit `web/src/lib/commands.ts` (add to `parseCommand()`)
- Update help text in same file
- Backend route may already exist or needs creation

**2. New API Endpoint:**
- Create route in `server/src/routes/[name].ts`
- Wire into `server/src/index.ts`
- Use Straddle SDK client (see patterns below)
- Add tracing headers (auto-added by middleware)

**3. New Dashboard Field:**
- Update relevant card component in `web/src/components/dashboard/`
- Ensure state includes the field (`web/src/lib/state.ts`)
- SSE updates handled automatically via `useSSE` hook

## Straddle SDK Integration

### ⚠️ CRITICAL: Verify API Fields Before Implementation

**NEVER implement code that accesses API fields without first verifying they exist in the source.**

Before adding any new field to `DemoPaykey`, `DemoCustomer`, `DemoCharge`, or any type that maps Straddle API responses:

1. **Check SDK Type Definitions First:**
   ```bash
   # Search for the field in SDK types
   grep -r "field_name" node_modules/@straddlecom/straddle/resources/

   # Example: Verify paykey fields exist
   cat node_modules/@straddlecom/straddle/resources/paykeys.d.ts
   ```

2. **Verify in Straddle Documentation:**
   - API docs: https://docs.straddle.io/
   - SDK reference: Check TypeScript definitions in `node_modules/@straddlecom/straddle/`
   - MCP server: https://docs.straddle.com/mcp

3. **NEVER assume fields exist based on:**
   - Issue descriptions or feature requests
   - Similar fields in other APIs
   - Logical assumptions about what "should" be there
   - Previous versions or documentation that may be outdated

4. **When in doubt:**
   - Test the actual API response in sandbox
   - Console.log the full response object to see what's actually returned
   - Contact Straddle support to confirm field availability

**Example of proper verification:**
```typescript
// ❌ WRONG: Assuming ownership.waldo_confidence exists
const demoPaykey: DemoPaykey = {
  ownership: paykeyData.ownership ? {
    waldo_confidence: paykeyData.ownership.waldo_confidence || 'unknown'
  } : undefined,
};

// ✅ CORRECT: First verify in SDK types that this field exists
// grep "ownership" node_modules/@straddlecom/straddle/resources/paykeys.d.ts
// If it doesn't exist, don't implement it!
```

**This rule prevents implementing features for non-existent API fields that will always return undefined.**

### Client Initialization

```typescript
import Straddle from '@straddlecom/straddle';

const client = new Straddle({
  apiKey: process.env.STRADDLE_API_KEY,
  environment: 'sandbox'
});
```

### Response Structure ⚠️ CRITICAL

**ALL SDK responses wrap data in `.data` object:**

```typescript
const customer = await client.customers.create({...});

// ❌ WRONG:
const id = customer.id;

// ✅ CORRECT:
const id = customer.data.id;
```

### Common Patterns

**Create Customer:**
```typescript
const customer = await client.customers.create({
  name: "Alberta Bobbeth Charleson",
  type: "individual",
  email: `user.${Date.now()}@example.com`,  // Unique email!
  phone: "+12125550123",
  device: { ip_address: "192.168.1.1" },
  config: { sandbox_outcome: "verified" }  // or "review", "rejected"
});
// Returns: customer.data.id, .verification_status, .risk_score
```

**Link Bank Account:**
```typescript
const paykey = await client.bridge.link.bankAccount({
  customer_id: "customer_id_here",
  account_number: "123456789",
  routing_number: "021000021",
  account_type: "checking",
  config: { sandbox_outcome: "active" }  // or "inactive", "rejected"
});
// Returns TWO important fields:
// - paykey.data.id (resource ID for GET /paykeys/:id)
// - paykey.data.paykey (TOKEN for charges.create) ← USE THIS!
```

**Create Charge:**
```typescript
const charge = await client.charges.create({
  paykey: "758c519d.02.2c16f91...",  // ⚠️ Use TOKEN, not ID!
  amount: 5000,  // Cents ($50.00)
  description: "Payment for services",
  currency: "USD",
  consent_type: "internet",
  device: { ip_address: "192.168.1.1" },
  payment_date: new Date().toISOString().split('T')[0],  // YYYY-MM-DD
  config: {
    balance_check: "enabled",
    sandbox_outcome: "paid"  // or "failed", "reversed_insufficient_funds"
  }
});
// Returns: charge.data.id, .status, .amount
```

### Sandbox Outcomes

Control deterministic behavior with `config.sandbox_outcome`:

| Resource | Outcomes |
|----------|----------|
| **Customers** | `standard`, `verified`, `review`, `rejected` |
| **Paykeys** | `standard`, `active`, `rejected` |
| **Charges** | `standard`, `paid`, `on_hold_daily_limit`, `cancelled_for_fraud_risk`, `cancelled_for_balance_check`, `failed_insufficient_funds`, `failed_customer_dispute`, `failed_closed_bank_account`, `reversed_insufficient_funds`, `reversed_customer_dispute`, `reversed_closed_bank_account` |

**Note:** The `inactive` outcome for paykeys has been removed as it is not supported by the Straddle API.

### Request Tracing

All API calls automatically include (via `server/src/middleware/tracing.ts`):
- `Request-Id` - UUID for individual request
- `Correlation-Id` - UUID for related requests
- `Idempotency-Key` - UUID for POST/PATCH (10-40 chars)

## Troubleshooting

### "Invalid paykey token" when creating charge
**Cause:** Using resource `id` instead of `paykey` token
**Fix:** Use `paykeyResponse.data.paykey`, not `.data.id`

### "Customer email already exists"
**Cause:** Reusing same email in sandbox
**Fix:** Use timestamp: `` `user.${Date.now()}@example.com` ``

### "Property X does not exist on type Y"
**Cause:** Accessing fields without `.data` wrapper
**Fix:** Always use `response.data.field`

### SSE shows "Disconnected"
**Cause:** Server not running or CORS misconfigured
**Fix:** Check server on port 4000, verify `CORS_ORIGIN` in `.env`

### Build fails with module resolution errors
**Cause:** Missing `.js` extensions (ESM requirement)
**Fix:** Server imports must include `.js`: `import { x } from './file.js'`

### "plaid_token must be provided or PLAID_PROCESSOR_TOKEN must be set"
**Cause:** Neither custom token provided nor env var configured
**Fix:** Either set `PLAID_PROCESSOR_TOKEN` in `server/.env` or provide token in PaykeyCard form

## File Structure Reference

```
server/src/
  index.ts              # Express app + SSE subscription
  config.ts             # Environment config
  sdk.ts                # Straddle client factory
  middleware/
    tracing.ts          # Request/Correlation/Idempotency headers
  domain/
    state.ts            # In-memory state with EventEmitter
    types.ts            # TypeScript definitions
    logs.ts             # Request/response logging
    events.ts           # SSE broadcaster
  routes/
    customers.ts        # Customer creation, review, verification
    bridge.ts           # Bank linking (Plaid + manual)
    paykeys.ts          # Paykey management
    charges.ts          # Charge creation and lifecycle
    state.ts            # State management (get/reset/logs/SSE)

web/src/
  App.tsx              # Main app with SSE hook
  layout/
    SplitView.tsx      # 40% left / 60% right split
    LeftPanel.tsx      # Terminal + API log
    RightPanel.tsx     # Dashboard container
  components/
    Terminal.tsx       # Interactive CLI
    APILog.tsx         # Request log with retro styling
    dashboard/
      CustomerCard.tsx        # Identity verification
      PaykeyCard.tsx          # Bank info, WALDO
      ChargeCard.tsx          # Payment details
      PizzaTracker.tsx        # Charge lifecycle
      KYCValidationCard.tsx   # KYC validation results
      AddressWatchlistCard.tsx # Watchlist matches
  lib/
    commands.ts        # Terminal command parser (412 lines)
    state.ts           # Zustand state management
    useSSE.ts          # SSE connection hook
```

## API Endpoints

**Customers:**
- `POST /api/customers` - Create with identity verification
- `GET /api/customers/:id` - Get details
- `GET /api/customers/:id/review` - Get KYC review
- `PATCH /api/customers/:id/review` - Manual decision

**Bridge/Paykeys:**
- `POST /api/bridge/plaid` - Link via Plaid
- `POST /api/bridge/bank-account` - Link via routing/account
- `GET /api/paykeys/:id` - Get status and balance

**Charges:**
- `POST /api/charges` - Create payment
- `GET /api/charges/:id` - Get details with history

**State:**
- `GET /api/state` - Current demo state
- `GET /api/config` - Public config (environment only, no secrets)
- `GET /api/logs` - Request log for UI
- `POST /api/reset` - Clear state
- `GET /api/events/stream` - SSE endpoint

## Documentation Reference

**Straddle API:**
- MCP Server: https://docs.straddle.com/mcp
- API Overview: https://docs.straddle.com/llms.txt
- Customers: https://docs.straddle.io/guides/identity/customers
- Paykeys: https://docs.straddle.io/guides/bridge/paykeys
- Payments: https://docs.straddle.io/guides/payments/overview
- Webhooks: https://docs.straddle.io/webhooks/overview/events

**Project Documentation:**
- Full changelog: `docs/archive/CHANGELOG_FULL.md`
- Implementation plans: `docs/archive/plans/`
- Test reports: `docs/archive/testing/`
- Debugging reports: `docs/archive/reports/`

## Security Notes

- **API keys ONLY in server environment** - never in frontend or `VITE_` variables
- **Sensitive config kept server-side** - /api/config endpoint only exposes non-sensitive values (environment name, etc.). Secrets like PLAID_PROCESSOR_TOKEN use server-side fallback logic
- **No logging of sensitive data** - tokens, account numbers are redacted in logs
- **Input validation** - all terminal commands validate before API calls
- **CORS configured** - only allow specified origin

## Design System

Retro 8-bit gaming aesthetic in `design/`:
- **Colors**: Cyan (#00FFFF), Blue (#0066FF), Magenta (#FF0099), Gold (#FFC300)
- **Effects**: Neon glow, scanlines, CRT distortion, glitch text
- **Components**: `retro-components.tsx` - Pre-built React components

## Need Help?

- Check `docs/archive/` for detailed implementation history
- Read specific plan that implemented a feature
- Review test reports to understand verification approach
- For Straddle API questions, use MCP server or docs above
