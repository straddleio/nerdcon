# Terminal UI Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the terminal interface with improved API log UX, better text formatting, and an interactive command menu with Street Fighter-style command cards.

**Architecture:** Four-phase approach: (1) Fix API log bugs and enhance interaction, (2) Improve terminal layout and styling, (3) Add slide-out command menu, (4) Build interactive command cards with visual flair.

**Tech Stack:** React, TypeScript, Zustand (state), Tailwind CSS (retro design system), Framer Motion (animations)

---

## Phase 1: API Log Enhancements

### Task 1.1: Fix React Key Bug

**Files:**
- Modify: `web/src/components/APILog.tsx:93`

**Problem:** POST /customers and GET /customers requests share expansion state due to duplicate or unstable keys.

**Step 1: Analyze current key generation**

Current line 93:
```typescript
key={`${entry.requestId}-${entry.method}-${entry.path}-${entry.timestamp}-${index}`}
```

The `requestId` should be unique, but if it's being reused or not properly generated, we get collisions.

**Step 2: Verify requestId uniqueness**

Run the app and check browser console:
```bash
# In browser console after running /customer-create command
console.log(useDemoStore.getState().apiLogs.map(l => l.requestId))
```

Expected: All unique UUIDs. If duplicates exist, the backend is reusing request IDs.

**Step 3: Use index-based stable key as fallback**

Since `requestId` comes from backend and may have timing issues, use index as primary key since logs are append-only:

```typescript
key={`api-log-${index}-${entry.timestamp}`}
```

**Step 4: Update expanded state to use index instead of requestId**

Replace line 14:
```typescript
const [expandedId, setExpandedId] = useState<number | null>(null);
```

Replace line 111:
```typescript
onClick={() => setExpandedId(expandedId === index ? null : index)}
```

Replace line 114:
```typescript
{expandedId === index ? '▼' : '▶'}
```

Replace line 119:
```typescript
{expandedId === index && (
```

**Step 5: Test the fix**

1. Run `/customer-create`
2. Verify POST /customers and GET /customers/:id/review expand independently
3. Click each log entry to confirm no linked behavior

**Step 6: Commit**

```bash
git add web/src/components/APILog.tsx
git commit -m "fix(api-log): resolve linked expansion bug by using index-based keys"
```

---

### Task 1.2: Click-Anywhere to Expand/Collapse

**Files:**
- Modify: `web/src/components/APILog.tsx:96-116`

**Step 1: Move onClick to parent div**

Replace the compact request line div (line 97) to make entire area clickable:

```typescript
<div
  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-background-elevated/30 transition-colors"
  onClick={() => setExpandedId(expandedId === index ? null : index)}
>
```

**Step 2: Remove button onClick and make it decorative**

Replace lines 110-115:
```typescript
{/* Expand/Collapse Indicator */}
<span className="text-xs text-primary pointer-events-none">
  {expandedId === index ? '▼' : '▶'}
</span>
```

**Step 3: Test click behavior**

1. Click anywhere on collapsed log → should expand
2. Click anywhere on expanded log → should collapse
3. Verify hover effect works

**Step 4: Commit**

```bash
git add web/src/components/APILog.tsx
git commit -m "feat(api-log): enable click-anywhere expansion"
```

---

### Task 1.3: Auto-Expand Latest Request

**Files:**
- Modify: `web/src/components/APILog.tsx:14-37`

**Step 1: Add useEffect to auto-expand latest**

After line 14, add new state and effect:

```typescript
const [expandedId, setExpandedId] = useState<number | null>(null);
const [autoExpandTimeout, setAutoExpandTimeout] = useState<NodeJS.Timeout | null>(null);

// Auto-expand most recent log entry
useEffect(() => {
  if (apiLogs.length === 0) return;

  const latestIndex = apiLogs.length - 1;

  // Clear any pending timeout
  if (autoExpandTimeout) {
    clearTimeout(autoExpandTimeout);
  }

  // Expand latest immediately
  setExpandedId(latestIndex);

  // After 3 seconds, keep it expanded (user can manually collapse)
  // This gives buffer for rapid sequences - only latest stays expanded
  const timeout = setTimeout(() => {
    // Check if this is still the latest
    const currentLatest = useDemoStore.getState().apiLogs.length - 1;
    if (latestIndex !== currentLatest) {
      // A newer request came in, this will be collapsed by the new one
      setExpandedId(currentLatest);
    }
  }, 3000);

  setAutoExpandTimeout(timeout);

  return () => {
    if (timeout) clearTimeout(timeout);
  };
}, [apiLogs.length]); // Only trigger on new logs
```

**Step 2: Test auto-expansion**

1. Run `/customer-create` → latest log should auto-expand
2. Wait 3 seconds → should stay expanded
3. Run `/create-paykey bank` → new log auto-expands, previous collapses
4. Run `/demo` (multiple rapid requests) → only latest should stay expanded

**Step 3: Commit**

```bash
git add web/src/components/APILog.tsx
git commit -m "feat(api-log): auto-expand latest request with 3s buffer"
```

---

## Phase 2: Terminal Layout & Styling

### Task 2.1: Adjust Split Ratio to 60/40

**Files:**
- Modify: `web/src/layout/LeftPanel.tsx:12-26`

**Step 1: Update height percentages**

Replace lines 16 and 22:

```typescript
export const LeftPanel: React.FC<LeftPanelProps> = ({ terminal, apiLog }) => {
  return (
    <div className="h-full flex flex-col">
      {/* Terminal Section (60%) */}
      <div className="h-[60%] border-b border-primary/30 overflow-hidden">
        {terminal}
      </div>

      {/* API Log Section (40%) */}
      <div className="h-[40%] overflow-hidden">
        {apiLog}
      </div>
    </div>
  );
};
```

**Step 2: Update comments**

