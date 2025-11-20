# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Straddle NerdCon Demo - Developer Guide

**Production-Ready** fintech demo showcasing Straddle's unified platform: identity verification, account connectivity, and instant payment processing.

## Quick Start

```bash
npm install
cd server && cp .env.example .env  # Add your STRADDLE_API_KEY
cd ..
npm run dev  # Starts both server:3001 and web:5173
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
│  │  (unified)   │  │  (Customer, Paykey, Charge)  │ │
│  │  + API Logs  │  │                              │ │
│  └──────────────┘  └──────────────────────────────┘ │
└─────────────┬───────────────────────────────────────┘
              │ fetch() API calls
              ▼
┌─────────────────────────────────────────────────────┐
│  Express Server (localhost:3001)                    │
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

**Left Panel:** Unified terminal with inline API request logs and command menu
**Right Panel:** Live dashboard showing verification status and payment flow

## Terminal UI

The terminal provides a CLI-style interface with integrated API logging:

**Features:**

- Unified view: Terminal and API logs in single pane
- Inline API logs: Request/response details appear after each command
- Syntax highlighting: JSON formatted with retro color scheme
- Command menu: Inline button slides up menu from bottom
- Alacritty aesthetic: Proper nesting, color scheme, retro fonts

**Components:**

- `Terminal.tsx` - Main terminal with inline API logs
- `APILogInline.tsx` - Compact expandable API log entries
- `CommandMenu.tsx` - Slide-up command menu

## Progressive Dashboard Disclosure

The dashboard adapts its layout as the payment flow progresses, maintaining UX continuity while optimizing space:

**Progressive States:**

1. **Empty**: All cards visible but empty (maintains existing layout expectations)
2. **Customer Only**: CustomerCard populated, others empty
3. **Customer + Paykey**: 60/40 split (Customer 60%, Paykey 40%)
4. **Customer + Charge**: 50/50 split (Customer 50%, ChargeCard with embedded paykey 50%)
5. **Charge Scheduled**: Compact CustomerCard + Featured CircularChargeTracker

**Key UX Patterns:**

- **Embedded Paykey**: When charge is created, paykey "becomes part of" the charge card as an expandable green key icon
- **Progressive Enhancement**: Layout starts familiar (empty cards) then adapts as data arrives
- **Smooth Transitions**: 500ms cubic-bezier transitions, 60fps animations
- **Theme Support**: Both dark (neon retro) and light (Ayu) themes

**Components:**

- `ChargeCard.tsx` - Supports embedded paykey mode with expandable details
- `CircularChargeTracker.tsx` - Animated SVG progress ring with paykey access
- `DashboardView.tsx` - Layout orchestrator with 5 progressive states

**State Management:**

- `getCardDisplayState()` - Zustand selector returns current layout state
- Returns layout, width, visibility, and mode for each component
- Drives progressive disclosure logic

**Animations:**

- Card resize: 500ms cubic-bezier
- Circular tracker: Scale-up with bounce (800ms)
- Embedded paykey: Fade-in (400ms)
- Reduced-motion support included

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
npm run dev:server       # Server only (port 3001)
npm run dev:web          # Web only (port 5173)

# Building
npm run build            # Build both workspaces
npm run type-check       # TypeScript validation

# Code quality
npm run lint             # ESLint all workspaces
npm run format           # Prettier formatting
```

## Code Quality Standards

### Linting

**Rules:**

- No `any` types (use proper TypeScript types)
- No `console.log` (use structured logger)
- Explicit function return types recommended
- Promise handling required (`no-floating-promises`)

**Running Linter:**

```bash
npm run lint              # All workspaces
npm run lint --workspace=server
npm run lint --workspace=web
```

**Auto-fix:**

```bash
npx eslint --fix src/
```

### Testing

**Running Tests:**

```bash
npm test --workspace=server    # Jest tests
npm test --workspace=web       # Vitest tests
npm run test:coverage          # With coverage report
```

**Writing Tests:**

- Follow TDD: write test first, watch it fail, make it pass
- Use descriptive test names
- Test happy paths and error cases
- Mock external dependencies (SDK, APIs)
- See `docs/TESTING.md` for detailed guidelines

**Coverage Thresholds:**

- Minimum 50% coverage required
- Coverage reports on all PRs
- View HTML reports in `coverage/lcov-report/index.html`

### Pre-Commit Checks

**Automatically runs on git commit:**

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking

**To bypass (not recommended):**

```bash
git commit --no-verify
```

### Environment Setup

**`server/.env`** (required):

```env
STRADDLE_API_KEY=eyJhbGc...      # JWT token from dashboard
STRADDLE_ENV=sandbox             # or production
PORT=3001                        # Default
CORS_ORIGIN=http://localhost:5173
GENERATOR_URL=http://localhost:8081  # Optional: Paykey generator service URL
```

**Web has no environment variables** - all API calls go through backend.

**Paykey Generator (Auto-started):**
The Generator tab embeds a Python service for creating paykeys. This service is automatically started when you run `npm run dev`.

- Default URL: `http://localhost:8081`
- Proxy endpoint: `/api/generator` (accessed through Express server)
- Requires: Python 3.x and `b3sum` command-line tool
- For deployed environments, update `GENERATOR_URL` to point to your hosted generator instance

### Terminal Commands Available

Type these in the browser terminal at `localhost:5173`:

