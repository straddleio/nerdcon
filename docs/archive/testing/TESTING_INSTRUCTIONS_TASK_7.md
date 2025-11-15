# Testing Instructions - Task 7: Terminal Commands Integration

## Quick Start

### Current Server Status
- **Backend:** Running on port 3001 ✓
- **Frontend:** Running on port 5174 ✓
- **Application URL:** http://localhost:5174

### Getting Started
1. Open your browser and navigate to: **http://localhost:5174**
2. Open browser Developer Tools (F12) to view console logs
3. Keep this testing guide and the test report template open

---

## Testing Overview

This is a **manual testing task** to verify the complete integration of terminal commands with the backend API and dashboard UI. No code changes are needed - this is purely verification.

### What You're Testing
1. Terminal command execution
2. Backend API integration
3. Real-time dashboard updates via SSE
4. Command history navigation
5. Error handling
6. Full demo flow orchestration

---

## Test Flow (Recommended Order)

### Phase 1: Basic Command Testing (10-15 minutes)
Test individual commands to verify each feature works independently:

1. `/help` - View available commands
2. `/create-customer --outcome verified` - Create customer
3. `/create-paykey bank --outcome active` - Link bank account
4. `/create-charge --amount 5000 --outcome paid` - Create payment
5. `/info` - View current state
6. `/outcomes` - View sandbox outcomes

**What to Watch:**
- Terminal output messages
- Dashboard cards populating with data
- Browser console for webhook logs
- Connection status indicator

---

### Phase 2: Full Demo Flow (5 minutes)
Test the orchestrated demo command:

1. `/reset` - Clear all state
2. `/demo` - Run complete flow
3. Verify all three steps execute
4. Check all cards populate correctly

**What to Watch:**
- Sequential execution of three steps
- Progress messages in terminal
- All dashboard cards fill with data
- PizzaTracker shows complete lifecycle

---

### Phase 3: User Experience Testing (5 minutes)
Test interactive features:

1. **Command History:**
   - Type `/help` and press Enter
   - Type `/info` and press Enter
   - Press Arrow Up (should show `/info`)
   - Press Arrow Up again (should show `/help`)
   - Press Arrow Down (should show `/info` again)

2. **Terminal Scrollback:**
   - Run several commands to fill terminal
   - Type `/clear` to clear scrollback
   - Verify dashboard remains intact

**What to Watch:**
- Command history navigation
- Terminal clearing behavior
- Input responsiveness

---

### Phase 4: Error Handling (5 minutes)
Test error scenarios:

1. `/reset` - Clear state
2. `/create-charge` - Try without paykey (should error)
3. `/invalid-command` - Try non-existent command
4. Verify error messages are clear and helpful

**What to Watch:**
- Error message clarity
- Error styling (red text)
- Helpful suggestions in errors

---

### Phase 5: SSE Connection Testing (5-10 minutes)
Test real-time connection:

1. **Initial Connection:**
   - Check browser console for `[SSE] Connected` log
   - Verify connection indicator shows green "LIVE"

2. **Webhook Reception:**
   - Run `/create-customer --outcome verified`
   - Watch console for webhook events
   - Verify dashboard updates in real-time

3. **Reconnection:**
   - Stop backend server (in server terminal: Ctrl+C)
   - Watch connection indicator turn red "OFFLINE"
   - Restart backend (`cd server && npm run dev`)
   - Watch auto-reconnection (should happen within 3-5 seconds)
   - Verify indicator turns green "LIVE" again

**What to Watch:**
- SSE connection logs in console
- Webhook event logs
- Connection status indicator changes
- Auto-reconnection behavior

---

### Phase 6: Different Outcomes Testing (10 minutes)
Test various sandbox outcomes:

1. **Customer Outcomes:**
   ```
   /reset
   /create-customer --outcome review
   ```
   (Should show pending review state)

2. **Paykey Outcomes:**
   ```
   /reset
   /create-customer --outcome verified
   /create-paykey bank --outcome inactive
   ```
   (Should show inactive paykey state)

3. **Charge Outcomes:**
   ```
   /reset
   /demo
   /create-charge --amount 10000 --outcome failed
   ```
   (Should show failed charge state)

**What to Watch:**
- Different status indicators
- Appropriate error/warning styling
- Correct state representations

---

## Common Issues to Look For

### Visual Issues
- [ ] Cards not populating with data
- [ ] Styling inconsistencies (retro theme not applied)
- [ ] Text overflow or truncation
- [ ] Terminal scrolling issues
- [ ] Connection status indicator not visible

