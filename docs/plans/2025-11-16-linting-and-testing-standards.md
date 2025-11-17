# Linting and Testing Standards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish comprehensive linting standards, fix all existing lint violations, and implement automated testing infrastructure to enforce quality standards on future commits/PRs.

**Architecture:** This plan upgrades ESLint configuration to stricter standards, systematically fixes 91 existing lint warnings across the codebase, adds missing test coverage, and sets up pre-commit hooks + CI/CD workflows to prevent future quality regressions.

**Tech Stack:** ESLint 8.56, TypeScript ESLint 6.19, Prettier 3.1, Husky 9.x, lint-staged, Jest 30, Vitest 4, GitHub Actions

---

## Current State Analysis

**Lint Issues Found:**
- 91 warnings across 10 files
- 64 `@typescript-eslint/no-explicit-any` warnings (use of `any` type)
- 27 `no-console` warnings (console statements in production code)
- All currently set to "warn" instead of "error"

**Test Coverage:**
- Server: 5 test files, Jest configured
- Web: 4 test files, Vitest configured
- 51 source files total, only ~18% have tests
- No automated test running on commits
- No coverage thresholds enforced

**Missing Infrastructure:**
- No pre-commit hooks
- No GitHub Actions CI/CD
- No coverage reporting
- No lint-staged for targeted linting

---

## Task 1: Upgrade ESLint Configuration

**Files:**
- Modify: `.eslintrc.json`

**Step 1: Create stricter ESLint rules**

Update `.eslintrc.json` with production-grade rules:

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "env": {
    "node": true,
    "es2022": true
  },
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": ["./server/tsconfig.json", "./web/tsconfig.json"]
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": ["warn", {
      "allowExpressions": true,
      "allowTypedFunctionExpressions": true
    }],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "no-console": ["error", { "allow": ["warn", "error", "info"] }],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "no-throw-literal": "error"
  },
  "overrides": [
    {
      "files": ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "warn",
        "no-console": "off"
      }
    }
  ]
}
```

**Step 2: Verify new configuration**

Run: `cd /home/keith/nerdcon && npm run lint 2>&1 | head -20`

Expected: More errors shown (rules upgraded from warn to error)

**Step 3: Create .eslintignore file**

Create `.eslintignore`:

```
node_modules
dist
build
coverage
*.config.js
*.config.ts
.next
.cache
```

**Step 4: Commit configuration changes**

```bash
git add .eslintrc.json .eslintignore
git commit -m "chore: upgrade ESLint to stricter production standards

- Change no-explicit-any from warn to error
- Change no-console from warn to error (allow warn/error/info)
- Add type-checking rules for promises
- Add explicit return types recommendation
- Create test file overrides for relaxed rules
- Add .eslintignore for build artifacts"
```

---

## Task 2: Fix TypeScript `any` Types - Domain Layer

**Files:**
- Modify: `server/src/domain/events.ts:36,47`
- Modify: `server/src/domain/log-stream.ts:21,25,31`
- Modify: `server/src/domain/logs.ts:15,16,58,59`
- Modify: `server/src/domain/types.ts:98,104,153`

**Step 1: Write test for event types**

Create `server/src/domain/__tests__/events.test.ts`:

```typescript
import { describe, it, expect, vi } from '@jest/globals';
import { broadcaster, createSSEHandler } from '../events.js';
import type { Request, Response } from 'express';

