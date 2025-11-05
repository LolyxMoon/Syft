# Test Cases: Strategy Backtesting

## TC-BACKTEST-001: Backtests Page Load
**Priority**: P0  
**Precondition**: Wallet connected

### Test Steps
1. Navigate to /app/backtests
2. Observe initial layout

### Expected Results
- ✅ Page title: "Strategy Backtests" with Clock icon
- ✅ Three tabs: Configure, Results, History
- ✅ "Configure" tab selected by default
- ✅ Backtest configuration form visible
- ✅ No results shown initially

---

## TC-BACKTEST-002: Configure Backtest
**Priority**: P0  
**Precondition**: User has vaults

### Test Steps
1. Select vault from dropdown
2. Select start date (e.g., 30 days ago)
3. Select end date (today)
4. Set initial capital (e.g., 1000 XLM)
5. Choose resolution (daily)

### Expected Results
- ✅ Vault dropdown shows user's vaults
- ✅ Date picker allows selecting dates
- ✅ Min date range: 7 days
- ✅ End date must be after start date
- ✅ Initial capital input validates (> 0)
- ✅ Resolution options: Hourly, Daily, Weekly
- ✅ All fields required
- ✅ Form validation shows errors

---

## TC-BACKTEST-003: Run Backtest (Happy Path)
**Priority**: P0  
**Precondition**: Valid configuration

### Test Steps
1. Configure backtest with valid inputs
2. Click "Run Backtest" button
3. Wait for completion

### Expected Results
- ✅ "Running..." indicator shows
- ✅ Progress percentage updates
- ✅ Job polling starts (max 60s)
- ✅ Auto-switches to "Results" tab when complete
- ✅ Success toast: "Backtest completed!"
- ✅ Results display

---

## TC-BACKTEST-004: Backtest Results Display
**Priority**: P0  
**Precondition**: Backtest completed

### Test Steps
1. View "Results" tab
2. Review all sections

### Expected Results
- ✅ **Performance Metrics Card**:
  - Total Return (%)
  - Sharpe Ratio
  - Max Drawdown (%)
  - Win Rate (%)
  - Total Trades
  - Avg Trade Duration
- ✅ **Portfolio Value Chart**:
  - Line chart showing value over time
  - X-axis: dates, Y-axis: value
  - Tooltip on hover
- ✅ **Strategy Comparison**:
  - Vault strategy vs Buy-and-Hold
  - Side-by-side metrics
- ✅ All calculations accurate

---

## TC-BACKTEST-005: Results Chart Interaction
**Priority**: P1  
**Precondition**: Backtest results visible

### Test Steps
1. Hover over chart line
2. Zoom in on a section (if available)
3. Toggle chart display options

### Expected Results
- ✅ Tooltip shows date and exact value
- ✅ Zoom controls work
- ✅ Can toggle: Strategy, Benchmark, Assets
- ✅ Legend identifies lines
- ✅ Chart responsive to window resize

---

## TC-BACKTEST-006: Strategy vs Benchmark
**Priority**: P1  
**Precondition**: Backtest results

### Test Steps
1. View comparison section
2. Compare metrics

### Expected Results
- ✅ Shows two columns: Strategy | Benchmark
- ✅ Metrics compared:
  - Total Return
  - Sharpe Ratio
  - Max Drawdown
  - Volatility
- ✅ Winner highlighted (green)
- ✅ Difference shown (+/- %)
- ✅ Benchmark = simple buy-and-hold

---

## TC-BACKTEST-007: Save Backtest Results
**Priority**: P1  
**Precondition**: Backtest completed

### Test Steps
1. Click "Save Backtest" button
2. Enter optional name/notes
3. Confirm save

### Expected Results
- ✅ Save modal opens
- ✅ Auto-generated name (optional override)
- ✅ Notes field for comments
- ✅ Success toast: "Backtest saved!"
- ✅ Appears in History tab
- ✅ Can access later

---

## TC-BACKTEST-008: Backtest History Tab
**Priority**: P1  
**Precondition**: User has saved backtests

### Test Steps
1. Click "History" tab
2. View saved backtests

### Expected Results
- ✅ Table with columns:
  - Name
  - Vault
  - Date Range
  - Return (%)
  - Created Date
  - Actions
- ✅ Most recent first
- ✅ "View" button loads results
- ✅ "Delete" button removes backtest
- ✅ Search/filter available

---

## TC-BACKTEST-009: Load Backtest from History
**Priority**: P1  
**Precondition**: Saved backtest exists

### Test Steps
1. Click "View" on a historical backtest
2. Observe results

### Expected Results
- ✅ Switches to Results tab
- ✅ Shows saved backtest results
- ✅ All metrics and charts load
- ✅ "Backtest from [date]" banner
- ✅ Can re-run with same config

---