| Command                                    | Description                                       | Example                                       |
| ------------------------------------------ | ------------------------------------------------- | --------------------------------------------- |
| `/demo`                                    | Full happy-path flow (customer → paykey → charge) | `/demo`                                       |
| `/customer-create` (or `/create-customer`) | Create verified customer                          | `/customer-create --outcome verified`         |
| `/customer-KYC`                            | Create customer with full KYC data                | `/customer-KYC`                               |
| `/create-paykey`                           | Link bank account                                 | `/create-paykey bank --outcome active`        |
| `/paykey-review`                           | Show review details for current paykey            | `/paykey-review`                              |
| `/paykey-decision`                         | Approve/reject paykey in review                   | `/paykey-decision approve`                    |
| `/create-charge`                           | Create payment                                    | `/create-charge --amount 5000 --outcome paid` |
| `/outcomes`                                | Show available sandbox outcomes                   | `/outcomes`                                   |
| `/info`                                    | Show current state (IDs)                          | `/info`                                       |
| `/reset`                                   | Clear all demo state                              | `/reset`                                      |
| `/help`                                    | Show all commands                                 | `/help`                                       |

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

### SDK Version

Currently using `@straddlecom/straddle` v0.3.0 which includes:

- Paykey review endpoints (`GET /paykeys/:id/review`, `PATCH /paykeys/:id/review`)
- Verification details with account_validation and name_match breakdowns
- Review status for paykeys requiring manual approval

**New Fields in Paykey Review:**

- `verification_details.breakdown.account_validation` - Account validation codes, decision, reason
- `verification_details.breakdown.name_match` - Name correlation score, customer/matched names, names on account

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
  ownership: paykeyData.ownership
    ? {
        waldo_confidence: paykeyData.ownership.waldo_confidence || 'unknown',
      }
    : undefined,
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
  environment: 'sandbox',
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
  name: 'Alberta Bobbeth Charleson',
  type: 'individual',
  email: `user.${Date.now()}@example.com`, // Unique email!
  phone: '+12125550123',
  device: { ip_address: '192.168.1.1' },
  config: { sandbox_outcome: 'verified' }, // or "review", "rejected"
});
// Returns: customer.data.id, .verification_status, .risk_score
```

**Link Bank Account:**

```typescript
const paykey = await client.bridge.link.bankAccount({
  customer_id: 'customer_id_here',
  account_number: '123456789',
  routing_number: '021000021',
  account_type: 'checking',
  config: { sandbox_outcome: 'active' }, // or "inactive", "rejected"
});
// Returns TWO important fields:
// - paykey.data.id (resource ID for GET /paykeys/:id)
// - paykey.data.paykey (TOKEN for charges.create) ← USE THIS!
```

**Create Charge:**

```typescript
const charge = await client.charges.create({
  paykey: '758c519d.02.2c16f91...', // ⚠️ Use TOKEN, not ID!
  amount: 5000, // Cents ($50.00)
  description: 'Payment for services',
  currency: 'USD',
  consent_type: 'internet',
  device: { ip_address: '192.168.1.1' },
  payment_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  config: {
    balance_check: 'enabled',
    sandbox_outcome: 'paid', // or "failed", "reversed_insufficient_funds"
  },
});
// Returns: charge.data.id, .status, .amount
```

### Sandbox Outcomes

Control deterministic behavior with `config.sandbox_outcome`:

| Resource      | Outcomes                                                                                                                                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customers** | `standard`, `verified`, `review`, `rejected`                                                                                                                                                                                                                                           |
| **Paykeys**   | `standard`, `active`, `review`, `rejected`                                                                                                                                                                                                                                             |
| **Charges**   | `standard`, `paid`, `on_hold_daily_limit`, `cancelled_for_fraud_risk`, `cancelled_for_balance_check`, `failed_insufficient_funds`, `failed_customer_dispute`, `failed_closed_bank_account`, `reversed_insufficient_funds`, `reversed_customer_dispute`, `reversed_closed_bank_account` |

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
**Fix:** Check server on port 3001, verify `CORS_ORIGIN` in `.env`

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
    UserGuideTab.tsx   # Single-screen user reference guide
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

## User Guide Tab

Single-screen reference for demo basics, accessible via GUIDE tab in right panel.

**Content Structure:**

- **Quick Start**: 3-step intro to running demos (/demo → watch dashboard → /reset)
- **Key Commands**: 6 most-used commands with descriptions (/demo, /reset, /help, /info)
- **Workflow**: Visual diagram of Customer → Paykey → Charge flow with numbered steps
- **Pro Tips**: 4 helpful hints for smooth demos (Tab autocomplete, MENU button, LOGS tab, /outcomes)

**Design Principles:**

- No scrolling required on 1080p+ displays
- Visual cards with icons and color coding (Customer=cyan, Paykey=blue, Charge=magenta)
- Scannable bullet points and code blocks
- Retro aesthetic matching app theme with pixel fonts and neon accents
- Framer Motion animations for card entrance

**Component Location:** `web/src/components/UserGuideTab.tsx`

**Usage:** The guide is automatically included in RightPanel as a fourth tab alongside Demo, Logs, and Generator. It provides quick reference without leaving the demo interface.

## Need Help?

- Check `docs/archive/` for detailed implementation history
- Read specific plan that implemented a feature
- Review test reports to understand verification approach
- For Straddle API questions, use MCP server or docs above
