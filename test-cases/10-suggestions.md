# Test Cases: AI Suggestions

## TC-SUGGEST-001: Suggestions Page Load
**Priority**: P0  
**Precondition**: Wallet connected with vaults

### Test Steps
1. Navigate to /app/suggestions
2. Observe initial layout

### Expected Results
- ✅ Page title: "AI Suggestions" with Lightbulb icon
- ✅ Vault selector dropdown
- ✅ "Generate Suggestions" button
- ✅ Empty state message initially
- ✅ No suggestions displayed yet

---

## TC-SUGGEST-002: Select Vault for Suggestions
**Priority**: P0  
**Precondition**: User has vaults

### Test Steps
1. Click vault selector dropdown
2. View vault options
3. Select a vault

### Expected Results
- ✅ Dropdown shows all user's vaults
- ✅ Each option displays:
  - Vault name
  - Vault ID (truncated)
  - Current APY
- ✅ Selected vault highlights
- ✅ "Generate Suggestions" button enables

---

## TC-SUGGEST-003: Generate Suggestions (Happy Path)
**Priority**: P0  
**Precondition**: Vault selected

### Test Steps
1. Select vault
2. Click "Generate Suggestions"
3. Wait for AI to process

### Expected Results
- ✅ "Generating..." indicator shows
- ✅ Job created and polling starts
- ✅ Progress indicator updates
- ✅ Timeout: 60 seconds
- ✅ Success toast: "Suggestions generated!"
- ✅ Suggestion cards appear
- ✅ Shows 3-5 suggestions

---

## TC-SUGGEST-004: Suggestion Card Display
**Priority**: P0  
**Precondition**: Suggestions generated

### Test Steps
1. View suggestion cards
2. Inspect each card

### Expected Results
- ✅ Each card shows:
  - Suggestion type badge (Rebalance, Add Asset, etc.)
  - Priority badge (High/Medium/Low) with color
  - Difficulty indicator (Easy/Medium/Hard)
  - Title summarizing suggestion
  - Description paragraph
  - Expected impact metrics:
    - Return increase %
    - Risk reduction %
    - Efficiency gain %
  - "Apply Suggestion" button
  - "View Details" button
- ✅ Cards sorted by priority (High → Low)

---

## TC-SUGGEST-005: Suggestion Types
**Priority**: P1  
**Precondition**: Various vault configurations

### Test Steps
1. Generate suggestions for different vaults
2. Observe suggestion types

### Expected Results
- ✅ **Rebalance**: "Rebalance portfolio to target allocation"
- ✅ **Add Asset**: "Add [asset] to diversify"
- ✅ **Remove Asset**: "Remove underperforming [asset]"
- ✅ **Adjust Rule**: "Modify rebalance threshold to X%"
- ✅ **Risk Adjustment**: "Reduce allocation to volatile assets"
- ✅ Each type has appropriate icon and color

---

## TC-SUGGEST-006: View Suggestion Details
**Priority**: P1  
**Precondition**: Suggestions available

### Test Steps
1. Click "View Details" on a suggestion
2. Review detail modal

### Expected Results
- ✅ Modal opens with full explanation
- ✅ Shows:
  - Detailed reasoning
  - Step-by-step implementation
  - Data supporting recommendation
  - Market sentiment analysis
  - Risk considerations
  - Expected timeline
- ✅ "Apply Suggestion" button in modal
- ✅ "Close" button

---

## TC-SUGGEST-007: Apply Suggestion to Vault Builder
**Priority**: P0  
**Precondition**: Suggestion selected

### Test Steps
1. Click "Apply Suggestion" on a card
2. Observe navigation

### Expected Results
- ✅ Redirects to /app/builder?mode=chat
- ✅ AI Chat mode auto-opens
- ✅ Selected vault auto-loads
- ✅ AI pre-fills input with action prompt
- ✅ Example: "Rebalance vault to 60% XLM, 40% USDC based on AI suggestion"
- ✅ User can review and deploy
- ✅ State preserved via location.state

---

## TC-SUGGEST-008: Priority Level Indicators
**Priority**: P1  
**Precondition**: Suggestions generated

### Test Steps
1. View suggestions with different priorities
2. Observe visual indicators

### Expected Results
- ✅ **High Priority**: Red badge, urgent icon
- ✅ **Medium Priority**: Yellow/orange badge
- ✅ **Low Priority**: Blue/gray badge
- ✅ Priority affects card order (high first)
- ✅ Tooltips explain priority reasoning

---

## TC-SUGGEST-009: Difficulty Indicators
**Priority**: P2  
**Precondition**: Suggestions visible

### Test Steps
1. View difficulty ratings
2. Understand impact

### Expected Results
- ✅ **Easy**: Quick implementation, low complexity
- ✅ **Medium**: Moderate effort required
- ✅ **Hard**: Complex changes, requires review
- ✅ Difficulty shown with icon/stars
- ✅ Tooltip explains what makes it easy/hard

---

## TC-SUGGEST-010: Expected Impact Metrics
**Priority**: P1  
**Precondition**: Suggestions displayed

