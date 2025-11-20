# Straddle NerdCon Demo

Interactive demo showcasing modern ACH payments with real-time identity verification, instant account connectivity, and payment processing visibility.

Built with Straddle's unified fintech platform to demonstrate how cryptographically-linked paykeys deliver instant rail speed with card-level reliability.

## What This Demo Does

Experience the future of ACH payments through a retro-styled split-screen interface:

- **Left Panel**: CLI-style terminal with interactive commands and real-time API request logs
- **Right Panel**: Live dashboard showing customer verification, bank linking, and payment status
- **Real Integration**: All API calls use Straddle's sandbox environment (no mocking, deterministic outcomes)
- **Instant Updates**: Server-Sent Events (SSE) provide real-time status changes

### The Problem We're Solving

Traditional ACH runs on 1970s infrastructure—systematic delays, zero visibility, too much fraud. New instant rails lack the controls needed to scale safely.

### Straddle's Approach

Cryptographically-linked tokens ("paykeys") that marry identity to open banking, delivering instant rail speed with card-level reliability.

## Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Python 3.x (for paykey generator service)
- `b3sum` (BLAKE3 command-line tool)
  - Arch Linux: `sudo pacman -S b3sum` or `yay -S b3sum`
  - macOS: `brew install b3sum`
  - Ubuntu/Debian: `cargo install b3sum` (requires Rust)
