# Test Cases: Vaults Management

## TC-VAULTS-001: Vaults Page Layout
**Priority**: P0  
**Precondition**: Wallet connected

### Test Steps
1. Navigate to /app/vaults
2. Observe page layout

### Expected Results
- ✅ Page title: "My Vaults" with Box icon
- ✅ 4 stats cards at top: Owned Vaults, Subscriptions, Total Value, Active Vaults
- ✅ Search bar and filters
- ✅ Grid/List view toggle
- ✅ Two sections: "Owned Vaults" and "Subscriptions"
- ✅ "Create New Vault" button in Owned Vaults section

---

## TC-VAULTS-002: Owned Vaults Display
**Priority**: P0  
**Precondition**: User owns vaults

### Test Steps
1. View "Owned Vaults" section
2. Inspect vault cards

### Expected Results
- ✅ Each vault shows:
  - Name
  - Asset list (resolved names, not addresses)
  - Vault ID (truncated)
  - TVL in USD
  - APY with color coding (green=positive, red=negative)
  - Status badge (active/inactive)
  - "View Details" button
- ✅ Grid view: 3 columns on desktop
- ✅ List view: Full-width rows
- ✅ Crown icon indicates owned vaults

---

## TC-VAULTS-003: Subscriptions Display
**Priority**: P1  
**Precondition**: User subscribed to vaults

### Test Steps
1. View "Subscriptions" section
2. Inspect subscription cards

### Expected Results
- ✅ Each subscription shows:
  - Vault name
  - Asset list
  - Share count
  - Current value in USD
  - P&L (profit/loss) with %
  - "View Details" button
- ✅ P&L color coded (green=profit, red=loss)
- ✅ Users icon indicates subscriptions

---

## TC-VAULTS-004: Empty States
**Priority**: P1  
**Precondition**: New user with no vaults

### Test Steps
1. View vaults page with no owned vaults
2. View with no subscriptions

### Expected Results
- ✅ Owned Vaults empty state:
  - Package icon
  - "No owned vaults found"
  - "Create your first vault to start earning yield"
  - "Create Vault" button → /app/builder
- ✅ Subscriptions empty state:
  - Users icon
  - "No subscriptions found"
  - "Browse the marketplace to find vaults to invest in"
  - "Browse Marketplace" button → /app/marketplace

---

## TC-VAULTS-005: Search Functionality
**Priority**: P1  
**Precondition**: User has 5+ vaults

### Test Steps
1. Type vault name in search bar
2. Type partial vault ID
3. Clear search

### Expected Results
- ✅ Results filter in real-time
- ✅ Searches both vault name and ID
- ✅ Case-insensitive search
- ✅ Clear button (X) appears when typing
- ✅ Clicking X clears search and resets results
- ✅ Shows count: "X results (filtered from Y)"

---

## TC-VAULTS-006: Status Filter
**Priority**: P1  
**Precondition**: User has active and inactive vaults

### Test Steps
1. Click "All" filter
2. Click "Active" filter
3. Click "Inactive" filter

### Expected Results
- ✅ "All" shows all vaults
- ✅ "Active" shows only active vaults
- ✅ "Inactive" shows only inactive vaults
- ✅ Active filter button highlighted
- ✅ Vault count updates per filter
- ✅ Search + filter work together

---

## TC-VAULTS-007: View Toggle (Grid vs List)
**Priority**: P2  
**Precondition**: User has vaults

### Test Steps
1. Click Grid icon
2. Click List icon
3. Observe layout changes

### Expected Results
- ✅ Grid view: 3 columns, compact cards
- ✅ List view: Single column, expanded rows
- ✅ Smooth transition between views
- ✅ View preference persists (localStorage)
- ✅ All vault data visible in both views

---

## TC-VAULTS-008: Sort Functionality
**Priority**: P2  
**Precondition**: User has vaults (if sort implemented)

### Test Steps
1. Sort by TVL
2. Sort by APY
3. Sort by Name

### Expected Results
- ✅ Vaults reorder by selected criteria
- ✅ Ascending/descending toggle
- ✅ Sort indicator shows active column

---

## TC-VAULTS-009: Stats Cards Calculation
**Priority**: P0  
**Precondition**: User has vaults with data

### Test Steps
1. Verify each stat card value
2. Manually calculate from vault data

### Expected Results
- ✅ **Owned Vaults**: Correct count + total TVL
- ✅ **Subscriptions**: Correct count + total value
- ✅ **Total Value**: Sum of owned TVL + subscription values
- ✅ **Active Vaults**: Correct count of active vaults (owned + subscribed)
- ✅ All calculations accurate to 2 decimal places

---