Ensure comments match new ratio (line 9):
```typescript
/**
 * Left panel with 60/40 split: Terminal on top, API Log below
 * Terminal gets larger space for improved command visibility
 */
```

**Step 3: Test layout**

1. Open app at localhost:5173
2. Verify terminal takes ~60% of left panel
3. Verify API log takes ~40%
4. Resize browser to ensure proportions hold

**Step 4: Commit**

```bash
git add web/src/layout/LeftPanel.tsx
git commit -m "feat(layout): change terminal/api-log split to 60/40"
```

---

### Task 2.2: Add Terminal Text Formatting

**Files:**
- Modify: `web/src/components/Terminal.tsx:125-164`

**Step 1: Create enhanced text formatting utility**

Add before getLineClass function (line 128):

```typescript
/**
 * Format terminal output with proper nesting and structure
 * Inspired by modern terminal emulators (alacritty, kitty)
 */
const formatTerminalText = (text: string): React.ReactNode => {
  const lines = text.split('\n');

  return lines.map((line, i) => {
    // Detect indentation level
    const indent = line.match(/^(\s+)/)?.[1].length || 0;
    const paddingLeft = indent * 0.5; // 0.5rem per 2 spaces

    // Detect list items
    const isBullet = /^\s*[•\-\*]\s/.test(line);
    const isNumbered = /^\s*\d+[\.\)]\s/.test(line);

    // Detect key-value pairs
    const isKeyValue = /^\s*[A-Za-z\s]+:\s/.test(line);

    return (
      <div
        key={i}
        style={{ paddingLeft: `${paddingLeft}rem` }}
        className={cn(
          isBullet && "before:content-['▸'] before:mr-1 before:text-primary/60",
          isNumbered && "font-mono",
          isKeyValue && "font-body text-neutral-300"
        )}
      >
        {line.trim()}
      </div>
    );
  });
};
```

**Step 2: Update terminal output rendering**

Replace lines 157-162:

```typescript
{terminalHistory.map((line) => (
  <div key={line.id} className={getLineClass(line.type)}>
    {formatTerminalText(line.text)}
  </div>
))}
```

**Step 3: Add import for cn utility**

At top of file (line 2):
```typescript
import { cn } from '@/components/ui/utils';
```

**Step 4: Test formatting**

1. Run `/help` → should show proper indentation
2. Run `/info` → key-value pairs should format nicely
3. Check that nesting is visible

**Step 5: Commit**

```bash
git add web/src/components/Terminal.tsx
git commit -m "feat(terminal): add rich text formatting with nesting"
```

---

### Task 2.3: Condense Success Messages

**Files:**
- Modify: `web/src/lib/commands.ts:114-412`

**Step 1: Update handleCreateCustomer output**

Replace lines 129-133:

```typescript
return {
  success: true,
  message: `✓ Customer created: ${customer.id}`,
  data: customer,
};
```

**Step 2: Update handleCustomerKYC output**

Replace lines 185-202:

```typescript
return {
  success: true,
  message: `✓ KYC Customer created: ${customer.id}`,
  data: customer,
};
```

**Step 3: Update handleCreatePaykey output**

Find the return statement (~line 250) and replace:

```typescript
return {
  success: true,
  message: `✓ Paykey created: ${paykey.id}`,
  data: paykey,
};
```

**Step 4: Update handleCreateCharge output**

Find the return statement (~line 340) and replace:

```typescript
return {
  success: true,
  message: `✓ Charge created: ${charge.id}`,
  data: charge,
};
```

**Step 5: Update /demo command output**

Find handleDemo function and update intermediate success messages to only show IDs:

```typescript
// After customer creation
addTerminalLine({ text: `✓ Customer created: ${customer.id}`, type: 'success' });

// After paykey creation
addTerminalLine({ text: `✓ Paykey created: ${paykey.id}`, type: 'success' });

// After charge creation
addTerminalLine({ text: `✓ Charge created: ${charge.id}`, type: 'success' });
```

**Step 6: Test condensed output**

1. Run each command and verify only "✓ Action: ID" appears
2. Verify full data still visible in API log
3. Check /demo shows clean progression

**Step 7: Commit**

```bash
git add web/src/lib/commands.ts
git commit -m "feat(terminal): condense success messages to action + ID"
```

---

## Phase 3: Command Menu System

### Task 3.1: Create Menu Component Structure

**Files:**
- Create: `web/src/components/CommandMenu.tsx`

**Step 1: Create base menu component**

```typescript
import React, { useState } from 'react';
import { cn } from '@/components/ui/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type CommandType =
  | 'customer-create'
  | 'customer-kyc'
  | 'paykey-plaid'
  | 'paykey-bank'
  | 'charge'
  | 'payout'
  | 'demo'
  | 'reset';

interface CommandMenuProps {
  onCommandSelect: (command: CommandType) => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ onCommandSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Menu Toggle Button - Nintendo Power Glove Style */}
      <button
        onClick={toggleMenu}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-50",
          "bg-gradient-to-r from-accent to-accent/80",
          "text-white font-pixel text-xs px-3 py-2",
          "rounded-r-pixel shadow-neon-accent",
          "hover:shadow-neon-accent-lg hover:from-accent/90 hover:to-accent/70",
          "transition-all duration-300",
          "flex items-center gap-2"
        )}
      >
        <span className="rotate-90">{isOpen ? '▼' : '▶'}</span>
        <span>MENU</span>
      </button>

      {/* Slide-out Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "absolute left-0 top-0 bottom-0 w-64 z-40",
              "bg-gradient-to-br from-background-elevated to-background-card",
              "border-r-2 border-primary shadow-neon-primary",
              "p-4 overflow-y-auto scrollbar-retro"
            )}
          >
            <h2 className="font-pixel text-primary text-sm mb-4 text-glow-primary">
              COMMAND MENU
            </h2>

            {/* Command categories will go here */}
            <div className="space-y-4">
              {/* Categories added in next task */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
```

