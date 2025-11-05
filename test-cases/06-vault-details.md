# Test Cases: Vault Details

## TC-DETAIL-001: Vault Details Page Load
**Priority**: P0  
**Precondition**: Vault exists, wallet connected

### Test Steps
1. Navigate to /app/vaults/[vault_id]
2. Wait for page to load

### Expected Results
- ✅ Vault name displays as page title
- ✅ Vault ID shown (full or truncated)
- ✅ Asset list visible
- ✅ TVL displays in USD
- ✅ Current APY visible with color coding
- ✅ Status badge (Active/Inactive)
- ✅ "Back to Vaults" button functional

---

## TC-DETAIL-002: Overview Section
**Priority**: P0  
**Precondition**: On vault detail page

### Test Steps
1. View overview section
2. Verify all metrics

### Expected Results
- ✅ **Total Value Locked**: $ amount
- ✅ **Current APY**: % with trend
- ✅ **Your Shares**: Share count (if subscribed)
- ✅ **Share Price**: Current price per share
- ✅ **Asset Allocation**: Pie chart or list
- ✅ All metrics formatted correctly

---

## TC-DETAIL-003: Performance Chart
**Priority**: P1  
**Precondition**: Vault has history

### Test Steps
1. View performance chart
2. Click different time periods
3. Hover over data points

### Expected Results
- ✅ Line chart shows TVL over time
- ✅ Time periods: 24h, 7d, 30d, All
- ✅ Tooltip shows exact value on hover
- ✅ Chart updates when period changes
- ✅ Y-axis scales appropriately
- ✅ Empty state if no data

---

## TC-DETAIL-004: Deposit to Vault
**Priority**: P0  
**Precondition**: Wallet has sufficient balance

### Test Steps
1. Click "Deposit" button
2. Enter amount (e.g., 100 XLM)
3. Click "Confirm Deposit"
4. Sign transaction in wallet
5. Wait for confirmation

### Expected Results
- ✅ Deposit modal opens
- ✅ Shows balance available
- ✅ Amount input validates (max = balance)
- ✅ "Max" button fills available balance
- ✅ Shows estimated shares to receive
- ✅ Transaction preview shown
- ✅ Wallet signature requested
- ✅ Success toast: "Deposit successful!"
- ✅ TVL updates after deposit
- ✅ User's share count increases

---

## TC-DETAIL-005: Withdraw from Vault
**Priority**: P0  
**Precondition**: User has shares in vault

### Test Steps
1. Click "Withdraw" button
2. Enter share amount or percentage
3. Click "Confirm Withdrawal"
4. Sign transaction
5. Wait for confirmation

### Expected Results
- ✅ Withdraw modal opens
- ✅ Shows current shares owned
- ✅ Amount or % selector
- ✅ "Withdraw All" button available
- ✅ Shows estimated assets to receive
- ✅ Transaction fees displayed
- ✅ Wallet signature requested
- ✅ Success toast: "Withdrawal successful!"
- ✅ User's shares decrease
- ✅ Assets returned to wallet

---

## TC-DETAIL-006: Rebalance Vault (Owner Only)
**Priority**: P0  
**Precondition**: User is vault owner

### Test Steps
1. Click "Rebalance" button
2. Confirm rebalance action
3. Sign transaction

### Expected Results
- ✅ "Rebalance" button visible to owner only
- ✅ Confirmation modal explains rebalance
- ✅ Shows gas estimate
- ✅ Transaction signed and submitted
- ✅ Loading state during rebalance
- ✅ Success toast: "Vault rebalanced!"
- ✅ Asset allocations update
- ✅ Transaction history updated

---

## TC-DETAIL-007: Strategy Details
**Priority**: P1  
**Precondition**: On vault detail page

### Test Steps
1. View "Strategy" section
2. Review configured rules

### Expected Results
- ✅ Lists all strategy rules
- ✅ Shows conditions in plain English
- ✅ Shows actions for each rule
- ✅ Example: "Rebalance when XLM allocation deviates by ±5%"
- ✅ Easy to understand format

---

## TC-DETAIL-008: Asset Breakdown
**Priority**: P1  
**Precondition**: Vault has multiple assets

### Test Steps
1. View asset allocation section
2. Check each asset

### Expected Results
- ✅ Pie chart shows allocation visually
- ✅ List shows each asset with:
  - Asset name/symbol
  - Current allocation %
  - Target allocation %
  - Dollar value
- ✅ Colors match pie chart
- ✅ Totals sum to 100%

---

## TC-DETAIL-009: Transaction History
**Priority**: P1  
**Precondition**: Vault has transactions

### Test Steps
1. Scroll to transaction history
2. View recent transactions

### Expected Results
- ✅ Table with columns: Type, Amount, Date, Status, TxHash
- ✅ Transaction types: Deposit, Withdraw, Rebalance, Swap
- ✅ Amounts formatted correctly
- ✅ Dates in readable format
- ✅ Status badges: Success (green), Pending (yellow), Failed (red)
- ✅ TxHash links to Stellar Explorer
- ✅ Pagination if many transactions
- ✅ Most recent first

---

## TC-DETAIL-010: Subscribers List (Owner View)
**Priority**: P2  
**Precondition**: User is owner, vault has subscribers

