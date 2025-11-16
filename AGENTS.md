# Repository Guidelines

## Project Structure & Module Organization
This npm-workspace repo splits into `server/` (Express + Straddle SDK) and `web/` (React/Vite UI). Server code lives under `server/src` with `routes/` for HTTP handlers, `domain/` for demo state + SSE events, `middleware/` for tracing, and `config.ts` for env wiring. Frontend logic stays in `web/src/components`, `layout`, and `lib/commands`, while global styles sit in `web/src/styles` and Tailwind config. Demo notes, assets, and manual reports live in `docs/` and `design/`; keep exploratory logs inside `docs/testing`.

## Build, Test, and Development Commands
Run `npm run dev` to boot both workspaces (API on :3001, Vite on :5173). `npm run build` compiles everything, while `npm run build:server` or `npm run build:web` target individual packages. Use `npm run type-check`, `npm run lint`, and `npm run format` before pushing. For single-surface debugging, run `npm run dev --workspace=server` or `npm run dev --workspace=web`; after a build, start the backend with `npm run start --workspace=server`.

## Coding Style & Naming Conventions
TypeScript + ES Modules are mandatory. Prettier enforces 2-space indent, single quotes, and trailing commas; ESLint handles import order and safety rules. Name React components with PascalCase (`Terminal.tsx`), colocate UI logic near the component, and reserve `web/src/lib` for hooks/utilities. Backend filenames stay lower-case descriptive (`customers.ts`). Prefer async/await, typed request handlers, and module-scoped config rather than inline literals.

## Testing Guidelines
No automated suite ships yet; regression scripts are documented in `docs/testing/*.md`. Smoke-test `/demo` plus targeted CLI commands in the in-browser terminal and watch the Express logs before opening a PR. If you add automated tests, colocate them as `*.spec.ts` beside the source, stub Straddle SDK calls, and wire a new `npm test` script so CI can run it.

## Commit & Pull Request Guidelines
History follows Conventional Commits (`feat(cards): ...`, `docs: ...`). Use imperative subject lines, scope changes when it helps reviewers, and mention tickets or Notion URLs in the footer. PRs should summarize behavior changes, list manual or automated test evidence (screenshots, CLI transcripts), call out env-variable additions, and request reviewers once both workspaces build cleanly.

## Configuration & Security Tips
Copy `server/.env.example` to `.env` and keep keys local. `server/src/config.ts` sets allowed CORS origins—lock it down when demoing outside localhost. SSE broadcasting runs in memory, so restarts wipe `stateManager`; warn demo operators and reset via `/reset` when needed.
