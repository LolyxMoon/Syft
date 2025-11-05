# Test Cases: Landing Page (Home)

## TC-HOME-001: Hero Section Display
**Priority**: P1  
**Precondition**: None

### Test Steps
1. Navigate to https://syft.app (root path)
2. Observe hero section

### Expected Results
- ✅ Title displays: "Build Smarter Vaults on Stellar"
- ✅ "Stellar" text highlighted in primary color (#dce85d)
- ✅ Subtitle clearly visible
- ✅ UnicornStudio animated background loads
- ✅ "Start Building" CTA button visible and functional
- ✅ No layout shifts or flashing content

---

## TC-HOME-002: Stats Bar
**Priority**: P2  
**Precondition**: None

### Test Steps
1. Scroll to stats section below hero
2. Verify all 4 stat cards display

### Expected Results
- ✅ "Total Value Locked" card shows: $76M, +12.5%
- ✅ "Active Vaults" card shows: 600+, +23.1%
- ✅ "Total Users" card shows: 80K, +8.3%
- ✅ "Avg APY" card shows: 15.2%, +2.1%
- ✅ All cards have icons and proper formatting
- ✅ Responsive grid layout (4 cols desktop, 2 cols mobile)

---

## TC-HOME-003: Trusted By Section
**Priority**: P2  
**Precondition**: None

### Test Steps
1. Scroll to "Trusted By" section
2. Observe marquee animation

### Expected Results
- ✅ Shows: Soroban Labs, Stellar Foundation, DeFi Alliance, etc.
- ✅ Marquee scrolls smoothly left-to-right
- ✅ Infinite loop animation works
- ✅ Text is readable during animation
- ✅ Gradient mask at edges for smooth fade

---

## TC-HOME-004: Features Section Animation
**Priority**: P2  
**Precondition**: None

### Test Steps
1. Scroll to "Everything You Need to Succeed" section
2. Observe animated integration icons
3. Observe connection lines animation

### Expected Results
- ✅ 6 integration icons float smoothly
- ✅ SVG connection lines animate
- ✅ Pulse glow effect on circles
- ✅ No performance lag (60fps)
- ✅ Animation pauses when section not visible (optimization)
- ✅ Feature benefit badges visible below

---

## TC-HOME-005: Feature Showcase Interaction
**Priority**: P2  
**Precondition**: None

### Test Steps
1. Scroll to platform showcase section
2. Hover over feature cards

### Expected Results
- ✅ Vertical timeline with gradient line
- ✅ 3 feature points (Smart Strategy, Real-time Analytics, Gas Optimization)
- ✅ Each point has connecting dot with animation
- ✅ Hover effects work on timeline items
- ✅ "Explore vaults" button navigates to /app/vaults

---

## TC-HOME-006: Feature Grid Cards
**Priority**: P1  
**Precondition**: None

### Test Steps
1. Scroll to 2x2 feature grid
2. Hover over each card
3. Click on cards

### Expected Results
- ✅ 4 cards: Live tracking, Audited contracts, Multi-protocol, Smart optimization
- ✅ Each card has: icon, tag, title
- ✅ Background images load correctly
- ✅ Gradient overlay visible
- ✅ Hover scales card to 1.05x
- ✅ Border changes to primary color on hover

---

## TC-HOME-007: How It Works Steps
**Priority**: P1  
**Precondition**: None

### Test Steps
1. Scroll to "Get Started in 3 Steps" section
2. Review all 3 steps

### Expected Results
- ✅ Step 01: Connect Wallet
- ✅ Step 02: Build Strategy  
- ✅ Step 03: Deploy & Earn
- ✅ Each step has description
- ✅ Glass card styling with hover effects
- ✅ "Create Your First Vault" button navigates to /app/builder

---

## TC-HOME-008: Testimonials Carousel
**Priority**: P2  
**Precondition**: None

### Test Steps
1. Scroll to testimonials section
2. Observe auto-scrolling behavior

### Expected Results
- ✅ 2 rows of testimonials
- ✅ Row 1 scrolls left-to-right
- ✅ Row 2 scrolls right-to-left
- ✅ Infinite scroll (seamless loop)
- ✅ 6 unique testimonials with names, handles, avatars
- ✅ Verified checkmarks visible
- ✅ Auto-scroll smooth and continuous

---

## TC-HOME-009: CTA Section
**Priority**: P1  
**Precondition**: None

### Test Steps
1. Scroll to final CTA section
2. Click "Launch App" button

### Expected Results
- ✅ Heading: "Ready to Maximize Your Yields?"
- ✅ Shimmer button animation works
- ✅ Gradient glow effects visible
- ✅ Button navigates to /app/builder
- ✅ Background blur and gradient effects

---

## TC-HOME-010: Navigation
**Priority**: P0  
**Precondition**: None

### Test Steps
1. Test all navigation buttons
2. Test footer links

### Expected Results
- ✅ "Start Building" → /app/builder
- ✅ "Explore vaults" → /app/vaults  
- ✅ "Create Your First Vault" → /app/builder
- ✅ "Launch App" → /app/builder
- ✅ Footer displays correctly
- ✅ All links functional

---

## TC-HOME-011: Mobile Responsiveness
**Priority**: P1  
**Precondition**: Mobile device or responsive mode

### Test Steps
1. Open site on mobile (or resize to <768px)
2. Scroll through entire page
3. Test all interactions

### Expected Results
- ✅ Hero text readable and properly sized
- ✅ Stats show 2 columns on mobile
- ✅ Feature cards stack vertically
- ✅ Testimonials scroll smoothly
- ✅ CTA button full-width on small screens
- ✅ No horizontal scroll
- ✅ Touch interactions work

---

## TC-HOME-012: Animation Performance
**Priority**: P2  
**Precondition**: None

### Test Steps
1. Open DevTools → Performance tab
2. Record page scroll
3. Check FPS and render time

### Expected Results
- ✅ Consistent 60 FPS during scroll
- ✅ No layout shifts (CLS < 0.1)
- ✅ Animations use CSS transforms (hardware accelerated)
- ✅ IntersectionObserver pauses off-screen animations
- ✅ Page load time < 3 seconds

---

## TC-HOME-013: UnicornStudio Background
**Priority**: P2  
**Precondition**: None

### Test Steps
1. Load homepage
2. Observe hero section background
3. Wait 5 seconds

### Expected Results
- ✅ Animated background loads within 2 seconds
- ✅ Fallback gradient shows during load
- ✅ No console errors if script fails
- ✅ Animation smooth and not distracting
- ✅ No performance impact on page
