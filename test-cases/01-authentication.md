# Test Cases: Authentication & Wallet Connection

## TC-AUTH-001: Connect Freighter Wallet
**Priority**: P0  
**Precondition**: Freighter extension installed

### Test Steps
1. Navigate to https://syft.app
2. Click "Connect Wallet" button in header
3. Select "Freighter" option
4. Approve connection in Freighter popup

### Expected Results
- ✅ Wallet connects successfully
- ✅ User address displays in header (truncated format: GB7X...4Y2A)
- ✅ Network indicator shows current network (Testnet/Futurenet/Mainnet)
- ✅ "Connect Wallet" button changes to wallet address dropdown

### Edge Cases
- Freighter not installed → Show installation link
- User rejects connection → Show error toast
- Already connected → Show disconnect option

---

## TC-AUTH-002: Connect Albedo Wallet
**Priority**: P0  
**Precondition**: Albedo available

### Test Steps
1. Navigate to https://syft.app
2. Click "Connect Wallet"
3. Select "Albedo" option
4. Complete Albedo authentication flow

### Expected Results
- ✅ Wallet connects successfully
- ✅ User can interact with all features
- ✅ Transactions prompt Albedo signing

---

## TC-AUTH-003: Disconnect Wallet
**Priority**: P0  
**Precondition**: Wallet connected

### Test Steps
1. Click on wallet address in header
2. Select "Disconnect" from dropdown
3. Confirm disconnection

### Expected Results
- ✅ Wallet disconnects successfully
- ✅ Header shows "Connect Wallet" button
- ✅ Redirected to landing page
- ✅ Dashboard shows "Connect wallet" message
- ✅ Protected pages show wallet requirement message

---

## TC-AUTH-004: Switch Network
**Priority**: P0  
**Precondition**: Wallet connected

### Test Steps
1. Open Freighter extension
2. Click network selector
3. Switch from Testnet to Futurenet (or vice versa)
4. Observe app behavior

### Expected Results
- ✅ App detects network change
- ✅ All data refetches for new network
- ✅ Network indicator updates in UI
- ✅ Vaults list refreshes (shows vaults for selected network)
- ✅ Balance updates for new network

---

## TC-AUTH-005: Multiple Wallet Switching
**Priority**: P1  
**Precondition**: Multiple accounts in Freighter

### Test Steps
1. Connect with Account A
2. Create a vault
3. Switch to Account B in Freighter
4. Observe dashboard

### Expected Results
- ✅ App detects account change
- ✅ Dashboard shows Account B's vaults (not Account A's)
- ✅ Balance reflects Account B
- ✅ Previous account's data not visible

---

## TC-AUTH-006: Session Persistence
**Priority**: P1  
**Precondition**: Wallet connected

### Test Steps
1. Connect wallet
2. Navigate to multiple pages
3. Refresh browser (F5)
4. Check wallet status

### Expected Results
- ✅ Wallet remains connected after refresh
- ✅ User address still displayed
- ✅ No need to reconnect
- ✅ All user data loads correctly

---

## TC-AUTH-007: Wallet Connection Error Handling
**Priority**: P1  
**Precondition**: None

### Test Steps
1. Click "Connect Wallet"
2. Close Freighter popup without approving
3. Observe error handling

### Expected Results
- ✅ Error toast displays: "Connection rejected by user"
- ✅ "Connect Wallet" button remains clickable
- ✅ User can retry connection
- ✅ No console errors

---

## TC-AUTH-008: Protected Routes
**Priority**: P0  
**Precondition**: Wallet NOT connected

### Test Steps
1. Navigate directly to /app/dashboard
2. Navigate to /app/builder
3. Navigate to /app/vaults
4. Observe behavior

### Expected Results
- ✅ Dashboard shows "Connect Your Wallet" card
- ✅ Builder shows wallet requirement message
- ✅ All pages gracefully handle no wallet state
- ✅ No crashes or blank screens

---

## TC-AUTH-009: Wallet Balance Display
**Priority**: P1  
**Precondition**: Wallet connected with XLM balance

### Test Steps
1. Connect wallet
2. View dashboard
3. Check balance display

### Expected Results
- ✅ XLM balance displays correctly
- ✅ Balance formatted with proper decimals
- ✅ Balance updates after transactions
- ✅ Shows "$X.XX USD" equivalent

---

## TC-AUTH-010: Auto-Reconnect on Page Load
**Priority**: P1  
**Precondition**: Previously connected wallet

### Test Steps
1. Connect wallet
2. Close browser completely
3. Reopen browser
4. Navigate to app

### Expected Results
- ✅ Wallet auto-reconnects
- ✅ No manual reconnection needed
- ✅ User data loads automatically
- ✅ Smooth user experience
