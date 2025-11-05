# Test Cases: Quest System & NFT Rewards

## TC-QUEST-001: Quests Page Load
**Priority**: P0  
**Precondition**: Wallet connected

### Test Steps
1. Navigate to /app/quests
2. Observe page layout

### Expected Results
- ✅ Page title: "Quests & Rewards" with Trophy icon
- ✅ Two tabs: "Quests" and "My NFTs"
- ✅ Stats bar with 4 metrics
- ✅ Quest cards grid
- ✅ Category filter buttons
- ✅ Progress indicators

---

## TC-QUEST-002: Quest Stats Display
**Priority**: P1  
**Precondition**: User has quest progress

### Test Steps
1. View stats bar at top
2. Verify calculations

### Expected Results
- ✅ **Total Quests**: Count of all available quests
- ✅ **Completed**: Number of finished quests
- ✅ **NFTs Earned**: Count of claimed NFT rewards
- ✅ **Completion Rate**: Percentage (completed/total × 100)
- ✅ All stats accurate
- ✅ Icons for each stat

---

## TC-QUEST-003: Quest Categories
**Priority**: P1  
**Precondition**: Quests available

### Test Steps
1. Click "All" category filter
2. Click "Basics" filter
3. Click "DeFi" filter
4. Click "Vaults" filter
5. Click "Advanced" filter

### Expected Results
- ✅ **All**: Shows all quests
- ✅ **Basics**: Onboarding quests (connect wallet, view dashboard)
- ✅ **DeFi**: DeFi education (swaps, liquidity, staking)
- ✅ **Vaults**: Vault-related (create, deposit, manage)
- ✅ **Advanced**: Complex tasks (backtesting, optimization)
- ✅ Active filter highlighted
- ✅ Quest count updates per filter

---

## TC-QUEST-004: Quest Card Display
**Priority**: P0  
**Precondition**: Quests loaded

### Test Steps
1. View quest cards
2. Inspect each card

### Expected Results
- ✅ Each card shows:
  - Category badge
  - Quest title
  - Description
  - XP reward amount
  - NFT preview (if reward)
  - Progress bar (if multi-step)
  - Status badge (Not Started/In Progress/Completed/Claimed)
  - Action button (Start/Continue/Claim)
- ✅ Cards color-coded by status
- ✅ Completed quests show checkmark

---

## TC-QUEST-005: Start Quest
**Priority**: P0  
**Precondition**: Quest not started

### Test Steps
1. Click "Start Quest" on a quest card
2. Observe behavior

### Expected Results
- ✅ Quest status changes to "In Progress"
- ✅ If quest has hints, hint tour auto-starts
- ✅ Button changes to "Continue Quest"
- ✅ Progress tracking begins
- ✅ Success toast: "Quest started!"

---

## TC-QUEST-006: Quest Hints System
**Priority**: P1  
**Precondition**: Quest with hints, user clicks start

### Test Steps
1. Start quest with hints (e.g., "Create Your First Vault")
2. Observe hint tour

### Expected Results
- ✅ Driver.js tour overlay appears
- ✅ Highlights relevant UI elements
- ✅ Shows step-by-step instructions
- ✅ Navigation: Previous, Next, Skip buttons
- ✅ Progress dots show current step
- ✅ User can skip tour
- ✅ Tour dismisses on completion
- ✅ Quest remains "In Progress"

---

## TC-QUEST-007: Quest Validation
**Priority**: P0  
**Precondition**: Quest in progress

### Test Steps
1. Start quest: "View Dashboard"
2. Navigate to /app/dashboard
3. Return to quests page

### Expected Results
- ✅ Backend validates quest completion
- ✅ Quest status changes to "Completed"
- ✅ "Claim Reward" button appears
- ✅ Success toast: "Quest completed! Claim your reward"
- ✅ Checkmark icon on card
- ✅ Progress bar at 100%

---

## TC-QUEST-008: Claim NFT Reward (Happy Path)
**Priority**: P0  
**Precondition**: Quest completed, not claimed

### Test Steps
1. Click "Claim Reward" button
2. Confirm transaction in wallet
3. Wait for confirmation

### Expected Results
- ✅ Claim modal opens showing NFT preview
- ✅ Explains reward (e.g., "Beginner Badge NFT")
- ✅ "Claim NFT" button
- ✅ Transaction built (XDR created)
- ✅ Freighter signature requested
- ✅ Transaction submitted to network
- ✅ Polling for confirmation
- ✅ Success modal: "NFT claimed successfully!"
- ✅ NFT appears in "My NFTs" tab
- ✅ Quest status changes to "Claimed"

---

## TC-QUEST-009: Claim Reward (User Rejects)
**Priority**: P1  
**Precondition**: Quest completed

### Test Steps
1. Click "Claim Reward"
2. Reject transaction in wallet

### Expected Results
- ✅ Error toast: "Transaction rejected"
- ✅ Quest remains "Completed" (not "Claimed")
- ✅ "Claim Reward" button still available
- ✅ User can retry later
- ✅ No partial state issues

---

