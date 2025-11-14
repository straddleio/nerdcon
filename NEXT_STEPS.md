# Next Steps - Straddle NerdCon Demo

> **Last Updated:** 2025-11-14 (Terminal Integration Complete)
> **Current Phase:** Phase 3A, 3B, 3C Complete → Phase 3D Optional

## 🎯 Project Status

### ✅ Phase 1 & 2: COMPLETE
**Backend API integration with Straddle SDK is fully functional and tested.**

### ✅ Phase 3A: COMPLETE (Just Finished!)
**Frontend UI foundation built with retro 8-bit design system.**

### ✅ Phase 3B: COMPLETE
**Terminal commands and API integration fully functional.**

### ✅ Phase 3C: COMPLETE
**Dashboard cards display real-time data from backend.**

### ❌ Phase 3D: NOT STARTED
**Optional polish features (typewriter animations, glitch effects, etc.)**

---

## 📊 Current Implementation Status

### Backend (Server) - ✅ 100% Complete

All API routes are implemented, tested, and working with real Straddle sandbox API:

#### Customer Routes (`server/src/routes/customers.ts`)
- ✅ `POST /api/customers` - Create customer with identity verification
- ✅ `GET /api/customers/:id` - Get customer details
- ✅ `GET /api/customers/:id/review` - Get identity review details
- ✅ `PATCH /api/customers/:id/review` - Manual verification decision
- ✅ `POST /api/customers/:id/refresh-review` - Refresh review status

#### Bridge/Paykey Routes (`server/src/routes/bridge.ts`, `server/src/routes/paykeys.ts`)
- ✅ `POST /api/bridge/bank-account` - Link bank account via routing/account numbers
- ✅ `POST /api/bridge/plaid` - Link account via Plaid processor token
- ✅ `GET /api/paykeys/:id` - Get paykey details (balance, institution, status)
- ✅ `GET /api/paykeys/:id/review` - Get paykey review
- ✅ `POST /api/paykeys/:id/cancel` - Cancel a paykey

#### Charge Routes (`server/src/routes/charges.ts`)
- ✅ `POST /api/charges` - Create charge with sandbox_outcome
- ✅ `GET /api/charges/:id` - Get charge details with status history
- ✅ `POST /api/charges/:id/cancel` - Cancel charge
- ✅ `POST /api/charges/:id/hold` - Place hold on charge
- ✅ `POST /api/charges/:id/release` - Release hold

#### System Routes
- ✅ `POST /api/webhooks/straddle` - Receive Straddle webhooks
- ✅ `GET /api/events/stream` - SSE endpoint for real-time updates
- ✅ `GET /api/state` - Get current demo state (customer/paykey/charge)
- ✅ `GET /api/logs` - Get API request logs
- ✅ `POST /api/reset` - Clear demo state
- ✅ `GET /health` - Health check endpoint

#### Supporting Infrastructure
- ✅ `server/src/sdk.ts` - Straddle SDK client initialization
- ✅ `server/src/config.ts` - Environment configuration
- ✅ `server/src/middleware/tracing.ts` - Request-Id, Correlation-Id, Idempotency-Key headers
- ✅ `server/src/domain/state.ts` - In-memory state management with EventEmitter
- ✅ `server/src/domain/events.ts` - SSE broadcaster
- ✅ `server/src/domain/logs.ts` - Request/response logging
- ✅ `server/src/domain/types.ts` - TypeScript type definitions

#### Verified Full Flow
```
Customer Creation (verified)
    ↓
Bank Account Linking (active paykey)
    ↓
Charge Creation (scheduled → paid)
    ↓
Webhooks Received (customer.event.v1, paykey.event.v1, charge.event.v1)
```

### Frontend (Web) - ✅ Phase 3A Complete (UI Foundation)

**Completed Components:**

1. **Layout** ✅
   - `web/src/layout/SplitView.tsx` - 40% left panel, 60% dashboard
   - `web/src/layout/LeftPanel.tsx` - 15% terminal, 85% API log split
   - `web/src/layout/RightPanel.tsx` - Dashboard container

