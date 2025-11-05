# Test Cases: Performance & Load Testing

## TC-PERF-001: Initial Page Load Performance
**Priority**: P0  
**Precondition**: Fresh browser, no cache

### Test Steps
1. Clear browser cache
2. Navigate to app
3. Measure load times

### Expected Results
- ✅ **First Contentful Paint (FCP)**: < 1.5s
- ✅ **Largest Contentful Paint (LCP)**: < 2.5s
- ✅ **Time to Interactive (TTI)**: < 3.5s
- ✅ **Total Blocking Time (TBT)**: < 300ms
- ✅ **Cumulative Layout Shift (CLS)**: < 0.1
- ✅ Lighthouse score: 90+

---

## TC-PERF-002: Page Navigation Speed
**Priority**: P1  
**Precondition**: App loaded

### Test Steps
1. Navigate Dashboard → Builder → Vaults → Analytics
2. Measure transition time

### Expected Results
- ✅ Page transitions < 500ms
- ✅ Smooth animations (60fps)
- ✅ No visible lag
- ✅ React Router optimized
- ✅ Code splitting effective

---

## TC-PERF-003: Chart Rendering Performance
**Priority**: P1  
**Precondition**: Large dataset (365 days)

### Test Steps
1. Load analytics with 1 year of data
2. Switch between time periods
3. Measure render time

### Expected Results
- ✅ Initial chart render: < 1s
- ✅ Period switch: < 300ms
- ✅ 60fps during animations
- ✅ No dropped frames
- ✅ Recharts optimized

---

## TC-PERF-004: Vault List with 100+ Vaults
**Priority**: P1  
**Precondition**: User with 100 vaults

### Test Steps
1. Load vaults page
2. Scroll through list
3. Search and filter
4. Measure performance

### Expected Results
- ✅ Initial load: < 3s
- ✅ Smooth scrolling (60fps)
- ✅ Virtual scrolling if needed
- ✅ Search filters: < 100ms
- ✅ No lag or stuttering

---

## TC-PERF-005: Marketplace with 500+ NFTs
**Priority**: P1  
**Precondition**: Marketplace has many listings

### Test Steps
1. Load marketplace
2. Scroll through listings
3. Apply filters
4. Measure performance

### Expected Results
- ✅ Initial load: < 4s
- ✅ Lazy load images
- ✅ Pagination effective
- ✅ 60fps scrolling
- ✅ Filter updates: < 200ms

---

## TC-PERF-006: WebSocket Message Handling
**Priority**: P1  
**Precondition**: WebSocket connected

### Test Steps
1. Simulate 100 WS messages/second
2. Observe app responsiveness

### Expected Results
- ✅ Messages processed efficiently
- ✅ UI updates batched (React 18)
- ✅ No UI freeze
- ✅ Memory usage stable
- ✅ No dropped messages

---

## TC-PERF-007: Concurrent User Simulation
**Priority**: P2  
**Precondition**: Load testing tool

### Test Steps
1. Simulate 1000 concurrent users
2. All performing typical actions
3. Measure backend and frontend

### Expected Results
- ✅ Backend handles load
- ✅ Response times < 2s (p95)
- ✅ No 500 errors
- ✅ Database queries optimized
- ✅ CDN serves static assets
- ✅ API rate limiting works

---

## TC-PERF-008: Memory Leaks Over Time
**Priority**: P1  
**Precondition**: App open for extended period

### Test Steps
1. Open app, perform actions for 1 hour
2. Monitor memory usage (DevTools)
3. Check for leaks

### Expected Results
- ✅ Memory usage stays < 100MB
- ✅ No continuous growth
- ✅ GC reclaims memory
- ✅ Event listeners cleaned up
- ✅ WebSocket connections managed
- ✅ React components unmount properly

---

## TC-PERF-009: Large Transaction History
**Priority**: P1  
**Precondition**: Vault with 1000+ transactions

### Test Steps
1. Load vault detail page
2. View transaction history
3. Scroll through history

### Expected Results
- ✅ Initial load: < 2s
- ✅ Pagination or virtual scroll
- ✅ 60fps scrolling
- ✅ Search and filter fast
- ✅ Export doesn't freeze UI

---

## TC-PERF-010: AI Chat Response Time
**Priority**: P1  
**Precondition**: AI Chat builder or Terminal

### Test Steps
1. Send message to AI
2. Measure response time
3. Test 10 different prompts

### Expected Results
- ✅ Average response: < 3s
- ✅ Max response: < 8s
- ✅ Loading indicator immediate
- ✅ Streaming responses (if implemented)
- ✅ Backend AI optimized

---

## TC-PERF-011: Backtest Large Date Range
**Priority**: P1  
**Precondition**: Backtest with 1 year hourly data

### Test Steps
1. Configure backtest (365 days, hourly)
2. Run backtest
3. Measure processing time

### Expected Results
- ✅ Backend processes < 30s
- ✅ Progress updates smooth
- ✅ Results render < 2s
- ✅ Chart draws without lag
- ✅ No browser freeze

---

## TC-PERF-012: Image Optimization
**Priority**: P1  
**Precondition**: Pages with images

### Test Steps
1. Check image sizes and formats
2. Verify lazy loading
3. Measure load impact

### Expected Results
- ✅ Images < 100KB each
- ✅ WebP format (with fallback)
- ✅ Lazy loading implemented
- ✅ Responsive images (srcset)
- ✅ CDN delivery

---

## TC-PERF-013: Bundle Size Analysis
**Priority**: P1  
**Precondition**: Production build

