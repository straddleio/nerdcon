# Paykey Generator Modal Debugging and Fixes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix systemic issues causing the paykey generator modal to get stuck at the first animation stage and prevent infinite render loops.

**Architecture:** Debug and fix React component lifecycle issues, add missing dependency arrays, implement comprehensive tests, and ensure proper state management.

**Tech Stack:** React, TypeScript, Vitest, Zustand, Testing Library

---

## Root Cause Analysis

**Console Evidence:**

```
PaykeyGeneratorModal.tsx:35 🔥 [MODAL] PaykeyGeneratorModal rendered: Object (4x times)
PaykeyGeneratorModal.tsx:81 🔥 [MODAL] Returning null because: Object (2x times)
PaykeyGeneratorModal.tsx:89 🔥 [MODAL] Rendering modal with data: Object (4x times)
```

**Identified Issues:**

1. **NameNormalizer.tsx:46** - Missing `onComplete` in useEffect dependency array causes completion callback to never fire
2. **WaldoStage.tsx:42** - Unconditional useEffect with `onComplete` dependency causes infinite loop when no waldoData
3. **No test coverage** - Zero tests for modal and animation components
4. **Render loop** - Modal renders 4+ times on mount, indicating state thrashing
5. **Missing error boundaries** - No protection against animation failures

---

## Task 1: Fix NameNormalizer Dependency Array

**Files:**

- Modify: `web/src/components/generator/animations/NameNormalizer.tsx:31-46`

**Step 1: Write failing test for NameNormalizer completion**

Create: `web/src/components/generator/animations/__tests__/NameNormalizer.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { NameNormalizer } from '../NameNormalizer';

describe('NameNormalizer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should call onComplete with normalized name after 1500ms', async () => {
    const onComplete = vi.fn();
    const customerName = 'John Smith Jr.';
    const expectedNormalized = 'JOHN SMITH';

    render(<NameNormalizer customerName={customerName} onComplete={onComplete} />);

    // Should not call onComplete immediately
    expect(onComplete).not.toHaveBeenCalled();

    // Advance time to 300ms (original stage)
    vi.advanceTimersByTime(300);
    expect(onComplete).not.toHaveBeenCalled();

    // Advance time to 1200ms (morphing stage)
    vi.advanceTimersByTime(900);
    expect(onComplete).not.toHaveBeenCalled();

    // Advance time to 1500ms (should complete)
    vi.advanceTimersByTime(300);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(expectedNormalized);
  });

  it('should cleanup timers on unmount', () => {
    const onComplete = vi.fn();
    const { unmount } = render(
      <NameNormalizer customerName="Test Name" onComplete={onComplete} />
    );

    // Unmount before completion
    unmount();
    vi.advanceTimersByTime(2000);

    // Should not call onComplete after unmount
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should show correct stages over time', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <NameNormalizer customerName="Test Name" onComplete={onComplete} />
    );

    // Initial stage should show original name
    expect(container.textContent).toContain('Test Name');

    // Advance to morphing stage
    vi.advanceTimersByTime(300);
    expect(container.textContent).toContain('NORMALIZING...');

    // Advance to normalized stage
    vi.advanceTimersByTime(900);
    expect(container.textContent).toContain('COMPLETE');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test NameNormalizer.test.tsx`

Expected: FAIL with timeout or onComplete not called

**Step 3: Fix the dependency array**

Modify `web/src/components/generator/animations/NameNormalizer.tsx` line 46:

```typescript
// BEFORE (line 46):
  }, [normalizedName]);

// AFTER:
  }, [normalizedName, onComplete]);
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test NameNormalizer.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/generator/animations/__tests__/NameNormalizer.test.tsx
git add web/src/components/generator/animations/NameNormalizer.tsx
git commit -m "fix: add onComplete to NameNormalizer useEffect deps

- Fixes animation getting stuck at first stage
- Adds comprehensive test coverage
- Ensures proper cleanup on unmount"
```

---

## Task 2: Fix WaldoStage Infinite Loop

**Files:**

