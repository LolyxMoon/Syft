# Test Cases: Portfolio Analytics

## TC-ANALYTICS-001: Analytics Page Load
**Priority**: P0  
**Precondition**: Wallet connected with vaults

### Test Steps
1. Navigate to /app/analytics
2. Wait for data to load

### Expected Results
- ✅ Page title: "Portfolio Analytics" with BarChart2 icon
- ✅ 4 performance metric cards at top
- ✅ Historical performance chart
- ✅ Asset allocation pie chart
- ✅ Vault breakdown table
- ✅ Best/worst performer cards
- ✅ Protocol yield comparison

---

## TC-ANALYTICS-002: Performance Metrics Cards
**Priority**: P0  
**Precondition**: User has vault activity

### Test Steps
1. View 4 metric cards
2. Verify calculations

### Expected Results
- ✅ **Total Portfolio Value**: Sum of all positions in USD
- ✅ **Total Earnings**: Profit with ROI %
- ✅ **Average APY**: Portfolio-weighted APY
- ✅ **Total Invested**: Original capital deployed
- ✅ All values format with $ and %
- ✅ Trend indicators (↑/↓) with percentages
- ✅ Color coding: green=positive, red=negative

---

## TC-ANALYTICS-003: Historical Performance Chart
**Priority**: P0  
**Precondition**: Portfolio has history

### Test Steps
1. View performance chart
2. Click "24h" period
3. Click "7d" period
4. Click "30d" period
5. Click "1y" period

### Expected Results
- ✅ Area chart shows portfolio value over time
- ✅ Each period loads correct data
- ✅ Gradient fill under line
- ✅ Tooltip on hover shows exact value and date
- ✅ Y-axis auto-scales
- ✅ X-axis labels appropriate for period
- ✅ Active period button highlighted
- ✅ Smooth transitions between periods

---

## TC-ANALYTICS-004: Asset Allocation Pie Chart
**Priority**: P1  
**Precondition**: Portfolio has multiple assets

### Test Steps
1. View asset allocation chart
2. Hover over slices
3. Review legend

### Expected Results
- ✅ Pie chart with all portfolio assets
- ✅ Each slice unique color
- ✅ Tooltip shows: Asset, Value ($), Percentage
- ✅ Legend lists assets with color indicators
- ✅ Percentages sum to 100%
- ✅ Largest slice labeled
- ✅ Small slices (<5%) grouped as "Others" (optional)

---

## TC-ANALYTICS-005: Vault Breakdown Table
**Priority**: P0  
**Precondition**: User has multiple vaults

### Test Steps
1. View vault breakdown table
2. Check all columns
3. Expand a vault row

### Expected Results
- ✅ Table columns:
  - Vault Name
  - TVL ($)
  - APY (%)
  - Earnings ($)
  - ROI (%)
  - Status
  - Actions
- ✅ Sort by any column (click header)
- ✅ Expand arrow reveals detailed metrics
- ✅ Expanded section shows:
  - Asset breakdown
  - Risk metrics (Sharpe, max drawdown, volatility)
  - Recent activity
- ✅ Color coding for positive/negative values

---

## TC-ANALYTICS-006: Sort Vault Table
**Priority**: P1  
**Precondition**: Multiple vaults

### Test Steps
1. Click "TVL" column header
2. Click "APY" column header
3. Click "Earnings" column header

### Expected Results
- ✅ Table sorts by selected column
- ✅ First click: descending (high to low)
- ✅ Second click: ascending (low to high)
- ✅ Sort arrow indicator shows direction
- ✅ Active column highlighted
- ✅ Sort persists across page visits

---

## TC-ANALYTICS-007: Expand Vault Details
**Priority**: P1  
**Precondition**: Vault in table

### Test Steps
1. Click expand arrow on a vault row
2. View expanded details
3. Click collapse arrow

### Expected Results
- ✅ Row expands smoothly
- ✅ Shows 3 sub-sections:
  - **Asset Breakdown**: List of assets with values
  - **Risk Metrics**: Sharpe ratio, max drawdown, volatility
  - **Performance**: Daily/weekly/monthly returns
- ✅ All metrics calculated correctly
- ✅ Collapsing hides details
- ✅ Can expand multiple rows simultaneously

---

## TC-ANALYTICS-008: Best/Worst Performers
**Priority**: P1  
**Precondition**: Multiple vaults with performance data

### Test Steps
1. View "Best Performer" card
2. View "Worst Performer" card

### Expected Results
- ✅ Best Performer shows:
  - Vault name
  - Highest ROI %
  - TVL
  - Green trophy icon
- ✅ Worst Performer shows:
  - Vault name
  - Lowest ROI % (or highest loss)
  - TVL
  - Red warning icon
- ✅ Click cards to navigate to vault details
- ✅ Updates in real-time

---

## TC-ANALYTICS-009: Protocol Yield Comparison
**Priority**: P1  
**Precondition**: None

### Test Steps
1. Scroll to "Protocol Yields" widget
2. View yield comparison