### Test Steps
1. Build for production
2. Analyze bundle with webpack-bundle-analyzer
3. Check sizes

### Expected Results
- ✅ Main bundle: < 300KB gzipped
- ✅ Code splitting effective
- ✅ Vendor chunks optimized
- ✅ Tree shaking working
- ✅ No duplicate dependencies
- ✅ Lazy load routes

---

## TC-PERF-014: API Response Caching
**Priority**: P1  
**Precondition**: Multiple page visits

### Test Steps
1. Load dashboard (API call)
2. Navigate away, come back
3. Measure load time

### Expected Results
- ✅ Cached data loads instantly
- ✅ Cache invalidation works
- ✅ Stale data refreshes
- ✅ Cache headers set correctly
- ✅ LocalStorage/IndexedDB used

---

## TC-PERF-015: Mobile Performance
**Priority**: P1  
**Precondition**: Real mobile device (mid-range)

### Test Steps
1. Load app on mobile
2. Navigate through pages
3. Measure performance

### Expected Results
- ✅ Initial load: < 4s on 4G
- ✅ Smooth scrolling (60fps)
- ✅ Touch interactions responsive
- ✅ No janky animations
- ✅ Battery usage reasonable

---

## TC-PERF-016: Keyboard Navigation Performance
**Priority**: P2  
**Precondition**: Keyboard-only navigation

### Test Steps
1. Tab through entire page
2. Navigate using keyboard shortcuts
3. Measure responsiveness

### Expected Results
- ✅ Tab order logical
- ✅ Focus indicators clear
- ✅ No focus trap
- ✅ Shortcuts work instantly
- ✅ Accessible throughout

---

## TC-PERF-017: Database Query Performance
**Priority**: P1  
**Precondition**: Backend monitoring

### Test Steps
1. Monitor DB queries during typical usage
2. Identify slow queries
3. Check optimization

### Expected Results
- ✅ All queries < 100ms (p95)
- ✅ Indexes on frequently queried columns
- ✅ N+1 queries eliminated
- ✅ Connection pooling effective
- ✅ Query plan optimized

---

## TC-PERF-018: Third-Party Script Impact
**Priority**: P1  
**Precondition**: Analytics, monitoring scripts

### Test Steps
1. Measure impact of external scripts
2. Check load order
3. Test with/without scripts

### Expected Results
- ✅ Scripts load asynchronously
- ✅ Non-blocking load
- ✅ Total impact < 500ms
- ✅ Can defer non-critical scripts
- ✅ Fallback if scripts fail

---

## TC-PERF-019: Stress Test Transaction Signing
**Priority**: P2  
**Precondition**: Multiple transactions queued

### Test Steps
1. Queue 10 transactions rapidly
2. Sign all in sequence
3. Observe handling

### Expected Results
- ✅ Queue manages properly
- ✅ No race conditions
- ✅ Each transaction completes
- ✅ UI remains responsive
- ✅ Proper error handling

---

## TC-PERF-020: Long-running Operations
**Priority**: P1  
**Precondition**: AI suggestions, backtests

### Test Steps
1. Start 5 long-running jobs simultaneously
2. Navigate between pages
3. Monitor completion

### Expected Results
- ✅ Jobs process independently
- ✅ Polling doesn't overwhelm backend
- ✅ Can cancel jobs if needed
- ✅ Results arrive correctly
- ✅ No memory leaks from polling

---

## TC-PERF-021: Lighthouse Audit (PWA)
**Priority**: P2  
**Precondition**: Production build

### Test Steps
1. Run Lighthouse audit
2. Check all categories
3. Review recommendations

### Expected Results
- ✅ **Performance**: 90+
- ✅ **Accessibility**: 95+
- ✅ **Best Practices**: 95+
- ✅ **SEO**: 90+
- ✅ PWA features (if implemented)

---

## TC-PERF-022: Offline Functionality
**Priority**: P2  
**Precondition**: Service worker (if implemented)

### Test Steps
1. Load app online
2. Go offline
3. Test functionality

### Expected Results
- ✅ Cached pages load
- ✅ Offline indicator shows
- ✅ Read-only access works
- ✅ Writes queue for when online
- ✅ Graceful degradation

---

## TC-PERF-023: CPU Throttling Simulation
**Priority**: P2  
**Precondition**: DevTools CPU throttling

### Test Steps
1. Set CPU throttling to 4x slowdown
2. Perform typical tasks
3. Observe performance

### Expected Results
- ✅ App still usable (slower)
- ✅ No crashes
- ✅ Loading states clear
- ✅ User can complete tasks
- ✅ Optimized for low-end devices

---

## TC-PERF-024: Network Throttling (Slow 3G)
**Priority**: P1  
**Precondition**: DevTools network throttling

### Test Steps
1. Set network to Slow 3G
2. Load app and navigate
3. Measure experience

### Expected Results
- ✅ Progressive loading works
- ✅ Critical content loads first
- ✅ Loading indicators helpful
- ✅ Requests prioritized
- ✅ Usable even on slow network

---

## TC-PERF-025: Performance Monitoring in Production
**Priority**: P1  
**Precondition**: Production environment

### Test Steps
1. Deploy to production
2. Monitor real user metrics (RUM)
3. Set up alerting

### Expected Results
- ✅ Monitoring tool integrated (Sentry, Datadog)
- ✅ Core Web Vitals tracked
- ✅ Error rate monitored
- ✅ Alerts for degradation
- ✅ Performance budgets set
