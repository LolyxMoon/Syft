# Test Cases: Edge Cases & Error Handling

## TC-EDGE-001: Wallet Disconnects Mid-Transaction
**Priority**: P0  
**Precondition**: Transaction in progress

### Test Steps
1. Start vault deployment
2. Disconnect wallet during transaction
3. Observe behavior

### Expected Results
- ✅ Error caught gracefully
- ✅ Toast: "Wallet disconnected"
- ✅ Transaction cancelled
- ✅ No partial deployment
- ✅ User can reconnect and retry
- ✅ No funds lost

---

## TC-EDGE-002: Network Switch During Operation
**Priority**: P0  
**Precondition**: Active operation

### Test Steps
1. Start depositing to vault on Testnet
2. Switch to Futurenet mid-operation
3. Observe handling

### Expected Results
- ✅ Operation cancels
- ✅ Warning: "Network changed"
- ✅ Data refetches for new network
- ✅ No cross-network contamination
- ✅ User can retry on correct network

---

## TC-EDGE-003: Insufficient Gas/Fees
**Priority**: P1  
**Precondition**: Wallet balance barely above 0

### Test Steps
1. Try to deploy vault with 0.5 XLM balance
2. Observe error handling

### Expected Results
- ✅ Pre-transaction validation
- ✅ Warning: "Insufficient balance for transaction fee"
- ✅ Shows required amount
- ✅ Transaction blocked
- ✅ Suggests funding wallet

---

## TC-EDGE-004: Invalid Vault Configuration
**Priority**: P1  
**Precondition**: Builder open

### Test Steps
1. Create vault with 0% allocation
2. Try with 150% total allocation
3. Try with no assets
4. Try with no rules
5. Try to deploy each

### Expected Results
- ✅ Validation catches all errors
- ✅ Clear error messages:
  - "Allocation must be > 0%"
  - "Total allocation must = 100%"
  - "At least one asset required"
  - "At least one rule required"
- ✅ Deploy button disabled
- ✅ Validation panel highlights issues

---

## TC-EDGE-005: Duplicate Asset in Vault
**Priority**: P1  
**Precondition**: Builder visual mode

### Test Steps
1. Add XLM asset block (50%)
2. Add another XLM asset block (50%)
3. Try to deploy

### Expected Results
- ✅ Validation error: "Duplicate asset: XLM"
- ✅ Suggests merging allocations
- ✅ Deploy blocked
- ✅ User can remove duplicate

---

## TC-EDGE-006: Malformed Contract Address
**Priority**: P1  
**Precondition**: Custom token input

### Test Steps
1. Add custom token
2. Enter invalid address: "abc123"
3. Try to save

### Expected Results
- ✅ Validation error: "Invalid Stellar address"
- ✅ Red outline on input
- ✅ Example shown: "Should start with C..."
- ✅ Cannot proceed until fixed

---

## TC-EDGE-007: Extremely Large Numbers
**Priority**: P1  
**Precondition**: Deposit/withdrawal form

### Test Steps
1. Try to deposit 999,999,999,999 XLM
2. Observe validation

### Expected Results
- ✅ Validation: "Amount exceeds balance"
- ✅ Input caps at balance
- ✅ Max button fills actual balance
- ✅ No overflow errors
- ✅ Handles large numbers gracefully

---

## TC-EDGE-008: Zero or Negative Amounts
**Priority**: P1  
**Precondition**: Any amount input

### Test Steps
1. Try to deposit 0 XLM
2. Try to deposit -100 XLM
3. Observe validation

### Expected Results
- ✅ Error: "Amount must be greater than 0"
- ✅ Negative values rejected
- ✅ Input validation prevents negatives
- ✅ Submit button disabled

---

## TC-EDGE-009: Concurrent Transactions
**Priority**: P1  
**Precondition**: Two browser tabs open

### Test Steps
1. Open vault detail in Tab A
2. Open same vault in Tab B
3. Deposit in Tab A
4. Immediately deposit in Tab B
5. Observe behavior

### Expected Results
- ✅ Both transactions queue properly
- ✅ No race condition
- ✅ Sequence numbers handled
- ✅ Both succeed or proper error
- ✅ Final state consistent

---

## TC-EDGE-010: Expired Session/Stale Data
**Priority**: P1  
**Precondition**: Browser open for hours

### Test Steps
1. Open app, don't interact
2. Wait 4+ hours
3. Try to perform action

### Expected Results
- ✅ Data refetches on action
- ✅ Session validates
- ✅ If expired, prompts re-auth
- ✅ No stale data used
- ✅ Graceful handling

---

## TC-EDGE-011: Browser Back Button During Multi-Step Flow
**Priority**: P1  
**Precondition**: Vault deployment in progress

### Test Steps
1. Start deploying vault (step 1 of 3)
2. Click browser back button
3. Observe behavior

### Expected Results
- ✅ Confirmation: "Are you sure? Deployment in progress"
- ✅ If confirmed, cancels deployment
- ✅ State cleaned up
- ✅ No orphaned transactions
- ✅ Can restart safely

---

## TC-EDGE-012: Special Characters in Inputs
**Priority**: P2  
**Precondition**: Text inputs available

### Test Steps
1. Enter vault name: "Test<script>alert('xss')</script>"
2. Enter description with SQL: "'; DROP TABLE vaults;--"
3. Submit

### Expected Results
- ✅ Input sanitized
- ✅ XSS prevented
- ✅ SQL injection prevented
- ✅ Special chars escaped or rejected
- ✅ No execution of injected code

