# Straddle NerdCon Demo

Interactive demo showcasing **modern ACH payments** with real-time identity verification, instant account connectivity, and payment processing visibility.

Built with Straddle's unified fintech platform to demonstrate how cryptographically-linked paykeys deliver instant rail speed with card-level reliability.

![Demo Screenshot](./design/screenshot.png)

## What This Demo Does

Experience the future of ACH payments through a retro-styled split-screen interface:

- **Left Panel**: CLI-style terminal with interactive commands + real-time API request log
- **Right Panel**: Live dashboard showing customer verification, bank linking, and payment status
- **Real Data**: All API calls use Straddle's sandbox environment (no mocking)
- **Instant Updates**: Server-Sent Events (SSE) provide real-time status changes

### The Problem We're Solving

Traditional ACH runs on 1970s infrastructure—systematic delays, zero visibility, too much fraud. New instant rails lack the controls needed to scale safely.

### Straddle's Approach

Cryptographically-linked tokens ("paykeys") that marry identity to open banking, delivering instant rail speed with card-level reliability.

## Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Straddle sandbox API key ([sign up here](https://dashboard.straddle.com))

### Installation

**1. Clone and install**

```bash
git clone https://github.com/hello-keith/nerdcon.git
cd nerdcon
npm install
```

**2. Configure your API key**

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and add your Straddle API key:

```env
STRADDLE_API_KEY=your_sandbox_key_here
STRADDLE_ENV=sandbox
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

**3. Start the demo**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Using the Demo

### Terminal Commands

Type these commands in the browser terminal:

| Command | Description |
|---------|-------------|
| `/demo` | Run complete flow (customer → bank → payment) |
| `/create-customer` | Create and verify a customer identity |
| `/customer-KYC` | Create customer with full KYC validation |
| `/create-paykey` | Link a bank account |
| `/create-charge` | Process a payment |
| `/info` | Show current demo state |
| `/reset` | Clear all data and start fresh |
| `/help` | Show all available commands |

### Example Session

```
> /demo
Creating verified customer...
✓ Customer created: Alberta Bobbeth Charleson
✓ Identity verified (risk score: 12)
✓ Bank account linked: Chase Bank ****1234
✓ Payment processed: $50.00 (PAID)

Demo complete! Watch the dashboard for real-time updates.
```

## Architecture

This demo uses real Straddle API calls in sandbox mode—no mocks, just deterministic outcomes via `sandbox_outcome` parameters.

### Tech Stack

**Backend**:
- Node.js 18+ with TypeScript
- Express.js REST API
- [@straddlecom/straddle](https://www.npmjs.com/package/@straddlecom/straddle) - Official Straddle SDK
- Server-Sent Events for real-time updates

**Frontend**:
- React 18 + TypeScript
- Vite for fast dev server and builds
- Tailwind CSS with custom retro 8-bit theme
- Zustand for state management

**Design**:
- Retro gaming aesthetic (cyan neon, scanlines, CRT effects)
- Split-screen layout optimized for live demos
- Real-time API request visualization

### Project Structure

```
nerdcon/
├── server/          # Express backend with Straddle SDK
│   └── src/
│       ├── routes/  # API endpoints (customers, paykeys, charges)
│       └── domain/  # State management and types
├── web/             # React frontend
│   └── src/
│       ├── components/  # Terminal, dashboard cards, UI
│       └── lib/         # Commands, state, API client
└── design/          # Design system and assets
```

## API Integration

This demo showcases Straddle's core APIs:

### Customer Identity Verification

```typescript
const customer = await straddle.customers.create({
  name: "Alberta Bobbeth Charleson",
  type: "individual",
  email: "alberta@example.com",
  phone: "+12125550123",
  device: { ip_address: "192.168.1.1" },
  config: { sandbox_outcome: "verified" }
});
```

### Bank Account Linking (Paykeys)

```typescript
const paykey = await straddle.bridge.link.bankAccount({
  customer_id: "customer_id",
  account_number: "123456789",
  routing_number: "021000021",
  account_type: "checking",
  config: { sandbox_outcome: "active" }
});
```

### Payment Processing

```typescript
const charge = await straddle.charges.create({
  paykey: "paykey_token",
  amount: 5000,  // $50.00 in cents
  description: "Payment",
  currency: "USD",
  consent_type: "internet",
  payment_date: "2024-01-15",
  config: { sandbox_outcome: "paid" }
});
```

### Sandbox Outcomes

Control deterministic behavior with `config.sandbox_outcome`:

| Resource | Outcomes | Description |
|----------|----------|-------------|
| **Customers** | `standard`, `verified`, `review`, `rejected` | Control customer verification status |
| **Paykeys** | `standard`, `active`, `rejected` | Define paykey authorization states |
| **Charges** | `standard`, `paid`, `on_hold_daily_limit`, `cancelled_for_fraud_risk`, `cancelled_for_balance_check`, `failed_insufficient_funds`, `failed_customer_dispute`, `failed_closed_bank_account`, `reversed_insufficient_funds`, `reversed_customer_dispute`, `reversed_closed_bank_account` | Simulate various payment outcomes |

**Success Scenarios:**
- `standard` - Normal processing (all resources)
- `paid` - Successful payment (charges)

**Hold and Cancellation:**
- `on_hold_daily_limit` - Held due to daily limits
- `cancelled_for_fraud_risk` - Cancelled for fraud detection
- `cancelled_for_balance_check` - Cancelled due to balance check

**Failure Scenarios:**
- `failed_insufficient_funds` - NSF (R01)
- `failed_customer_dispute` - Dispute (R05)
- `failed_closed_bank_account` - Closed account (R02)

**Reversal Scenarios:**
- `reversed_insufficient_funds` - Paid then reversed for NSF (R01)
- `reversed_customer_dispute` - Paid then reversed for dispute (R05)
- `reversed_closed_bank_account` - Paid then reversed for closed account (R02)

## Development

### Available Scripts

```bash
npm run dev          # Start both server and web
npm run build        # Build production bundles
npm run type-check   # TypeScript validation
npm run lint         # ESLint checking
npm run format       # Prettier formatting
```

### Environment Variables

Only the backend requires configuration:

```env
STRADDLE_API_KEY     # Your Straddle sandbox API key (required)
STRADDLE_ENV         # "sandbox" or "production" (default: sandbox)
PORT                 # Backend port (default: 4000)
CORS_ORIGIN          # Frontend URL (default: http://localhost:5173)
```

The frontend has no environment variables—all API calls proxy through the backend for security.

## Resources

- **Straddle Documentation**: [docs.straddle.com](https://docs.straddle.com/)
- **API Reference**: [docs.straddle.com/llms.txt](https://docs.straddle.com/llms.txt)
- **Node SDK**: [github.com/straddleio/straddle-node](https://github.com/straddleio/straddle-node)
- **Developer Guide**: See [CLAUDE.md](./CLAUDE.md) for implementation details

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Questions?

- Check the [Developer Guide](./CLAUDE.md) for technical details
- Visit [docs.straddle.com](https://docs.straddle.com/) for API documentation
- Explore the code—it's designed to be readable and educational!

---

Built with ⚡ by the Straddle team for Fintech NerdCon