**Step 2: Install framer-motion**

```bash
cd web && npm install framer-motion
```

**Step 3: Add design system utilities**

Check if `shadow-neon-*` and `text-glow-*` exist in design system. If not, add to `web/src/lib/design-system/retro-design-system.ts`:

```typescript
// Add to tailwindConfig.theme.extend
boxShadow: {
  'neon-primary': '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)',
  'neon-primary-lg': '0 0 15px rgba(0, 255, 255, 0.7), 0 0 30px rgba(0, 255, 255, 0.5)',
  'neon-accent': '0 0 10px rgba(255, 0, 153, 0.5), 0 0 20px rgba(255, 0, 153, 0.3)',
  'neon-accent-lg': '0 0 15px rgba(255, 0, 153, 0.7), 0 0 30px rgba(255, 0, 153, 0.5)',
},
```

**Step 4: Verify component imports and builds**

```bash
npm run type-check
```

Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add web/src/components/CommandMenu.tsx web/package.json web/package-lock.json web/src/lib/design-system/retro-design-system.ts
git commit -m "feat(menu): create command menu base structure"
```

---

### Task 3.2: Add Command Categories and Buttons

**Files:**
- Modify: `web/src/components/CommandMenu.tsx:56-61`

**Step 1: Add command button component**

Add before CommandMenu component:

```typescript
interface CommandButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'utility';
  disabled?: boolean;
}

const CommandButton: React.FC<CommandButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  const variantClasses = {
    primary: 'bg-primary/20 border-primary text-primary hover:bg-primary/30',
    secondary: 'bg-secondary/20 border-secondary text-secondary hover:bg-secondary/30',
    utility: 'bg-gold/20 border-gold text-gold hover:bg-gold/30',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full px-3 py-2 rounded-pixel border-2",
        "font-pixel text-xs transition-all duration-200",
        "hover:shadow-neon-primary disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant]
      )}
    >
      {label}
    </button>
  );
};
```

**Step 2: Add command categories**

Replace the "Categories added in next task" comment (line 59):

```typescript
<div className="space-y-4">
  {/* CUSTOMERS */}
  <div>
    <h3 className="font-pixel text-secondary text-xs mb-2 uppercase">
      Customers
    </h3>
    <div className="space-y-2">
      <CommandButton
        label="Create Customer"
        onClick={() => {
          onCommandSelect('customer-create');
          setIsOpen(false);
        }}
      />
      <CommandButton
        label="Customer KYC"
        onClick={() => {
          onCommandSelect('customer-kyc');
          setIsOpen(false);
        }}
      />
    </div>
  </div>

  {/* PAYKEYS */}
  <div>
    <h3 className="font-pixel text-secondary text-xs mb-2 uppercase">
      Paykeys
    </h3>
    <div className="space-y-2">
      <CommandButton
        label="Plaid Link"
        onClick={() => {
          onCommandSelect('paykey-plaid');
          setIsOpen(false);
        }}
      />
      <CommandButton
        label="Bank Account"
        onClick={() => {
          onCommandSelect('paykey-bank');
          setIsOpen(false);
        }}
      />
    </div>
  </div>

  {/* PAYMENTS */}
  <div>
    <h3 className="font-pixel text-secondary text-xs mb-2 uppercase">
      Payments
    </h3>
    <div className="space-y-2">
      <CommandButton
        label="Charge"
        onClick={() => {
          onCommandSelect('charge');
          setIsOpen(false);
        }}
      />
      <CommandButton
        label="Payout"
        onClick={() => {
          onCommandSelect('payout');
          setIsOpen(false);
        }}
        disabled
      />
    </div>
  </div>

  {/* UTILITIES */}
  <div className="pt-2 border-t border-primary/20">
    <div className="grid grid-cols-2 gap-2">
      <CommandButton
        label="DEMO"
        onClick={() => {
          onCommandSelect('demo');
          setIsOpen(false);
        }}
        variant="utility"
      />
      <CommandButton
        label="RESET"
        onClick={() => {
          onCommandSelect('reset');
          setIsOpen(false);
        }}
        variant="utility"
      />
    </div>
  </div>
</div>
```

**Step 3: Test menu appearance**

Not yet integrated into app, but verify TypeScript builds:

```bash
npm run type-check
```

**Step 4: Commit**

```bash
git add web/src/components/CommandMenu.tsx
git commit -m "feat(menu): add categorized command buttons"
```

---

### Task 3.3: Integrate Menu into Terminal

**Files:**
- Modify: `web/src/components/Terminal.tsx:9-183`
- Modify: `web/src/layout/LeftPanel.tsx:1-27`

**Step 1: Import CommandMenu in Terminal**

Add import at top of Terminal.tsx:

```typescript
import { CommandMenu, CommandType } from './CommandMenu';
```

**Step 2: Add state for command card trigger**

After line 13, add:

```typescript
const [selectedCommand, setSelectedCommand] = useState<CommandType | null>(null);
```

**Step 3: Add command selection handler**

After handleKeyDown function (~line 123):

```typescript
/**
 * Handle command selection from menu
 */