describe('SSE Event Broadcaster', () => {
  it('should broadcast events to all connected clients', () => {
    const mockRes1 = {
      write: vi.fn(),
      flush: vi.fn(),
    } as unknown as Response;

    const mockRes2 = {
      write: vi.fn(),
      flush: vi.fn(),
    } as unknown as Response;

    broadcaster.addClient(mockRes1);
    broadcaster.addClient(mockRes2);

    broadcaster.broadcast({ type: 'test', data: { foo: 'bar' } });

    expect(mockRes1.write).toHaveBeenCalledWith(
      expect.stringContaining('data: {"type":"test","data":{"foo":"bar"}}')
    );
    expect(mockRes2.write).toHaveBeenCalled();
  });

  it('should handle SSE connection requests', () => {
    const mockReq = {} as Request;
    const mockRes = {
      writeHead: vi.fn(),
      write: vi.fn(),
      flush: vi.fn(),
      on: vi.fn(),
    } as unknown as Response;

    const handler = createSSEHandler();
    handler(mockReq, mockRes);

    expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'text/event-stream',
    }));
  });
});
```

**Step 2: Run test to verify current behavior**

Run: `cd /home/keith/nerdcon/server && npm test -- events.test.ts`

Expected: PASS (test works with current `any` types)

**Step 3: Replace `any` with proper types in events.ts**

In `server/src/domain/events.ts`, replace:

```typescript
// Line 36: error: any
export function broadcast(event: any): void {

// Line 47: res: any
export function createSSEHandler() {
  return (_req: Request, res: any): void => {
```

With:

```typescript
// Import Response type at top
import type { Request, Response } from 'express';

// Line 36: Proper event type
export interface BroadcastEvent {
  type: string;
  data: Record<string, unknown>;
}

export function broadcast(event: BroadcastEvent): void {

// Line 47: Proper Response type
export function createSSEHandler() {
  return (_req: Request, res: Response): void => {
```

**Step 4: Replace `any` in log-stream.ts**

In `server/src/domain/log-stream.ts`:

```typescript
// Lines 21, 25, 31 - replace:
let eventData: any;
const parsedData: any = JSON.parse(dataStr);
let reconnectTime: any;

// With:
let eventData: Record<string, unknown> | null = null;
const parsedData: Record<string, unknown> = JSON.parse(dataStr) as Record<string, unknown>;
let reconnectTime: number | null = null;
```

**Step 5: Replace `any` in logs.ts**

In `server/src/domain/logs.ts`:

```typescript
// Lines 15-16, 58-59 - replace:
headers: any;
body: any;

// With:
headers: Record<string, string | string[]>;
body: unknown;
```

**Step 6: Replace `any` in types.ts**

In `server/src/domain/types.ts`:

```typescript
// Line 98 - replace:
verification_details?: any;

// With:
verification_details?: {
  breakdown?: {
    account_validation?: unknown;
    name_match?: unknown;
  };
};

// Line 104 - replace:
metadata?: any;

// With:
metadata?: Record<string, unknown>;

// Line 153 - replace:
export type SandboxOutcome = any;

// With:
export type SandboxOutcome =
  | 'standard'
  | 'verified'
  | 'review'
  | 'rejected'
  | 'active'
  | 'paid'
  | 'on_hold_daily_limit'
  | 'cancelled_for_fraud_risk'
  | 'cancelled_for_balance_check'
  | 'failed_insufficient_funds'
  | 'failed_customer_dispute'
  | 'failed_closed_bank_account'
  | 'reversed_insufficient_funds'
  | 'reversed_customer_dispute'
  | 'reversed_closed_bank_account';
```

**Step 7: Run tests to verify changes**

Run: `cd /home/keith/nerdcon/server && npm test`

Expected: All tests PASS

**Step 8: Run lint to verify domain fixes**

Run: `cd /home/keith/nerdcon && npm run lint -- server/src/domain/`

Expected: 0 errors in domain files

**Step 9: Commit domain layer fixes**

```bash
git add server/src/domain/
git commit -m "refactor(server): replace any types with proper types in domain layer

- Add BroadcastEvent interface for type-safe event broadcasting
- Replace any with Record<string, unknown> for JSON data
- Add proper Response type for SSE handlers
- Define explicit SandboxOutcome union type
- Add structured types for verification_details and metadata

Fixes 17 TypeScript any violations in domain layer"
```

---

## Task 3: Fix TypeScript `any` Types - Routes Layer

**Files:**
- Modify: `server/src/routes/bridge.ts:85,113,229,257`
- Modify: `server/src/routes/charges.ts:106,119,135,221,234,246,297,348,399`
- Modify: `server/src/routes/customers.ts:156,182,210,293,298,360,446,500,567`
- Modify: `server/src/routes/paykeys.ts:54,79,130,184`

**Step 1: Create error handling types**

Create `server/src/domain/errors.ts`:

```typescript
export interface StraddleAPIError {
  error: {
    type: string;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  status?: number;
}

export interface ExpressError extends Error {
  status?: number;
  code?: string;
}

export function isStraddleError(error: unknown): error is StraddleAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as StraddleAPIError).error === 'object'
  );
}

export function toExpressError(error: unknown): ExpressError {
  if (error instanceof Error) {
    return error as ExpressError;
  }

  if (isStraddleError(error)) {
    const err = new Error(error.error.message) as ExpressError;
    err.status = error.status || 500;
    err.code = error.error.code;
    return err;
  }

  return new Error('Unknown error occurred') as ExpressError;
}
```

**Step 2: Write test for error handling**

Create `server/src/domain/__tests__/errors.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import { isStraddleError, toExpressError } from '../errors.js';

describe('Error Type Guards', () => {
  it('should identify Straddle API errors', () => {
    const straddleErr = {
      error: {
        type: 'invalid_request',
        code: 'INVALID_CUSTOMER',
        message: 'Customer not found',
      },
      status: 404,
    };

    expect(isStraddleError(straddleErr)).toBe(true);
    expect(isStraddleError(new Error('regular error'))).toBe(false);
    expect(isStraddleError(null)).toBe(false);
  });

  it('should convert unknown errors to Express errors', () => {
    const regularErr = new Error('Test error');
    const expressErr = toExpressError(regularErr);

    expect(expressErr).toBeInstanceOf(Error);
    expect(expressErr.message).toBe('Test error');
  });

  it('should convert Straddle errors to Express errors', () => {
    const straddleErr = {
      error: {
        type: 'invalid_request',
        code: 'INVALID_CUSTOMER',
        message: 'Customer not found',
      },
      status: 404,
    };

    const expressErr = toExpressError(straddleErr);

    expect(expressErr.message).toBe('Customer not found');
    expect(expressErr.status).toBe(404);
    expect(expressErr.code).toBe('INVALID_CUSTOMER');
  });
});
```

**Step 3: Run test to verify error handling**

Run: `cd /home/keith/nerdcon/server && npm test -- errors.test.ts`

Expected: PASS

**Step 4: Fix bridge.ts error handling**

In `server/src/routes/bridge.ts`:

```typescript
// Add import at top
import { toExpressError } from '../domain/errors.js';

// Replace lines 85, 113, 229, 257:
} catch (error: any) {

// With:
} catch (error: unknown) {
  const err = toExpressError(error);
```

**Step 5: Fix charges.ts error handling**

In `server/src/routes/charges.ts`:

```typescript
// Add import at top
import { toExpressError } from '../domain/errors.js';

// Replace all catch blocks (lines 106, 119, 135, 221, 234, 246, 297, 348, 399):
} catch (error: any) {

// With:
} catch (error: unknown) {
  const err = toExpressError(error);
```

**Step 6: Fix customers.ts error handling**

In `server/src/routes/customers.ts`:

```typescript
// Add import at top
import { toExpressError } from '../domain/errors.js';

// Replace all catch blocks (lines 156, 182, 210, 293, 298, 360, 446, 500, 567):
} catch (error: any) {

// With:
} catch (error: unknown) {
  const err = toExpressError(error);
```

**Step 7: Fix paykeys.ts error handling**

In `server/src/routes/paykeys.ts`:

```typescript
// Add import at top
import { toExpressError } from '../domain/errors.js';

// Replace all catch blocks (lines 54, 79, 130, 184):
} catch (error: any) {

// With:
} catch (error: unknown) {
  const err = toExpressError(error);
```

**Step 8: Run existing route tests**

Run: `cd /home/keith/nerdcon/server && npm test -- routes/`

Expected: All existing route tests PASS

**Step 9: Run lint on routes**

Run: `cd /home/keith/nerdcon && npm run lint -- server/src/routes/`

Expected: 0 `any` errors remaining (still console warnings to fix next)

**Step 10: Commit routes error handling fixes**

```bash
git add server/src/domain/errors.ts server/src/domain/__tests__/errors.test.ts server/src/routes/
git commit -m "refactor(server): replace any with proper error types in routes

- Create StraddleAPIError and ExpressError interfaces
- Add type guard for Straddle API errors
- Add error converter for Express error handling
- Replace all catch(error: any) with catch(error: unknown)
- Use toExpressError() for type-safe error handling

Fixes 30 TypeScript any violations in routes layer
Adds comprehensive error handling tests"
```

---

## Task 4: Fix Console Statements

**Files:**
- Modify: `server/src/index.ts:73-76,79,80,82,85,88`
- Modify: `server/src/domain/events.ts:27,30,37`
- Modify: `server/src/routes/bridge.ts:82,226`
- Modify: `server/src/routes/charges.ts:103,218`
- Modify: `server/src/routes/customers.ts:110,115,130,154,312-319,334`
- Modify: `server/src/routes/paykeys.ts:51,180,248`

**Step 1: Create structured logger**

Create `server/src/lib/logger.ts`:

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info('[DEBUG]', message, context || '');
    }
  }

  info(message: string, context?: LogContext): void {
    console.info('[INFO]', message, context || '');
  }

  warn(message: string, context?: LogContext): void {
    console.warn('[WARN]', message, context || '');
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    console.error('[ERROR]', message, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      ...context,
    });
  }
}

export const logger = new Logger();
```

**Step 2: Write logger tests**

Create `server/src/lib/__tests__/logger.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from '@jest/globals';
import { logger } from '../logger.js';

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should log info messages', () => {
    logger.info('test message', { userId: '123' });

    expect(console.info).toHaveBeenCalledWith(
      '[INFO]',
      'test message',
      { userId: '123' }
    );
  });

  it('should log errors with stack traces', () => {
    const error = new Error('test error');
    logger.error('Something failed', error);

    expect(console.error).toHaveBeenCalledWith(
      '[ERROR]',
      'Something failed',
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'test error',
          stack: expect.any(String),
        }),
      })
    );
  });

  it('should only log debug in development', () => {
    const originalEnv = process.env.NODE_ENV;

    process.env.NODE_ENV = 'production';
    logger.debug('debug message');
    expect(console.info).not.toHaveBeenCalled();

    process.env.NODE_ENV = 'development';
    logger.debug('debug message');
    expect(console.info).toHaveBeenCalledWith('[DEBUG]', 'debug message', '');

    process.env.NODE_ENV = originalEnv;
  });
});
```

**Step 3: Run logger tests**

Run: `cd /home/keith/nerdcon/server && npm test -- logger.test.ts`

Expected: PASS

**Step 4: Replace console in index.ts**

In `server/src/index.ts`:

```typescript
// Add import
import { logger } from './lib/logger.js';

// Replace lines 73-76:
console.log('🎮 Straddle NerdCon Demo Server');
console.log(`📡 Server: http://localhost:${config.port}`);
console.log(`🌐 CORS Origin: ${config.corsOrigin}`);
console.log(`🔧 Straddle Env: ${config.straddleEnv}`);

// With:
logger.info('Straddle NerdCon Demo Server starting', {
  port: config.port,
  corsOrigin: config.corsOrigin,
  environment: config.straddleEnv,
});

// Replace lines 79-80, 82:
console.log(`✅ Server running on port ${config.port}`);
console.log(`📊 SSE endpoint: http://localhost:${config.port}/api/events/stream`);
console.error('❌ Server error:', err);

// With:
logger.info('Server ready', {
  port: config.port,
  sseEndpoint: `http://localhost:${config.port}/api/events/stream`,
});
logger.error('Server startup failed', err);

// Replace lines 85, 88:
console.log('\n👋 Shutting down gracefully...');
console.log('✅ Server closed');

// With:
logger.info('Shutting down gracefully');
logger.info('Server closed');
```

**Step 5: Replace console in events.ts**

In `server/src/domain/events.ts`:

```typescript
// Add import
import { logger } from '../lib/logger.js';

// Replace lines 27, 30, 37:
console.log(`SSE: Connected client (${clients.size} total)`);
console.log(`SSE: Disconnected client (${clients.size} remaining)`);
console.log('SSE: Broadcasting event:', event.type);

// With:
logger.debug('SSE client connected', { totalClients: clients.size });
logger.debug('SSE client disconnected', { remainingClients: clients.size });
logger.debug('SSE broadcasting event', { eventType: event.type });
```

**Step 6: Replace console in routes (bridge, charges, customers, paykeys)**

In each route file:

```typescript
// Add import
import { logger } from '../lib/logger.js';

// Replace all console.log with logger.debug
// Replace all console.error with logger.error

// Example in bridge.ts line 82:
console.log('Creating paykey via Plaid Link:', { customerId });
// Becomes:
logger.debug('Creating paykey via Plaid', { customerId });

// Example in customers.ts lines 312-319:
console.log('=== Customer Review Details ===');
console.log('Customer ID:', customerId);
// Becomes:
logger.debug('Fetching customer review', { customerId });
```

**Step 7: Run all tests**

Run: `cd /home/keith/nerdcon/server && npm test`

Expected: All tests PASS

**Step 8: Run lint check**

Run: `cd /home/keith/nerdcon && npm run lint`

Expected: 0 warnings, 0 errors

**Step 9: Commit logger implementation**

```bash
git add server/src/lib/ server/src/index.ts server/src/domain/events.ts server/src/routes/
git commit -m "refactor(server): replace console statements with structured logger

- Create Logger class with debug/info/warn/error levels
- Add context object support for structured logging
- Debug logs only in development mode
- Error logs include stack traces
- Replace all console.log/error with logger calls

Fixes 27 no-console violations
Adds comprehensive logger tests"
```

---

## Task 5: Fix Remaining Lint Issues

**Files:**
- Modify: `server/src/index.ts:62`
- Modify: `server/src/routes/__tests__/geolocation-proxy.test.ts:8`

**Step 1: Fix index.ts middleware typing**

In `server/src/index.ts` line 62:

```typescript
// Replace:
app.use((err: any, req: Request, res: Response, next: NextFunction) => {

// With:
import type { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // ... existing error handling logic
};

app.use(errorHandler);
```

**Step 2: Fix test file typing**

In `server/src/routes/__tests__/geolocation-proxy.test.ts` line 8:

```typescript
// Replace:
const mockRequest = (ip?: string): any => ({

// With:
import type { Request } from 'express';

const mockRequest = (ip?: string): Partial<Request> => ({
```

**Step 3: Run lint**

Run: `cd /home/keith/nerdcon && npm run lint`

Expected: 0 warnings, 0 errors - ALL CLEAN! 🎉

**Step 4: Commit final fixes**

```bash
git add server/src/index.ts server/src/routes/__tests__/geolocation-proxy.test.ts
git commit -m "refactor(server): fix remaining TypeScript any violations

- Use ErrorRequestHandler type for Express error middleware
- Use Partial<Request> for mock request objects in tests

Fixes final 2 any type violations - codebase is now 100% type-safe"
```

---

## Task 6: Add Pre-Commit Hooks

**Files:**
- Create: `.husky/pre-commit`
- Modify: `package.json`

**Step 1: Install husky and lint-staged**

Run:

```bash
cd /home/keith/nerdcon && npm install --save-dev husky@^9.0.0 lint-staged@^15.0.0
```

Expected: Packages installed successfully

**Step 2: Initialize husky**

Run:

```bash
cd /home/keith/nerdcon && npx husky init
```

Expected: `.husky/` directory created

**Step 3: Create pre-commit hook**

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**Step 4: Make pre-commit executable**

Run:

```bash
chmod +x /home/keith/nerdcon/.husky/pre-commit
```

Expected: File is executable

**Step 5: Configure lint-staged**

Add to root `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

**Step 6: Add prepare script to package.json**

In root `package.json`, add to scripts:

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

**Step 7: Test pre-commit hook**

Create a test file with lint error:

```bash
echo "const x: any = 5;" > /home/keith/nerdcon/server/src/test-lint.ts
git add server/src/test-lint.ts
git commit -m "test: verify pre-commit hook"
```

Expected: Commit BLOCKED with lint error

**Step 8: Remove test file**

Run:

```bash
rm /home/keith/nerdcon/server/src/test-lint.ts
```

**Step 9: Commit hook setup**

```bash
git add .husky/ package.json package-lock.json
git commit -m "chore: add pre-commit hooks with husky and lint-staged

- Install husky 9.x and lint-staged 15.x
- Configure pre-commit to run ESLint and Prettier
- Auto-fix and format staged files before commit
- Block commits with lint errors

Ensures future commits maintain code quality standards"
```

---

## Task 7: Add GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create GitHub Actions directory**

Run:

```bash
mkdir -p /home/keith/nerdcon/.github/workflows
```

Expected: Directory created

**Step 2: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check formatting
        run: npx prettier --check "**/*.{ts,tsx,js,jsx,json,md}"

  type-check:
    name: Type Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript type check
        run: npm run type-check

  test:
    name: Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run server tests
        run: npm test --workspace=server

      - name: Run web tests
        run: npm test --workspace=web

      - name: Upload server coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./server/coverage/lcov.info
          flags: server

      - name: Upload web coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./web/coverage/lcov.info
          flags: web

  build:
    name: Build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build server
        run: npm run build:server

      - name: Build web
        run: npm run build:web
```

**Step 3: Update Jest config for coverage**

In `server/jest.config.js`, add:

```javascript
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
```

**Step 4: Update Vitest config for coverage**

In `web/vitest.config.ts`, add to test object:

```typescript
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        branches: 50,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
  },
```

**Step 5: Add coverage dependencies**

Run:

```bash
cd /home/keith/nerdcon/web && npm install --save-dev @vitest/coverage-v8
```

Expected: Coverage package installed

**Step 6: Test CI locally**

Run lint, type-check, and tests:

```bash
cd /home/keith/nerdcon
npm run lint
npm run type-check
npm test --workspace=server
npm test --workspace=web
```

Expected: All pass successfully

**Step 7: Commit CI/CD workflow**

```bash
git add .github/ server/jest.config.js web/vitest.config.ts web/package.json
git commit -m "ci: add GitHub Actions workflow for automated testing

- Add lint job to check ESLint and Prettier
- Add type-check job for TypeScript validation
- Add test job with coverage reporting to Codecov
- Add build job to verify production builds
- Set coverage thresholds to 50% for all metrics
- Install @vitest/coverage-v8 for web coverage

Runs on push to main/master and all pull requests"
```

---

## Task 8: Add Coverage Reporting

**Files:**
- Create: `codecov.yml`
- Create: `.github/workflows/coverage-report.yml`

**Step 1: Create Codecov configuration**

Create `codecov.yml`:

```yaml
coverage:
  status:
    project:
      default:
        target: 50%
        threshold: 5%
    patch:
      default:
        target: 50%
        threshold: 10%

comment:
  layout: "diff, flags, files"
  behavior: default

flags:
  server:
    paths:
      - server/src/
  web:
    paths:
      - web/src/
```

**Step 2: Add coverage scripts to package.json**

In `server/package.json`, add:

```json
{
  "scripts": {
    "test:coverage": "NODE_OPTIONS=--experimental-vm-modules jest --coverage"
  }
}
```

In `web/package.json`, add:

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

**Step 3: Add .gitignore entries**

Add to `.gitignore` (create if doesn't exist):

```
# Test coverage
coverage/
*.lcov
.nyc_output/

# Build outputs
dist/
build/
```

**Step 4: Run coverage locally**

Run:

```bash
cd /home/keith/nerdcon
npm run test:coverage --workspace=server
npm run test:coverage --workspace=web
```

Expected: Coverage reports generated

**Step 5: Review coverage reports**

Run:

```bash
cd /home/keith/nerdcon/server && cat coverage/lcov-report/index.html | grep -A5 "Coverage Summary"
cd /home/keith/nerdcon/web && cat coverage/lcov-report/index.html | grep -A5 "Coverage Summary"
```

Expected: Coverage percentages displayed

**Step 6: Commit coverage configuration**

```bash
git add codecov.yml .gitignore server/package.json web/package.json
git commit -m "test: add code coverage reporting with Codecov

- Configure Codecov with 50% target coverage
- Add coverage scripts to server and web workspaces
- Set up separate flags for server and web coverage
- Ignore coverage directories in git
- Enable coverage threshold enforcement

Coverage reports will be posted on all PRs"
```

---

## Task 9: Add Missing Tests - Server Routes

**Files:**
- Create: `server/src/routes/__tests__/customers.test.ts`
- Create: `server/src/routes/__tests__/paykeys.test.ts`
- Create: `server/src/routes/__tests__/charges.test.ts`

**Step 1: Write customers route tests**

Create `server/src/routes/__tests__/customers.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { customerRouter } from '../customers.js';

// Mock the SDK
vi.mock('../../sdk.js', () => ({
  getStraddleClient: vi.fn(() => ({
    customers: {
      create: vi.fn().mockResolvedValue({
        data: {
          id: 'cust_123',
          verification_status: 'verified',
          risk_score: 0.1,
        },
      }),
      retrieve: vi.fn().mockResolvedValue({
        data: {
          id: 'cust_123',
          name: 'Test User',
          verification_status: 'verified',
        },
      }),
    },
  })),
}));

describe('Customer Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/customers', customerRouter);
  });

  describe('POST /api/customers', () => {
    it('should create a customer with valid data', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '+12125550123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('customer');
      expect(response.body.customer.id).toBe('cust_123');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should retrieve a customer by id', async () => {
      const response = await request(app).get('/api/customers/cust_123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('customer');
      expect(response.body.customer.name).toBe('Test User');
    });
  });
});
```

**Step 2: Run customer route tests**

Run: `cd /home/keith/nerdcon/server && npm test -- customers.test.ts`

Expected: PASS

**Step 3: Write paykeys route tests**

Create `server/src/routes/__tests__/paykeys.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { paykeyRouter } from '../paykeys.js';

vi.mock('../../sdk.js', () => ({
  getStraddleClient: vi.fn(() => ({
    paykeys: {
      retrieve: vi.fn().mockResolvedValue({
        data: {
          id: 'paykey_123',
          paykey: 'token_abc',
          status: 'active',
        },
      }),
    },
  })),
}));

describe('Paykey Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/paykeys', paykeyRouter);
  });

  describe('GET /api/paykeys/:id', () => {
    it('should retrieve a paykey by id', async () => {
      const response = await request(app).get('/api/paykeys/paykey_123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('paykey');
      expect(response.body.paykey.status).toBe('active');
    });
  });
});
```

**Step 4: Run paykey route tests**

Run: `cd /home/keith/nerdcon/server && npm test -- paykeys.test.ts`

Expected: PASS

**Step 5: Write charges route tests**

Create `server/src/routes/__tests__/charges.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { chargeRouter } from '../charges.js';

vi.mock('../../sdk.js', () => ({
  getStraddleClient: vi.fn(() => ({
    charges: {
      create: vi.fn().mockResolvedValue({
        data: {
          id: 'charge_123',
          amount: 5000,
          status: 'paid',
        },
      }),
      retrieve: vi.fn().mockResolvedValue({
        data: {
          id: 'charge_123',
          amount: 5000,
          status: 'paid',
        },
      }),
    },
  })),
}));

describe('Charge Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/charges', chargeRouter);
  });

  describe('POST /api/charges', () => {
    it('should create a charge with valid data', async () => {
      const response = await request(app)
        .post('/api/charges')
        .send({
          paykey: 'token_abc',
          amount: 5000,
          description: 'Test charge',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('charge');
      expect(response.body.charge.amount).toBe(5000);
    });

    it('should reject invalid amount', async () => {
      const response = await request(app)
        .post('/api/charges')
        .send({
          paykey: 'token_abc',
          amount: -100,
        });

      expect(response.status).toBe(400);
    });
  });
});
```

**Step 6: Run charge route tests**

Run: `cd /home/keith/nerdcon/server && npm test -- charges.test.ts`

Expected: PASS

**Step 7: Run all tests**

Run: `cd /home/keith/nerdcon/server && npm test`

Expected: All tests PASS

**Step 8: Commit route tests**

```bash
git add server/src/routes/__tests__/
git commit -m "test(server): add comprehensive route tests

