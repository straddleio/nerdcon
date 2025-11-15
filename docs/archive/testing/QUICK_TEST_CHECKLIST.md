# Quick Test Checklist - Task 7

**URL:** http://localhost:5174
**Backend:** Port 3001 ✓ Running
**Frontend:** Port 5174 ✓ Running

---

## 5-Minute Smoke Test

### 1. Basic Commands (2 min)
```bash
/help
/create-customer --outcome verified
/create-paykey bank --outcome active
/create-charge --amount 5000 --outcome paid
```
✓ All commands execute without errors
✓ All dashboard cards populate with data

### 2. Full Demo Flow (1 min)
```bash
/reset
/demo
```
✓ Three steps execute sequentially
✓ All cards populate correctly
✓ Success message at end

### 3. Error Handling (1 min)
```bash
/reset
/create-charge
```
✓ Error message: "No paykey found"

```bash
/invalid-command
```
✓ Error message: "Unknown command"

### 4. Command History (30 sec)
- Type `/help` + Enter
- Type `/info` + Enter
- Press Arrow Up
✓ Shows `/info`
- Press Arrow Up again
✓ Shows `/help`

### 5. SSE Connection (30 sec)
- Check browser console (F12)
✓ See `[SSE] Connected` log
✓ Connection indicator shows green "LIVE"

---

## If All Above Pass → Task 7 Complete!

**For comprehensive testing:** Use `TESTING_INSTRUCTIONS_TASK_7.md`
**For detailed report:** Use `MANUAL_TEST_REPORT_TASK_7.md`

---

## Common Commands Reference

```bash
# Information
/help                                    # Show all commands
/info                                    # Show current state
/outcomes                                # List sandbox outcomes
/clear                                   # Clear terminal scrollback

# State Management
/reset                                   # Clear all demo state

# Customer Operations
/create-customer                         # Default: verified outcome
/create-customer --outcome review        # Pending review
/create-customer --outcome rejected      # Rejected

# Paykey Operations
/create-paykey bank                      # Link bank account (default: active)
/create-paykey bank --outcome inactive   # Inactive account
/create-paykey plaid                     # Link via Plaid (requires token)

# Charge Operations
/create-charge                           # Default: $100, paid outcome
/create-charge --amount 5000             # $50.00 charge
/create-charge --outcome failed          # Failed payment
/create-charge --outcome reversed_insufficient_funds

# Full Flow
/demo                                    # Run complete happy-path flow
```

---

## Success Criteria

- [ ] All commands execute
- [ ] Dashboard updates in real-time
- [ ] No errors in browser console
- [ ] Command history works
- [ ] SSE connection stable
- [ ] Error messages are clear
- [ ] `/demo` flow completes successfully

---

## Report Issues In

`docs/MANUAL_TEST_REPORT_TASK_7.md`