### Test Steps
1. View "Subscribers" section (owner only)
2. Check subscriber information

### Expected Results
- ✅ Shows total subscriber count
- ✅ Lists subscribers with:
  - Wallet address (truncated)
  - Share count
  - Join date
  - % of vault
- ✅ Privacy settings respected
- ✅ Owner cannot see if vault is private

---

## TC-DETAIL-011: Share/Social Features
**Priority**: P2  
**Precondition**: On vault detail page

### Test Steps
1. Click "Share" button
2. Copy vault link
3. Test social share buttons

### Expected Results
- ✅ Share modal opens
- ✅ Vault URL generated: /app/vaults/[id]
- ✅ "Copy Link" button copies to clipboard
- ✅ Success toast: "Link copied!"
- ✅ Social buttons (Twitter, Discord) open share dialogs
- ✅ Shareable image preview (optional)

---

## TC-DETAIL-012: Edit Vault (Owner Only)
**Priority**: P1  
**Precondition**: User is vault owner

### Test Steps
1. Click "Edit" button
2. Modify vault settings
3. Save changes

### Expected Results
- ✅ "Edit" button visible to owner only
- ✅ Opens edit modal or navigates to builder
- ✅ Can edit: Name, Description, Visibility
- ✅ Cannot edit: Assets, Strategy (requires redeploy)
- ✅ Changes save successfully
- ✅ Vault updates reflect immediately

---

## TC-DETAIL-013: Delete/Archive Vault (Owner Only)
**Priority**: P1  
**Precondition**: User is owner, vault has no subscribers

### Test Steps
1. Click "Delete" or "Archive" button
2. Confirm action

### Expected Results
- ✅ Warning modal appears
- ✅ Explains consequences (permanent)
- ✅ Requires confirmation (type vault name)
- ✅ Cannot delete if has subscribers
- ✅ Success: Vault archived/deleted
- ✅ Redirects to vaults list

---

## TC-DETAIL-014: Subscribe/Unsubscribe
**Priority**: P0  
**Precondition**: User is NOT owner

### Test Steps
1. View vault as non-owner
2. Click "Subscribe" button
3. Deposit initial amount
4. Later, click "Unsubscribe"

### Expected Results
- ✅ "Subscribe" button visible to non-owners
- ✅ Deposit flow same as TC-DETAIL-004
- ✅ After deposit, button changes to "Unsubscribe"
- ✅ Unsubscribe requires withdrawing all shares
- ✅ Warning if shares remain

---

## TC-DETAIL-015: Performance Metrics
**Priority**: P1  
**Precondition**: Vault has historical data

### Test Steps
1. View performance metrics section
2. Check calculations

### Expected Results
- ✅ **Total Return**: % since inception
- ✅ **Best Performing Day**: Date and %
- ✅ **Worst Performing Day**: Date and %
- ✅ **Sharpe Ratio**: Risk-adjusted return
- ✅ **Max Drawdown**: Worst peak-to-trough
- ✅ **Volatility**: Standard deviation
- ✅ All calculations accurate

---

## TC-DETAIL-016: Risk Metrics
**Priority**: P2  
**Precondition**: On vault detail page

### Test Steps
1. View risk assessment section
2. Review risk indicators

### Expected Results
- ✅ Risk level badge: Low/Medium/High
- ✅ Risk score out of 10
- ✅ Risk factors listed:
  - Asset volatility
  - Strategy complexity
  - Liquidity risk
  - Protocol risk
- ✅ Color coding (green=low, yellow=medium, red=high)

---

## TC-DETAIL-017: Vault Not Found
**Priority**: P1  
**Precondition**: Invalid vault ID in URL

### Test Steps
1. Navigate to /app/vaults/invalid-id-12345

### Expected Results
- ✅ Error page displays
- ✅ Message: "Vault not found"
- ✅ Explanation: "The vault you're looking for doesn't exist or has been removed"
- ✅ "Back to Vaults" button
- ✅ No crash or blank screen

---

## TC-DETAIL-018: Quest Tracking
**Priority**: P2  
**Precondition**: User has active quest

### Test Steps
1. Navigate to vault detail page
2. Check quest progress

### Expected Results
- ✅ Quest system detects page visit
- ✅ "View Vault" quest progresses
- ✅ No visible UI change (background tracking)

---

## TC-DETAIL-019: Mobile Vault Details
**Priority**: P1  
**Precondition**: Mobile device

### Test Steps
1. Open vault detail on mobile
2. Test all interactions

### Expected Results
- ✅ All sections stack vertically
- ✅ Charts responsive and scrollable
- ✅ Buttons easily tappable
- ✅ Modals full-screen on mobile
- ✅ No horizontal scroll
- ✅ All text readable

---

## TC-DETAIL-020: Real-time Updates
**Priority**: P1  
**Precondition**: WebSocket connected

### Test Steps
1. Open vault detail
2. Make change in another tab
3. Observe updates

### Expected Results
- ✅ TVL updates live
- ✅ APY recalculates in real-time
- ✅ Transaction history auto-refreshes
- ✅ Chart data updates
- ✅ No manual refresh needed