2. **Terminal Section** ✅
   - `web/src/components/Terminal.tsx` - UI shell (commands not wired yet)
   - `web/src/components/APILog.tsx` - Request log display with NerdCon logo background

3. **Dashboard Section** ✅
   - `web/src/components/dashboard/DashboardView.tsx` - Main layout
   - `web/src/components/dashboard/CustomerCard.tsx` - Identity modules, geolocation, risk scores
   - `web/src/components/dashboard/PaykeyCard.tsx` - Bank info, WALDO, customer name
   - `web/src/components/dashboard/ChargeCard.tsx` - Amount, payment rail, balance checks
   - `web/src/components/dashboard/PizzaTracker.tsx` - Horizontal charge lifecycle tracker

4. **Design System** ✅
   - Retro 8-bit aesthetic fully applied
   - Neon colors (cyan, blue, magenta, gold)
   - Card padding, borders, glow effects
   - Nerd Fonts icons (unicode symbols + react-icons)
   - NerdCon logo watermark in API log

5. **Utilities** ✅
   - `web/src/lib/nerd-icons.ts` - Icon mapping helpers
   - `web/src/lib/useGeolocation.ts` - IP geolocation hook (ip-api.com)
   - `web/src/components/ui/ChargeStatusIcon.tsx` - Status icon component
   - `web/src/components/ui/utils.ts` - cn() helper

**Integration Complete:**
- ✅ Terminal command parser (`web/src/lib/commands.ts`) - 412 lines
- ✅ State management (`web/src/lib/state.ts`) - 157 lines
- ✅ SSE connection (`web/src/lib/useSSE.ts`) - 118 lines
- ✅ Connection status indicator (`web/src/components/ConnectionStatus.tsx`) - 31 lines
- ✅ All dashboard cards connected to Zustand state
- ✅ Real-time updates via EventSource

---

## Phase 3B & 3C Implementation Summary

**Completed Features:**
1. ✅ Zustand state management (`web/src/lib/state.ts`)
2. ✅ Command parser with all handlers (`web/src/lib/commands.ts`)
3. ✅ Interactive terminal with history (`web/src/components/Terminal.tsx`)
4. ✅ Dashboard cards connected to state (all 4 cards)
5. ✅ SSE connection for real-time updates (`web/src/lib/useSSE.ts`)
6. ✅ Connection status indicator (`web/src/components/ConnectionStatus.tsx`)

**Commands Implemented:**
- `/help` - Show available commands
- `/create-customer [--outcome verified|review|rejected]` - Create customer
- `/create-paykey [plaid|bank] [--outcome active|inactive|rejected]` - Link bank
- `/create-charge [--amount <cents>] [--outcome paid|failed]` - Create charge
- `/demo` - Run full happy-path flow
- `/info` - Show current state
- `/reset` - Clear demo state
- `/clear` - Clear terminal

**Files Created:**
- `web/src/lib/state.ts` (157 lines)
- `web/src/lib/commands.ts` (412 lines)
- `web/src/lib/useSSE.ts` (118 lines)
- `web/src/components/ConnectionStatus.tsx` (31 lines)

**Files Modified:**
- `web/src/components/Terminal.tsx` - Made interactive
- `web/src/components/dashboard/CustomerCard.tsx` - Connected to state
- `web/src/components/dashboard/PaykeyCard.tsx` - Connected to state
- `web/src/components/dashboard/ChargeCard.tsx` - Connected to state
- `web/src/components/dashboard/PizzaTracker.tsx` - Connected to state
- `web/src/App.tsx` - Added SSE hook and connection status

**Total Implementation:** ~718 lines of new TypeScript code

---

## 🚀 Priority Roadmap

### Phase 3A: Frontend Layout ✅ COMPLETE

**Goal:** Build the split-screen foundation with retro 8-bit design

