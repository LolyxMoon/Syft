# Test Cases: NFT Marketplace

## TC-MARKET-001: Marketplace Page Load
**Priority**: P0  
**Precondition**: Wallet connected

### Test Steps
1. Navigate to /app/marketplace
2. Observe page layout

### Expected Results
- ✅ Page title: "Vault Marketplace"
- ✅ 3 stat cards at top:
  - Total Listings
  - Average Profit Share
  - Best Performance
- ✅ Search and filter bar
- ✅ NFT listings grid
- ✅ Pagination or infinite scroll

---

## TC-MARKET-002: Marketplace Stats
**Priority**: P1  
**Precondition**: Active listings exist

### Test Steps
1. View stats cards
2. Verify calculations

### Expected Results
- ✅ **Total Listings**: Count of active NFTs
- ✅ **Avg Profit Share**: Average % across all listed NFTs
- ✅ **Best Performance**: Highest APY vault
- ✅ All stats update in real-time
- ✅ Icons display correctly

---

## TC-MARKET-003: Browse NFT Listings
**Priority**: P0  
**Precondition**: Listings exist

### Test Steps
1. Scroll through marketplace
2. View NFT cards

### Expected Results
- ✅ Each NFT card shows:
  - NFT image/thumbnail
  - Vault name
  - Profit share %
  - Price in XLM
  - Seller address (truncated)
  - "View Details" button
- ✅ Grid layout: 3-4 columns on desktop
- ✅ Hover effects on cards
- ✅ "For Sale" badge

---

## TC-MARKET-004: Search Listings
**Priority**: P1  
**Precondition**: 5+ listings available

### Test Steps
1. Type vault name in search
2. Type seller address
3. Clear search

### Expected Results
- ✅ Results filter in real-time
- ✅ Searches vault name and seller
- ✅ Case-insensitive
- ✅ Clear button (X) resets
- ✅ Shows count: "X results"

---

## TC-MARKET-005: Filter by Profit Share
**Priority**: P1  
**Precondition**: Multiple listings

### Test Steps
1. Set profit share range: 0-25%
2. Set range: 25-50%
3. Set range: 50-100%

### Expected Results
- ✅ Slider or dropdown filter
- ✅ Results update immediately
- ✅ Only NFTs in range displayed
- ✅ Can combine with search
- ✅ Reset filter button

---

## TC-MARKET-006: Sort Listings
**Priority**: P1  
**Precondition**: Multiple listings

### Test Steps
1. Sort by Price (Low to High)
2. Sort by Price (High to Low)
3. Sort by Profit Share (High to Low)
4. Sort by Recently Listed

### Expected Results
- ✅ Listings reorder correctly
- ✅ Sort indicator shows active sort
- ✅ Ascending/descending toggle
- ✅ Results accurate

---

## TC-MARKET-007: View NFT Details
**Priority**: P0  
**Precondition**: Listing exists

### Test Steps
1. Click "View Details" on an NFT
2. Review detail modal/page

### Expected Results
- ✅ Modal or page opens with full details
- ✅ Shows:
  - Large NFT image
  - Vault name
  - Vault ID
  - Profit share %
  - Price in XLM (and USD equivalent)
  - Seller wallet address
  - Listing date
  - Vault performance metrics
- ✅ "Buy Now" button
- ✅ "View Vault" button → vault detail page

---

## TC-MARKET-008: Purchase NFT (Happy Path)
**Priority**: P0  
**Precondition**: Wallet has sufficient XLM

### Test Steps
1. Click "Buy Now" on an NFT
2. Review purchase summary
3. Confirm purchase
4. Sign transaction in wallet
5. Wait for confirmation

### Expected Results
- ✅ Purchase modal opens
- ✅ Shows: Price, Profit share, Fees
- ✅ Total cost calculated
- ✅ Balance check (warning if insufficient)
- ✅ "Confirm Purchase" button
- ✅ Transaction signed in Freighter
- ✅ Success toast: "NFT purchased successfully!"
- ✅ NFT appears in user's wallet/profile
- ✅ Listing removed from marketplace

---

## TC-MARKET-009: Purchase NFT (Insufficient Funds)
**Priority**: P1  
**Precondition**: Wallet balance < NFT price

### Test Steps
1. Try to buy expensive NFT
2. Click "Buy Now"

### Expected Results
- ✅ Warning displayed: "Insufficient balance"
- ✅ "Buy Now" button disabled
- ✅ Shows required amount vs current balance
- ✅ Suggests funding wallet
- ✅ No transaction attempted

---

## TC-MARKET-010: List Your NFT for Sale
**Priority**: P0  
**Precondition**: User owns vault NFT