- Modify: `web/src/components/generator/WaldoStage.tsx:39-46`

**Step 1: Write failing test for WaldoStage skip behavior**

Create: `web/src/components/generator/__tests__/WaldoStage.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { WaldoStage } from '../WaldoStage';
import type { GeneratorData } from '../types';

describe('WaldoStage', () => {
  it('should call onComplete immediately when no waldoData', () => {
    const onComplete = vi.fn();
    const generatorData: GeneratorData = {
      customerName: 'Test User',
      waldoData: undefined,
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    };

    render(<WaldoStage generatorData={generatorData} onComplete={onComplete} />);

    // Should call onComplete immediately and only once
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should not cause infinite loop when no waldoData', () => {
    const onComplete = vi.fn();
    const generatorData: GeneratorData = {
      customerName: 'Test User',
      waldoData: undefined,
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    };

    const { rerender } = render(
      <WaldoStage generatorData={generatorData} onComplete={onComplete} />
    );

    // Re-render multiple times
    rerender(<WaldoStage generatorData={generatorData} onComplete={onComplete} />);
    rerender(<WaldoStage generatorData={generatorData} onComplete={onComplete} />);

    // Should still only call onComplete once
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should render NameNormalizer when waldoData exists', () => {
    const onComplete = vi.fn();
    const generatorData: GeneratorData = {
      customerName: 'John Smith',
      waldoData: {
        correlationScore: 95,
        matchedName: 'JOHN SMITH',
        namesOnAccount: ['John Smith', 'J Smith'],
      },
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    };

    const { container } = render(
      <WaldoStage generatorData={generatorData} onComplete={onComplete} />
    );

    // Should render the first animation stage
    expect(container.textContent).toContain('Name Normalization');

    // Should not call onComplete immediately
    expect(onComplete).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test WaldoStage.test.tsx`

Expected: FAIL with "expected 1 call but got 2+" (infinite loop detected)

**Step 3: Fix the infinite loop with useRef**

Modify `web/src/components/generator/WaldoStage.tsx`:

```typescript
// Add import at top (after line 12):
import React, { useState, useRef } from 'react';

// Replace lines 34-46 with:
export const WaldoStage: React.FC<WaldoStageProps> = ({ generatorData, onComplete }) => {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationStage>('normalize');
  const [normalizedName, setNormalizedName] = useState<string>('');
  const [variations, setVariations] = useState<string[]>([]);
  const hasCalledComplete = useRef(false);

  // If no WALDO data, skip immediately (only once)
  React.useEffect(() => {
    if (!generatorData.waldoData && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete();
    }
  }, [generatorData.waldoData, onComplete]);

  // If no WALDO data, don't render anything
  if (!generatorData.waldoData) {
    return null;
  }

  const { waldoData } = generatorData;
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test WaldoStage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/generator/__tests__/WaldoStage.test.tsx
git add web/src/components/generator/WaldoStage.tsx
git commit -m "fix: prevent infinite loop in WaldoStage when no waldoData

- Use useRef to track completion callback
- Only call onComplete once
- Add test coverage for skip behavior"
```

---

## Task 3: Add PaykeyGeneratorModal State Tests

**Files:**

- Create: `web/src/components/__tests__/PaykeyGeneratorModal.test.tsx`

**Step 1: Write integration tests for modal state management**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaykeyGeneratorModal } from '../PaykeyGeneratorModal';
import { useDemoStore } from '@/lib/state';

// Mock the stage components to avoid complex animation testing
vi.mock('../generator/WaldoStage', () => ({
  WaldoStage: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="waldo-stage">
      <button onClick={onComplete}>Complete WALDO</button>
    </div>
  ),
}));

vi.mock('../generator/Blake3Stage', () => ({
  Blake3Stage: ({ onComplete }: { onComplete: (hash: string) => void }) => (
    <div data-testid="blake3-stage">
      <button onClick={() => onComplete('abc123hash')}>Complete BLAKE3</button>
    </div>
  ),
}));

