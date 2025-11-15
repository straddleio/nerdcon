# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **production-ready live demo application** for Fintech NerdCon showcasing Straddle's unified fintech platform. The demo features a split-screen web app with a CLI-style terminal interface and real-time dashboard showing customer identity verification, account connectivity, and payment processing.

**Status**: Backend ✅ Complete | Frontend ✅ Complete | Build ✅ Passing

**Critical Constraint**: All Straddle API calls MUST use the real sandbox API via the `@straddlecom/straddle` Node SDK. No mocking or fake responses - only `sandbox_outcome` for deterministic simulation.

**📋 For Recent Changes & Known Issues**: See [CHANGELOG.md](./CHANGELOG.md) for detailed project history, completed work, known issues, and remaining tasks.

## Architecture

**Monorepo Structure**:
```
server/     # Node/Express/TypeScript backend with Straddle SDK (✅ Complete)
web/        # React/TypeScript/Vite frontend with retro gaming UI (✅ Complete)
design/     # Retro 8-bit gaming design system assets (✅ Available)
```

**Data Flow**: Browser Terminal → Express API → Straddle SDK → Sandbox API → Webhooks → SSE → Dashboard Updates

**Critical Security Rule**: API keys ONLY in server environment. Never in frontend code or VITE_ variables.

## Straddle SDK Integration

### Installation

```bash
npm install @straddlecom/straddle
```

### Client Initialization

```typescript
import Straddle from '@straddlecom/straddle';

const client = new Straddle({
  apiKey: process.env.STRADDLE_API_KEY,
  environment: 'sandbox' // or 'production'
});
```

### Key SDK Methods

**Charges**:
```typescript
const charge = await client.charges.create({
  amount: 10000, // cents
  paykey: 'paykey_id',
  currency: 'USD',
  consent_type: 'internet',
  device: { ip_address: '192.168.1.1' },
  payment_date: '2024-01-15',
  config: { balance_check: 'enabled', sandbox_outcome: 'paid' }
});

const chargeDetails = await client.charges.get('charge_id');
```

**Customers**:
```typescript
const customer = await client.customers.create({
  name: 'Alberta Bobbeth Charleson',
  type: 'individual',
  email: 'alberta@example.com',
  phone: '+12125550123',
  device: { ip_address: '192.168.1.1' },
  config: { sandbox_outcome: 'verified' }
});

const review = await client.customers.review.get('customer_id');
const decision = await client.customers.review.decision('customer_id', {
  status: 'verified'
});
```

**Bridge/Paykeys**:
```typescript
// Plaid path
const paykeyFromPlaid = await client.bridge.link.plaid({
  customer_id: 'customer_id',
  plaid_token: 'processor-sandbox-xxx'
});

// Bank account path
const paykeyFromBank = await client.bridge.link.bankAccount({
  customer_id: 'customer_id',
  account_number: '123456789',
  routing_number: '021000021',
  account_type: 'checking',
  config: { sandbox_outcome: 'active' }
});

const paykey = await client.paykeys.get('paykey_id');
```

### SDK Features

- **Type Safety**: Full TypeScript definitions
- **Auto-Pagination**: `for await (const item of client.payments.list()) { }`
- **Error Handling**: Structured error classes (BadRequestError, AuthenticationError, etc.)
- **Retries**: Automatic retry logic (2 retries by default)
- **Custom Requests**: `client.get()`, `client.post()` for undocumented endpoints

## API Reference

**Primary Resources**:
- **MCP Server**: https://docs.straddle.com/mcp
- **API Overview**: https://docs.straddle.com/llms.txt
- **Node SDK**: https://github.com/straddleio/straddle-node
- **Main Documentation**: https://docs.straddle.com/

**Key Documentation Pages**:
- Customers & Identity: https://docs.straddle.io/guides/identity/customers
- Paykeys: https://docs.straddle.io/guides/bridge/paykeys
- Payments: https://docs.straddle.io/guides/payments/overview
- Sandbox Testing: https://docs.straddle.io/guides/resources/sandbox-paybybank
- Webhooks: https://docs.straddle.io/webhooks/overview/events

## Development Commands

### Running the Application

**Start both server and web** (recommended):
```bash
npm run dev
```

**Start server only**:
```bash
npm run dev:server          # Runs on http://localhost:4000
```