---

## TC-EDGE-013: API Timeout
**Priority**: P1  
**Precondition**: Slow/unstable network

### Test Steps
1. Throttle network to 2G
2. Try to generate AI suggestions (60s timeout)
3. Wait for timeout

### Expected Results
- ✅ Loading indicator throughout
- ✅ After 60s: "Request timed out"
- ✅ "Try Again" button
- ✅ Partial data not corrupted
- ✅ Can retry successfully

---

## TC-EDGE-014: Backend API Down
**Priority**: P0  
**Precondition**: Backend unavailable

### Test Steps
1. Simulate backend down (network blocked)
2. Try to load dashboard
3. Try to deploy vault

### Expected Results
- ✅ Error page: "Service temporarily unavailable"
- ✅ Retry button available
- ✅ No blank screens
- ✅ Cached data shown if available
- ✅ User notified clearly

---

## TC-EDGE-015: WebSocket Connection Drops
**Priority**: P1  
**Precondition**: WebSocket connected

### Test Steps
1. Open dashboard with real-time updates
2. Kill WebSocket connection
3. Make vault changes
4. Observe behavior

### Expected Results
- ✅ App detects disconnection
- ✅ Attempts to reconnect
- ✅ Falls back to polling if needed
- ✅ Updates still arrive (slower)
- ✅ User experience degraded but functional

---

## TC-EDGE-016: Rapid Button Clicking (Double Submit)
**Priority**: P1  
**Precondition**: Any submit button

### Test Steps
1. Click "Deploy Vault" rapidly 5 times
2. Observe behavior

### Expected Results
- ✅ Button disabled after first click
- ✅ Only one transaction created
- ✅ Loading state prevents re-click
- ✅ No duplicate deployments
- ✅ Debouncing works correctly

---

## TC-EDGE-017: Empty Search Results
**Priority**: P1  
**Precondition**: Search feature available

### Test Steps
1. Search vaults for "nonexistent12345"
2. Observe results

### Expected Results
- ✅ Empty state: "No results found"
- ✅ Suggests: "Try different keywords"
- ✅ Clear search button visible
- ✅ No error thrown
- ✅ Can search again

---

## TC-EDGE-018: Date Range Validation
**Priority**: P1  
**Precondition**: Date picker (backtests)

### Test Steps
1. Set start date in future
2. Set end date before start date
3. Set date range > 1 year

### Expected Results
- ✅ Error: "Start date cannot be in future"
- ✅ Error: "End date must be after start date"
- ✅ Warning: "Large date range may be slow"
- ✅ Auto-correct if possible
- ✅ Submit blocked if invalid

---

## TC-EDGE-019: Browser Compatibility Issues
**Priority**: P1  
**Precondition**: Old browser (IE, Safari 12)

### Test Steps
1. Open app in old browser
2. Attempt to use features

### Expected Results
- ✅ Warning banner: "Browser not supported"
- ✅ Suggests upgrading
- ✅ Core features work (graceful degradation)
- ✅ Or redirect to upgrade page

---

## TC-EDGE-020: Mobile Keyboard Overlaps Input
**Priority**: P1  
**Precondition**: Mobile device

### Test Steps
1. Focus on input at bottom of screen
2. Observe keyboard behavior

### Expected Results
- ✅ Page scrolls input into view
- ✅ Keyboard doesn't hide input
- ✅ Can see what you're typing
- ✅ Submit button accessible
- ✅ Fixed bottom inputs handle correctly

---

## TC-EDGE-021: Copy-Paste Attack (Address)
**Priority**: P1  
**Precondition**: Transfer/withdrawal form

### Test Steps
1. Copy valid address
2. Paste address (clipboard hijacked with malicious address)
3. Observe validation

### Expected Results
- ✅ Address format validated
- ✅ Checksum verified (if applicable)
- ✅ Warning if address changed
- ✅ User confirms recipient
- ✅ No silent address swap

---

## TC-EDGE-022: Tab Switching During Loading
**Priority**: P2  
**Precondition**: Slow page load

### Test Steps
1. Navigate to analytics (loading)
2. Immediately switch browser tab away
3. Return after 30 seconds

### Expected Results
- ✅ Page continues loading
- ✅ Data loads correctly
- ✅ No memory leaks
- ✅ No duplicate requests
- ✅ State consistent

---

## TC-EDGE-023: LocalStorage Full
**Priority**: P2  
**Precondition**: localStorage at capacity

### Test Steps
1. Fill localStorage (chat history, etc.)
2. Try to save more data

### Expected Results
- ✅ Catches quota exceeded error
- ✅ Clears old data (LRU)
- ✅ Saves new data
- ✅ User notified if needed
- ✅ No crash

---

## TC-EDGE-024: Image Load Failures
**Priority**: P2  
**Precondition**: NFT images

### Test Steps
1. View NFT with broken image link
2. Observe fallback

### Expected Results
- ✅ Placeholder image shown
- ✅ Alt text displayed
- ✅ No broken image icon
- ✅ Retry button (optional)
- ✅ Layout doesn't break

---

## TC-EDGE-025: Freighter Extension Disabled
**Priority**: P1  
**Precondition**: Freighter installed but disabled

### Test Steps
1. Disable Freighter extension
2. Try to connect wallet

### Expected Results
- ✅ Error: "Freighter is disabled"
- ✅ Instructions to enable
- ✅ Link to extension settings
- ✅ Fallback to Albedo option
- ✅ Graceful handling