## TC-VAULTS-010: View Vault Details Navigation
**Priority**: P0  
**Precondition**: Vault exists

### Test Steps
1. Click "View Details" button on a vault
2. Observe navigation

### Expected Results
- ✅ Navigates to /app/vaults/[vault_id]
- ✅ Vault detail page loads correctly
- ✅ Correct vault data displayed

---

## TC-VAULTS-011: Network Switch Behavior
**Priority**: P0  
**Precondition**: User has vaults on multiple networks

### Test Steps
1. View vaults on Testnet
2. Switch to Futurenet
3. Observe behavior

### Expected Results
- ✅ Page refetches data for new network
- ✅ Vaults list updates (shows Futurenet vaults)
- ✅ Stats recalculate for new network
- ✅ Search and filters reset
- ✅ No Testnet vaults visible on Futurenet

---

## TC-VAULTS-012: Real-time Updates
**Priority**: P1  
**Precondition**: WebSocket connection active

### Test Steps
1. Open vaults page
2. Perform action in another tab (deposit, withdraw, rebalance)
3. Observe vaults page

### Expected Results
- ✅ TVL updates automatically
- ✅ APY updates when recalculated
- ✅ Status changes reflect immediately
- ✅ No manual refresh needed

---

## TC-VAULTS-013: Asset Name Resolution
**Priority**: P1  
**Precondition**: Vaults with custom tokens

### Test Steps
1. View vault with custom token
2. Observe asset display

### Expected Results
- ✅ Known assets show names: XLM, USDC, BTC
- ✅ Unknown assets show first 8 chars: CABC1234...
- ✅ Asset names resolve asynchronously
- ✅ "Loading..." shown during resolution
- ✅ Fallback to address if resolution fails

---

## TC-VAULTS-014: Mobile Responsiveness
**Priority**: P1  
**Precondition**: Mobile device or <768px width

### Test Steps
1. Open vaults page on mobile
2. Test all interactions

### Expected Results
- ✅ Stats stack in 2 columns
- ✅ Search bar full-width
- ✅ Grid view shows 1 column on mobile
- ✅ Filter buttons scrollable horizontally
- ✅ All text readable
- ✅ Buttons easily tappable

---

## TC-VAULTS-015: Loading States
**Priority**: P1  
**Precondition**: Fresh page load

### Test Steps
1. Load page with throttled network
2. Observe loading indicators

### Expected Results
- ✅ Skeleton loaders for stat cards
- ✅ Skeleton loaders for vault cards
- ✅ "Loading..." text appears
- ✅ Smooth transition to loaded state
- ✅ No content jump/flash

---

## TC-VAULTS-016: Error Handling
**Priority**: P1  
**Precondition**: Backend error or network failure

### Test Steps
1. Simulate network error
2. Try to load vaults

### Expected Results
- ✅ Error card displays: AlertCircle icon
- ✅ Message: "Error Loading Vaults"
- ✅ Error details shown
- ✅ "Try Again" button refetches data
- ✅ No crash or blank screen

---

## TC-VAULTS-017: Performance with Many Vaults
**Priority**: P2  
**Precondition**: User with 50+ vaults

### Test Steps
1. Load vaults page
2. Search and filter
3. Measure performance

### Expected Results
- ✅ Initial load < 3 seconds
- ✅ Search updates < 100ms
- ✅ Filter updates < 100ms
- ✅ Smooth 60fps scrolling
- ✅ No lag or stuttering

---

## TC-VAULTS-018: Vault Pagination (if implemented)
**Priority**: P2  
**Precondition**: User with 100+ vaults

### Test Steps
1. Scroll to bottom of vault list
2. Click "Load More" or observe infinite scroll

### Expected Results
- ✅ More vaults load on demand
- ✅ Loading indicator during fetch
- ✅ Smooth append to list
- ✅ No duplicate vaults
- ✅ Scroll position maintained

---

## TC-VAULTS-019: Vault Quick Actions (if available)
**Priority**: P2  
**Precondition**: Vault with actions menu

### Test Steps
1. Hover over vault card
2. Click actions menu (⋮)
3. Select actions

### Expected Results
- ✅ Actions menu appears: Edit, Duplicate, Archive, Delete
- ✅ "Edit" opens vault in builder
- ✅ "Duplicate" clones vault config
- ✅ "Archive" moves to inactive
- ✅ "Delete" shows confirmation modal

---

## TC-VAULTS-020: Create New Vault Button
**Priority**: P0  
**Precondition**: None

### Test Steps
1. Click "Create New Vault" button
2. Observe navigation

### Expected Results
- ✅ Navigates to /app/builder
- ✅ Builder opens in Visual mode
- ✅ Empty canvas ready for new vault