### Functional Issues
- [ ] Commands not executing
- [ ] Dashboard not updating
- [ ] Command history not working
- [ ] Error messages not displaying
- [ ] SSE connection failing

### Integration Issues
- [ ] Webhooks not received
- [ ] Data mismatch between terminal and dashboard
- [ ] State not persisting correctly
- [ ] Reset command not clearing all state

### Performance Issues
- [ ] Slow command execution
- [ ] UI lag or freezing
- [ ] Delayed webhook updates
- [ ] Memory leaks (test by running many commands)

---

## Browser Console Monitoring

### Expected Console Logs

**On Page Load:**
```
[SSE] Connecting to http://localhost:3001/api/sse
[SSE] Connected
```

**On Command Execution:**
```
[API] POST /api/customers/create
[Webhook] customer.created
[Webhook] customer.updated
[State] Customer updated: cust_xxxxx
```

**On SSE Disconnect:**
```
[SSE] Disconnected
[SSE] Reconnecting in 3s...
```

### Console Errors to Watch For
- CORS errors
- 404 Not Found errors
- 500 Internal Server errors
- WebSocket/SSE connection failures
- React errors or warnings

---

## Recording Test Results

Use the provided test report template: `docs/MANUAL_TEST_REPORT_TASK_7.md`

**For Each Test:**
1. Read expected results
2. Execute the test steps
3. Record actual results
4. Mark as PASS or FAIL
5. Add notes about any issues

**Screenshots Recommended:**
- Initial state (empty dashboard)
- After `/demo` command (populated dashboard)
- Error messages
- Connection status changes
- Browser console logs

---

## Test Completion Criteria

Task 7 is considered **COMPLETE** when:

1. **All individual commands work:**
   - /help, /info, /outcomes, /clear
   - /create-customer with different outcomes
   - /create-paykey (both plaid and bank)
   - /create-charge with different outcomes
   - /reset

2. **Full demo flow works:**
   - /demo executes all three steps
   - All cards populate correctly
   - PizzaTracker shows complete lifecycle

3. **Interactive features work:**
   - Command history (arrow up/down)
   - Terminal clear (/clear)
   - Input responsiveness

4. **Error handling works:**
   - Invalid commands show error
   - Missing prerequisites show error
   - Errors are user-friendly

5. **SSE connection works:**
   - Connects on page load
   - Receives webhooks
   - Auto-reconnects after disconnect
   - Status indicator updates correctly

6. **No critical bugs:**
   - No crashes or freezes
   - No data loss
   - No broken features

---

## If Tests Fail

### Backend Issues
If commands fail or return errors:
1. Check backend terminal for error logs
2. Verify `STRADDLE_API_KEY` is set in `.env`
3. Restart backend: `cd server && npm run dev`
4. Check server is on port 3001: http://localhost:3001/api/health

### Frontend Issues
If UI doesn't update or looks broken:
1. Check browser console for errors
2. Hard refresh browser (Ctrl+Shift+R)
3. Restart frontend: `cd web && npm run dev`
4. Try different browser

### SSE Issues
If webhooks don't arrive:
1. Check browser console for connection status
2. Verify no CORS errors
3. Test SSE endpoint directly: http://localhost:3001/api/sse
4. Check firewall/antivirus settings

---

## Reporting Results

After completing all tests:

1. **Fill out test report:** `docs/MANUAL_TEST_REPORT_TASK_7.md`
2. **Document all issues** (critical and non-critical)
3. **Take screenshots** of any bugs
4. **Note browser/OS** used for testing
5. **Provide overall assessment** (ready for demo or needs fixes)

---

## Questions During Testing?

If you encounter unclear behavior or need clarification:
1. Check the task specification: `docs/plans/2025-11-14-terminal-commands-integration.md`
2. Review API documentation: https://docs.straddle.com/
3. Check server logs for detailed error messages
4. Document the question in test report for follow-up

---

## Estimated Testing Time

- **Quick smoke test:** 15-20 minutes (just Phase 1 & 2)
- **Full comprehensive test:** 45-60 minutes (all phases)
- **With documentation:** 75-90 minutes (testing + report writing)

---

## Ready to Start?

1. [ ] Backend server running on port 3001
2. [ ] Frontend server running on port 5174
3. [ ] Browser open to http://localhost:5174
4. [ ] Developer console open (F12)
5. [ ] Test report template open
6. [ ] This testing guide open

**Good luck! The demo is looking great!**
