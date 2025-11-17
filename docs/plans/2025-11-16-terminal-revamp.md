# Terminal Revamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate terminal and API logs into a single unified terminal with inline API request logs, move menu button inline, and enhance visual styling to match riced alacritty terminal aesthetic.

**Architecture:** Refactor LeftPanel to render only Terminal component. Terminal component will integrate API log display inline after each command. CommandMenu button moves from floating to inline in terminal input area. Enhanced terminal styling with proper nesting, color scheme, and nerdcon heading font for commands.

**Tech Stack:** React, TypeScript, Zustand (state), Framer Motion (animations), Tailwind CSS (retro design system)

**Feature Branch:** `feature/terminal-revamp`

**Execution:** Use `/superpowers:execute-plan` with subagent-driven development workflow for parallel task execution and code review between tasks.

---

## Task 1: Create Feature Branch and Verify Current State

**Files:**
- No code changes

**Step 1: Create and switch to feature branch**

```bash
git checkout -b feature/terminal-revamp
```

Expected: Branch created and switched

**Step 2: Verify current terminal works**

Run: `npm run dev`

Expected: App loads at localhost:5173, terminal and API log sections visible in left panel

**Step 3: Take note of current structure**

Review files:
- `web/src/layout/LeftPanel.tsx` - 60/40 split terminal/API log
- `web/src/components/Terminal.tsx` - Terminal with floating menu
- `web/src/components/APILog.tsx` - Separate API log component
- `web/src/components/CommandMenu.tsx` - Floating menu button

Expected: Understanding of current architecture

**Step 4: Commit checkpoint**

```bash
git add .
git commit -m "chore: checkpoint before terminal revamp

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create APILogInline Component

**Files:**
- Create: `web/src/components/APILogInline.tsx`

**Step 1: Write component interface and skeleton**

Create `web/src/components/APILogInline.tsx`:

```typescript
import React, { useState } from 'react';
import { cn } from '@/components/ui/utils';
import type { APILogEntry } from '@/lib/state';

interface APILogInlineProps {
  entry: APILogEntry;
}

/**
 * Inline API request log that appears after terminal commands
 * Compact format with expandable request/response details
 */
