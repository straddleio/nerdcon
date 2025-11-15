# Changelog

Recent notable changes to the Straddle NerdCon Demo.

For full development history, see [`docs/archive/CHANGELOG_FULL.md`](docs/archive/CHANGELOG_FULL.md).

## [Current] - Production Ready ✅

**Status**: All features complete and tested

### Latest Features
- ✅ KYC customer request with validation cards (`/customer-KYC` command)
- ✅ Address watchlist match display
- ✅ Request/response logging with tracing headers
- ✅ Interactive terminal with 8 commands
- ✅ Real-time dashboard updates via SSE
- ✅ Full Straddle SDK integration

### Stack
- **Backend**: Node.js 18+, Express, TypeScript, `@straddlecom/straddle` SDK
- **Frontend**: React 18, Vite, TypeScript, Zustand, Tailwind CSS
- **Design**: Retro 8-bit gaming aesthetic

### Quick Start
```bash
npm install
cd server && cp .env.example .env  # Add STRADDLE_API_KEY
npm run dev  # http://localhost:5173
```

Type `/demo` in the terminal to see the full flow.

## Documentation

- **Developer Guide**: [`CLAUDE.md`](CLAUDE.md) - Essential development info
- **User Guide**: [`README.md`](README.md) - Project overview and quick start
- **Full History**: [`docs/archive/CHANGELOG_FULL.md`](docs/archive/CHANGELOG_FULL.md)
- **Implementation Plans**: [`docs/archive/plans/`](docs/archive/plans/)
- **Test Reports**: [`docs/archive/testing/`](docs/archive/testing/)