const handleMenuCommand = (command: CommandType) => {
  setSelectedCommand(command);
  // Command card will handle actual execution in Phase 4
  // For now, just log
  console.log('Selected command:', command);
};
```

**Step 4: Wrap terminal in relative container and add menu**

Replace the main terminal div (line 143):

```typescript
return (
  <div className="h-full flex flex-col bg-background-dark p-2 relative">
    {/* Command Menu */}
    <CommandMenu onCommandSelect={handleMenuCommand} />

    {/* Header */}
    <div className="mb-1 pb-1 border-b border-primary/30">
      <RetroHeading level={4} variant="primary" className="text-xs leading-tight">
        STRADDLE TERMINAL
      </RetroHeading>
    </div>

    {/* Output Area */}
    {/* ... rest of terminal ... */}
  </div>
);
```

**Step 5: Test menu integration**

1. Start dev server
2. Open app
3. Click menu button → menu should slide out from left
4. Click command buttons → menu should close, check console for log
5. Verify menu doesn't block terminal functionality

**Step 6: Commit**

```bash
git add web/src/components/Terminal.tsx
git commit -m "feat(menu): integrate command menu into terminal"
```

---

## Phase 4: Command Card System

### Task 4.1: Create Command Card Base Component

**Files:**
- Create: `web/src/components/CommandCard.tsx`

**Step 1: Create card base with Street Fighter inspiration**

```typescript
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/components/ui/utils';

export interface CommandCardProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const CommandCard: React.FC<CommandCardProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
          />

          {/* Card - Street Fighter Style */}
          <motion.div
            initial={{
              scale: 0.5,
              opacity: 0,
              rotateY: -90,
              x: '-50%',
              y: '-50%'
            }}
            animate={{
              scale: 1,
              opacity: 1,
              rotateY: 0,
              x: '-50%',
              y: '-50%'
            }}
            exit={{
              scale: 0.5,
              opacity: 0,
              rotateY: 90,
              x: '-50%',
              y: '-50%'
            }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 200
            }}
            className={cn(
              "fixed top-1/2 left-1/2 z-[70]",
              "w-[500px] max-h-[80vh] overflow-y-auto",
              "bg-gradient-to-br from-background-elevated via-background-card to-background-dark",
              "border-4 border-primary rounded-pixel",
              "shadow-neon-primary-lg",
              "p-6"
            )}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-primary/30">
              <h2 className="font-pixel text-primary text-xl text-glow-primary uppercase">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-accent hover:text-accent/80 font-pixel text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

**Step 2: Add text-glow utilities if missing**

In `web/src/lib/design-system/retro-design-system.ts`, add to tailwindConfig.theme.extend:

```typescript
textShadow: {
  'glow-primary': '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.4)',
  'glow-secondary': '0 0 10px rgba(0, 102, 255, 0.8), 0 0 20px rgba(0, 102, 255, 0.4)',
  'glow-accent': '0 0 10px rgba(255, 0, 153, 0.8), 0 0 20px rgba(255, 0, 153, 0.4)',
},
```

And add plugin to support textShadow:

```typescript
export const tailwindConfig = {
  theme: {
    extend: {
      // ... existing config
    }
  },
  plugins: [
    // Add text shadow plugin
    function({ addUtilities }: any) {
      addUtilities({
        '.text-glow-primary': {
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.4)',
        },
        '.text-glow-secondary': {
          textShadow: '0 0 10px rgba(0, 102, 255, 0.8), 0 0 20px rgba(0, 102, 255, 0.4)',
        },
        '.text-glow-accent': {
          textShadow: '0 0 10px rgba(255, 0, 153, 0.8), 0 0 20px rgba(255, 0, 153, 0.4)',
        },
      });
    },
  ],
};
```

**Step 3: Verify builds**

```bash
npm run type-check
```

**Step 4: Commit**

```bash
git add web/src/components/CommandCard.tsx web/src/lib/design-system/retro-design-system.ts
git commit -m "feat(cards): create Street Fighter-style command card base"
```

---

### Task 4.2: Create Customer Command Card

**Files:**
- Create: `web/src/components/cards/CustomerCard.tsx`

**Step 1: Create customer form card**

```typescript
import React, { useState } from 'react';
import { CommandCard } from '../CommandCard';
import { cn } from '@/components/ui/utils';

interface CustomerCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData, outcome: 'verified' | 'review' | 'rejected') => void;
}

export interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: {
    address1: string;
    city: string;
    state: string;
    zip: string;
  };
  compliance_profile: {
    ssn: string;
    dob: string;
  };
  device: {
    ip_address: string;
  };
  type: 'individual' | 'business';
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    first_name: 'Alberta',
    last_name: 'Bobbeth Charleson',
    email: `user.${Date.now()}@example.com`,
    phone: '+12125550123',
    address: {
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
    },
    compliance_profile: {
      ssn: '123-45-6789',
      dob: '1990-01-01',
    },
    device: {
      ip_address: '192.168.1.1',
    },
    type: 'individual',
  });

  const handleSubmit = (outcome: 'verified' | 'review' | 'rejected') => {
    onSubmit(formData, outcome);
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...(prev as any)[parent], [field]: value }
    }));
  };

  return (
    <CommandCard isOpen={isOpen} onClose={onClose} title="CREATE CUSTOMER">
      {/* Form Fields */}
      <div className="space-y-3">
        {/* Name */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-pixel text-primary mb-1">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
            />
          </div>
          <div>
            <label className="block text-xs font-pixel text-primary mb-1">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Address</label>
          <input
            type="text"
            value={formData.address.address1}
            onChange={(e) => updateNestedField('address', 'address1', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm mb-2",
              "focus:border-primary focus:outline-none"
            )}
            placeholder="Street Address"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => updateNestedField('address', 'city', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
              placeholder="City"
            />
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) => updateNestedField('address', 'state', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
              placeholder="State"
            />
            <input
              type="text"
              value={formData.address.zip}
              onChange={(e) => updateNestedField('address', 'zip', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
              placeholder="ZIP"
            />
          </div>
        </div>

        {/* SSN */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">SSN</label>
          <input
            type="text"
            value={formData.compliance_profile.ssn}
            onChange={(e) => updateNestedField('compliance_profile', 'ssn', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
        </div>

        {/* DOB */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Date of Birth</label>
          <input
            type="date"
            value={formData.compliance_profile.dob}
            onChange={(e) => updateNestedField('compliance_profile', 'dob', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
        </div>

        {/* IP Address */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">IP Address</label>
          <input
            type="text"
            value={formData.device.ip_address}
            onChange={(e) => updateNestedField('device', 'ip_address', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Customer Type</label>
          <select
            value={formData.type}
            onChange={(e) => updateField('type', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          >
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {/* Sandbox Outcome Buttons - Street Fighter Style */}
      <div className="mt-6 pt-4 border-t-2 border-primary/20">
        <p className="text-xs font-pixel text-secondary mb-3">SANDBOX OUTCOME</p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleSubmit('verified')}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-accent-green/20 border-2 border-accent-green text-accent-green",
              "hover:bg-accent-green/30 hover:shadow-[0_0_15px_rgba(57,255,20,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ✓ Verified
          </button>
          <button
            onClick={() => handleSubmit('review')}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-gold/20 border-2 border-gold text-gold",
              "hover:bg-gold/30 hover:shadow-[0_0_15px_rgba(255,195,0,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ⚠ Review
          </button>
          <button
            onClick={() => handleSubmit('rejected')}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-accent-red/20 border-2 border-accent-red text-accent-red",
              "hover:bg-accent-red/30 hover:shadow-[0_0_15px_rgba(255,0,64,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ✗ Rejected
          </button>
        </div>
      </div>
    </CommandCard>
  );
};
```