## TC-QUEST-010: Multi-Step Quest Progress
**Priority**: P1  
**Precondition**: Quest with multiple objectives

### Test Steps
1. Start quest: "Become a Vault Master" (create + deposit + manage)
2. Complete first step
3. Complete second step
4. Complete third step

### Expected Results
- ✅ Progress bar shows completion percentage
- ✅ Example: "1/3 completed" → "2/3" → "3/3"
- ✅ Each step validates independently
- ✅ Can complete in any order (if parallel)
- ✅ Quest completes when all steps done
- ✅ Checkmarks on completed steps

---

## TC-QUEST-011: My NFTs Tab
**Priority**: P0  
**Precondition**: User has claimed NFTs

### Test Steps
1. Click "My NFTs" tab
2. View NFT gallery

### Expected Results
- ✅ Grid display of owned NFTs
- ✅ Each NFT shows:
  - Image/artwork
  - Name (e.g., "Beginner Badge")
  - Quest it was earned from
  - Claimed date
  - Rarity badge (if applicable)
- ✅ "View Details" button opens NFT modal
- ✅ Empty state if no NFTs: "Complete quests to earn NFTs"

---

## TC-QUEST-012: NFT Detail Modal
**Priority**: P1  
**Precondition**: NFT in gallery

### Test Steps
1. Click on an NFT
2. View details

### Expected Results
- ✅ Large NFT image
- ✅ NFT metadata:
  - Name
  - Description
  - Quest earned from
  - Claimed date
  - Contract address
  - Token ID
  - Network (Testnet/Futurenet)
- ✅ "View on Explorer" link → Stellar Expert
- ✅ "Share" button (optional)
- ✅ "Close" button

---

## TC-QUEST-013: Quest Search/Filter
**Priority**: P2  
**Precondition**: Many quests available

### Test Steps
1. Type quest name in search
2. Filter by completion status
3. Clear filters

### Expected Results
- ✅ Search filters quests by title/description
- ✅ Status filter: All/Not Started/In Progress/Completed
- ✅ Results update in real-time
- ✅ Clear button resets

---

## TC-QUEST-014: Daily/Weekly Quests (if available)
**Priority**: P2  
**Precondition**: Time-based quests exist

### Test Steps
1. View daily quests section
2. Complete a daily quest
3. Wait 24 hours (or simulate)
4. Check reset

### Expected Results
- ✅ Daily quests labeled with clock icon
- ✅ "Resets in: 12h 34m" countdown
- ✅ After reset, quest becomes available again
- ✅ Can earn rewards multiple times
- ✅ Weekly quests reset weekly

---

## TC-QUEST-015: Quest Leaderboard (if available)
**Priority**: P2  
**Precondition**: Leaderboard feature exists

### Test Steps
1. View leaderboard section
2. Check ranking

### Expected Results
- ✅ Shows top 10-50 users by XP
- ✅ User's own rank highlighted
- ✅ Columns: Rank, Username/Address, XP, NFTs
- ✅ Updates in real-time
- ✅ Pagination for full list

---

## TC-QUEST-016: Empty Quest State
**Priority**: P1  
**Precondition**: All quests completed

### Test Steps
1. Complete all available quests
2. View quests page

### Expected Results
- ✅ Congratulations message
- ✅ "You've completed all quests!"
- ✅ Trophy icon
- ✅ "Check back for new quests" note
- ✅ Stats show 100% completion

---

## TC-QUEST-017: Quest Notifications
**Priority**: P2  
**Precondition**: Quest completed

### Test Steps
1. Complete quest objective
2. Observe notifications

### Expected Results
- ✅ Toast notification: "Quest completed!"
- ✅ Badge notification on Quests page icon (if in nav)
- ✅ Sound effect (optional, with mute option)
- ✅ Visual confetti or celebration animation

---

## TC-QUEST-018: NFT Transfer/List (if supported)
**Priority**: P2  
**Precondition**: Owned NFT

### Test Steps
1. Open NFT detail
2. Click "Transfer" or "List for Sale"
3. Complete transaction

### Expected Results
- ✅ Transfer modal: Enter recipient address
- ✅ List for sale: Set price, profit share
- ✅ Transaction signed and submitted
- ✅ NFT ownership updates
- ✅ Marketplace listing created (if listing)

---

## TC-QUEST-019: Mobile Quests View
**Priority**: P1  
**Precondition**: Mobile device

### Test Steps
1. Open quests on mobile
2. Start and complete quest
3. Claim reward

### Expected Results
- ✅ Cards stack in single column
- ✅ Stats in 2x2 grid
- ✅ Category buttons scrollable
- ✅ Hint tours work on mobile
- ✅ NFT gallery responsive
- ✅ All interactions functional

---

## TC-QUEST-020: Quest Analytics (if available)
**Priority**: P2  
**Precondition**: Quest history exists

### Test Steps
1. View quest analytics section
2. Review metrics

### Expected Results
- ✅ Shows: Total XP earned, Time spent on quests
- ✅ Chart of quest completion over time
- ✅ Most popular quest categories
- ✅ Average completion time per quest
- ✅ Badges/achievements unlocked
