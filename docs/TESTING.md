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