**Step 2: Create cards directory**

```bash
mkdir -p web/src/components/cards
```

**Step 3: Verify builds**

```bash
npm run type-check
```

**Step 4: Commit**

```bash
git add web/src/components/cards/CustomerCard.tsx
git commit -m "feat(cards): create customer form card with outcomes"
```

---

### Task 4.3: Create Paykey Command Cards

**Files:**
- Create: `web/src/components/cards/PaykeyCard.tsx`

**Step 1: Create paykey card with conditional fields**

```typescript
import React, { useState } from 'react';
import { CommandCard } from '../CommandCard';
import { cn } from '@/components/ui/utils';

interface PaykeyCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaykeyFormData, outcome: 'active' | 'inactive' | 'rejected') => void;
  type: 'plaid' | 'bank';
  customerId?: string;
}

export interface PaykeyFormData {
  customer_id: string;
  // Plaid
  plaid_token?: string;
  // Bank
  account_number?: string;
  routing_number?: string;
  account_type?: 'checking' | 'savings';
}

export const PaykeyCard: React.FC<PaykeyCardProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  customerId
}) => {
  const [formData, setFormData] = useState<PaykeyFormData>({
    customer_id: customerId || '',
    plaid_token: 'test_plaid_token_sandbox',
    account_number: '123456789',
    routing_number: '021000021',
    account_type: 'checking',
  });

  const handleSubmit = (outcome: 'active' | 'inactive' | 'rejected') => {
    onSubmit(formData, outcome);
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const title = type === 'plaid' ? 'LINK PLAID ACCOUNT' : 'LINK BANK ACCOUNT';

  return (
    <CommandCard isOpen={isOpen} onClose={onClose} title={title}>
      {/* Image Placeholder */}
      <div className="flex items-center justify-center h-24 bg-background-dark border-2 border-primary/20 rounded-pixel mb-4">
        <span className="text-primary/40 font-pixel text-xs">
          {type === 'plaid' ? '🏦 PLAID LOGO' : '🏛️ BANK LOGO'}
        </span>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        {/* Customer ID */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Customer ID</label>
          <input
            type="text"
            value={formData.customer_id}
            onChange={(e) => updateField('customer_id', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
            placeholder="customer_xxx"
          />
        </div>

        {type === 'plaid' ? (
          /* Plaid Token */
          <div>
            <label className="block text-xs font-pixel text-primary mb-1">Plaid Token</label>
            <input
              type="text"
              value={formData.plaid_token}
              onChange={(e) => updateField('plaid_token', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
            />
          </div>
        ) : (
          /* Bank Account Fields */
          <>
            <div>
              <label className="block text-xs font-pixel text-primary mb-1">Account Number</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => updateField('account_number', e.target.value)}
                className={cn(
                  "w-full px-2 py-1 bg-background-dark border border-primary/30",
                  "rounded text-neutral-200 font-body text-sm",
                  "focus:border-primary focus:outline-none"
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-pixel text-primary mb-1">Routing Number</label>
              <input
                type="text"
                value={formData.routing_number}
                onChange={(e) => updateField('routing_number', e.target.value)}
                className={cn(
                  "w-full px-2 py-1 bg-background-dark border border-primary/30",
                  "rounded text-neutral-200 font-body text-sm",
                  "focus:border-primary focus:outline-none"
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-pixel text-primary mb-1">Account Type</label>
              <select
                value={formData.account_type}
                onChange={(e) => updateField('account_type', e.target.value)}
                className={cn(
                  "w-full px-2 py-1 bg-background-dark border border-primary/30",
                  "rounded text-neutral-200 font-body text-sm",
                  "focus:border-primary focus:outline-none"
                )}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Sandbox Outcome Buttons */}
      <div className="mt-6 pt-4 border-t-2 border-primary/20">
        <p className="text-xs font-pixel text-secondary mb-3">SANDBOX OUTCOME</p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleSubmit('active')}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-accent-green/20 border-2 border-accent-green text-accent-green",
              "hover:bg-accent-green/30 hover:shadow-[0_0_15px_rgba(57,255,20,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ✓ Active
          </button>
          <button
            onClick={() => handleSubmit('inactive')}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-gold/20 border-2 border-gold text-gold",
              "hover:bg-gold/30 hover:shadow-[0_0_15px_rgba(255,195,0,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ⚠ Inactive
          </button>
          <button
            onClick={() => handleSubmit('rejected')}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-accent-red/20 border-2 border-accent-red text-accent-red",
              "hover:bg-accent-red/30 hover:shadow-[0_0_15px_rgba(255,0,64,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ✗ Rejected
          </button>
        </div>
      </div>
    </CommandCard>
  );
};
```