## TC-BACKTEST-010: Delete Backtest
**Priority**: P2  
**Precondition**: Saved backtest exists

### Test Steps
1. Click "Delete" on a backtest
2. Confirm deletion

### Expected Results
- ✅ Confirmation modal appears
- ✅ Warning: "This action cannot be undone"
- ✅ User confirms
- ✅ Backtest removed from history
- ✅ Success toast: "Backtest deleted"

---

## TC-BACKTEST-011: Export Backtest Results
**Priority**: P2  
**Precondition**: Backtest results visible

### Test Steps
1. Click "Export" button
2. Choose format (CSV)
3. Download file

### Expected Results
- ✅ Export modal or direct download
- ✅ CSV includes:
  - All metrics
  - Daily/hourly values
  - Trade log
- ✅ File named: backtest_[vault]_[date].csv
- ✅ Opens in Excel/Sheets correctly

---

## TC-BACKTEST-012: Backtest Validation Errors
**Priority**: P1  
**Precondition**: Invalid configuration

### Test Steps
1. Leave vault unselected
2. Set end date before start date
3. Set capital to 0
4. Try to run

### Expected Results
- ✅ "Run Backtest" button disabled
- ✅ Error messages display:
  - "Please select a vault"
  - "End date must be after start date"
  - "Initial capital must be > 0"
- ✅ Red outline on invalid fields
- ✅ Cannot submit until fixed

---

## TC-BACKTEST-013: Backtest Timeout Handling
**Priority**: P1  
**Precondition**: Long-running backtest

### Test Steps
1. Configure large date range (1 year)
2. Run backtest
3. Wait for timeout (60s)

### Expected Results
- ✅ Progress indicator shows up to timeout
- ✅ If exceeds 60s, error toast appears
- ✅ Message: "Backtest took too long, please try smaller range"
- ✅ Can retry with shorter range
- ✅ No crash

---

## TC-BACKTEST-014: Empty History State
**Priority**: P1  
**Precondition**: No saved backtests

### Test Steps
1. Click "History" tab
2. View empty state

### Expected Results
- ✅ Empty state icon (Clock or Archive)
- ✅ Message: "No backtest history"
- ✅ Subtext: "Run and save backtests to see them here"
- ✅ "Run Your First Backtest" button → Configure tab

---

## TC-BACKTEST-015: Date Range Validation
**Priority**: P1  
**Precondition**: Configuring backtest

### Test Steps
1. Select start date: today
2. Select end date: today
3. Try dates < 7 days apart

### Expected Results
- ✅ Minimum range enforced: 7 days
- ✅ Error: "Date range must be at least 7 days"
- ✅ End date auto-adjusts if too close
- ✅ Cannot select future dates

---

## TC-BACKTEST-016: Search Backtest History
**Priority**: P2  
**Precondition**: 10+ saved backtests

### Test Steps
1. Type vault name in history search
2. Filter by date range
3. Clear filters

### Expected Results
- ✅ Results filter in real-time
- ✅ Searches vault name and notes
- ✅ Date range filter available
- ✅ Clear button resets
- ✅ Shows result count

---

## TC-BACKTEST-017: Backtest Job Polling
**Priority**: P1  
**Precondition**: Backtest running

### Test Steps
1. Start backtest
2. Observe polling behavior
3. Monitor console/network

### Expected Results
- ✅ Polls backend every 1-2 seconds
- ✅ Status updates: pending → running → completed
- ✅ Progress percentage increases
- ✅ Max polling time: 60 seconds
- ✅ Stops polling when complete or timeout
- ✅ Handles errors gracefully

---

## TC-BACKTEST-018: Multiple Backtests Comparison
**Priority**: P2  
**Precondition**: 2+ saved backtests

### Test Steps
1. Select 2 backtests to compare (if feature exists)
2. View comparison

### Expected Results
- ✅ Side-by-side or overlay comparison
- ✅ Charts overlay with different colors
- ✅ Metrics table compares both
- ✅ Easy to identify better strategy

---

## TC-BACKTEST-019: Mobile Backtests View
**Priority**: P1  
**Precondition**: Mobile device

### Test Steps
1. Open backtests on mobile
2. Configure and run backtest
3. View results

### Expected Results
- ✅ Form fields stack vertically
- ✅ Date pickers mobile-optimized
- ✅ Charts responsive and scrollable
- ✅ All buttons easily tappable
- ✅ Tables scroll horizontally if needed
- ✅ Tab navigation clear

---

## TC-BACKTEST-020: Backtest Performance
**Priority**: P2  
**Precondition**: Large backtest (1 year, hourly)

### Test Steps
1. Run intensive backtest
2. Measure load and render time

### Expected Results
- ✅ Backend processing < 30 seconds
- ✅ Results render < 2 seconds
- ✅ Chart draws smoothly
- ✅ No browser freeze
- ✅ Memory usage reasonable