**Completed Tasks:**
1. ✅ Created split-view layout (40% left panel, 60% dashboard)
2. ✅ Applied retro design system with Tailwind config
3. ✅ Built all dashboard cards with placeholder data
4. ✅ Integrated Nerd Fonts icons (unicode + react-icons)
5. ✅ Added live geolocation lookup (ip-api.com)
6. ✅ Redesigned charge tracker to horizontal layout
7. ✅ Added NerdCon logo watermark to API log background
8. ✅ Fixed card padding and terminal compression

**Files Created:**
- `web/src/layout/SplitView.tsx`
- `web/src/layout/LeftPanel.tsx`
- `web/src/layout/RightPanel.tsx`
- `web/src/components/Terminal.tsx`
- `web/src/components/APILog.tsx`
- `web/src/components/dashboard/DashboardView.tsx`
- `web/src/components/dashboard/CustomerCard.tsx` (with modules, geolocation)
- `web/src/components/dashboard/PaykeyCard.tsx` (with WALDO, customer name)
- `web/src/components/dashboard/ChargeCard.tsx` (with payment rail, balance checks)
- `web/src/components/dashboard/PizzaTracker.tsx` (horizontal with status history)
- `web/src/lib/nerd-icons.ts`
- `web/src/lib/useGeolocation.ts`
- `web/src/components/ui/ChargeStatusIcon.tsx`
- `web/public/assets/nerdcon-logo.png`