export const APILogInline: React.FC<APILogInlineProps> = ({ entry }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-accent-green';
    if (status >= 400 && status < 500) return 'text-gold';
    if (status >= 500) return 'text-accent-red';
    return 'text-neutral-400';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-secondary';
      case 'POST':
        return 'text-gold';
      case 'PATCH':
        return 'text-primary';
      case 'DELETE':
        return 'text-accent-red';
      default:
        return 'text-neutral-400';
    }
  };

  return (
    <div className="border-l-2 border-primary/30 ml-2 pl-3 my-1">
      {/* Compact Request Line */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-background-elevated/20 p-1 rounded transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-primary/60 text-[10px] font-pixel">API</span>
        <span className={cn('font-pixel text-[10px] font-bold', getMethodColor(entry.method))}>
          {entry.method}
        </span>
        <span className="text-neutral-400 font-mono text-[10px] flex-1 truncate">
          {entry.path}
        </span>
        <span className={cn('font-mono text-[10px] font-bold', getStatusColor(entry.statusCode))}>
          {entry.statusCode}
        </span>
        <span className="text-neutral-500 font-mono text-[10px]">{entry.duration}ms</span>
        <span className="text-[10px] text-primary/60">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 space-y-2 text-[10px]">
          {/* Request/Response Split */}
          <div className="grid grid-cols-2 gap-2">
            {/* Request */}
            <div>
              <div className="text-neutral-500 font-pixel mb-1">Request</div>
              <pre className="p-2 bg-background-dark border border-primary/20 rounded text-neutral-300 font-mono overflow-x-auto scrollbar-retro max-h-48">
                {entry.requestBody
                  ? JSON.stringify(entry.requestBody, null, 2)
                  : '// No body'}
              </pre>
            </div>

            {/* Response */}
            <div>
              <div className="text-neutral-500 font-pixel mb-1">Response</div>
              <pre className="p-2 bg-background-dark border border-secondary/20 rounded text-neutral-300 font-mono overflow-x-auto scrollbar-retro max-h-48">
                {entry.responseBody
                  ? JSON.stringify(entry.responseBody, null, 2)
                  : '// No body'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

**Step 2: Verify component compiles**

Run: `npm run type-check`

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add web/src/components/APILogInline.tsx
git commit -m "feat: add inline API log component for terminal

- Compact single-line format with expand/collapse
- Color-coded method and status
- Split request/response view when expanded
- No request ID display to save space
- Formatted JSON with syntax highlighting

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add API Log Association to Terminal State

**Files:**
- Modify: `web/src/lib/state.ts`

**Step 1: Update TerminalLine interface to include associated API logs**

In `web/src/lib/state.ts`, find the `TerminalLine` interface (around line 22) and modify:

```typescript
/**
 * Terminal output line
 */
export interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  timestamp: Date;
  // Associated API log entries that occurred during this command
  apiLogs?: APILogEntry[];
}
```

**Step 2: Update addTerminalLine to accept optional apiLogs**

Find the `addTerminalLine` function in the store and verify it handles the new field. The function should already spread all properties, so this should work automatically.

**Step 3: Verify types compile**

Run: `npm run type-check`

Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add web/src/lib/state.ts
git commit -m "feat: associate API logs with terminal lines

- Add apiLogs field to TerminalLine interface
- Enables inline API log display in terminal

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Create Enhanced Terminal with Inline API Logs

**Files:**
- Modify: `web/src/components/Terminal.tsx`

**Step 1: Import APILogInline component**

At the top of `web/src/components/Terminal.tsx`, add import:

```typescript
import { APILogInline } from './APILogInline';
```

**Step 2: Add useEffect to associate API logs with terminal lines**

After the existing imports and state declarations (around line 30), add:

```typescript
const apiLogs = useDemoStore((state) => state.apiLogs);

// Associate API logs with terminal lines
useEffect(() => {
  if (apiLogs.length === 0) return;

  // Find the most recent input line and attach any new API logs
  const lastInputIndex = terminalHistory.findLastIndex(line => line.type === 'input');
  if (lastInputIndex === -1) return;

  const lastInputLine = terminalHistory[lastInputIndex];

  // Get API logs that occurred after this command (within last 5 seconds)
  const commandTime = lastInputLine.timestamp.getTime();
  const relevantLogs = apiLogs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= commandTime && logTime < commandTime + 5000;
  });

  if (relevantLogs.length > 0 && !lastInputLine.apiLogs) {
    // Update the terminal line to include these logs
    const updatedHistory = [...terminalHistory];
    updatedHistory[lastInputIndex] = {
      ...lastInputLine,
      apiLogs: relevantLogs
    };
    // Note: This will require a new state setter - see next step
  }
}, [apiLogs, terminalHistory]);
```

**Step 3: Update renderLine to include inline API logs**

Replace the `renderLine` function (around line 360) with:

```typescript
/**
 * Render a single terminal line with inline API logs
 */
const renderLine = (line: TerminalLine) => {
  const formattedContent = formatTerminalText(line.text);

  return (
    <div key={line.id}>
      {/* Terminal Line */}
      <div
        className={cn(
          'font-mono text-sm leading-relaxed',
          {
            'text-neutral-300': line.type === 'output',
            'text-primary font-display': line.type === 'input', // Use nerdcon heading font
            'text-accent-green': line.type === 'success',
            'text-accent-red': line.type === 'error',
            'text-secondary': line.type === 'info',
          }
        )}
        data-type={line.type}
      >
        {formattedContent}
      </div>

      {/* Inline API Logs */}
      {line.apiLogs && line.apiLogs.length > 0 && (
        <div className="ml-4 my-1">
          {line.apiLogs.map(log => (
            <APILogInline key={log.requestId} entry={log} />
          ))}
        </div>
      )}
    </div>
  );
};
```

**Step 4: Verify component compiles**

Run: `npm run type-check`

Expected: No TypeScript errors (may have unused variable warning for now)

**Step 5: Commit**

```bash
git add web/src/components/Terminal.tsx
git commit -m "feat: integrate inline API logs in terminal

- Import APILogInline component
- Associate API logs with terminal command lines
- Render API logs inline after each command
- Use nerdcon heading font (font-display) for input commands

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Move Command Menu Button Inline

**Files:**
- Modify: `web/src/components/Terminal.tsx`
- Modify: `web/src/components/CommandMenu.tsx`

**Step 1: Update CommandMenu to support inline placement**

In `web/src/components/CommandMenu.tsx`, modify the menu button and panel animation:

Replace the menu toggle button section (around line 62) with:

```typescript
{/* Menu Toggle Button - Inline Style */}
<button
  onClick={toggleMenu}
  aria-label="Toggle command menu"
  aria-expanded={isOpen}
  aria-controls="command-menu-panel"
  className={cn(
    "bg-gradient-to-r from-accent to-accent/80",
    "text-white font-pixel text-xs px-2 py-1",
    "rounded-pixel shadow-neon-accent",
    "hover:shadow-neon-accent-lg hover:from-accent/90 hover:to-accent/70",
    "transition-all duration-300",
    "flex items-center gap-1"
  )}
>
  <span className="text-xs">{isOpen ? '▼' : '▲'}</span>
  <span>MENU</span>
</button>
```

Replace the slide-out panel (around line 82) with bottom slide-up panel:

```typescript
{/* Slide-up Menu Panel from Bottom */}
<AnimatePresence>
  {isOpen && (
    <motion.div
      id="command-menu-panel"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn(
        "absolute left-0 right-0 bottom-0 z-40",
        "bg-gradient-to-br from-background-elevated to-background-card",
        "border-t-2 border-primary shadow-neon-primary",
        "p-4 overflow-y-auto scrollbar-retro max-h-64"
      )}
    >
      <h2 className="font-pixel text-primary text-sm mb-4 text-glow-primary">
        COMMAND MENU
      </h2>

      {/* Command categories - same as before */}
      <div className="space-y-4">
        {/* Keep existing command buttons structure */}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

**Step 2: Update CommandMenu props to make it non-absolute**

Change the component export to remove absolute positioning context:

```typescript
export const CommandMenu: React.FC<CommandMenuProps> = ({ onCommandSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      {/* Button and panel here */}
    </div>
  );
};
```

**Step 3: Move CommandMenu to terminal input area**

In `web/src/components/Terminal.tsx`, modify the input form section (around line 405):

```typescript
{/* Input Area */}
<form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-primary/30 pt-1 mt-1">
  <span className="text-primary font-pixel text-xs">{'>'}</span>
  <input
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={handleKeyDown}
    placeholder="Enter command..."
    className="flex-1 bg-transparent border-none outline-none text-primary font-body text-xs placeholder-neutral-600 disabled:opacity-50"
    disabled={isExecuting}
    autoFocus
  />
  <CommandMenu onCommandSelect={handleMenuCommand} />
</form>
```

**Step 4: Remove CommandMenu from top of terminal**

In `web/src/components/Terminal.tsx`, find and remove the line (around line 386):

```typescript
{/* Command Menu */}
<CommandMenu onCommandSelect={handleMenuCommand} />
```

Remove this entire line.

**Step 5: Update terminal container to handle menu overlay**

Modify the main terminal container div (around line 384):

```typescript
return (
  <div className="h-full flex flex-col bg-background-dark p-2 relative overflow-hidden">
    {/* Rest of content */}
  </div>
);
```

**Step 6: Test menu animation**

Run: `npm run dev`

Expected: Menu button appears inline in input area, slides up from bottom when clicked, terminal content shifts up

**Step 7: Commit**

```bash
git add web/src/components/Terminal.tsx web/src/components/CommandMenu.tsx
git commit -m "feat: move command menu inline with terminal input

- CommandMenu button now inline on right of input area
- Menu slides up from bottom instead of from left
- Terminal content shifts up when menu active
- Menu slides down to restore full terminal pane

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Refactor LeftPanel to Single Terminal

**Files:**
- Modify: `web/src/layout/LeftPanel.tsx`
- Modify: `web/src/App.tsx`

**Step 1: Update LeftPanel to only render terminal**

In `web/src/layout/LeftPanel.tsx`, replace entire file with:

```typescript
import React from 'react';

interface LeftPanelProps {
  terminal: React.ReactNode;
}

/**
 * Left panel with unified terminal
 * API logs now appear inline within terminal
 */
export const LeftPanel: React.FC<LeftPanelProps> = ({ terminal }) => {
  return (
    <div className="h-full">
      {terminal}
    </div>
  );
};
```

**Step 2: Update App.tsx to remove apiLog prop**

In `web/src/App.tsx`, find the LeftPanel usage (around line 28) and modify:

```typescript
<LeftPanel
  terminal={<Terminal />}
/>
```

Remove the `apiLog={<APILog />}` line.

**Step 3: Verify app still compiles**

Run: `npm run type-check`

Expected: No TypeScript errors

**Step 4: Test in browser**

Run: `npm run dev`

Expected: Only terminal visible in left panel, no separate API log section

**Step 5: Commit**

```bash
git add web/src/layout/LeftPanel.tsx web/src/App.tsx
git commit -m "refactor: consolidate to single terminal view

- Remove 60/40 split in LeftPanel
- Terminal now occupies full left panel
- Remove separate APILog component from App
- API logs display inline within terminal

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Enhanced Terminal Styling - Alacritty Aesthetic

**Files:**
- Modify: `web/src/components/Terminal.tsx`

**Step 1: Enhance formatTerminalText for better nesting and structure**

In `web/src/components/Terminal.tsx`, replace the `formatTerminalText` function (around line 326) with enhanced version:

```typescript
/**
 * Format terminal output with proper nesting and structure
 * Inspired by riced alacritty terminals with our retro color scheme
 */
const formatTerminalText = (text: string): React.ReactNode => {
  const lines = text.split('\n');

  return lines.map((line, i) => {
    // Detect indentation level
    const indent = line.match(/^(\s+)/)?.[1].length || 0;
    const paddingLeft = Math.floor(indent / 2) * 0.75; // 0.75rem per 2 spaces

    // Detect list items
    const isBullet = /^\s*[•\-*]\s/.test(line);
    const isNumbered = /^\s*\d+[.)]\s/.test(line);

    // Detect key-value pairs (enhanced)
    const keyValueMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_\s]*?):\s*(.+)$/);

    // Detect special formatting
    const isSuccess = /^✓/.test(line.trim());
    const isError = /^✗/.test(line.trim());
    const isInfo = /^ℹ/.test(line.trim());

    if (keyValueMatch) {
      const [, key, value] = keyValueMatch;
      return (
        <div
          key={i}
          style={{ paddingLeft: `${paddingLeft}rem` }}
          className="flex gap-2 font-mono text-xs leading-relaxed"
        >
          <span className="text-secondary font-semibold">{key}:</span>
          <span className="text-neutral-300">{value}</span>
        </div>
      );
    }

    return (
      <div
        key={i}
        style={{ paddingLeft: `${paddingLeft}rem` }}
        className={cn(
          'font-mono text-xs leading-relaxed',
          isBullet && "before:content-['▸'] before:mr-2 before:text-primary",
          isNumbered && "text-gold",
          isSuccess && "text-accent-green",
          isError && "text-accent-red",
          isInfo && "text-secondary"
        )}
      >
        {line.replace(/^\s+/, '')}
      </div>
    );
  });
};
```

**Step 2: Update renderLine with enhanced styling**

Replace the `renderLine` function with enhanced styling:

```typescript
/**
 * Render a single terminal line with enhanced alacritty-style formatting
 */
const renderLine = (line: TerminalLine) => {
  const formattedContent = formatTerminalText(line.text);

  return (
    <div key={line.id} className="mb-1">
      {/* Terminal Line */}
      <div
        className={cn(
          'leading-relaxed transition-colors duration-150',
          {
            'text-neutral-300 font-mono text-xs': line.type === 'output',
            'text-primary font-display text-sm font-bold tracking-wide': line.type === 'input',
            'text-accent-green font-mono text-xs': line.type === 'success',
            'text-accent-red font-mono text-xs': line.type === 'error',
            'text-secondary font-mono text-xs': line.type === 'info',
          }
        )}
        data-type={line.type}
      >
        {formattedContent}
      </div>

      {/* Inline API Logs */}
      {line.apiLogs && line.apiLogs.length > 0 && (
        <div className="ml-2 my-1.5 space-y-1">
          {line.apiLogs.map(log => (
            <APILogInline key={log.requestId} entry={log} />
          ))}
        </div>
      )}
    </div>
  );
};
```

**Step 3: Enhance terminal header styling**

Update the terminal header (around line 389):

```typescript
{/* Header */}
<div className="mb-2 pb-2 border-b border-primary/20">
  <RetroHeading level={4} variant="primary" className="text-xs leading-tight tracking-wider">
    STRADDLE TERMINAL v1.0
  </RetroHeading>
  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
    Type /help for commands
  </div>
</div>
```

**Step 4: Enhance output area styling**

Update the output area container (around line 396):

```typescript
{/* Output Area */}
<div
  ref={outputRef}
  className="flex-1 overflow-y-auto scrollbar-retro font-body text-xs space-y-0 min-h-0 px-1"
  style={{
    scrollBehavior: 'smooth',
    background: 'linear-gradient(180deg, rgba(10,14,26,0) 0%, rgba(10,14,26,0.3) 100%)'
  }}
>
  {terminalHistory.map((line) => renderLine(line))}
  {isExecuting && (
    <div className="text-primary animate-pulse font-mono text-xs flex items-center gap-2">
      <span className="inline-block w-1 h-3 bg-primary animate-pulse"></span>
      Processing...
    </div>
  )}
</div>
```

**Step 5: Enhance input area styling**

Update the input form (around line 405):

```typescript
{/* Input Area */}
<form
  onSubmit={handleSubmit}
  className="flex items-center gap-2 border-t border-primary/20 pt-2 mt-2 bg-background-elevated/30 px-2 py-1.5 rounded"
>
  <span className="text-primary font-pixel text-xs animate-pulse">{'>'}</span>
  <input
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={handleKeyDown}
    placeholder="Enter command..."
    className="flex-1 bg-transparent border-none outline-none text-primary font-mono text-xs placeholder-neutral-600 disabled:opacity-50"
    disabled={isExecuting}
    autoFocus
  />
  <CommandMenu onCommandSelect={handleMenuCommand} />
</form>
```

**Step 6: Test enhanced styling**

Run: `npm run dev`

Expected: Terminal looks like riced alacritty with:
- Proper color gradients
- Enhanced nesting visualization
- Key-value pair highlighting
- Smooth animations
- Command input uses heading font (font-display)

**Step 7: Commit**

```bash
git add web/src/components/Terminal.tsx
git commit -m "feat: enhance terminal styling with alacritty aesthetic

- Improved text nesting and indentation display
- Key-value pair syntax highlighting
- Enhanced color scheme integration
- Command input uses nerdcon heading font (font-display)
- Subtle gradients and transitions
- Better visual hierarchy and spacing
- Symbol-based status indicators (✓, ✗, ℹ)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Format JSON in API Logs with Color Scheme

**Files:**
- Modify: `web/src/components/APILogInline.tsx`

**Step 1: Create JSON syntax highlighter function**

Add this helper function at the top of `web/src/components/APILogInline.tsx` after imports:

```typescript
/**
 * Format JSON with syntax highlighting using retro color scheme
 */
const formatJSON = (obj: any): string => {
  if (!obj) return '// No data';

  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return '// Invalid JSON';
  }
};

/**
 * Syntax highlight JSON string
 */
const highlightJSON = (jsonString: string): React.ReactNode => {
  // Simple regex-based syntax highlighting
  const parts = jsonString.split(/("(?:[^"\\]|\\.)*")|(\d+)|(\btrue\b|\bfalse\b|\bnull\b)/g);

  return parts.map((part, i) => {
    if (!part) return null;

    // String (includes quotes)
    if (part.startsWith('"')) {
      // Check if it's a key (followed by :) or value
      const isKey = jsonString.indexOf(part) !== -1 &&
                    jsonString[jsonString.indexOf(part) + part.length]?.trim() === ':';

      return (
        <span key={i} className={isKey ? 'text-secondary' : 'text-accent-green'}>
          {part}
        </span>
      );
    }

    // Number
    if (/^\d+$/.test(part)) {
      return (
        <span key={i} className="text-gold">
          {part}
        </span>
      );
    }

    // Boolean/null
    if (/^(true|false|null)$/.test(part)) {
      return (
        <span key={i} className="text-primary">
          {part}
        </span>
      );
    }

    // Default (punctuation, whitespace)
    return <span key={i} className="text-neutral-400">{part}</span>;
  });
};
```

**Step 2: Update expanded view to use highlighted JSON**

Replace the expanded details section in the component:

```typescript
{/* Expanded Details */}
{isExpanded && (
  <div className="mt-2 space-y-2 text-[10px]">
    {/* Request/Response Split */}
    <div className="grid grid-cols-2 gap-2">
      {/* Request */}
      <div>
        <div className="text-neutral-500 font-pixel mb-1 text-[9px]">Request</div>
        <pre className="p-2 bg-background-dark border border-primary/20 rounded font-mono overflow-x-auto scrollbar-retro max-h-48 text-[10px] leading-relaxed">
          <code>{highlightJSON(formatJSON(entry.requestBody))}</code>
        </pre>
      </div>

      {/* Response */}
      <div>
        <div className="text-neutral-500 font-pixel mb-1 text-[9px]">Response</div>
        <pre className="p-2 bg-background-dark border border-secondary/20 rounded font-mono overflow-x-auto scrollbar-retro max-h-48 text-[10px] leading-relaxed">
          <code>{highlightJSON(formatJSON(entry.responseBody))}</code>
        </pre>
      </div>
    </div>
  </div>
)}
```

**Step 3: Test JSON syntax highlighting**

Run: `npm run dev`

Execute a command like `/demo` and expand an API log

Expected: JSON keys in blue (secondary), strings in green, numbers in gold, booleans in cyan

**Step 4: Commit**

```bash
git add web/src/components/APILogInline.tsx
git commit -m "feat: add JSON syntax highlighting to API logs

- Syntax highlighting for request/response bodies
- Keys in secondary blue
- Strings in accent green
- Numbers in gold
- Booleans/null in primary cyan
- Maintains retro color scheme consistency

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Remove Old APILog Component and Clean Up

**Files:**
- Delete: `web/src/components/APILog.tsx`
- Modify: `web/src/App.tsx`

**Step 1: Remove APILog import from App.tsx**

In `web/src/App.tsx`, remove the import line:

```typescript
import { APILog } from './components/APILog';
```

**Step 2: Delete APILog component file**

```bash
rm web/src/components/APILog.tsx
```

**Step 3: Check for other references to APILog**

Run:
```bash
grep -r "APILog" web/src/ --exclude-dir=node_modules
```

Expected: Only test files may reference it (can be updated separately)

**Step 4: Verify app compiles**

Run: `npm run type-check`

Expected: No errors

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated APILog component

- Delete separate APILog component
- Remove imports from App.tsx
- API logs now fully integrated inline with terminal

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Fix API Log Association Logic

**Files:**
- Modify: `web/src/lib/state.ts`

**Step 1: Add helper to associate API logs with terminal lines**

In `web/src/lib/state.ts`, find the store definition and add a new action:

```typescript
// Inside the store definition, after setExecuting
associateAPILogsWithCommand: (commandId: string, logs: APILogEntry[]) =>
  set((state) => {
    const updatedHistory = state.terminalHistory.map(line =>
      line.id === commandId
        ? { ...line, apiLogs: [...(line.apiLogs || []), ...logs] }
        : line
    );
    return { terminalHistory: updatedHistory };
  }),
```

**Step 2: Export the action type**

Update the interface definition to include the new method:

```typescript
export interface DemoState {
  // ... existing fields ...

  // Actions
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  setExecuting: (executing: boolean) => void;
  associateAPILogsWithCommand: (commandId: string, logs: APILogEntry[]) => void;
  // ... other actions ...
}
```

**Step 3: Verify state compiles**

Run: `npm run type-check`

Expected: No errors

**Step 4: Commit**

```bash
git add web/src/lib/state.ts
git commit -m "feat: add API log association helper to state

- New associateAPILogsWithCommand action
- Enables proper linking of API logs to commands
- Supports multiple logs per command

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Implement API Log Association in Commands

**Files:**
- Modify: `web/src/lib/commands.ts`

**Step 1: Update executeCommand to track command IDs**

In `web/src/lib/commands.ts`, find the `executeCommand` function and update to track the command ID:

```typescript
export const executeCommand = async (input: string): Promise<CommandResult> => {
  const { addTerminalLine, associateAPILogsWithCommand } = useDemoStore.getState();

  // Generate command ID
  const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Record when command started for API log association
  const commandStartTime = Date.now();

  // ... rest of command parsing and execution ...

  // After command execution, associate any API logs that occurred
  // (This will be done via SSE or polling - placeholder for now)

  return { success: true, message: 'Command executed' };
};
```

**Step 2: Update addTerminalLine calls to use consistent IDs**

Find all `addTerminalLine` calls and ensure they can be tracked. The ID is auto-generated by the store, so we need to return it.

Update the store's `addTerminalLine` to return the ID:

Go back to `web/src/lib/state.ts` and modify:

```typescript
addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => {
  const id = uuid();
  set((state) => ({
    terminalHistory: [
      ...state.terminalHistory,
      { ...line, id, timestamp: new Date() },
    ],
  }));
  return id;
},
```

**Step 3: Update interface to include return type**

```typescript
addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => string;
```

**Step 4: Update Terminal.tsx to capture command IDs**

In `web/src/components/Terminal.tsx`, modify the `handleSubmit` function to track command IDs:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const command = input.trim();
  if (!command) return;

  // Add to history
  setCommandHistory((prev) => [...prev, command]);
  setHistoryIndex(-1);

  // Add input line to terminal and capture ID
  const commandId = addTerminalLine({ text: `> ${command}`, type: 'input' });
  setInput('');
  setExecuting(true);

  try {
    // Execute command
    const result = await executeCommand(command);

    // Add result to terminal
    if (result.message) {
      addTerminalLine({
        text: result.message,
        type: result.success ? 'success' : 'error',
      });
    }
  } catch (error) {
    addTerminalLine({
      text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'error',
    });
  } finally {
    setExecuting(false);
  }
};
```

**Step 5: Verify compiles**

Run: `npm run type-check`

Expected: No errors

**Step 6: Commit**

```bash
git add web/src/lib/state.ts web/src/lib/commands.ts web/src/components/Terminal.tsx
git commit -m "feat: implement command ID tracking for API log association

- addTerminalLine now returns command ID
- Commands track their IDs for API log linking
- Foundation for automatic API log association

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Implement Automatic API Log Association via SSE

**Files:**
- Modify: `web/src/lib/useSSE.ts`

**Step 1: Update SSE hook to associate API logs with latest command**

In `web/src/lib/useSSE.ts`, find where API logs are processed and add association logic:

```typescript
// When receiving API log updates via SSE
if (event.type === 'api_log') {
  const newLog = event.data as APILogEntry;

  // Add to global logs
  setApiLogs((prev) => [newLog, ...prev]);

  // Associate with most recent command (within last 10 seconds)
  const { terminalHistory, associateAPILogsWithCommand } = useDemoStore.getState();
  const recentCommand = terminalHistory
    .filter(line => line.type === 'input')
    .reverse()
    .find(line => {
      const timeDiff = Date.now() - line.timestamp.getTime();
      return timeDiff < 10000; // Within 10 seconds
    });

  if (recentCommand) {
    associateAPILogsWithCommand(recentCommand.id, [newLog]);
  }
}
```

**Step 2: Verify SSE integration**

Run: `npm run dev`

Execute a command like `/demo`

Expected: API logs appear inline with the command automatically

**Step 3: Commit**

```bash
git add web/src/lib/useSSE.ts
git commit -m "feat: automatic API log association via SSE

- SSE events automatically link API logs to commands
- Associates logs with most recent command (10s window)
- Real-time inline API log display

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 13: Update Terminal Tests

**Files:**
- Modify: `web/src/components/__tests__/Terminal-styling.test.tsx`
- Modify: `web/src/components/__tests__/Terminal-autocomplete.test.tsx`

**Step 1: Update styling test for new inline menu**

In `web/src/components/__tests__/Terminal-styling.test.tsx`, update tests that reference CommandMenu:

```typescript
// Remove tests about floating menu positioning
// Add tests for inline menu placement

it('renders command menu inline with input', () => {
  render(<Terminal />);
  const menuButton = screen.getByLabelText(/toggle command menu/i);
  const inputArea = screen.getByPlaceholderText(/enter command/i).parentElement;

  expect(inputArea).toContainElement(menuButton);
});
```

**Step 2: Add test for API log inline display**

```typescript
it('displays API logs inline after commands', async () => {
  const { container } = render(<Terminal />);

  // Mock a command with API logs
  const mockTerminalLine: TerminalLine = {
    id: 'test-1',
    text: '> /demo',
    type: 'input',
    timestamp: new Date(),
    apiLogs: [{
      requestId: 'req-1',
      correlationId: 'corr-1',
      method: 'POST',
      path: '/api/customers',
      statusCode: 200,
      duration: 150,
      timestamp: new Date().toISOString(),
      requestBody: { name: 'Test' },
      responseBody: { id: 'cust_123' }
    }]
  };

  // Add to store
  useDemoStore.getState().setTerminalHistory([mockTerminalLine]);

  // Check for inline API log
  await waitFor(() => {
    expect(screen.getByText(/POST/i)).toBeInTheDocument();
    expect(screen.getByText(/\/api\/customers/i)).toBeInTheDocument();
  });
});
```

**Step 3: Run tests**

Run: `npm test`

Expected: Tests pass or need minor updates based on implementation

**Step 4: Commit**

```bash
git add web/src/components/__tests__/
git commit -m "test: update terminal tests for inline changes

- Update CommandMenu positioning tests
- Add tests for inline API log display
- Remove deprecated APILog component tests

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 14: Visual Polish and Final Adjustments

**Files:**
- Modify: `web/src/components/Terminal.tsx`
- Modify: `web/src/components/APILogInline.tsx`

**Step 1: Add subtle animations to terminal output**

In `web/src/components/Terminal.tsx`, update the renderLine function to add fade-in animation:

```typescript
const renderLine = (line: TerminalLine) => {
  const formattedContent = formatTerminalText(line.text);

  return (
    <div
      key={line.id}
      className="mb-1 animate-pixel-fade-in"
    >
      {/* Rest of content */}
    </div>
  );
};
```

**Step 2: Add hover effects to API log entries**

In `web/src/components/APILogInline.tsx`, enhance hover states:

```typescript
<div className="border-l-2 border-primary/30 ml-2 pl-3 my-1 hover:border-primary/60 transition-all duration-200">
  <div
    className="flex items-center gap-2 cursor-pointer hover:bg-background-elevated/30 p-1 rounded transition-all duration-200 hover:shadow-sm"
    onClick={() => setIsExpanded(!isExpanded)}
  >
    {/* Content */}
  </div>
</div>
```

**Step 3: Add loading indicator improvements**

Update the processing indicator in Terminal.tsx:

```typescript
{isExecuting && (
  <div className="flex items-center gap-2 text-primary animate-pulse font-mono text-xs my-2">
    <div className="flex gap-1">
      <span className="inline-block w-1 h-3 bg-primary animate-pulse" style={{ animationDelay: '0ms' }}></span>
      <span className="inline-block w-1 h-3 bg-primary animate-pulse" style={{ animationDelay: '150ms' }}></span>
      <span className="inline-block w-1 h-3 bg-primary animate-pulse" style={{ animationDelay: '300ms' }}></span>
    </div>
    <span>Processing...</span>
  </div>
)}
```

**Step 4: Test visual polish**

Run: `npm run dev`

Test:
- Line animations on new output
- Hover states on API logs
- Loading indicators
- Overall visual cohesion

Expected: Smooth, polished retro terminal experience

**Step 5: Commit**

```bash
git add web/src/components/Terminal.tsx web/src/components/APILogInline.tsx
git commit -m "polish: add animations and visual refinements

- Fade-in animations for terminal lines
- Enhanced hover states for API logs
- Improved loading indicators with staggered animation
- Smooth transitions throughout

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 15: Update Documentation

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`

**Step 1: Update README architecture section**

In `README.md`, find the architecture section and update:

```markdown
## Architecture

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
└─────────────────────────────────────────────────────┘
```

**Left Panel:** Unified terminal with inline API request logs and command menu
**Right Panel:** Live dashboard showing verification status and payment flow
```

**Step 2: Add terminal UI section to CLAUDE.md**

In `CLAUDE.md`, add section after "Architecture":

```markdown
## Terminal UI

The terminal provides a CLI-style interface with integrated API logging:

**Features:**
- Unified view: Terminal and API logs in single pane
- Inline API logs: Request/response details appear after each command
- Syntax highlighting: JSON formatted with retro color scheme
- Command menu: Inline button slides up menu from bottom
- Alacritty aesthetic: Proper nesting, color scheme, retro fonts

**Components:**
- `Terminal.tsx` - Main terminal with inline API logs
- `APILogInline.tsx` - Compact expandable API log entries
- `CommandMenu.tsx` - Slide-up command menu
```

**Step 3: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: update for unified terminal architecture

- Update architecture diagrams
- Document inline API log feature
- Add terminal UI section to CLAUDE.md
- Reflect current single-pane design

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 16: End-to-End Testing and Verification

**Files:**
- No code changes

**Step 1: Full functionality test**

Run: `npm run dev`

Test sequence:
1. Open browser to localhost:5173
2. Execute `/help` - verify commands display properly with formatting
3. Execute `/demo` - verify:
   - API logs appear inline after command
   - Logs are expandable/collapsible
   - JSON syntax highlighting works
   - Color scheme is consistent
4. Click menu button - verify:
   - Menu slides up from bottom
   - Terminal content shifts up
   - Menu slides back down on close
5. Test various commands (/info, /outcomes, /customer-create)
6. Verify terminal scrolling works smoothly
7. Check terminal text uses heading font for commands

Expected: All features work as designed

**Step 2: Run type checking**

Run: `npm run type-check`

Expected: No TypeScript errors

**Step 3: Run linting**

Run: `npm run lint`

Expected: No linting errors (or only minor warnings)

**Step 4: Create verification checklist**

Create file: `docs/testing/terminal-revamp-verification.md`

```markdown
# Terminal Revamp Verification Checklist

## ✅ Core Features

- [ ] Single terminal pane (no separate API log section)
- [ ] API logs appear inline after commands
- [ ] API logs are expandable/collapsible
- [ ] Request ID not shown in logs (space saving)
- [ ] JSON syntax highlighting works
- [ ] Command menu button inline with input
- [ ] Menu slides up from bottom
- [ ] Menu slides down on close
- [ ] Terminal content shifts for menu

## ✅ Visual Design

- [ ] Command input uses nerdcon heading font (font-display)
- [ ] Proper text nesting and indentation
- [ ] Key-value pairs highlighted
- [ ] Color scheme matches design system
- [ ] Smooth animations and transitions
- [ ] Terminal resembles riced alacritty

## ✅ Functionality

- [ ] Commands execute correctly
- [ ] API logs auto-associate with commands
- [ ] Terminal scrolling works
- [ ] Input autocomplete still works
- [ ] Command history (arrow keys) works
- [ ] All terminal commands functional

## ✅ Code Quality

- [ ] TypeScript compiles without errors
- [ ] No linting errors
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Clean git history
```

**Step 5: Document test results**

After running all tests, update the verification checklist with results.

**Step 6: Commit verification docs**

```bash
git add docs/testing/terminal-revamp-verification.md
git commit -m "test: add terminal revamp verification checklist

- Comprehensive feature verification
- Visual design checks
- Functionality testing
- Code quality verification

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 17: Create Pull Request

**Files:**
- No code changes

**Step 1: Final build test**

Run: `npm run build`

Expected: Build succeeds without errors

**Step 2: Check git status**

Run: `git status`

Expected: All changes committed, working tree clean

**Step 3: Push feature branch**

```bash
git push -u origin feature/terminal-revamp
```

Expected: Branch pushed to remote

**Step 4: Create pull request**

Run:
```bash
gh pr create --title "Terminal Revamp: Unified Terminal with Inline API Logs" --body "$(cat <<'EOF'
## Summary

Major UX improvement consolidating terminal and API logs into a single unified view with enhanced visual design.

### Key Changes

- **Single Terminal Pane**: Removed 60/40 split, terminal now occupies full left panel
- **Inline API Logs**: Request/response details appear directly after each command
- **Space Optimization**: Removed request ID display, compact log format
- **JSON Syntax Highlighting**: Color-coded JSON with retro color scheme
- **Inline Command Menu**: Menu button moved to terminal input, slides up from bottom
- **Enhanced Styling**: Alacritty-inspired design with proper nesting, heading font for commands

### Components Changed

- `Terminal.tsx` - Integrated inline API logs, enhanced styling, inline menu
- `APILogInline.tsx` - New component for compact expandable logs
- `LeftPanel.tsx` - Simplified to single terminal view
- `CommandMenu.tsx` - Refactored for bottom slide-up animation
- `state.ts` - Added API log association support

### Components Removed

- `APILog.tsx` - Deprecated separate API log component

### Testing

- ✅ All commands functional
- ✅ API logs auto-associate with commands
- ✅ Menu animations smooth
- ✅ Visual design matches specifications
- ✅ TypeScript compiles clean
- ✅ Build successful

### Screenshots

See verification checklist: `docs/testing/terminal-revamp-verification.md`

## Test Plan

1. Run `/demo` - verify inline API logs appear
2. Click menu button - verify slide-up animation
3. Expand API log - verify JSON highlighting
4. Test various commands - verify formatting
5. Check terminal scrolling and responsiveness

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR created successfully

**Step 5: Get PR URL**

The command will output the PR URL. Copy it for reference.

**Step 6: Final commit**

```bash
git add .
git commit -m "chore: terminal revamp complete - ready for review

All tasks completed:
- Single unified terminal view
- Inline API logs with syntax highlighting
- Command menu moved inline with slide-up animation
- Enhanced alacritty-style visual design
- Documentation updated
- Tests verified

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Completion Summary

### What Was Built

1. **Unified Terminal View** - Single pane replacing 60/40 split
2. **Inline API Logs** - Compact logs appearing after commands
3. **JSON Syntax Highlighting** - Color-coded JSON with retro scheme
4. **Inline Command Menu** - Bottom slide-up menu integration
5. **Enhanced Styling** - Alacritty-inspired terminal aesthetic
6. **Automatic Log Association** - SSE-driven log linking

### Files Modified

- `web/src/components/Terminal.tsx` - Core terminal with inline logs
- `web/src/layout/LeftPanel.tsx` - Simplified single view
- `web/src/components/CommandMenu.tsx` - Inline menu with animations
- `web/src/lib/state.ts` - API log association support
- `web/src/lib/useSSE.ts` - Automatic log association
- `README.md`, `CLAUDE.md` - Updated documentation

### Files Created

- `web/src/components/APILogInline.tsx` - Inline log component
- `docs/testing/terminal-revamp-verification.md` - Test checklist
- `docs/plans/2025-11-16-terminal-revamp.md` - This plan

### Files Removed

- `web/src/components/APILog.tsx` - Deprecated component

### Execution Instructions

**Using Subagent-Driven Development (Recommended):**

```bash
# In current session, use subagent-driven-development skill
/superpowers:execute-plan docs/plans/2025-11-16-terminal-revamp.md
```

**Using Parallel Session:**

```bash
# Open new Claude Code session in the same directory
# Then run:
/superpowers:execute-plan docs/plans/2025-11-16-terminal-revamp.md
```

Both approaches will execute tasks sequentially with code review between major steps.