**Step 2: Verify builds**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add web/src/components/cards/PaykeyCard.tsx
git commit -m "feat(cards): create paykey card for plaid and bank accounts"
```

---

### Task 4.4: Create Charge Command Card

**Files:**
- Create: `web/src/components/cards/ChargeCard.tsx`

**Step 1: Create charge form card**

```typescript
import React, { useState } from 'react';
import { CommandCard } from '../CommandCard';
import { cn } from '@/components/ui/utils';

interface ChargeCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ChargeFormData, outcome: ChargeOutcome) => void;
  paykeyToken?: string;
}

export type ChargeOutcome =
  | 'paid'
  | 'failed'
  | 'reversed_insufficient_funds'
  | 'on_hold_daily_limit'
  | 'cancelled_for_fraud_risk';

export interface ChargeFormData {
  paykey: string;
  amount: number;
  description: string;
  payment_date: string;
  consent_type: 'internet' | 'telephone' | 'written';
}

export const ChargeCard: React.FC<ChargeCardProps> = ({
  isOpen,
  onClose,
  onSubmit,
  paykeyToken
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<ChargeFormData>({
    paykey: paykeyToken || '',
    amount: 5000, // $50.00
    description: 'Payment for services',
    payment_date: today,
    consent_type: 'internet',
  });

  const handleSubmit = (outcome: ChargeOutcome) => {
    onSubmit(formData, outcome);
    onClose();
  };

  const updateField = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <CommandCard isOpen={isOpen} onClose={onClose} title="CREATE CHARGE">
      {/* Form Fields */}
      <div className="space-y-3">
        {/* Paykey */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">
            Paykey Token
          </label>
          <input
            type="text"
            value={formData.paykey}
            onChange={(e) => updateField('paykey', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
            placeholder="xxxxxxxx.02.xxxxxxxxx..."
          />
          <p className="text-xs text-neutral-500 mt-1">From state.paykey.paykey</p>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">
            Amount (cents)
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => updateField('amount', parseInt(e.target.value))}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
          <p className="text-xs text-neutral-500 mt-1">
            ${(formData.amount / 100).toFixed(2)} USD
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Payment Date</label>
          <input
            type="date"
            value={formData.payment_date}
            onChange={(e) => updateField('payment_date', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
        </div>

        {/* Consent Type */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Consent Type</label>
          <select
            value={formData.consent_type}
            onChange={(e) => updateField('consent_type', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          >
            <option value="internet">Internet</option>
            <option value="telephone">Telephone</option>
            <option value="written">Written</option>
          </select>
        </div>
      </div>

      {/* Sandbox Outcome Buttons */}
      <div className="mt-6 pt-4 border-t-2 border-primary/20">
        <p className="text-xs font-pixel text-secondary mb-3">SANDBOX OUTCOME</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSubmit('paid')}
            className={cn(
              "px-3 py-2 rounded-pixel font-pixel text-xs",
              "bg-accent-green/20 border-2 border-accent-green text-accent-green",
              "hover:bg-accent-green/30 hover:shadow-[0_0_15px_rgba(57,255,20,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ✓ Paid
          </button>
          <button
            onClick={() => handleSubmit('failed')}
            className={cn(
              "px-3 py-2 rounded-pixel font-pixel text-xs",
              "bg-accent-red/20 border-2 border-accent-red text-accent-red",
              "hover:bg-accent-red/30 hover:shadow-[0_0_15px_rgba(255,0,64,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ✗ Failed
          </button>
          <button
            onClick={() => handleSubmit('reversed_insufficient_funds')}
            className={cn(
              "px-3 py-2 rounded-pixel font-pixel text-xs",
              "bg-gold/20 border-2 border-gold text-gold",
              "hover:bg-gold/30 hover:shadow-[0_0_15px_rgba(255,195,0,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ⚠ Insufficient
          </button>
          <button
            onClick={() => handleSubmit('on_hold_daily_limit')}
            className={cn(
              "px-3 py-2 rounded-pixel font-pixel text-xs",
              "bg-secondary/20 border-2 border-secondary text-secondary",
              "hover:bg-secondary/30 hover:shadow-[0_0_15px_rgba(0,102,255,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ⏸ Daily Limit
          </button>
          <button
            onClick={() => handleSubmit('cancelled_for_fraud_risk')}
            className={cn(
              "px-3 py-2 rounded-pixel font-pixel text-xs col-span-2",
              "bg-accent/20 border-2 border-accent text-accent",
              "hover:bg-accent/30 hover:shadow-[0_0_15px_rgba(255,0,153,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            🚫 Fraud Risk
          </button>
        </div>
      </div>
    </CommandCard>
  );
};
```

**Step 2: Verify builds**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add web/src/components/cards/ChargeCard.tsx
git commit -m "feat(cards): create charge card with multiple outcomes"
```

---

### Task 4.5: Create Demo and Reset Cards

**Files:**
- Create: `web/src/components/cards/DemoCard.tsx`
- Create: `web/src/components/cards/ResetCard.tsx`

**Step 1: Create demo card with stylized text**

```typescript
import React from 'react';
import { CommandCard } from '../CommandCard';
import { cn } from '@/components/ui/utils';

interface DemoCardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DemoCard: React.FC<DemoCardProps> = ({ isOpen, onClose, onConfirm }) => {
  const handleExecute = () => {
    onConfirm();
    onClose();
  };

  return (
    <CommandCard isOpen={isOpen} onClose={onClose} title="DEMO MODE">
      {/* Street Fighter Style Visual */}
      <div className="py-8 text-center space-y-6">
        <div className="relative">
          <h3 className={cn(
            "font-pixel text-6xl text-primary text-glow-primary",
            "animate-pulse"
          )}>
            AUTO
          </h3>
          <h3 className={cn(
            "font-pixel text-6xl text-accent text-glow-accent",
            "animate-pulse",
            "animation-delay-150"
          )}>
            ATTACK
          </h3>
        </div>

        <p className="text-neutral-300 font-body text-sm max-w-sm mx-auto">
          Execute full happy-path flow: Customer → Paykey → Charge
        </p>

        <div className="space-y-2 text-xs font-pixel text-secondary">
          <p>⚡ Create verified customer</p>
          <p>⚡ Link active bank account</p>
          <p>⚡ Process successful charge</p>
        </div>
      </div>

      {/* Execute Button */}
      <div className="mt-6 pt-4 border-t-2 border-primary/20">
        <button
          onClick={handleExecute}
          className={cn(
            "w-full px-6 py-4 rounded-pixel font-pixel text-lg",
            "bg-gradient-to-r from-primary via-secondary to-accent",
            "text-black border-4 border-gold",
            "hover:shadow-[0_0_30px_rgba(0,255,255,0.8)]",
            "transition-all duration-200 uppercase",
            "animate-pulse"
          )}
        >
          🎮 EXECUTE COMBO
        </button>
      </div>
    </CommandCard>
  );
};
```

**Step 2: Create reset card**

```typescript
import React from 'react';
import { CommandCard } from '../CommandCard';
import { cn } from '@/components/ui/utils';

interface ResetCardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetCard: React.FC<ResetCardProps> = ({ isOpen, onClose, onConfirm }) => {
  const handleReset = () => {
    onConfirm();
    onClose();
  };

  return (
    <CommandCard isOpen={isOpen} onClose={onClose} title="RESET DEMO">
      {/* Warning Visual */}
      <div className="py-6 text-center space-y-4">
        <div className="text-6xl">⚠️</div>

        <h3 className="font-pixel text-2xl text-accent-red text-glow-accent">
          WARNING
        </h3>

        <p className="text-neutral-300 font-body text-sm max-w-sm mx-auto">
          This will clear all demo data:
        </p>

        <div className="space-y-2 text-xs font-body text-neutral-400">
          <p>• Customer data</p>
          <p>• Paykey information</p>
          <p>• Charge history</p>
          <p>• Terminal output</p>
          <p>• API logs</p>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="mt-6 pt-4 border-t-2 border-primary/20">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-neutral-700/20 border-2 border-neutral-500 text-neutral-400",
              "hover:bg-neutral-700/30",
              "transition-all duration-200 uppercase"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-accent-red/20 border-2 border-accent-red text-accent-red",
              "hover:bg-accent-red/30 hover:shadow-[0_0_15px_rgba(255,0,64,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            🗑️ Reset
          </button>
        </div>
      </div>
    </CommandCard>
  );
};
```

**Step 3: Verify builds**

```bash
npm run type-check
```

**Step 4: Commit**

```bash
git add web/src/components/cards/DemoCard.tsx web/src/components/cards/ResetCard.tsx
git commit -m "feat(cards): create demo and reset cards with visual flair"
```

---

### Task 4.6: Wire Command Cards to Terminal

**Files:**
- Modify: `web/src/components/Terminal.tsx:1-185`
- Modify: `web/src/lib/commands.ts` (add new functions)

**Step 1: Import all card components in Terminal**

Add to imports at top of Terminal.tsx:

```typescript
import { CustomerCard, CustomerFormData } from './cards/CustomerCard';
import { PaykeyCard, PaykeyFormData } from './cards/PaykeyCard';
import { ChargeCard, ChargeFormData, ChargeOutcome } from './cards/ChargeCard';
import { DemoCard } from './cards/DemoCard';
import { ResetCard } from './cards/ResetCard';
import { useDemoStore } from '@/lib/state';
```

**Step 2: Add card state management**

After line 13 where selectedCommand state is:

```typescript
const [selectedCommand, setSelectedCommand] = useState<CommandType | null>(null);
const customer = useDemoStore((state) => state.customer);
const paykey = useDemoStore((state) => state.paykey);
```

**Step 3: Create card submission handlers**

After handleMenuCommand function:

```typescript
/**
 * Handle customer card submission
 */
const handleCustomerSubmit = async (
  data: CustomerFormData,
  outcome: 'verified' | 'review' | 'rejected'
) => {
  setExecuting(true);
  addTerminalLine({ text: `> Creating customer (${outcome})...`, type: 'input' });

  try {
    const response = await fetch('http://localhost:3001/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        config: { sandbox_outcome: outcome }
      })
    });

    if (!response.ok) throw new Error('Failed to create customer');

    const customerData = await response.json();
    useDemoStore.getState().setCustomer(customerData);

    addTerminalLine({
      text: `✓ Customer created: ${customerData.id}`,
      type: 'success'
    });
  } catch (error) {
    addTerminalLine({
      text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'error'
    });
  } finally {
    setExecuting(false);
    setSelectedCommand(null);
  }
};

/**
 * Handle paykey card submission
 */
const handlePaykeySubmit = async (
  data: PaykeyFormData,
  outcome: 'active' | 'inactive' | 'rejected'
) => {
  setExecuting(true);
  const type = data.plaid_token ? 'plaid' : 'bank';
  addTerminalLine({ text: `> Creating ${type} paykey (${outcome})...`, type: 'input' });

  try {
    const endpoint = type === 'plaid'
      ? 'http://localhost:3001/api/bridge/plaid'
      : 'http://localhost:3001/api/bridge/bank-account';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        config: { sandbox_outcome: outcome }
      })
    });

    if (!response.ok) throw new Error('Failed to create paykey');

    const paykeyData = await response.json();
    useDemoStore.getState().setPaykey(paykeyData);

    addTerminalLine({
      text: `✓ Paykey created: ${paykeyData.id}`,
      type: 'success'
    });
  } catch (error) {
    addTerminalLine({
      text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'error'
    });
  } finally {
    setExecuting(false);
    setSelectedCommand(null);
  }
};

/**
 * Handle charge card submission
 */
const handleChargeSubmit = async (
  data: ChargeFormData,
  outcome: ChargeOutcome
) => {
  setExecuting(true);
  addTerminalLine({ text: `> Creating charge (${outcome})...`, type: 'input' });

  try {
    const response = await fetch('http://localhost:3001/api/charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        currency: 'USD',
        device: { ip_address: '192.168.1.1' },
        config: {
          balance_check: 'enabled',
          sandbox_outcome: outcome
        }
      })
    });

    if (!response.ok) throw new Error('Failed to create charge');

    const chargeData = await response.json();
    useDemoStore.getState().setCharge(chargeData);

    addTerminalLine({
      text: `✓ Charge created: ${chargeData.id}`,
      type: 'success'
    });
  } catch (error) {
    addTerminalLine({
      text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'error'
    });
  } finally {
    setExecuting(false);
    setSelectedCommand(null);
  }
};

/**
 * Handle demo execution
 */
const handleDemoExecute = async () => {
  // Use existing /demo command
  setSelectedCommand(null);
  await executeCommand('/demo');
};

/**
 * Handle reset execution
 */
const handleResetExecute = async () => {
  // Use existing /reset command
  setSelectedCommand(null);
  await executeCommand('/reset');
};
```

**Step 4: Add card components to render**

Before the closing `</div>` of the main terminal container, add:

```typescript
{/* Command Cards */}
<CustomerCard
  isOpen={selectedCommand === 'customer-create' || selectedCommand === 'customer-kyc'}
  onClose={() => setSelectedCommand(null)}
  onSubmit={handleCustomerSubmit}
/>
<PaykeyCard
  isOpen={selectedCommand === 'paykey-plaid'}
  onClose={() => setSelectedCommand(null)}
  onSubmit={handlePaykeySubmit}
  type="plaid"
  customerId={customer?.id}
/>
<PaykeyCard
  isOpen={selectedCommand === 'paykey-bank'}
  onClose={() => setSelectedCommand(null)}
  onSubmit={handlePaykeySubmit}
  type="bank"
  customerId={customer?.id}
/>
<ChargeCard
  isOpen={selectedCommand === 'charge'}
  onClose={() => setSelectedCommand(null)}
  onSubmit={handleChargeSubmit}
  paykeyToken={paykey?.paykey}
/>
<DemoCard
  isOpen={selectedCommand === 'demo'}
  onClose={() => setSelectedCommand(null)}
  onConfirm={handleDemoExecute}
/>
<ResetCard
  isOpen={selectedCommand === 'reset'}
  onClose={() => setSelectedCommand(null)}
  onConfirm={handleResetExecute}
/>
```

**Step 5: Test full integration**

1. Start dev server
2. Click menu button
3. Click "Create Customer" → card should appear
4. Fill form, click "Verified" → should create customer and close card
5. Test each card type
6. Verify terminal shows condensed success messages
7. Verify API log shows full request/response

**Step 6: Commit**

```bash
git add web/src/components/Terminal.tsx
git commit -m "feat(cards): wire all command cards to terminal with handlers"
```

---

## Testing & Verification

### Task 5.1: End-to-End Testing

**Step 1: Test API Log Enhancements**

1. Run `/customer-create`
2. Verify latest log auto-expands
3. Click anywhere on log to collapse
4. Run another command
5. Verify new log expands, old one collapses
6. Verify no linked expansion bug between POST and GET

**Step 2: Test Terminal Improvements**

1. Verify terminal takes 60% of left panel
2. Run `/help` → check text formatting and nesting
3. Run various commands → verify "✓ Action: ID" format
4. Check full data still in API logs

**Step 3: Test Command Menu**

1. Click menu button → slides out from left
2. Verify categories display correctly
3. Click each button → correct card appears
4. Verify menu closes when card opens

**Step 4: Test Command Cards**

Customer:
- Open customer card
- Edit fields
- Click each outcome button
- Verify customer created with correct outcome

Paykey (both types):
- Open plaid card → verify plaid token field
- Open bank card → verify bank fields
- Test with customer ID from state
- Click outcomes

Charge:
- Open charge card
- Verify paykey auto-filled from state
- Test amount conversion display
- Click various outcomes

Demo:
- Open demo card
- Verify "AUTO ATTACK" styling
- Click execute → full flow runs

Reset:
- Open reset card
- Verify warning display
- Click reset → state clears

**Step 5: Test CLI commands still work**

Type each command manually in terminal:
- `/customer-create --outcome verified`
- `/create-paykey bank --outcome active`
- `/create-charge --amount 5000 --outcome paid`
- `/demo`
- `/reset`

All should work without triggering cards.

**Step 6: Document any issues**

Create `docs/testing/2025-11-15-terminal-ui-test-report.md` with findings.

---

## Summary

This implementation plan adds:

1. **API Log Enhancements**: Fixed React key bug, click-anywhere expansion, auto-expand latest with 3s buffer
2. **Terminal Improvements**: 60/40 split, rich text formatting, condensed success messages
3. **Command Menu**: Slide-out menu with categorized buttons, Nintendo Power Glove aesthetic
4. **Command Cards**: Street Fighter-style cards for each command type with editable fields and sandbox outcome buttons
5. **Full Integration**: Cards wire to existing API, CLI commands still work independently

**Total Commits**: 16
**Estimated Time**: 6-8 hours (with testing)
**Key Dependencies**: framer-motion for animations
