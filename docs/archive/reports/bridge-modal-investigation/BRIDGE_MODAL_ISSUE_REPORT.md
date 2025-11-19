# Bridge Modal Close Issue - Root Cause Analysis

**Date:** 2025-11-19
**Status:** 🐛 BUG CONFIRMED - Orphaned iframe not cleaned up
**Severity:** Medium - Modal appears not to close, but is actually caused by third-party library

---

## Executive Summary

The Bridge modal does NOT properly close because the `<StraddleBridge>` component from `@straddleio/bridge-react` leaves an orphaned iframe in the DOM when it unmounts.

### Visual Impact

- User clicks close button → Close button disappears, backdrop disappears
- But Bridge widget (iframe) remains visible on screen
- User perceives this as "modal didn't close" even though the BridgeModal component did unmount

---

## Root Cause

The `<StraddleBridge>` component from `@straddleio/bridge-react`:

1. Renders an iframe with id `Straddle-widget-iframe`
2. **Appends this iframe directly to `document.body`** (not within its own component tree)
3. **Does NOT remove the iframe when the component unmounts**

### Evidence

**Before Close:**

```json
{
  "id": "Straddle-widget-iframe",
  "parentTag": "BODY",        ← Direct child of body, not React component
  "hasParent": true,
  "zIndex": "2147483647"
}
```

**After Close:**

```json
{
  "id": "Straddle-widget-iframe",
  "parentTag": "BODY",        ← Still in DOM!
  "hasParent": true,
  "isConnected": true,        ← Still connected
  "zIndex": "2147483647"
}
```

**BridgeModal Elements After Close:**

```
backdrop: false   ✅ Properly removed
closeBtn: false   ✅ Properly removed
```

The BridgeModal component **did unmount correctly**, but the iframe was left behind.

---

## Technical Details

### Current Code Flow

**File:** `/home/keith/nerdcon/web/src/components/modals/BridgeModal.tsx`

```tsx
const handleExit = (): void => {
  console.log('Bridge exit called');
  addTerminalLine({
    text: 'Bridge widget closed',
    type: 'info',
    source: 'ui-action',
  });
  setBridgeToken(null); // ← Sets token to null
  setBridgeModalOpen(false); // ← Sets modal state to false
};

// Early return check (line 74-76)
if (!bridgeToken || bridgeToken.trim() === '') {
  return null; // ← Component unmounts
}

return (
  <>
    {isBridgeModalOpen && <div onClick={handleExit} />} {/* Backdrop */}
    {isBridgeModalOpen && <StraddleBridge token={bridgeToken} onClose={handleExit} />}
    {isBridgeModalOpen && <button onClick={handleExit}>✕ ESC</button>}
  </>
);
```

### What Happens When User Clicks Close

1. ✅ `handleExit()` is called
2. ✅ `setBridgeToken(null)` updates state
3. ✅ Component re-renders
4. ✅ Early return check (`!bridgeToken`) passes → returns `null`
5. ✅ React unmounts BridgeModal component
6. ✅ Backdrop removed from DOM
7. ✅ Close button removed from DOM
8. ❌ **`<StraddleBridge>` component does NOT clean up its iframe**
9. ❌ **iframe remains visible on screen**

---

## Test Results

### Test: Element Removal Timeline

| Time         | Backdrop | Close Button | iframe |
| ------------ | -------- | ------------ | ------ |
| Before close | 1        | 1            | 1      |
| 0ms after    | 0 ✅     | 0 ✅         | 1 ❌   |
| 500ms after  | 0 ✅     | 0 ✅         | 1 ❌   |
| 1000ms after | 0 ✅     | 0 ✅         | 1 ❌   |
| 2000ms after | 0 ✅     | 0 ✅         | 1 ❌   |

**Conclusion:** Backdrop and close button are removed immediately. iframe persists indefinitely.

### Console Output Confirms Handler Execution

```
[log] Bridge exit called
```

The `handleExit()` function executes successfully. The issue is **not** with our event handlers.

---

## Why This Happens

The `@straddleio/bridge-react` library appears to:

1. Create an iframe imperatively (probably `document.createElement('iframe')`)
2. Append it directly to body (`document.body.appendChild(iframe)`)
3. Not provide a cleanup method or unmount lifecycle

This is a **third-party library issue**, not a bug in our BridgeModal component.

---

## Solutions

### Option 1: Force iframe removal (QUICK FIX) ✅ RECOMMENDED