### Test Steps
1. Navigate to owned NFT (from profile or vaults)
2. Click "List for Sale"
3. Enter price in XLM
4. Enter profit share %
5. Confirm listing
6. Sign transaction

### Expected Results
- ✅ List modal opens
- ✅ Price input (XLM) with USD conversion
- ✅ Profit share slider/input (0-100%)
- ✅ Preview of listing
- ✅ Platform fee shown (e.g., 2.5%)
- ✅ Transaction signed
- ✅ Success toast: "NFT listed successfully!"
- ✅ NFT appears in marketplace

---

## TC-MARKET-011: Cancel Listing
**Priority**: P1  
**Precondition**: User has active listing

### Test Steps
1. View own listed NFT
2. Click "Cancel Listing"
3. Confirm cancellation
4. Sign transaction

### Expected Results
- ✅ "Cancel Listing" button visible to seller
- ✅ Confirmation modal appears
- ✅ Transaction signed
- ✅ NFT removed from marketplace
- ✅ NFT returned to user's wallet
- ✅ Success toast: "Listing cancelled"

---

## TC-MARKET-012: Update Listing Price
**Priority**: P2  
**Precondition**: User has active listing

### Test Steps
1. View own listing
2. Click "Edit Price"
3. Enter new price
4. Confirm

### Expected Results
- ✅ Edit modal opens
- ✅ Current price shown
- ✅ Can update price and profit share
- ✅ Changes save
- ✅ Marketplace updates immediately

---

## TC-MARKET-013: NFT Image Display
**Priority**: P1  
**Precondition**: NFTs with images

### Test Steps
1. View NFT cards
2. Check image loading

### Expected Results
- ✅ Images load correctly
- ✅ Placeholder shown during load
- ✅ Fallback image if load fails
- ✅ Images optimized (lazy load)
- ✅ Aspect ratio maintained

---

## TC-MARKET-014: Empty Marketplace
**Priority**: P1  
**Precondition**: No active listings

### Test Steps
1. View marketplace with no listings

### Expected Results
- ✅ Empty state displays
- ✅ Message: "No listings available"
- ✅ Suggestion: "Be the first to list a vault NFT!"
- ✅ "Create Vault" button
- ✅ Marketplace icon

---

## TC-MARKET-015: Pagination
**Priority**: P2  
**Precondition**: 50+ listings

### Test Steps
1. Scroll to bottom of page
2. Click "Next Page" or observe auto-load

### Expected Results
- ✅ Shows 20-30 listings per page
- ✅ Pagination controls: Previous, Next, Page numbers
- ✅ Loading indicator during fetch
- ✅ Smooth append to list
- ✅ No duplicate NFTs

---

## TC-MARKET-016: NFT Purchase History
**Priority**: P2  
**Precondition**: User has purchased NFTs

### Test Steps
1. Navigate to profile/history
2. View purchase history

### Expected Results
- ✅ Lists all purchased NFTs
- ✅ Shows: Date, Price, Vault name, Seller
- ✅ Links to vault details
- ✅ Transaction hash links

---

## TC-MARKET-017: NFT Sales Notifications
**Priority**: P2  
**Precondition**: User's NFT sold

### Test Steps
1. List NFT
2. Wait for another user to purchase
3. Check notifications

### Expected Results
- ✅ Toast notification: "Your NFT was sold!"
- ✅ Email notification (if enabled)
- ✅ Sales history updated
- ✅ Funds credited to wallet

---

## TC-MARKET-018: Mobile Marketplace
**Priority**: P1  
**Precondition**: Mobile device

### Test Steps
1. Browse marketplace on mobile
2. Test all interactions

### Expected Results
- ✅ Cards stack in 1-2 columns
- ✅ Search bar full-width
- ✅ Filters in collapsible menu
- ✅ Modals full-screen
- ✅ Touch gestures work
- ✅ All text readable

---

## TC-MARKET-019: Marketplace Performance
**Priority**: P2  
**Precondition**: 100+ listings

### Test Steps
1. Load marketplace
2. Scroll and interact
3. Measure performance

### Expected Results
- ✅ Initial load < 2 seconds
- ✅ Image lazy loading
- ✅ Virtual scrolling (if many items)
- ✅ 60fps scroll
- ✅ No memory leaks

---

## TC-MARKET-020: Marketplace Analytics
**Priority**: P2  
**Precondition**: Platform has sales data

### Test Steps
1. View marketplace stats
2. Check trending NFTs

### Expected Results
- ✅ "Trending" section shows hot NFTs
- ✅ "Recently Sold" displays recent sales
- ✅ Volume metrics (24h, 7d, 30d)
- ✅ Floor price tracker
- ✅ Top sellers leaderboard
