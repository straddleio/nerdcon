# Manual Testing Report - Task 7: Terminal Commands Integration

**Test Date:** [To be filled by tester]
**Tester:** [Your name]
**Environment:**
- Backend: http://localhost:3001
- Frontend: http://localhost:5174
- Browser: [Chrome/Firefox/Edge/Safari]

---

## Pre-Test Setup

### Server Status
- [ ] Backend server running on port 3001
- [ ] Frontend server running on port 5174
- [ ] Browser console open (F12)
- [ ] Application loaded at http://localhost:5174

### Visual Check
- [ ] Split-screen layout visible
- [ ] Terminal component on left
- [ ] Dashboard cards on right
- [ ] Connection status indicator visible

---

## Test 1: Individual Command Testing

### 1.1 Help Command
**Command:** `/help`

**Expected Results:**
- [ ] Help text displays in terminal
- [ ] Lists all available commands
- [ ] Shows command syntax and descriptions

**Actual Results:**
```
[Record what you see]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

### 1.2 Create Customer
**Command:** `/create-customer --outcome verified`

**Expected Results:**
- [ ] Success message in terminal
- [ ] CustomerCard populates with data
- [ ] Shows customer name "Alberta Bobbeth Charleson"
- [ ] Shows email "alberta.charleson@example.com"
- [ ] Shows phone "+12125550123"
- [ ] Modules display verification status
- [ ] SSE webhook logs appear in browser console

**Actual Results:**
```
Terminal Output:
[Record terminal output]

CustomerCard Data:
[Record what appears in CustomerCard]

Console Logs:
[Record webhook logs from browser console]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

### 1.3 Create Paykey (Bank Account)
**Command:** `/create-paykey bank --outcome active`

**Expected Results:**
- [ ] Success message in terminal
- [ ] PaykeyCard shows institution name
- [ ] PaykeyCard shows account balance
- [ ] WALDO confidence score displayed
- [ ] Account ownership status shown
- [ ] SSE webhook logs appear in browser console

**Actual Results:**
```
Terminal Output:
[Record terminal output]

PaykeyCard Data:
[Record what appears in PaykeyCard]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

### 1.4 Create Charge
**Command:** `/create-charge --amount 5000 --outcome paid`

**Expected Results:**
- [ ] Success message in terminal
- [ ] ChargeCard shows $50.00 charge amount
- [ ] ChargeCard shows status "paid"
- [ ] PizzaTracker displays lifecycle steps
- [ ] PizzaTracker shows progression: created → scheduled → pending → paid
- [ ] SSE webhook logs appear in browser console

**Actual Results:**
```
Terminal Output:
[Record terminal output]

ChargeCard Data:
[Record charge amount and status]

PizzaTracker Status:
[Record tracker steps and current status]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

## Test 2: Full Demo Flow

### 2.1 Reset Command
**Command:** `/reset`

**Expected Results:**
- [ ] All dashboard cards clear
- [ ] CustomerCard shows empty state
- [ ] PaykeyCard shows empty state
- [ ] ChargeCard shows empty state
- [ ] PizzaTracker clears
- [ ] Success message in terminal

**Actual Results:**
```
[Record what happens]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

### 2.2 Demo Command (Full Flow)
**Command:** `/demo`

**Expected Results:**
- [ ] Three steps execute sequentially:
  1. Create customer with verified outcome
  2. Create paykey with active outcome
  3. Create charge with paid outcome
- [ ] All three cards populate with data
- [ ] PizzaTracker shows complete lifecycle
- [ ] Success message displays at end
- [ ] Each step shows progress in terminal

**Actual Results:**
```
Step 1 - Customer Creation:
[Record output]

Step 2 - Paykey Creation:
[Record output]

Step 3 - Charge Creation:
[Record output]

Final State:
[Record all card states]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

## Test 3: Command History Navigation

### 3.1 Arrow Key Navigation
**Test Steps:**
1. Type `/help` and press Enter
2. Type `/info` and press Enter
3. Press Arrow Up
4. Press Arrow Up again
5. Press Arrow Down

**Expected Results:**
- [ ] After first Arrow Up: `/info` appears in input
- [ ] After second Arrow Up: `/help` appears in input
- [ ] After Arrow Down: `/info` appears in input
- [ ] Command history cycles through correctly

**Actual Results:**
```
[Record navigation behavior]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

## Test 4: Error Handling

### 4.1 Missing Prerequisite Error
**Command:** `/create-charge`
(Run this after `/reset` to ensure no paykey exists)

**Expected Results:**
- [ ] Error message displays: "No paykey found. Create a paykey first with /create-paykey"
- [ ] Error appears in red/error styling
- [ ] No charge is created

**Actual Results:**
```
[Record error message]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

### 4.2 Invalid Command Error
**Command:** `/invalid-command`

**Expected Results:**
- [ ] Error message displays: "Unknown command: /invalid-command"
- [ ] Error appears in red/error styling
- [ ] Help hint suggests using `/help`

**Actual Results:**
```
[Record error message]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

## Test 5: SSE Connection & Webhooks

### 5.1 Connection Status
**Test Steps:**
1. Open browser console (F12)
2. Look for SSE connection logs
3. Check connection status indicator in UI

**Expected Results:**
- [ ] Browser console shows `[SSE] Connected to http://localhost:3001/api/sse`
- [ ] Connection status indicator shows green "LIVE"
- [ ] No connection errors in console