### Expected Results
- ✅ Bar chart comparing protocols
- ✅ Shows: Soroswap, MockPool, Manual Hold
- ✅ APY % for each protocol
- ✅ Highlights best yield
- ✅ Updates periodically
- ✅ "Live Rates" indicator

---

## TC-ANALYTICS-010: Empty Portfolio State
**Priority**: P1  
**Precondition**: New user with no positions

### Test Steps
1. Navigate to analytics with empty portfolio

### Expected Results
- ✅ All metric cards show $0.00 / 0%
- ✅ Performance chart: "No data available"
- ✅ Pie chart: Empty state message
- ✅ Table: Empty state with icon
- ✅ Message: "Start investing to see analytics"
- ✅ "Create Vault" CTA button

---

## TC-ANALYTICS-011: Risk Metrics Calculation
**Priority**: P1  
**Precondition**: Vault with 30+ days history

### Test Steps
1. Expand vault with history
2. Review risk metrics

### Expected Results
- ✅ **Sharpe Ratio**: (Return - Risk-free rate) / Std deviation
  - >1 = good, >2 = excellent
- ✅ **Max Drawdown**: Worst peak-to-trough decline %
  - Negative value, lower = riskier
- ✅ **Volatility**: Standard deviation of returns
  - Higher = more volatile
- ✅ All calculations mathematically accurate
- ✅ Tooltips explain each metric

---

## TC-ANALYTICS-012: Time-weighted Returns
**Priority**: P2  
**Precondition**: Multiple deposits/withdrawals

### Test Steps
1. View portfolio return
2. Verify calculation method

### Expected Results
- ✅ Returns calculated using time-weighted method
- ✅ Accounts for cash flows (deposits/withdrawals)
- ✅ Accurate representation of performance
- ✅ Not skewed by timing of contributions

---

## TC-ANALYTICS-013: Real-time Data Updates
**Priority**: P1  
**Precondition**: WebSocket connected

### Test Steps
1. Open analytics page
2. Trigger vault activity in another tab
3. Observe updates

### Expected Results
- ✅ TVL updates automatically
- ✅ Earnings recalculate
- ✅ Charts refresh with new data
- ✅ Table updates instantly
- ✅ No manual refresh needed

---

## TC-ANALYTICS-014: Export Analytics Data
**Priority**: P2  
**Precondition**: Analytics data available

### Test Steps
1. Click "Export" button (if available)
2. Select format (CSV, PDF)
3. Download file

### Expected Results
- ✅ Export modal opens
- ✅ Options: CSV (data), PDF (report)
- ✅ File generates successfully
- ✅ Includes all visible data
- ✅ Properly formatted
- ✅ Filename includes date

---

## TC-ANALYTICS-015: Custom Date Range
**Priority**: P2  
**Precondition**: Historical data available

### Test Steps
1. Click "Custom Range" on chart
2. Select start and end dates
3. Apply range

### Expected Results
- ✅ Date picker opens
- ✅ Can select any historical dates
- ✅ Chart updates with selected range
- ✅ Metrics recalculate for range
- ✅ Range indicator displayed

---

## TC-ANALYTICS-016: Compare Vaults
**Priority**: P2  
**Precondition**: 2+ vaults

### Test Steps
1. Select 2 vaults for comparison (if feature exists)
2. View comparison chart

### Expected Results
- ✅ Overlay chart with both vault performances
- ✅ Different colors for each vault
- ✅ Legend identifies vaults
- ✅ Side-by-side metrics comparison
- ✅ Easy to see which performs better

---

## TC-ANALYTICS-017: Mobile Analytics View
**Priority**: P1  
**Precondition**: Mobile device

### Test Steps
1. Open analytics on mobile
2. Scroll through all sections

### Expected Results
- ✅ Metric cards stack in 2 columns
- ✅ Charts responsive, scrollable
- ✅ Table scrolls horizontally
- ✅ Expand/collapse works on touch
- ✅ All data accessible
- ✅ Text readable

---

## TC-ANALYTICS-018: Loading States
**Priority**: P1  
**Precondition**: Fresh page load

### Test Steps
1. Load analytics with throttled network
2. Observe loading indicators

### Expected Results
- ✅ Skeleton loaders for cards
- ✅ Chart placeholder with spinner
- ✅ Table rows shimmer
- ✅ Smooth transition to data
- ✅ No layout shift

---

## TC-ANALYTICS-019: Analytics Performance
**Priority**: P2  
**Precondition**: Large portfolio (20+ vaults)

### Test Steps
1. Load analytics page
2. Expand all vaults
3. Change chart periods
4. Measure performance

### Expected Results
- ✅ Initial load < 3 seconds
- ✅ Chart changes < 500ms
- ✅ Table sorting < 100ms
- ✅ Smooth 60fps scrolling
- ✅ No lag or freezing

---

## TC-ANALYTICS-020: Error Handling
**Priority**: P1  
**Precondition**: Backend error

### Test Steps
1. Simulate API failure
2. Observe error states

### Expected Results
- ✅ Error cards display with alert icon
- ✅ Message: "Failed to load analytics"
- ✅ "Retry" button attempts refetch
- ✅ Partial data shows if available
- ✅ No crash or blank screen