**Design Features Implemented:**
- Neon colors: cyan (#00FFFF), blue (#0066FF), magenta (#FF0099), gold (#FFC300)
- Card borders with glow effects on hover
- Pixel-perfect spacing (p-8 on all cards)
- Terminal aesthetic with proper compression (15% height)
- Professional icons: Plus, Calendar, Clock, Dollar for charge statuses
- Pulsing globe icon for live geolocation
- 3% opacity logo watermark with lighten blend mode

**Deliverable:** ✅ Complete static UI shell with retro aesthetic and placeholder data

---

### Phase 3B: Terminal Commands & API Integration (NEXT - HIGH PRIORITY)

**Goal:** Wire up interactive command-line interface to backend API

**Tasks:**
1. ✅ Terminal UI already exists - wire up command input (enable disabled input)
2. Create command parser for terminal commands
3. Build HTTP client to call backend API (`http://localhost:3001/api/*`)
4. Add typewriter animation for command responses
5. Store command history with up/down arrow navigation
6. Display API responses in terminal output
7. Show "thinking..." states during API calls

**Files to Create:**
- `web/src/lib/commands.ts` - Command parser and executor
- `web/src/lib/api.ts` - HTTP client for backend routes
- Update `web/src/components/Terminal.tsx` - Wire up input handling

**Commands to Implement:**
```bash
/create-customer [--outcome verified|review|rejected]
  → POST /api/customers
  → Update state with customer ID

/create-paykey [plaid|bank] [--outcome active|inactive|rejected]
  → POST /api/bridge/bank-account OR /api/bridge/plaid
  → Store paykey token

/create-charge [--amount <cents>] [--outcome paid|failed]
  → POST /api/charges
  → Show charge ID and status

/demo                 # Run full happy-path flow (all 3 steps)
/info                 # Show current state (GET /api/state)
/reset                # Clear demo state (POST /api/reset)
/clear                # Clear terminal scrollback
/help                 # Show available commands
```

**API Endpoints to Call:**
- `POST /api/customers` - Create customer
- `POST /api/bridge/bank-account` - Link bank account
- `POST /api/charges` - Create charge
- `GET /api/state` - Get current demo state
- `POST /api/reset` - Reset demo

**Deliverable:** Functional terminal that creates customers/paykeys/charges via backend API

---

### Phase 3C: Dashboard Cards (HIGH PRIORITY)

**Goal:** Display real-time data from backend

**Tasks:**
1. Implement CustomerCard showing verification_status, risk_score
2. Implement PaykeyCard showing institution, balance, ownership
3. Implement ChargeCard showing amount, status, failure_reason
4. Implement PizzaTracker showing charge lifecycle steps
5. Connect to state from `/api/state` endpoint

**Data Sources:**
- Initial load: `GET /api/state`
- Live updates: EventSource on `/api/events/stream`

**Deliverable:** Live dashboard updating with API data

---

### Phase 3D: Real-time Updates (MEDIUM PRIORITY)

**Goal:** SSE integration for live updates

**Tasks:**
1. Set up EventSource connection to `/api/events/stream`
2. Implement Zustand state management
3. Handle webhook events to update cards in real-time
4. Add loading states and error handling

**Events to Handle:**
- `state:change` - Full state update
- `state:customer` - Customer updated
- `state:paykey` - Paykey updated
- `state:charge` - Charge updated
- `webhook` - Raw webhook event
- `state:reset` - Demo reset

**Deliverable:** Dashboard updates automatically via webhooks

---

### Phase 4: Polish & Demo Orchestration (MEDIUM PRIORITY)

**Goal:** Production-ready demo experience

**Tasks:**
1. Implement `/demo` command (auto-run full flow)
2. Add glitch effects, animations, scanlines
3. Error handling and edge cases
4. Performance optimization
5. Add loading states and feedback

**Deliverable:** Complete, polished demo ready for NerdCon

---

## 🔥 Critical Lessons Learned (DO NOT FORGET!)

### 1. Straddle SDK Response Structure
**All SDK responses are wrapped in a `.data` object:**

```typescript
const customer = await straddleClient.customers.create({...});

// ❌ WRONG:
const id = customer.id;

// ✅ CORRECT:
const id = customer.data.id;
```

**This applies to ALL SDK methods:** customers, paykeys, charges, bridge, etc.

### 2. Webhook Event Structure
Straddle webhooks use this format:

```typescript
{
  "event_type": "customer.event.v1",  // NOT "type"
  "event_id": "uuid",
  "account_id": "uuid",
  "data": { /* resource object */ }  // NOT "data.object"
}
```

Event naming pattern: `{resource}.{action}.v1`
- `customer.created.v1`, `customer.event.v1`
- `paykey.created.v1`, `paykey.event.v1`
- `charge.created.v1`, `charge.event.v1`

### 3. Paykey vs Paykey ID
The bridge response includes TWO important fields:

```typescript
const paykeyResponse = await straddleClient.bridge.link.bankAccount({...});

{
  data: {
    id: "019a80be-b183-...",           // Resource ID (for GET requests)
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
  paykey: "758c519d.02.2c16f91...",  // Use token
  amount: 5000,
  description: "Payment",
  // ...
});
```

### 4. Required Fields

**Charges MUST include:**
- `paykey` (the token, not ID)
- `amount` (in cents)
- `description` (string, cannot be empty)
- `currency` (e.g., "USD")
- `consent_type` ("internet" for sandbox)
- `device.ip_address`
- `payment_date` (YYYY-MM-DD format)

**Customers MUST include:**
- `name`
- `type` ("individual" or "business")
- `email` (must be unique - auto-generate with timestamp)
- `phone`
- `device.ip_address`

### 5. SDK Method Naming
SDK uses **camelCase**, not snake_case:

```typescript
// ✅ CORRECT:
await straddleClient.bridge.link.bankAccount({...});

// ❌ WRONG:
await straddleClient.bridge.link.bank_account({...});
```

### 6. Environment Configuration
Required in `server/.env`:
```bash
STRADDLE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # JWT token
STRADDLE_ENV=sandbox
PORT=3001
NGROK_URL=https://your-ngrok-id.ngrok-free.dev
PLAID_PROCESSOR_TOKEN=processor-sandbox-xxx-your-token
```

---

## 📁 Key File Locations

### Backend (Complete)
```
server/
├── src/
│   ├── index.ts              # Express app entry
│   ├── config.ts             # Environment variables
│   ├── sdk.ts                # Straddle client factory
│   ├── middleware/
│   │   └── tracing.ts        # Request IDs, correlation, idempotency
│   ├── domain/
│   │   ├── state.ts          # In-memory demo state (EventEmitter)
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── events.ts         # SSE broadcaster
│   │   └── logs.ts           # Request/response logging
│   └── routes/
│       ├── customers.ts      # Customer + identity routes
│       ├── bridge.ts         # Bank account linking routes
│       ├── paykeys.ts        # Paykey management routes
│       ├── charges.ts        # Payment routes
│       ├── webhooks.ts       # Webhook receiver
│       └── state.ts          # Demo state routes
└── .env                      # API keys, config
```

### Frontend (To Be Built)
```
web/
├── src/
│   ├── App.tsx               # Main app (currently placeholder)
│   ├── main.tsx              # Entry point
│   ├── layout/
│   │   └── SplitView.tsx     # 40/60 terminal/dashboard split (NOT BUILT)
│   ├── components/
│   │   ├── Terminal.tsx      # Command interface (NOT BUILT)
│   │   ├── RequestLog.tsx    # API log display (NOT BUILT)
│   │   └── dashboard/
│   │       ├── CustomerCard.tsx    # Identity status (NOT BUILT)
│   │       ├── PaykeyCard.tsx      # Bank info (NOT BUILT)
│   │       ├── ChargeCard.tsx      # Payment status (NOT BUILT)
│   │       └── PizzaTracker.tsx    # Lifecycle viz (NOT BUILT)
│   └── lib/
│       ├── api.ts            # HTTP client (NOT BUILT)
│       ├── commands.ts       # Command parser (NOT BUILT)
│       └── state.ts          # Zustand store (NOT BUILT)
```

### Design Assets (Available)
```
design/
├── retro-design-system.ts    # Tailwind tokens, colors, fonts
├── retro-components.tsx      # Pre-built React components
└── retro-styles.css          # Global animations, effects
```

---

## 🧪 Testing the Backend

### Quick Health Check
```bash
curl http://localhost:3001/health
```

### Full Flow Test
```bash
# 1. Create customer
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test.'$(date +%s)'@example.com","outcome":"verified"}'
# Response: { "id": "...", "verification_status": "verified" }

# 2. Link bank account (get customer_id from step 1)
curl -X POST http://localhost:3001/api/bridge/bank-account \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"<CUSTOMER_ID>","outcome":"active"}'
# Response: { "id": "...", "paykey": "TOKEN...", "status": "active" }

# 3. Create charge (use paykey TOKEN from step 2)
curl -X POST http://localhost:3001/api/charges \
  -H "Content-Type: application/json" \
  -d '{"paykey":"<PAYKEY_TOKEN>","amount":5000,"description":"Test charge","outcome":"paid"}'
# Response: { "id": "...", "status": "created", "amount": 5000 }

# 4. Check state
curl http://localhost:3001/api/state
# Response: { "customer": {...}, "paykey": {...}, "charge": {...} }

# 5. Reset for next test
curl -X POST http://localhost:3001/api/reset
```

---

## 📚 Documentation References

- **CLAUDE.md** - Comprehensive project guidelines
- **Straddle MCP**: https://docs.straddle.com/mcp
- **API Overview**: https://docs.straddle.com/llms.txt
- **Node SDK**: https://github.com/straddleio/straddle-node
- **Webhook Docs**: https://www.svix.com/event-types/us/org_2n72kASOjdYaDUyohRqiT6VQURc/

---

## 🎬 For Next Claude Session

**Start here:**

1. Read this file (`NEXT_STEPS.md`) to understand current status
2. Review `CLAUDE.md` for project guidelines
3. Read `design/README.md` for retro design system usage
4. Start with **Phase 3A: Frontend Layout** (highest priority)
5. Reference backend routes in `server/src/routes/` for API integration

**First task:**
Create `web/src/layout/SplitView.tsx` with retro 8-bit aesthetic using the design system from `design/retro-design-system.ts`.

**Remember:**
- Backend is 100% complete and tested
- Focus ONLY on frontend UI
- Do NOT modify backend routes (they work perfectly)
- Use real API calls to `http://localhost:3001/api/*`
- Apply retro gaming aesthetic throughout

---

**Status:** Backend production-ready. Frontend is blank canvas. Let's build the UI! 🚀