**Start web only**:
```bash
npm run dev:web             # Runs on http://localhost:5173
```

### Building

**Build everything**:
```bash
npm run build               # Builds both workspaces
```

**Build server**:
```bash
npm run build:server        # TypeScript → dist/
```

**Build web**:
```bash
npm run build:web           # Vite production build
npm run preview             # Preview production build
```

### Type Checking and Linting

```bash
npm run type-check          # Type check all workspaces
npm run lint                # Lint all workspaces
npm run format              # Format with Prettier
```

### Environment Setup

**Server** (`server/.env`):
```bash
STRADDLE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Required: JWT token from Straddle dashboard
STRADDLE_ENV=sandbox        # Required: sandbox or production
PORT=4000                   # Default: 4000
CORS_ORIGIN=http://localhost:5173  # Default: http://localhost:5173
NGROK_URL=https://your-id.ngrok-free.dev  # Optional: for webhook testing
PLAID_PROCESSOR_TOKEN=processor-sandbox-xxx  # Optional: for Plaid demo path
```

**Web** has no environment variables (all API calls go through backend)

## Key Technical Decisions

### Backend Stack
- **Node.js** ≥ 18 with TypeScript
- **Express** for REST endpoints
- **@straddlecom/straddle** - Official SDK (MUST use this, note: @straddlecom not @straddleio)
- **uuid** - For Request-Id, Correlation-Id, Idempotency-Key headers
- **dotenv** - Environment configuration
- **SSE/WebSocket** - Real-time webhook updates to UI

### Frontend Stack
- **React + TypeScript + Vite**
- **shadcn/ui** with custom retro gaming theme
- **Tailwind CSS** with 8-bit aesthetic (neon colors, scanlines, CRT effects)
- **EventSource** - For SSE connection to server

### API Endpoints Structure

Demo server exposes thin wrappers around Straddle:

**Customers**:
- `POST /api/customers` → Create customer with identity verification
- `GET /api/customers/:id` → Get customer details
- `GET /api/customers/:id/review` → Get identity review details
- `PATCH /api/customers/:id/review` → Manual verification decision

**Bridge/Paykeys** (account linking):
- `POST /api/bridge/plaid` → Link via Plaid processor token
- `POST /api/bridge/bank-account` → Link via routing/account numbers
- `GET /api/paykeys/:id` → Get paykey status and balance

**Charges** (Pay by Bank):
- `POST /api/charges` → Create charge with sandbox_outcome
- `GET /api/charges/:id` → Get charge details with status history
- `GET /api/charges/:id/stream` → SSE for status updates

**State & Webhooks**:
- `GET /api/state` → Current demo state (customer/paykey/charge IDs)
- `GET /api/logs` → Recent API request log for UI display
- `POST /api/webhooks/straddle` → Receive Straddle webhooks
- `POST /api/reset` → Clear demo state

### Tracing & Headers

Every Straddle API call must include:
- `Request-Id` - UUID for individual request
- `Correlation-Id` - UUID for related requests
- `Idempotency-Key` - UUID for POST/PATCH operations (10-40 chars)

Implementation in `server/src/middleware/tracing.ts` should generate these and capture timing/status for the API request log.

### Sandbox Simulation

Use `config.sandbox_outcome` to control deterministic behavior:

**Customers**: `verified`, `review`, `rejected`
**Paykeys**: `active`, `inactive`, `rejected`
**Charges**: `paid`, `failed`, `reversed_insufficient_funds`, `on_hold_daily_limit`, `cancelled_for_fraud_risk`

Default test data template:
```typescript
{
  name: "Alberta Bobbeth Charleson",
  type: "individual",
  email: "alberta.charleson@example.com",
  phone: "+12125550123",
  device: { ip_address: "192.168.1.1" },
  config: { sandbox_outcome: "verified" }
}
```

## UI Layout

**Split Screen Design**:

**Left (40-45% width)**:
- Terminal component with CLI commands
- API request log showing real requests to Straddle

**Right (55-60% width)**:
- Customer Risk card (identity verification status)
- Paykey/Bank card (institution, ownership, balance)
- Charge card (amount, status, sandbox_outcome)
- Pizza Tracker (charge lifecycle: created → scheduled → pending → paid)