Add manual iframe cleanup to `handleExit()`:

```tsx
const handleExit = (): void => {
  console.log('Bridge exit called');

  // Force remove Straddle iframe if it exists
  const iframe = document.getElementById('Straddle-widget-iframe');
  if (iframe) {
    iframe.remove();
  }

  addTerminalLine({
    text: 'Bridge widget closed',
    type: 'info',
    source: 'ui-action',
  });
  setBridgeToken(null);
  setBridgeModalOpen(false);
};
```

**Pros:**

- Simple, 3 lines of code
- Works immediately
- No dependency changes

**Cons:**

- Assumes iframe id `'Straddle-widget-iframe'` won't change
- Doesn't address root cause in library

### Option 2: useEffect cleanup (BETTER PRACTICE) ✅ ALSO RECOMMENDED

Add a useEffect to handle iframe cleanup:

```tsx
// Clean up orphaned iframe when component unmounts
React.useEffect(() => {
  return () => {
    // Cleanup function runs when component unmounts
    const iframe = document.getElementById('Straddle-widget-iframe');
    if (iframe) {
      console.log('Cleaning up orphaned Straddle iframe');
      iframe.remove();
    }
  };
}, []);
```

**Pros:**

- Follows React best practices
- Automatic cleanup on unmount
- Doesn't rely on handleExit being called

**Cons:**

- Assumes iframe id won't change
- Still a workaround for library issue

### Option 3: Contact Straddle Support (LONG TERM)

File a bug report with Straddle about the iframe cleanup issue in `@straddleio/bridge-react`.

**Pros:**

- Fixes root cause
- Benefits all users of the library

**Cons:**

- Takes time
- Requires waiting for library update
- May not be prioritized

### Option 4: Wrapper with MutationObserver (NUCLEAR OPTION)

Create a wrapper component that monitors for iframe creation and ensures cleanup.

**Pros:**

- Most robust

**Cons:**

- Overly complex
- Performance overhead
- Overkill for this issue

---

## Recommendation

**Implement both Option 1 and Option 2** for defense in depth:

1. Add useEffect cleanup (Option 2) - handles normal unmount
2. Add manual removal to handleExit (Option 1) - handles edge cases
3. File bug report with Straddle (Option 3) - long-term fix

### Proposed Code Change

```tsx
// Add this useEffect
React.useEffect(() => {
  return () => {
    const iframe = document.getElementById('Straddle-widget-iframe');
    if (iframe) {
      console.log('Cleaning up orphaned Straddle iframe');
      iframe.remove();
    }
  };
}, []);

// Update handleExit
const handleExit = (): void => {
  console.log('Bridge exit called');

  // Force remove iframe (defense in depth)
  const iframe = document.getElementById('Straddle-widget-iframe');
  if (iframe) {
    iframe.remove();
  }

  addTerminalLine({
    text: 'Bridge widget closed',
    type: 'info',
    source: 'ui-action',
  });
  setBridgeToken(null);
  setBridgeModalOpen(false);
};
```

---

## Test Files

All test files created during investigation:

1. `/home/keith/nerdcon/test-bridge-modal.spec.ts` - Initial investigation
2. `/home/keith/nerdcon/test-bridge-state.spec.ts` - State management check
3. `/home/keith/nerdcon/test-bridge-close-detailed.spec.ts` - Timeline analysis
4. `/home/keith/nerdcon/test-iframe-orphan.spec.ts` - Orphaned iframe proof

## Screenshots

Visual evidence of the issue:

1. `state-before-close.png` - Modal open with Bridge widget visible
2. `state-after-close.png` - After close, terminal shows "Bridge widget closed" but iframe still visible
3. `detailed-close-test.png` - Final state with orphaned iframe
4. `iframe-orphan-test.png` - After manual iframe removal test

---

## Impact

**User Experience:**

- User clicks close button
- Close button disappears
- Backdrop disappears
- **But Bridge widget stays visible** ← BAD UX
- User has to refresh page or click elsewhere to clear

**Severity:** Medium

- Does not crash the app
- Does not prevent other operations
- But creates confusing UX ("why won't this close?")

---

## Conclusion

The Bridge modal close functionality **works correctly in our code**, but is broken by the `@straddleio/bridge-react` library's failure to clean up its iframe when unmounting.

**Action Required:** Implement iframe cleanup workaround (Options 1 + 2).