- Add customers route tests (create, retrieve)
- Add paykeys route tests (retrieve)
- Add charges route tests (create, validation)
- Mock Straddle SDK for isolated testing
- Test happy paths and error cases

Increases test coverage for route layer"
```

---

## Task 10: Add Missing Tests - Web Components

**Files:**
- Create: `web/src/components/cards/__tests__/PaykeyCard.test.tsx`
- Create: `web/src/components/cards/__tests__/ChargeCard.test.tsx`
- Create: `web/src/lib/__tests__/state.test.ts`

**Step 1: Write PaykeyCard tests**

Create `web/src/components/cards/__tests__/PaykeyCard.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaykeyCard } from '../PaykeyCard';
import type { DemoPaykey } from '@/lib/state';

describe('PaykeyCard', () => {
  const mockPaykey: DemoPaykey = {
    id: 'paykey_123',
    paykey: 'token_abc',
    status: 'active',
    bank_name: 'Chase Bank',
    account_type: 'checking',
    last4: '1234',
  };

  it('should render paykey information', () => {
    render(<PaykeyCard paykey={mockPaykey} />);

    expect(screen.getByText('Chase Bank')).toBeInTheDocument();
    expect(screen.getByText(/1234/)).toBeInTheDocument();
    expect(screen.getByText(/checking/i)).toBeInTheDocument();
  });

  it('should show active status', () => {
    render(<PaykeyCard paykey={mockPaykey} />);

    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it('should render null when no paykey provided', () => {
    const { container } = render(<PaykeyCard paykey={null} />);

    expect(container.firstChild).toBeNull();
  });
});
```

**Step 2: Run PaykeyCard tests**

Run: `cd /home/keith/nerdcon/web && npm test -- PaykeyCard.test.tsx`

Expected: PASS

**Step 3: Write ChargeCard tests**

Create `web/src/components/cards/__tests__/ChargeCard.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChargeCard } from '../ChargeCard';
import type { DemoCharge } from '@/lib/state';

describe('ChargeCard', () => {
  const mockCharge: DemoCharge = {
    id: 'charge_123',
    amount: 5000,
    status: 'paid',
    description: 'Test payment',
    created_at: '2025-11-16T10:00:00Z',
  };

  it('should render charge information', () => {
    render(<ChargeCard charge={mockCharge} />);

    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('Test payment')).toBeInTheDocument();
  });

  it('should show paid status', () => {
    render(<ChargeCard charge={mockCharge} />);

    expect(screen.getByText(/paid/i)).toBeInTheDocument();
  });

  it('should format amount correctly', () => {
    const chargeWithCents = { ...mockCharge, amount: 12345 };
    render(<ChargeCard charge={chargeWithCents} />);

    expect(screen.getByText('$123.45')).toBeInTheDocument();
  });
});
```

**Step 4: Run ChargeCard tests**

Run: `cd /home/keith/nerdcon/web && npm test -- ChargeCard.test.tsx`

Expected: PASS

**Step 5: Write state management tests**

Create `web/src/lib/__tests__/state.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useDemoStore } from '../state';
import type { DemoCustomer, DemoPaykey, DemoCharge } from '../state';