### Terminal Commands (✅ Implemented)

**Customer Commands**:
- `/create-customer [--outcome verified|review|rejected]` - Create customer with identity verification
  - Default outcome: `verified`
  - Auto-generates unique email with timestamp
  - Shows verification status and risk score

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

**Paykey Commands**:
- `/create-paykey [plaid|bank] [--outcome active|inactive|rejected]` - Link bank account
  - `plaid` - Uses Plaid processor token (requires PLAID_PROCESSOR_TOKEN env var)
  - `bank` - Uses hardcoded routing/account numbers for sandbox
  - Default outcome: `active`
  - Requires customer to exist first

**Charge Commands**:
- `/create-charge [--amount <cents>] [--outcome paid|failed|reversed_insufficient_funds]` - Create payment
  - Default amount: 5000 (cents = $50.00)
  - Default outcome: `paid`
  - Requires both customer and paykey to exist
  - Shows charge lifecycle in PizzaTracker

**Demo & Utility**:
- `/demo` - Run full happy-path flow (customer → paykey → charge)
  - Creates verified customer
  - Links active bank account
  - Creates paid charge
  - Shows real-time updates
- `/info` - Display current demo state (customer/paykey/charge IDs)
- `/reset` - Clear all demo state and reset dashboard
- `/clear` - Clear terminal scrollback only
- `/help` - Show available commands

**Implementation**: See `web/src/lib/commands.ts` (412 lines) for command parser and execution logic.

## Common Issues & Troubleshooting

### TypeScript Errors

**Issue**: "Property 'X' does not exist on type 'Y'"
**Cause**: SDK responses wrap data in `.data` object
**Solution**: Always access `response.data.field` not `response.field`

**Issue**: "Type 'X | undefined' is not assignable to type 'X'"
**Cause**: Optional fields from SDK responses
**Solution**: Use optional chaining `?.` or null checks before accessing nested fields

**Issue**: "Method 'bank_account' does not exist"
**Cause**: SDK uses camelCase, not snake_case
**Solution**: Use `bankAccount`, not `bank_account`

### Runtime Errors

**Issue**: "Invalid paykey token" when creating charge
**Cause**: Using the resource `id` instead of the `paykey` token
**Solution**: Use `paykeyResponse.data.paykey` (the token), not `paykeyResponse.data.id`

**Issue**: "Customer email already exists"
**Cause**: Reusing the same email in sandbox
**Solution**: Auto-generate emails with timestamp: `` `user.${Date.now()}@example.com` ``

**Issue**: "Missing required field: payment_date"
**Cause**: Charge creation requires payment_date
**Solution**: Always include `payment_date` in YYYY-MM-DD format (use helper: `new Date().toISOString().split('T')[0]`)

### Connection Issues

**Issue**: SSE connection shows "Disconnected"
**Cause**: Server not running or CORS misconfigured
**Solution**: Ensure server is running on port 4000 and `CORS_ORIGIN=http://localhost:5173`

**Issue**: API requests fail with CORS error
**Cause**: Frontend running on different port than configured
**Solution**: Check `server/.env` has correct `CORS_ORIGIN`

### Build Issues

**Issue**: `npm run build` fails with module resolution errors
**Cause**: Missing `.js` extensions in imports (ESM requirement)
**Solution**: All server imports must include `.js` extension: `import { x } from './file.js'`

**Issue**: Vite build fails with type errors
**Cause**: Unused imports or missing type definitions
**Solution**: Run `npm run type-check` in web workspace to identify issues

## Working with Claude Code

### Development Approach

**The project is complete.** When working with this codebase:

1. **Read NEXT_STEPS.md first** - Contains critical lessons learned and current status

2. **Never modify backend routes** - They are production-ready and fully tested. If adding features, create new routes.

3. **Understand the data flow**:
   - Terminal command → `commands.ts` parser → `fetch()` to backend
   - Backend route → Straddle SDK → Response
   - Backend emits event → SSE → Frontend state update → Dashboard re-render

4. **Test changes immediately**:
   - Backend: Use curl to test API endpoints
   - Frontend: Run `/demo` command to verify full flow
   - Check browser console for errors
   - Watch API log for request/response details