### Test Steps
1. Review impact metrics on cards
2. Verify realism

### Expected Results
- ✅ **Return Increase**: +X% projected
- ✅ **Risk Reduction**: -Y% projected
- ✅ **Efficiency Gain**: +Z% projected
- ✅ All percentages positive
- ✅ Realistic values (not 100%+ returns)
- ✅ Based on backtesting data
- ✅ Disclaimer about projections

---

## TC-SUGGEST-011: Cached Suggestions
**Priority**: P1  
**Precondition**: Previously generated suggestions exist

### Test Steps
1. Select vault with cached suggestions
2. Observe loading behavior

### Expected Results
- ✅ Cached suggestions load instantly (GET request)
- ✅ "Last updated: X mins ago" timestamp
- ✅ "Regenerate" button available
- ✅ No polling needed for cached data
- ✅ Cache expires after 1 hour

---

## TC-SUGGEST-012: Regenerate Suggestions
**Priority**: P1  
**Precondition**: Cached suggestions visible

### Test Steps
1. Click "Regenerate Suggestions" button
2. Wait for new suggestions

### Expected Results
- ✅ Fresh API call (POST request)
- ✅ Job polling starts
- ✅ Old suggestions remain visible during generation
- ✅ New suggestions replace old ones
- ✅ Success toast: "Suggestions updated!"
- ✅ Timestamp updates

---

## TC-SUGGEST-013: No Suggestions Available
**Priority**: P1  
**Precondition**: AI finds no improvements

### Test Steps
1. Generate suggestions for optimal vault
2. Observe result

### Expected Results
- ✅ Message: "No suggestions at this time"
- ✅ Explanation: "Your vault is already well-optimized!"
- ✅ Thumbs up icon
- ✅ "Try again later" note
- ✅ Suggests checking again after market changes

---

## TC-SUGGEST-014: Suggestion Generation Timeout
**Priority**: P1  
**Precondition**: Slow backend or network

### Test Steps
1. Generate suggestions
2. Wait 60+ seconds

### Expected Results
- ✅ Polling times out after 60 seconds
- ✅ Error toast: "Suggestion generation took too long"
- ✅ "Try Again" button available
- ✅ No crash or hanging state

---

## TC-SUGGEST-015: Empty Vault State
**Priority**: P1  
**Precondition**: New user with no vaults

### Test Steps
1. Navigate to suggestions page
2. Observe empty state

### Expected Results
- ✅ Vault selector disabled or shows "No vaults"
- ✅ Empty state card:
  - Lightbulb icon
  - "No vaults to optimize"
  - "Create a vault to get AI-powered suggestions"
  - "Create Vault" button → /app/builder

---

## TC-SUGGEST-016: Suggestion Implementation Steps
**Priority**: P1  
**Precondition**: Suggestion detail modal open

### Test Steps
1. View implementation section
2. Review steps

### Expected Results
- ✅ Step-by-step instructions numbered
- ✅ Clear, actionable steps
- ✅ Example steps:
  1. "Navigate to Vault Builder"
  2. "Adjust XLM allocation to 60%"
  3. "Deploy updated vault"
- ✅ Estimated time to complete
- ✅ "Apply Now" shortcut button

---

## TC-SUGGEST-017: Data Supporting Suggestions
**Priority**: P2  
**Precondition**: Suggestion details visible

### Test Steps
1. View "Data Support" section
2. Review insights

### Expected Results
- ✅ Shows market sentiment analysis
- ✅ Historical performance data
- ✅ Correlation metrics
- ✅ Volatility indicators
- ✅ Charts or graphs (optional)
- ✅ Sources cited (if applicable)

---

## TC-SUGGEST-018: Dismiss Suggestion
**Priority**: P2  
**Precondition**: Suggestions visible

### Test Steps
1. Click "X" or "Dismiss" on a suggestion card
2. Confirm dismissal

### Expected Results
- ✅ Confirmation: "Are you sure?"
- ✅ Explanation: "This will hide this suggestion"
- ✅ Card fades out and removes
- ✅ Dismissed suggestions logged
- ✅ Won't reappear on next generation

---

## TC-SUGGEST-019: Mobile Suggestions View
**Priority**: P1  
**Precondition**: Mobile device

### Test Steps
1. Open suggestions on mobile
2. Generate and view suggestions

### Expected Results
- ✅ Vault selector full-width
- ✅ Cards stack in single column
- ✅ All content readable
- ✅ Buttons easily tappable
- ✅ Modal full-screen on mobile
- ✅ Smooth scrolling

---

## TC-SUGGEST-020: Suggestion History/Tracking
**Priority**: P2  
**Precondition**: Applied suggestions exist

### Test Steps
1. Navigate to history section (if available)
2. View applied suggestions

### Expected Results
- ✅ Lists all applied suggestions
- ✅ Shows: Date applied, Type, Vault, Outcome
- ✅ Tracks success metrics
- ✅ Shows actual vs projected impact
- ✅ "Learn from results" insights