**Actual Results:**
```
Console Logs:
[Record SSE connection logs]

Connection Status:
[Record UI indicator state]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

### 5.2 Webhook Reception
**Test Steps:**
1. Run `/create-customer --outcome verified`
2. Watch browser console for webhook logs

**Expected Results:**
- [ ] Console logs show webhook events like:
  - `customer.created`
  - `customer.updated`
  - `identity.verified`
- [ ] Dashboard updates in real-time as webhooks arrive
- [ ] No webhook errors in console

**Actual Results:**
```
Webhook Events Received:
[List all webhook events from console]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

### 5.3 Reconnection Behavior
**Test Steps:**
1. Stop backend server (Ctrl+C in server terminal)
2. Observe UI connection status
3. Restart backend server (`npm run dev`)
4. Observe reconnection

**Expected Results:**
- [ ] Connection status turns red "OFFLINE" when backend stops
- [ ] Browser console shows disconnection message
- [ ] Connection status turns green "LIVE" after backend restarts
- [ ] Auto-reconnects within a few seconds
- [ ] No manual refresh needed

**Actual Results:**
```
Disconnection:
[Record behavior when server stops]

Reconnection:
[Record behavior when server restarts]

Time to Reconnect:
[Record approximate time]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

## Test 6: Additional Command Testing

### 6.1 Info Command
**Command:** `/info`

**Expected Results:**
- [ ] Displays current demo state
- [ ] Shows customer ID if customer exists
- [ ] Shows paykey ID if paykey exists
- [ ] Shows charge ID if charge exists
- [ ] Shows "No [resource]" if resource doesn't exist

**Actual Results:**
```
[Record info output]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

### 6.2 Outcomes Command
**Command:** `/outcomes`

**Expected Results:**
- [ ] Lists supported sandbox outcomes for:
  - Customers (verified, review, rejected)
  - Paykeys (active, inactive, rejected)
  - Charges (paid, failed, reversed_insufficient_funds, etc.)
- [ ] Formatted clearly and readable

**Actual Results:**
```
[Record outcomes output]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

### 6.3 Clear Command
**Command:** `/clear`

**Expected Results:**
- [ ] Terminal scrollback clears
- [ ] Only prompt line remains
- [ ] Dashboard cards remain unchanged
- [ ] State is NOT reset (only visual clear)

**Actual Results:**
```
[Record behavior]
```

**Status:** [ ] PASS [ ] FAIL
**Notes:**

---

## Test 7: Manual Verification Checklist

Go through the complete checklist from the task specification:

- [ ] Terminal accepts input and executes commands
- [ ] Command history works (arrow up/down)
- [ ] All dashboard cards display real data
- [ ] SSE connection indicator shows green when connected
- [ ] Webhooks update dashboard in real-time
- [ ] `/demo` command runs full flow successfully
- [ ] `/reset` clears all state
- [ ] `/clear` clears terminal output only
- [ ] Error messages display for invalid commands
- [ ] Retro gaming UI theme is applied consistently

**Additional Observations:**
```
[Any other notes about UI/UX, performance, visual bugs, etc.]
```

---

## Test 8: Different Sandbox Outcomes

### 8.1 Customer Review Outcome
**Commands:**
```
/reset
/create-customer --outcome review
```

**Expected Results:**
- [ ] Customer created with "review" status
- [ ] CustomerCard shows "pending review" or similar
- [ ] Identity verification modules indicate review needed

**Actual Results:**
```
[Record results]
```

**Status:** [ ] PASS [ ] FAIL

---

### 8.2 Charge Failed Outcome
**Commands:**
```
/reset
/demo
/create-charge --amount 10000 --outcome failed
```

**Expected Results:**
- [ ] Charge created with "failed" status
- [ ] ChargeCard shows failure state
- [ ] PizzaTracker shows failed step
- [ ] Error/failure styling applied

**Actual Results:**
```
[Record results]
```

**Status:** [ ] PASS [ ] FAIL

---

## Overall Test Summary

**Total Tests:** [Count]
**Passed:** [Count]
**Failed:** [Count]
**Pass Rate:** [Percentage]

### Critical Issues Found
```
[List any blocking issues]
```

### Non-Critical Issues Found
```
[List minor bugs or improvements]
```

### Browser Compatibility
Tested on:
- [ ] Chrome [Version]
- [ ] Firefox [Version]
- [ ] Edge [Version]
- [ ] Safari [Version]

### Performance Notes
```
[Any observations about speed, responsiveness, lag]
```

### UI/UX Observations
```
[Notes about visual design, user experience, retro theme]
```

---

## Recommendations

### Must Fix Before Demo
1. [Issue 1]
2. [Issue 2]

### Should Fix
1. [Issue 1]
2. [Issue 2]

### Nice to Have
1. [Enhancement 1]
2. [Enhancement 2]

---

## Sign-Off

**Tester Signature:** ___________________
**Date:** ___________________
**Ready for Demo:** [ ] YES [ ] NO
**Comments:**
```
[Final thoughts]
```