5. **Common modification scenarios**:
   - **New terminal command**: Add to `web/src/lib/commands.ts`, update help text
   - **New API endpoint**: Create route in `server/src/routes/`, wire in `index.ts`
   - **New dashboard field**: Update card component, ensure state includes the field
   - **New sandbox outcome**: Add to command parser outcomes, update help text

6. **Keep security in mind**:
   - API keys ONLY in server environment
   - Never log sensitive data (full tokens, account numbers)
   - Validate all user input in terminal commands

7. **Optimize for live demo**:
   - Prefer deterministic sandbox outcomes
   - Add helpful error messages in terminal
   - Test full `/demo` flow before presenting

### Actual File Structure (✅ Implemented)

```
server/src/
  index.ts              # ✅ Express app entry with SSE subscription
  config.ts             # ✅ Environment configuration loader
  sdk.ts                # ✅ Straddle client factory
  middleware/
    tracing.ts          # ✅ Request-Id, Correlation-Id, Idempotency-Key middleware
  domain/
    state.ts            # ✅ In-memory state with EventEmitter
    types.ts            # ✅ TypeScript type definitions
    logs.ts             # ✅ Request/response logging
    events.ts           # ✅ SSE broadcaster for real-time updates
  routes/
    customers.ts        # ✅ Customer creation, review, verification
    bridge.ts           # ✅ Bank account linking (Plaid & manual)
    paykeys.ts          # ✅ Paykey management
    charges.ts          # ✅ Charge creation and lifecycle
    webhooks.ts         # ✅ Straddle webhook receiver
    state.ts            # ✅ State management (get/reset/logs/SSE stream)

web/src/
  main.tsx             # ✅ React entry point
  App.tsx              # ✅ Main app with SSE hook
  layout/
    SplitView.tsx      # ✅ 40% left / 60% right split
    LeftPanel.tsx      # ✅ Terminal + API log (15/85 split)
    RightPanel.tsx     # ✅ Dashboard container
  components/
    Terminal.tsx       # ✅ Interactive terminal with command history
    APILog.tsx         # ✅ Request log with NerdCon logo background
    ConnectionStatus.tsx  # ✅ SSE connection indicator
    dashboard/
      DashboardView.tsx    # ✅ Main dashboard layout
      CustomerCard.tsx     # ✅ Identity verification, geolocation
      PaykeyCard.tsx       # ✅ Bank info, WALDO, ownership
      ChargeCard.tsx       # ✅ Amount, payment rail, balance
      PizzaTracker.tsx     # ✅ Horizontal charge lifecycle
    ui/
      ChargeStatusIcon.tsx # ✅ Status icon component
      retro-components.tsx # ✅ Design system components
  lib/
    api.ts             # ✅ HTTP client (not implemented - using fetch directly)
    commands.ts        # ✅ Terminal command parser (412 lines)
    state.ts           # ✅ Zustand state management (157 lines)
    useSSE.ts          # ✅ SSE connection hook (118 lines)
    useGeolocation.ts  # ✅ IP geolocation lookup
    nerd-icons.ts      # ✅ Icon mapping helpers
```

## Critical SDK Implementation Details

### SDK Response Structure ⚠️ MUST READ

**ALL Straddle SDK responses wrap data in a `.data` object:**

```typescript
const customer = await straddleClient.customers.create({...});

// ❌ WRONG:
const id = customer.id;

// ✅ CORRECT:
const id = customer.data.id;
```

This applies to ALL SDK methods: `customers.*`, `paykeys.*`, `charges.*`, `bridge.link.*`, etc.

### Paykey vs Paykey ID ⚠️ CRITICAL

The bridge response includes TWO important fields:

```typescript
const paykeyResponse = await straddleClient.bridge.link.bankAccount({...});

{
  data: {
    id: "019a80be-b183-...",           // Resource ID (for GET /paykeys/:id)
    paykey: "758c519d.02.2c16f91...",  // TOKEN (for charges.create)
    customer_id: "...",
    status: "active"
  }
}
```

**When creating charges, use the `paykey` TOKEN, not the `id`:**

```typescript
// ✅ CORRECT:
await straddleClient.charges.create({
  paykey: paykeyResponse.data.paykey,  // Use the TOKEN
  amount: 5000,
  description: "Payment",
  // ...
});

// ❌ WRONG:
await straddleClient.charges.create({
  paykey: paykeyResponse.data.id,  // This will fail!
  // ...
});
```