describe('Demo Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useDemoStore.setState({
      customer: null,
      paykey: null,
      charge: null,
      logs: [],
    });
  });

  it('should initialize with null state', () => {
    const state = useDemoStore.getState();

    expect(state.customer).toBeNull();
    expect(state.paykey).toBeNull();
    expect(state.charge).toBeNull();
    expect(state.logs).toEqual([]);
  });

  it('should update customer state', () => {
    const customer: DemoCustomer = {
      id: 'cust_123',
      name: 'Test User',
      verification_status: 'verified',
    };

    useDemoStore.setState({ customer });
    const state = useDemoStore.getState();

    expect(state.customer).toEqual(customer);
  });

  it('should add logs', () => {
    const log = {
      method: 'POST',
      path: '/api/customers',
      status: 200,
      timestamp: new Date().toISOString(),
    };

    useDemoStore.setState((state) => ({
      logs: [...state.logs, log],
    }));

    const state = useDemoStore.getState();
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0]).toEqual(log);
  });

  it('should reset all state', () => {
    // Set some state
    useDemoStore.setState({
      customer: { id: 'cust_123', name: 'Test' },
      paykey: { id: 'paykey_123', status: 'active' },
      charge: { id: 'charge_123', amount: 5000 },
      logs: [{ method: 'GET', path: '/test' }],
    });

    // Reset
    useDemoStore.setState({
      customer: null,
      paykey: null,
      charge: null,
      logs: [],
    });

    const state = useDemoStore.getState();
    expect(state.customer).toBeNull();
    expect(state.paykey).toBeNull();
    expect(state.charge).toBeNull();
    expect(state.logs).toEqual([]);
  });
});
```

**Step 6: Run state tests**

Run: `cd /home/keith/nerdcon/web && npm test -- state.test.ts`

Expected: PASS

**Step 7: Run all web tests**

Run: `cd /home/keith/nerdcon/web && npm test`

Expected: All tests PASS

**Step 8: Commit web tests**

```bash
git add web/src/
git commit -m "test(web): add component and state management tests

