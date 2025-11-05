# Test Cases: Dashboard

## TC-DASH-001: Initial Dashboard Load
**Priority**: P0  
**Precondition**: Wallet connected with vaults

### Test Steps
1. Navigate to /app/dashboard
2. Wait for data to load
3. Observe all sections

### Expected Results
- ✅ Page title: "Dashboard" with Activity icon
- ✅ 4 stat cards display at top
- ✅ Portfolio performance chart loads
- ✅ Asset allocation pie chart loads
- ✅ Active vaults list displays
- ✅ Yield opportunities widget visible
- ✅ Profit distributions section (if applicable)
- ✅ Loading states show before data

---

## TC-DASH-002: Stats Cards Data
**Priority**: P0  
**Precondition**: User has vaults with deposits

### Test Steps
1. View 4 stat cards
2. Verify calculations

### Expected Results
- ✅ **Total Value Locked**: Shows sum of all vault TVLs in USD
- ✅ **Weighted APY**: Shows portfolio-weighted APY with "Avg" note
- ✅ **Active Vaults**: Shows count with "All Active" or vault status
- ✅ **Total Earnings**: Shows earnings with ROI percentage
- ✅ All values format correctly (decimals, $ signs, %)
- ✅ Icons display for each stat

---

## TC-DASH-003: Performance Chart Period Selection
**Priority**: P1  
**Precondition**: Vault has performance history

### Test Steps
1. Locate performance chart
2. Click "24h" period button
3. Click "7d" period button
4. Click "30d" period button
5. Click "1y" period button

### Expected Results
- ✅ Chart data updates for selected period
- ✅ Active period button highlighted
- ✅ X-axis labels update appropriately
- ✅ Data fetches from backend
- ✅ Loading indicator during fetch
- ✅ Chart maintains aspect ratio

---

## TC-DASH-004: Asset Allocation Pie Chart
**Priority**: P1  
**Precondition**: User has vaults with different assets

### Test Steps
1. View asset allocation section
2. Hover over pie chart slices
3. Review legend

### Expected Results
- ✅ Pie chart renders with all assets
- ✅ Each slice has unique color
- ✅ Tooltip shows on hover: Asset name, $ value, percentage
- ✅ Legend lists all assets with colors
- ✅ Percentages sum to 100%
- ✅ Empty state if no assets: "No assets yet"

---

## TC-DASH-005: Vault List Display
**Priority**: P0  
**Precondition**: User owns vaults

### Test Steps
1. Scroll to "Active Vaults" section
2. View vault cards
3. Check all displayed information

### Expected Results
- ✅ Each vault shows: Name, Assets, ID (truncated)
- ✅ TVL displays in USD
- ✅ APY shows with +/- and color coding
- ✅ Status indicator (green = active, gray = inactive)
- ✅ "View" button navigates to vault detail
- ✅ User's share count visible if they have shares
- ✅ Asset names resolve (not contract addresses)

---

## TC-DASH-006: Empty Dashboard State
**Priority**: P1  
**Precondition**: New user with no vaults

### Test Steps
1. Connect fresh wallet with no vaults
2. Navigate to dashboard

### Expected Results
- ✅ All stat cards show $0.00 / 0 values
- ✅ Performance chart shows "No historical data available"
- ✅ Asset allocation shows "No assets yet"
- ✅ Vault list shows: "No vaults yet" with Box icon
- ✅ "Create Vault" button navigates to builder
- ✅ No error messages or crashes

---

## TC-DASH-007: Real-time Updates via WebSocket
**Priority**: P1  
**Precondition**: Vault with active rebalancing

### Test Steps
1. Open dashboard in browser A
2. Trigger vault rebalance in browser B (or via API)
3. Observe dashboard in browser A

### Expected Results
- ✅ Dashboard auto-updates when vault changes
- ✅ TVL updates in real-time
- ✅ Performance chart reflects new data
- ✅ No manual refresh needed
- ✅ Toast notification (optional): "Vault updated"

---

## TC-DASH-008: Best Yield Opportunities Widget
**Priority**: P1  
**Precondition**: None

### Test Steps
1. Locate "Best Yield Opportunities" section
2. View USDC yield comparison
3. Check protocol data

### Expected Results
- ✅ Shows yields for: Soroswap, MockPool, Manual Hold
- ✅ APY percentages display for each
- ✅ "Live Rates" badge visible
- ✅ Data fetches from protocols
- ✅ Recommended option highlighted
- ✅ Updates periodically

---

## TC-DASH-009: Profit Distributions Section
**Priority**: P1  
**Precondition**: User has vault with profit sharing

### Test Steps
1. Scroll to "Profit Distributions" section
2. View distribution cards

### Expected Results
- ✅ Lists all claimable distributions
- ✅ Shows: Vault name, Amount, Status
- ✅ "Claim" button functional
- ✅ Claimed distributions marked as "Claimed"
- ✅ Empty state if no distributions

---

## TC-DASH-010: Network Switch Behavior
**Priority**: P0  
**Precondition**: User has vaults on multiple networks

### Test Steps
1. View dashboard on Testnet
2. Switch to Futurenet in wallet
3. Observe dashboard behavior

### Expected Results
- ✅ All data refetches for Futurenet
- ✅ Vaults list updates (shows Futurenet vaults)
- ✅ Stats recalculate for new network
- ✅ Charts reload with correct network data
- ✅ No stale Testnet data visible

---

## TC-DASH-011: Vault Search/Filter
**Priority**: P2  
**Precondition**: User has 5+ vaults

### Test Steps
1. Locate vault list
2. If search bar exists, test search
3. Filter by status if available

### Expected Results
- ✅ Search filters vaults by name/ID
- ✅ Status filter works (Active/All/Inactive)
- ✅ Results update in real-time
- ✅ Clear search button resets

---

## TC-DASH-012: Loading States
**Priority**: P1  
**Precondition**: Fresh page load

### Test Steps
1. Open dashboard with throttled network (DevTools)
2. Observe loading indicators

### Expected Results
- ✅ Skeleton loaders for stat cards
- ✅ Skeleton loaders for charts
- ✅ Skeleton loaders for vault list
- ✅ Smooth transition from loading to data
- ✅ No content flash/jump

---

## TC-DASH-013: Mobile Dashboard View
**Priority**: P1  
**Precondition**: Mobile device or <768px width

### Test Steps
1. Open dashboard on mobile
2. Scroll through all sections

### Expected Results
- ✅ Stats cards stack in 2 columns
- ✅ Performance chart scrollable/zoomable
- ✅ Pie chart appropriately sized
- ✅ Vault cards stack vertically
- ✅ All text readable
- ✅ Buttons easily tappable (>44px)

---

## TC-DASH-014: Dashboard Performance
**Priority**: P2  
**Precondition**: User with 20+ vaults

### Test Steps
1. Load dashboard with many vaults
2. Measure load time
3. Test scroll performance

### Expected Results
- ✅ Initial load < 3 seconds
- ✅ Smooth 60fps scrolling
- ✅ Charts render without lag
- ✅ No memory leaks over time
- ✅ Efficient re-renders (React.memo used)

---

## TC-DASH-015: Error Handling
**Priority**: P1  
**Precondition**: Backend down or network error

### Test Steps
1. Disconnect internet
2. Try to load dashboard
3. Observe error state

### Expected Results
- ✅ Error card displays with alert icon
- ✅ Clear error message: "Failed to load vaults"
- ✅ "Try Again" button attempts refetch
- ✅ No blank screen or crash
- ✅ Partial data shows if available