- Straddle sandbox API key ([sign up here](https://dashboard.straddle.com))

### Installation

**1. Clone and install**

```bash
git clone https://github.com/straddleio/nerdcon-demo.git
cd nerdcon-demo
npm install
```

**2. Configure your API key**

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and add your Straddle API key:

```env
# Required
STRADDLE_API_KEY=sk_sandbox_your_key_here
STRADDLE_ENV=sandbox

# Optional - defaults shown
PORT=3001
CORS_ORIGIN=http://localhost:5173
GENERATOR_URL=http://localhost:8081

# Webhook configuration (optional for local dev)
WEBHOOK_SECRET=your_webhook_secret_here
NGROK_URL=https://your-ngrok-id.ngrok.io

# Feature toggles (safe defaults for open source)
ENABLE_UNMASK=false
ENABLE_LOG_STREAM=false
```

**3. Start the demo**

```bash
cd ..
npm run dev
```

This starts three services concurrently:
- Express backend (port 3001)
- React frontend (port 5173)
- Paykey generator service (port 8081)

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Using the Demo

### Terminal Commands

Type these commands in the browser terminal:

| Command | Description |
|---------|-------------|
| `/demo` | Run complete flow (customer → bank → payment) |
| `/customer-create` | Create and verify a customer identity |
| `/customer-KYC` | Create customer with full KYC validation |
| `/create-paykey` | Link a bank account (supports Plaid or manual entry) |
| `/paykey-review` | Show review details for current paykey |
| `/paykey-decision approve\|reject` | Approve or reject paykey in review |
| `/create-charge` | Process a payment |
| `/outcomes` | Show all available sandbox outcome values |
| `/info` | Show current demo state (IDs, status) |
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

### Webhooks (Optional)

To test webhook functionality:

1. **Set up ngrok or similar tunnel:**
   ```bash
   ngrok http 3001
   ```

2. **Configure webhook in Straddle dashboard:**
   - Point to: `https://your-ngrok-id.ngrok.io/api/webhooks/straddle`
   - Get your webhook secret from the dashboard

3. **Update `.env`:**
   ```env
   WEBHOOK_SECRET=whsec_xxx_from_straddle
   NGROK_URL=https://your-ngrok-id.ngrok.io
   ```

Webhooks use Svix signature verification. Requests with missing or invalid signatures are rejected before any state changes.

### Feature Toggles

The demo includes feature flags with safe defaults for open-source:

- `ENABLE_UNMASK=false` - Hides customer unmask functionality. Only enable if your API key has `show_sensitive` permissions.
- `ENABLE_LOG_STREAM=false` - Disables verbose developer log stream. Set to `true` for internal demos.

These flags are returned by `/api/config` and automatically applied in the UI.

## Architecture

This demo uses real Straddle API calls in sandbox mode—no mocks, just deterministic outcomes via `sandbox_outcome` parameters.

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

### Tech Stack

**Backend:**
- Node.js 18+ with TypeScript
- Express.js REST API
- [@straddlecom/straddle](https://www.npmjs.com/package/@straddlecom/straddle) v0.3.0 - Official Straddle SDK
- Server-Sent Events for real-time updates
- Svix for webhook signature verification

**Frontend:**
- React 18 + TypeScript
- Vite for fast dev server and builds
- Tailwind CSS with custom retro 8-bit theme
- Zustand for state management
- Straddle Bridge React SDK for Plaid integration

**Design:**
- Retro gaming aesthetic (cyan neon, scanlines, CRT effects)
- Split-screen layout optimized for live demos
- Real-time API request visualization with syntax highlighting

### Project Structure

```
nerdcon-demo/
├── server/              # Express backend with Straddle SDK
│   └── src/
│       ├── routes/      # API endpoints (customers, paykeys, charges, webhooks)
│       ├── domain/      # State management and types
│       ├── middleware/  # Request tracing, error handling
│       └── __tests__/   # Jest tests with >80% coverage
├── web/                 # React frontend
│   └── src/
│       ├── components/  # Terminal, dashboard cards, UI components
│       ├── lib/         # Commands parser, state, API client
│       └── __tests__/   # Vitest tests with >80% coverage
├── paykey-generator/    # Python service for generating paykeys
└── design/              # Design system and retro components
```

## API Integration Examples

This demo showcases Straddle's core APIs using SDK v0.3.0:

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

// Access response data
console.log(customer.data.id);
console.log(customer.data.verification_status);
console.log(customer.data.risk_score);
```

### Bank Account Linking (Paykeys)

```typescript
const paykey = await straddle.bridge.link.bankAccount({
  customer_id: "cus_xxx",
  account_number: "123456789",
  routing_number: "021000021",
  account_type: "checking",
  config: { sandbox_outcome: "active" }
});

// IMPORTANT: Two different fields!
console.log(paykey.data.id);      // Resource ID for GET /paykeys/:id
console.log(paykey.data.paykey);  // TOKEN for charges.create - USE THIS!
```

### Payment Processing

```typescript
const charge = await straddle.charges.create({
  paykey: "758c519d.02.2c16f91...",  // Use TOKEN, not ID!
  amount: 5000,  // $50.00 in cents
  description: "Payment for services",
  currency: "USD",
  consent_type: "internet",
  payment_date: "2024-01-15",
  device: { ip_address: "192.168.1.1" },
  config: {
    balance_check: "enabled",
    sandbox_outcome: "paid"
  }
});
```

### Sandbox Outcomes

Control deterministic behavior with `config.sandbox_outcome`:

| Resource | Outcomes |
|----------|----------|
| **Customers** | `standard`, `verified`, `review`, `rejected` |
| **Paykeys** | `standard`, `active`, `review`, `rejected` |
| **Charges** | `standard`, `paid`, `on_hold_daily_limit`, `cancelled_for_fraud_risk`, `cancelled_for_balance_check`, `failed_insufficient_funds`, `failed_customer_dispute`, `failed_closed_bank_account`, `reversed_insufficient_funds`, `reversed_customer_dispute`, `reversed_closed_bank_account` |

See `/outcomes` command in the terminal for detailed descriptions of each outcome.

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start both server and web
npm run dev:server       # Server only (port 3001)
npm run dev:web          # Web only (port 5173)

# Building
npm run build            # Build both workspaces
npm run build:server     # Build server only
npm run build:web        # Build web only

# Code quality
npm run lint             # ESLint all workspaces
npm run format           # Prettier formatting
npm run type-check       # TypeScript validation

# Testing
npm test --workspace=server      # Run server tests (Jest)
npm test --workspace=web         # Run web tests (Vitest)
npm run test:coverage            # Run tests with coverage report
```

### Running Tests

Both workspaces have comprehensive test coverage (>80%):

```bash
# Server tests (Jest)
cd server
npm test

# Web tests (Vitest)
cd web
npm test

# Coverage reports
npm run test:coverage
```

### Pre-commit Hooks

The project uses Husky and lint-staged for pre-commit checks:

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking

To bypass (not recommended):
```bash
git commit --no-verify
```

## Deployment

### Render (Recommended)

**Backend:**
1. Create new Web Service
2. Build command: `npm install && npm run build:server`
3. Start command: `npm run start:server`
4. Environment variables:
   ```
   STRADDLE_API_KEY=sk_sandbox_xxx
   STRADDLE_ENV=sandbox
   CORS_ORIGIN=https://your-frontend-url.com
   WEBHOOK_SECRET=whsec_xxx
   ENABLE_UNMASK=false
   ENABLE_LOG_STREAM=false
   ```

**Frontend:**
1. Create new Static Site
2. Build command: `npm install && npm run build:web`
3. Publish directory: `web/dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

**Webhooks:**
- Configure in Straddle dashboard: `https://your-backend-url.onrender.com/api/webhooks/straddle`

## Resources

- **Straddle Documentation**: [docs.straddle.com](https://docs.straddle.com/)
- **API Reference**: [docs.straddle.com/llms.txt](https://docs.straddle.com/llms.txt)
- **Node SDK**: [github.com/straddleio/straddle-node](https://github.com/straddleio/straddle-node)
- **Developer Guide**: See [CLAUDE.md](./CLAUDE.md) for detailed implementation guide

## Contributing

Contributions are welcome! Please read the [Developer Guide](./CLAUDE.md) for:
- Code architecture and patterns
- Testing guidelines
- Common development tasks
- Troubleshooting tips

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Questions?

- Check the [Developer Guide](./CLAUDE.md) for technical details
- Visit [docs.straddle.com](https://docs.straddle.com/) for API documentation
- Open an issue for bugs or feature requests
- The code is designed to be readable and educational - explore it!

---

Built with ⚡ by the Straddle team