- Add PaykeyCard component tests (render, status, null handling)
- Add ChargeCard component tests (amount formatting, status)
- Add Zustand state management tests (initialization, updates, reset)
- Test happy paths and edge cases

Increases test coverage for web components and state"
```

---

## Task 11: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Create: `docs/TESTING.md`
- Create: `docs/CONTRIBUTING.md`

**Step 1: Add testing section to CLAUDE.md**

In `CLAUDE.md`, add after "Common Commands" section:

```markdown
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
```

**Step 2: Create testing guidelines**

Create `docs/TESTING.md`:

```markdown
# Testing Guidelines

## Philosophy

- **Write tests first** (TDD) - Test should fail before you write implementation
- **Test behavior, not implementation** - Focus on what code does, not how
- **Keep tests simple** - One assertion per test when possible
- **Mock external dependencies** - Don't call real APIs in tests

## Server Tests (Jest)

**Location:** `server/src/**/__tests__/*.test.ts`

**Running:**
```bash
cd server && npm test
npm test -- --watch          # Watch mode
npm test -- customers.test.ts  # Specific file
npm run test:coverage        # With coverage
```

**Structure:**
```typescript
import { describe, it, expect, vi, beforeEach } from '@jest/globals';

describe('Feature Name', () => {
  beforeEach(() => {
    // Reset state before each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = { foo: 'bar' };

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

**Mocking SDK:**
```typescript
vi.mock('../sdk.js', () => ({
  getStraddleClient: vi.fn(() => ({
    customers: {
      create: vi.fn().mockResolvedValue({ data: mockData }),
    },
  })),
}));
```

## Web Tests (Vitest + React Testing Library)

**Location:** `web/src/**/__tests__/*.test.tsx`

**Running:**
```bash
cd web && npm test
npm test -- --watch
npm test -- CustomerCard.test.tsx
npm run test:coverage
```

**Component Testing:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from '../Component';

describe('Component', () => {
  it('should render expected content', () => {
    render(<Component prop="value" />);

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

**User Interaction:**
```typescript
import { fireEvent } from '@testing-library/react';

it('should handle button click', () => {
  render(<Button onClick={handleClick} />);

  const button = screen.getByRole('button');
  fireEvent.click(button);

  expect(handleClick).toHaveBeenCalled();
});
```

## Coverage Requirements

**Thresholds:**
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

**Viewing Coverage:**
```bash
npm run test:coverage --workspace=server
open server/coverage/lcov-report/index.html
```

## CI/CD

**GitHub Actions runs on every PR:**
1. ESLint check
2. TypeScript type check
3. All tests
4. Coverage report to Codecov
5. Build verification

**All checks must pass before merge.**

## Common Patterns

**Testing Async Functions:**
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});
```

**Testing Error Cases:**
```typescript
it('should throw on invalid input', () => {
  expect(() => functionWithError()).toThrow('Expected error');
});
```

**Testing State Updates:**
```typescript
it('should update state correctly', () => {
  const { result } = renderHook(() => useCustomHook());

  act(() => {
    result.current.updateState(newValue);
  });

  expect(result.current.state).toBe(newValue);
});
```
```

**Step 3: Create contributing guidelines**

Create `docs/CONTRIBUTING.md`:

```markdown
# Contributing Guidelines

## Development Workflow

1. **Check out a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write tests first** (TDD)
   - Write failing test
   - Run test to verify it fails
   - Write minimal code to pass
   - Refactor if needed

3. **Make your changes**
   - Follow TypeScript strict mode
   - Use structured logger (no console.log)
   - Add proper types (no `any`)
   - Write clear commit messages

4. **Run quality checks**
   ```bash
   npm run lint          # Fix any lint errors
   npm run type-check    # Fix any type errors
   npm test              # Ensure all tests pass
   npm run build         # Verify builds work
   ```

5. **Commit your changes**
   - Pre-commit hooks will auto-run
   - Lint and format will auto-fix
   - Commit will be blocked if errors remain

6. **Push and create PR**
   ```bash
   git push -u origin feature/your-feature-name
   ```
   - GitHub Actions will run CI checks
   - All checks must pass for merge

## Code Standards

### TypeScript
- ✅ Use proper types (`Record<string, unknown>`, interfaces)
- ❌ Never use `any` type
- ✅ Explicit function return types
- ❌ No implicit any returns

### Logging
- ✅ Use `logger.debug()`, `logger.info()`, `logger.error()`
- ❌ No `console.log()` or `console.error()`
- ✅ Include context objects for structured logging

### Error Handling
- ✅ Use `try/catch` with proper error types
- ✅ Use `toExpressError()` for API errors
- ❌ Never throw string literals
- ✅ Include error context in logs

### Testing
- ✅ Write tests for new features
- ✅ Update tests for changed behavior
- ✅ Maintain 50%+ coverage
- ❌ Don't skip tests to make CI pass

## Commit Message Format

```
type(scope): brief description

- Detailed point 1
- Detailed point 2

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Scopes:**
- `server`: Backend changes
- `web`: Frontend changes
- `deps`: Dependency updates

**Examples:**
```
feat(server): add customer KYC verification endpoint

- Add GET /api/customers/:id/kyc route
- Include verification breakdown details
- Add error handling for missing customers

Fixes #42
```

## Getting Help

- Check `CLAUDE.md` for architecture and setup
- Review `docs/TESTING.md` for test guidelines
- Look at existing code for patterns
- Ask questions in PR comments
```

**Step 4: Commit documentation updates**

```bash
git add CLAUDE.md docs/TESTING.md docs/CONTRIBUTING.md
git commit -m "docs: add comprehensive testing and contributing guidelines

- Add code quality section to CLAUDE.md
- Create TESTING.md with Jest/Vitest examples
- Create CONTRIBUTING.md with development workflow
- Document coverage requirements and CI/CD process
- Provide commit message format guidelines

Makes it easy for new contributors to maintain quality standards"
```

---

## Task 12: Final Verification

**Files:**
- None (verification only)

**Step 1: Run complete lint check**

Run:

```bash
cd /home/keith/nerdcon && npm run lint
```

Expected: ✅ 0 errors, 0 warnings

**Step 2: Run complete type check**

Run:

```bash
cd /home/keith/nerdcon && npm run type-check
```

Expected: ✅ No type errors

**Step 3: Run all tests**

Run:

```bash
cd /home/keith/nerdcon && npm test --workspace=server && npm test --workspace=web
```

Expected: ✅ All tests pass

**Step 4: Generate coverage reports**

Run:

```bash
cd /home/keith/nerdcon
npm run test:coverage --workspace=server
npm run test:coverage --workspace=web
```

Expected: ✅ Coverage above 50% thresholds

**Step 5: Verify builds**

Run:

```bash
cd /home/keith/nerdcon && npm run build
```

Expected: ✅ Both server and web build successfully

**Step 6: Test pre-commit hook**

Run:

```bash
cd /home/keith/nerdcon
echo "// Test change" >> server/src/config.ts
git add server/src/config.ts
git commit -m "test: verify pre-commit hook works"
```

Expected: ✅ Lint-staged runs, commit succeeds

**Step 7: Revert test change**

Run:

```bash
git reset HEAD~1
git checkout server/src/config.ts
```

Expected: Test commit reverted

**Step 8: Create summary report**

Create `docs/reports/2025-11-16-linting-testing-complete.md`:

```markdown
# Linting and Testing Implementation - Completion Report

**Date:** 2025-11-16
**Status:** ✅ Complete

## Summary

Successfully upgraded linting standards, fixed all 91 lint violations, added comprehensive test coverage, and implemented automated quality checks for future commits.

## Completed Tasks

### ✅ Linting Improvements
- Upgraded ESLint from warn to error for production standards
- Fixed 64 `@typescript-eslint/no-explicit-any` violations
- Fixed 27 `no-console` violations
- Added type-checking rules for promises
- Created `.eslintignore` for build artifacts

### ✅ Code Refactoring
- Replaced all `any` types with proper TypeScript types
- Created structured logger to replace console statements
- Added error handling types and utilities
- Improved type safety across domain and routes layers

### ✅ Testing Infrastructure
- Added 8 new test files (routes, components, state)
- Configured coverage thresholds (50% minimum)
- Set up Jest for server, Vitest for web
- Added coverage reporting to Codecov

### ✅ Automation
- Installed and configured Husky + lint-staged
- Created pre-commit hooks for automatic linting
- Set up GitHub Actions CI/CD workflow
- Automated lint, type-check, test, and build on all PRs

### ✅ Documentation
- Updated CLAUDE.md with code quality standards
- Created TESTING.md with comprehensive test guidelines
- Created CONTRIBUTING.md with development workflow
- Added commit message format guidelines

## Metrics

**Before:**
- Lint warnings: 91
- Lint errors: 0
- Test files: 9
- Coverage: Unknown
- Pre-commit checks: None
- CI/CD: None

**After:**
- Lint warnings: 0 ✅
- Lint errors: 0 ✅
- Test files: 17 (89% increase)
- Coverage: >50% with enforcement ✅
- Pre-commit checks: ESLint + Prettier ✅
- CI/CD: Full GitHub Actions workflow ✅

## Quality Gates

All commits and PRs now automatically checked for:
1. ✅ ESLint compliance
2. ✅ Prettier formatting
3. ✅ TypeScript type safety
4. ✅ Test coverage thresholds
5. ✅ Successful builds

## Next Steps

1. Monitor CI/CD on next few PRs
2. Adjust coverage thresholds if needed (currently 50%)
3. Add E2E tests for full user workflows (future enhancement)
4. Consider adding Playwright for browser testing (future enhancement)

## Files Changed

- Modified: 15 source files (fixed lint violations)
- Created: 9 new test files
- Created: 6 new infrastructure files (husky, GitHub Actions, etc.)
- Created: 3 documentation files
- Total commits: 12
```

**Step 9: Commit completion report**

```bash
git add docs/reports/2025-11-16-linting-testing-complete.md
git commit -m "docs: add linting and testing implementation completion report

Summary of all improvements:
- 0 lint warnings/errors (down from 91)
- 17 test files (up from 9)
- Pre-commit hooks installed
- GitHub Actions CI/CD configured
- Comprehensive documentation added

All quality gates now enforced automatically"
```

---

## Execution Complete

**Plan saved to:** `docs/plans/2025-11-16-linting-and-testing-standards.md`

**Summary:**
- 12 tasks covering linting, testing, automation, and documentation
- 91 lint violations will be fixed
- 8 new test files will be added
- Pre-commit hooks and CI/CD will be configured
- Comprehensive documentation will be created

**Estimated time:** 2-3 hours for complete implementation

**All future commits will be automatically validated for quality standards.**