vi.mock('../generator/MintingStage', () => ({
  MintingStage: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="minting-stage">
      <button onClick={onComplete}>Complete Minting</button>
    </div>
  ),
}));

describe('PaykeyGeneratorModal', () => {
  beforeEach(() => {
    // Reset store state
    useDemoStore.getState().clearGeneratorData();
  });

  it('should not render when showPaykeyGenerator is false', () => {
    const { container } = render(<PaykeyGeneratorModal />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when generatorData is null', () => {
    useDemoStore.setState({ showPaykeyGenerator: true, generatorData: null });
    const { container } = render(<PaykeyGeneratorModal />);
    expect(container.firstChild).toBeNull();
  });

  it('should render modal when both flag and data are present', () => {
    useDemoStore.getState().setGeneratorData({
      customerName: 'John Smith',
      waldoData: {
        correlationScore: 95,
        matchedName: 'JOHN SMITH',
        namesOnAccount: ['John Smith'],
      },
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    });

    render(<PaykeyGeneratorModal />);

    expect(screen.getByText('PAYKEY GENERATOR')).toBeInTheDocument();
    expect(screen.getByText(/Generating secure token for John Smith/i)).toBeInTheDocument();
  });

  it('should start at WALDO stage when waldoData exists', () => {
    useDemoStore.getState().setGeneratorData({
      customerName: 'John Smith',
      waldoData: {
        correlationScore: 95,
        matchedName: 'JOHN SMITH',
        namesOnAccount: ['John Smith'],
      },
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    });

    render(<PaykeyGeneratorModal />);

    expect(screen.getByTestId('waldo-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('blake3-stage')).not.toBeInTheDocument();
  });

  it('should skip to BLAKE3 stage when no waldoData', () => {
    useDemoStore.getState().setGeneratorData({
      customerName: 'John Smith',
      waldoData: undefined,
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    });

    render(<PaykeyGeneratorModal />);

    expect(screen.getByTestId('blake3-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('waldo-stage')).not.toBeInTheDocument();
  });

  it('should progress through stages correctly', async () => {
    useDemoStore.getState().setGeneratorData({
      customerName: 'John Smith',
      waldoData: {
        correlationScore: 95,
        matchedName: 'JOHN SMITH',
        namesOnAccount: ['John Smith'],
      },
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    });

    render(<PaykeyGeneratorModal />);

    // Start at WALDO
    expect(screen.getByTestId('waldo-stage')).toBeInTheDocument();

    // Complete WALDO
    fireEvent.click(screen.getByText('Complete WALDO'));

    // Should move to BLAKE3
    await waitFor(() => {
      expect(screen.getByTestId('blake3-stage')).toBeInTheDocument();
    });

    // Complete BLAKE3
    fireEvent.click(screen.getByText('Complete BLAKE3'));

    // Should move to Minting
    await waitFor(() => {
      expect(screen.getByTestId('minting-stage')).toBeInTheDocument();
    });
  });

  it('should close modal on Skip button click', () => {
    useDemoStore.getState().setGeneratorData({
      customerName: 'John Smith',
      waldoData: undefined,
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    });

    render(<PaykeyGeneratorModal />);

    expect(screen.getByText('PAYKEY GENERATOR')).toBeInTheDocument();

    // Click Skip
    fireEvent.click(screen.getByText('SKIP'));

    // Modal should be closed
    const state = useDemoStore.getState();
    expect(state.showPaykeyGenerator).toBe(false);
    expect(state.generatorData).toBeNull();
  });

  it('should close modal on ESC key', () => {
    useDemoStore.getState().setGeneratorData({
      customerName: 'John Smith',
      waldoData: undefined,
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    });

    render(<PaykeyGeneratorModal />);

    // Press ESC
    fireEvent.keyDown(window, { key: 'Escape' });

    // Modal should be closed
    const state = useDemoStore.getState();
    expect(state.showPaykeyGenerator).toBe(false);
    expect(state.generatorData).toBeNull();
  });

  it('should close modal on background click', () => {
    useDemoStore.getState().setGeneratorData({
      customerName: 'John Smith',
      waldoData: undefined,
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    });

    const { container } = render(<PaykeyGeneratorModal />);

    // Click on overlay background
    const overlay = container.querySelector('.fixed.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
    }

    // Modal should be closed
    const state = useDemoStore.getState();
    expect(state.showPaykeyGenerator).toBe(false);
    expect(state.generatorData).toBeNull();
  });
});
```

**Step 2: Run test to verify current failures**

Run: `cd web && npm test PaykeyGeneratorModal.test.tsx`

Expected: Some tests may fail due to bugs we're fixing

**Step 3: No implementation changes needed for this task**

The tests document expected behavior. Fixes from Tasks 1-2 should make these pass.

**Step 4: Run test to verify all pass after previous fixes**

Run: `cd web && npm test PaykeyGeneratorModal.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/__tests__/PaykeyGeneratorModal.test.tsx
git commit -m "test: add comprehensive PaykeyGeneratorModal tests

- Tests modal visibility logic
- Tests stage progression
- Tests close behaviors (skip, ESC, background click)
- Uses mocked stage components for isolation"
```

---

## Task 4: Fix Render Loop with React.memo

**Files:**

- Modify: `web/src/components/PaykeyGeneratorModal.tsx`

**Step 1: Add render tracking test**

Add to `web/src/components/__tests__/PaykeyGeneratorModal.test.tsx`:

```typescript
describe('PaykeyGeneratorModal Performance', () => {
  it('should not re-render excessively when data does not change', () => {
    const renderSpy = vi.fn();

    const TestWrapper = () => {
      renderSpy();
      return <PaykeyGeneratorModal />;
    };

    useDemoStore.getState().setGeneratorData({
      customerName: 'John Smith',
      waldoData: undefined,
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    });

    const { rerender } = render(<TestWrapper />);

    const initialRenderCount = renderSpy.mock.calls.length;

    // Re-render with same data
    rerender(<TestWrapper />);

    // Should not cause additional renders beyond React's normal behavior
    // Allow for 1-2 renders max (initial + potential update)
    expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(initialRenderCount + 2);
  });
});
```

**Step 2: Run test to verify excessive renders**

Run: `cd web && npm test PaykeyGeneratorModal.test.tsx`

Expected: May fail if render count is too high

**Step 3: Memoize stage callbacks**

Modify `web/src/components/PaykeyGeneratorModal.tsx`:

```typescript
// Add import at top (after line 8):
import React, { useEffect, useState, useCallback } from 'react';

// Replace lines 64-78 with memoized callbacks:
// Handle stage progression (memoized to prevent unnecessary re-renders)
const handleWaldoComplete = useCallback((): void => {
  setCurrentStage('blake3');
}, []);

// Handle BLAKE3 completion (memoized)
const handleBlake3Complete = useCallback((hash: string): void => {
  setGeneratedHash(hash);
  setCurrentStage('minting');
}, []);

// Handle Minting completion (memoized)
const handleMintingComplete = useCallback((): void => {
  // MintingStage handles all animations, then closes modal
  clearGeneratorData();
}, [clearGeneratorData]);
```

**Step 4: Run test to verify improved performance**

Run: `cd web && npm test PaykeyGeneratorModal.test.tsx`

Expected: PASS with lower render counts

**Step 5: Commit**

```bash
git add web/src/components/__tests__/PaykeyGeneratorModal.test.tsx
git add web/src/components/PaykeyGeneratorModal.tsx
git commit -m "perf: memoize PaykeyGeneratorModal callbacks

- Use useCallback for stage completion handlers
- Prevents unnecessary re-renders
- Reduces render loop issues"
```

---

## Task 5: Add Error Boundary Protection

**Files:**

- Create: `web/src/components/generator/ErrorBoundary.tsx`
- Modify: `web/src/components/PaykeyGeneratorModal.tsx`

**Step 1: Write test for error boundary**

Create: `web/src/components/generator/__tests__/ErrorBoundary.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GeneratorErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('GeneratorErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when no error', () => {
    render(
      <GeneratorErrorBoundary onError={vi.fn()}>
        <ThrowError shouldThrow={false} />
      </GeneratorErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should show error message when child throws', () => {
    const onError = vi.fn();

    render(
      <GeneratorErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </GeneratorErrorBoundary>
    );

    expect(screen.getByText(/animation error/i)).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <GeneratorErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </GeneratorErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test ErrorBoundary.test.tsx`

Expected: FAIL - component doesn't exist

**Step 3: Create ErrorBoundary component**

Create: `web/src/components/generator/ErrorBoundary.tsx`

```typescript
/**
 * Error Boundary for Generator Animations
 *
 * Catches errors in animation components and provides fallback UI
 */

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * GeneratorErrorBoundary Component
 *
 * Wraps generator animations to prevent modal crashes
 * Calls onError callback to allow parent to handle failure (e.g., close modal)
 */
export class GeneratorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error): void {
    // Call parent error handler if provided
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="text-accent font-pixel text-lg">⚠ ANIMATION ERROR</div>
          <p className="text-neutral-400 text-sm font-body text-center max-w-md">
            An error occurred during the animation. The modal will close automatically.
          </p>
          {this.state.error && (
            <details className="text-xs text-neutral-500 font-mono">
              <summary className="cursor-pointer">Technical Details</summary>
              <pre className="mt-2 p-2 bg-background-dark rounded border border-neutral-700 overflow-auto max-w-md">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test ErrorBoundary.test.tsx`

Expected: PASS

**Step 5: Integrate error boundary into modal**

Modify `web/src/components/PaykeyGeneratorModal.tsx`:

```typescript
// Add import (after line 14):
import { GeneratorErrorBoundary } from './generator/ErrorBoundary';

// Add error handler (after line 72):
  // Handle animation errors
  const handleAnimationError = useCallback(
    (error: Error): void => {
      console.error('[MODAL] Animation error:', error);
      // Close modal after brief delay to show error message
      setTimeout(() => {
        clearGeneratorData();
      }, 2000);
    },
    [clearGeneratorData]
  );

// Wrap stage container (line 147) with error boundary:
          {/* Stage Container */}
          <GeneratorErrorBoundary onError={handleAnimationError}>
            <div className="space-y-6">
              {/* ... existing stage code ... */}
            </div>
          </GeneratorErrorBoundary>
```

**Step 6: Run tests to verify**

Run: `cd web && npm test PaykeyGeneratorModal.test.tsx`

Expected: PASS

**Step 7: Commit**

```bash
git add web/src/components/generator/__tests__/ErrorBoundary.test.tsx
git add web/src/components/generator/ErrorBoundary.tsx
git add web/src/components/PaykeyGeneratorModal.tsx
git commit -m "feat: add error boundary for generator animations

- Protects modal from animation crashes
- Shows user-friendly error message
- Auto-closes modal after error
- Full test coverage"
```

---

## Task 6: Remove Debug Console Logs

**Files:**

- Modify: `web/src/components/PaykeyGeneratorModal.tsx`
- Modify: `web/src/lib/state.ts`
- Modify: `web/src/components/Terminal.tsx`

**Step 1: Write test to ensure no console pollution**

Add to `web/src/components/__tests__/PaykeyGeneratorModal.test.tsx`:

```typescript
describe('PaykeyGeneratorModal Console Logs', () => {
  it('should not log to console.error during normal operation', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    useDemoStore.getState().setGeneratorData({
      customerName: 'John Smith',
      waldoData: undefined,
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    });

    render(<PaykeyGeneratorModal />);

    // Should not have any console.error calls from component
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npm test PaykeyGeneratorModal.test.tsx`

Expected: FAIL - console.error is being called

**Step 3: Remove console.error statements**

Modify `web/src/components/PaykeyGeneratorModal.tsx`:

```typescript
// DELETE lines 35-39 (debug logging):
// console.error('🔥 [MODAL] PaykeyGeneratorModal rendered:', {
//   showPaykeyGenerator,
//   hasGeneratorData: !!generatorData,
//   generatorData,
// });

// DELETE lines 81-86 (null return logging):
// if (!showPaykeyGenerator || !generatorData) {
//   console.error('🔥 [MODAL] Returning null because:', {
//     showPaykeyGenerator,
//     generatorData,
//     reason: !showPaykeyGenerator ? 'showPaykeyGenerator is false' : 'generatorData is null',
//   });
//   return null;
// }

// Replace with clean version:
if (!showPaykeyGenerator || !generatorData) {
  return null;
}

// DELETE line 89 (modal render logging):
// console.error('🔥 [MODAL] Rendering modal with data:', generatorData);
```

Modify `web/src/lib/state.ts` (lines 203-206):

```typescript
  setGeneratorData: (data: GeneratorData) => {
    // DELETE console.error lines
    set({ generatorData: data, showPaykeyGenerator: true });
  },
```

Modify `web/src/components/Terminal.tsx` (line 378):

```typescript
        // DELETE console.error line
        useDemoStore.getState().setGeneratorData({
```

**Step 4: Run test to verify it passes**

Run: `cd web && npm test PaykeyGeneratorModal.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/PaykeyGeneratorModal.tsx
git add web/src/lib/state.ts
git add web/src/components/Terminal.tsx
git commit -m "chore: remove debug console.error statements

- Clean up development logging
- Reduce console noise
- Keep error boundary logging only"
```

---

## Task 7: Manual Verification

**Files:**

- None (manual testing)

**Step 1: Start dev server and test full flow**

```bash
npm run dev
```

Open browser to http://localhost:5173

**Step 2: Test bank account paykey (no WALDO)**

Terminal commands:

```
/reset
/create-customer --outcome verified
/create-paykey bank --outcome active
```

Verify:

- Modal opens immediately
- Shows BLAKE3 stage (skips WALDO)
- Animation progresses through all stages
- Modal closes after minting complete
- No console errors
- No infinite render loops

**Step 3: Test Plaid paykey (with WALDO)**

Terminal commands:

```
/reset
/create-customer --outcome verified
/create-paykey plaid --outcome active
```

Verify:

- Modal opens immediately
- Shows WALDO stage first
- NameNormalizer animation completes (~1.5s)
- VariationTree animation runs
- SimilarityMeter animation runs
- Progresses to BLAKE3 stage
- Progresses to Minting stage
- Modal closes after complete
- No console errors

**Step 4: Test Skip button**

Trigger modal, click SKIP immediately

Verify:

- Modal closes without errors
- State is cleaned up

**Step 5: Test ESC key**

Trigger modal, press ESC

Verify:

- Modal closes without errors

**Step 6: Test background click**

Trigger modal, click outside modal box

Verify:

- Modal closes without errors

**Step 7: Run all tests**

```bash
cd web && npm test
```

Expected: All tests pass

**Step 8: Run linter**

```bash
npm run lint
```

Expected: No errors

**Step 9: Run type check**

```bash
npm run type-check
```

Expected: No errors

**Step 10: Final commit**

```bash
git add -A
git commit -m "test: verify paykey generator modal functionality

- Manual testing complete
- All animations working
- No render loops
- Clean console output
- All automated tests passing"
```

---

## Summary

This plan fixes the systemic issues in the paykey generator modal:

**Root Causes Fixed:**

1. ✅ Missing `onComplete` dependency in NameNormalizer
2. ✅ Infinite loop in WaldoStage skip logic
3. ✅ Excessive re-renders from non-memoized callbacks
4. ✅ No error boundaries for animation failures
5. ✅ Debug console.error pollution

**Test Coverage Added:**

- NameNormalizer animation timing and completion
- WaldoStage skip behavior and loop prevention
- PaykeyGeneratorModal state management
- Stage progression logic
- Error boundary functionality

**Total Tasks:** 7 tasks with TDD approach
**Estimated Time:** 2-3 hours for complete implementation and testing

**Execution:** Ready for superpowers:executing-plans or superpowers:subagent-driven-development