### SDK Method Naming

SDK uses **camelCase**, not snake_case:

```typescript
// ✅ CORRECT:
await straddleClient.bridge.link.bankAccount({...});

// ❌ WRONG:
await straddleClient.bridge.link.bank_account({...});
```

### Required Fields for Common Operations

**Creating Charges**:
- `paykey` (the token string, NOT the resource ID)
- `amount` (in cents, integer)
- `description` (string, cannot be empty)
- `currency` (e.g., "USD")
- `consent_type` ("internet" for sandbox)
- `device.ip_address` (string)
- `payment_date` (YYYY-MM-DD format)

**Creating Customers**:
- `name` (string)
- `type` ("individual" or "business")
- `email` (must be unique - use timestamp: `user.${Date.now()}@example.com`)
- `phone` (string, E.164 format recommended)
- `device.ip_address` (string)

### Webhook Event Structure

Straddle webhooks use this format:

```typescript
{
  "event_type": "customer.event.v1",  // NOT "type"
  "event_id": "uuid",
  "account_id": "uuid",
  "data": { /* resource object */ }  // Direct resource, NOT "data.object"
}
```

Event naming: `{resource}.{action}.v1`

## Design System

The project uses a retro 8-bit gaming aesthetic inspired by Fintech NerdCon. Design assets are in `design/`:

- **retro-design-system.ts** - Design tokens and Tailwind config
- **retro-components.tsx** - Pre-built React components (RetroCard, RetroHeading, etc.)
- **retro-styles.css** - Global styles, animations (scanlines, CRT, glitch)

**Key Colors**:
- Primary: Cyan (#00FFFF) - Main neon accent
- Secondary: Blue (#0066FF) - Electric blue
- Accent: Magenta (#FF0099) - Hot pink
- Gold: (#FFC300) - Special highlights

**Effects**: Neon glow, pixel borders, scanlines, CRT distortion, glitch text, typewriter animation

## Testing the Application

### Quick Health Check

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T...",
  "environment": "sandbox"
}
```

### Manual API Testing

**1. Create Customer**:
```bash
curl -X POST http://localhost:4000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test.'$(date +%s)'@example.com",
    "outcome": "verified"
  }'
```

Response includes: `id`, `verification_status`, `risk_score`

**2. Link Bank Account** (use customer_id from step 1):
```bash
curl -X POST http://localhost:4000/api/bridge/bank-account \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "<CUSTOMER_ID>",
    "outcome": "active"
  }'
```

Response includes: `id` (resource ID), `paykey` (token), `status`

**3. Create Charge** (use `paykey` token from step 2):
```bash
curl -X POST http://localhost:4000/api/charges \
  -H "Content-Type: application/json" \
  -d '{
    "paykey": "<PAYKEY_TOKEN>",
    "amount": 5000,
    "description": "Test charge",
    "outcome": "paid"
  }'
```

**4. Check State**:
```bash
curl http://localhost:4000/api/state
```

**5. Reset Demo**:
```bash
curl -X POST http://localhost:4000/api/reset
```

### SSE Connection Test

```bash
curl -N http://localhost:4000/api/events/stream
```

You should see SSE events in format:
```
event: state:change
data: {"customer":null,"paykey":null,"charge":null}
```

### Frontend Testing

1. Open `http://localhost:5173` in browser
2. Connection status should show "Connected" (green)
3. Type `/demo` in terminal and press Enter
4. Watch dashboard cards update in real-time
5. Check API log for request history

## Reference Documentation

For detailed implementation guidance, see:
- `NEXT_STEPS.md` - Current status, completed features, lessons learned
- `DEVELOPMENT-PLAN.md` - Original implementation roadmap
- `README.md` - Quick start guide
- `design/` - Design system assets

**Straddle API Documentation**:
- Straddle MCP: https://docs.straddle.com/mcp
- API Overview: https://docs.straddle.com/llms.txt
- Node SDK: https://github.com/straddleio/straddle-node
- Customers & Identity: https://docs.straddle.io/guides/identity/customers
- Paykeys: https://docs.straddle.io/guides/bridge/paykeys
- Payments: https://docs.straddle.io/guides/payments/overview
- Webhooks: https://docs.straddle.io/webhooks/overview/events
