# Straddle NerdCon Demo

**Status:** ✅ Production Ready | **Phase:** 4/4 Complete | **Build:** Passing

Live demo application showcasing Straddle's unified fintech platform with real-time identity verification, account connectivity, and payment processing.

## Project Structure

```
.
├── server/          # Node.js/Express backend with Straddle SDK
├── web/             # React/Vite frontend with retro gaming UI
├── design/          # Retro 8-bit design system assets
└── DEVELOPMENT-PLAN.md   # Detailed implementation roadmap
```

## Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Straddle sandbox API key ([get one here](https://dashboard.straddle.com))

### Installation

1. **Clone and install dependencies**

```bash
npm install
```

2. **Configure environment variables**

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and add your Straddle API key:

```env
STRADDLE_API_KEY=sk_sandbox_your_key_here
STRADDLE_ENV=sandbox
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

3. **Start the development servers**

```bash
# From project root - runs both server and web
npm run dev

# Or run individually:
npm run dev:server  # Backend on http://localhost:4000
npm run dev:web     # Frontend on http://localhost:5173
```

## Architecture

**Data Flow**: Browser UI → Demo Server (Express) → Straddle Sandbox API

**Key Principle**: All Straddle API calls use the real sandbox API via `@straddlecom/straddle` Node SDK. No mocking - only `sandbox_outcome` for deterministic simulation.

### Backend Stack

- **Node.js** ≥18 with TypeScript
- **Express** for REST endpoints
- **@straddlecom/straddle** v0.2.1 - Official Straddle SDK
- **uuid** - Request tracing headers
- **dotenv** - Environment configuration

### Frontend Stack

- **React 18** + TypeScript + Vite
- **Tailwind CSS** with retro 8-bit gaming theme
- **Zustand** - State management
- **EventSource** - SSE for real-time webhook updates

### Design System

Retro 8-bit gaming aesthetic with:
- **Colors**: Cyan (#00FFFF), Blue (#0066FF), Magenta (#FF0099), Gold (#FFC300)
- **Effects**: Neon glow, pixel borders, scanlines, CRT distortion, glitch text
- **Components**: Pre-built in `/design/` directory

## Development

### Available Scripts

**Root level:**
- `npm run dev` - Start both server and web in parallel
- `npm run build` - Build both workspaces
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier

**Server workspace:**
- `npm run dev:server` - Start server with hot reload
- `npm run build:server` - Build TypeScript to dist/
- `npm run type-check` - Type check without emitting

**Web workspace:**
- `npm run dev:web` - Start Vite dev server
- `npm run build:web` - Production build
- `npm run preview` - Preview production build

### Project Status

**Phase 1: Monorepo Infrastructure Setup** ✅ COMPLETE
- [x] Monorepo structure with workspaces
- [x] Backend scaffold with Straddle SDK
- [x] Frontend scaffold with Vite + React
- [x] Shared tooling (ESLint, Prettier, TypeScript)

**Phase 2: Backend - Straddle SDK Integration** ✅ COMPLETE
- [ ] SDK client setup with request tracing
- [ ] Data models for Customer, Paykey, Charge
- [ ] Core API routes
- [ ] Real-time updates via SSE

**Phase 3: Frontend - Retro UI** ✅ COMPLETE
- [ ] Split-screen layout
- [ ] Terminal component with command parser
- [ ] API request log display
- [ ] Dashboard cards (Customer, Paykey, Charge, Pizza Tracker)

**Phase 4: Integration & Polish** ✅ COMPLETE
- [ ] Connect frontend to backend
- [ ] Demo orchestration (`/demo` command)
- [ ] Visual polish and animations
- [ ] Error handling

See [DEVELOPMENT-PLAN.md](./DEVELOPMENT-PLAN.md) for detailed roadmap.

## Straddle SDK Integration

### Client Initialization

```typescript
import Straddle from '@straddlecom/straddle';

const client = new Straddle({
  apiKey: process.env.STRADDLE_API_KEY,
  environment: 'sandbox'
});
```

### Sandbox Simulation

Use `config.sandbox_outcome` for deterministic behavior:

**Customers**: `verified`, `review`, `rejected`
**Paykeys**: `active`, `inactive`, `rejected`
**Charges**: `paid`, `failed`, `reversed_insufficient_funds`, `on_hold_daily_limit`, `cancelled_for_fraud_risk`

Example:
```typescript
const customer = await client.customers.create({
  name: 'Alberta Bobbeth Charleson',
  type: 'individual',
  email: 'alberta@example.com',
  phone: '+12125550123',
  device: { ip_address: '192.168.1.1' },
  config: { sandbox_outcome: 'verified' }
});
```

## Resources

- **Straddle Documentation**: https://docs.straddle.com/
- **Node SDK**: https://github.com/straddleio/straddle-node
- **MCP Server**: https://docs.straddle.com/mcp
- **API Overview**: https://docs.straddle.com/llms.txt
- **Project Guide**: [CLAUDE.md](./CLAUDE.md)

## Demo Concept

**The Problem**: ACH runs on 1970s infrastructure with systematic delays, zero visibility, and too much fraud. New instant rails lack the controls needed to scale safely.

**Straddle's Solution**: Cryptographically-linked tokens ("paykeys") that marry identity to open banking, delivering instant rail speed with card-level reliability.

**This Demo**: Split-screen interface with CLI-style terminal and real-time dashboard showing customer identity verification, account connectivity, and payment processing with instant visibility.

## License

Private - Fintech NerdCon Demo
