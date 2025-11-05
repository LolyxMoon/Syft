# Test Cases: End-to-End User Journeys

## TC-E2E-001: Complete Onboarding Flow
**Priority**: P0  
**Precondition**: New user, Freighter installed

### Test Steps
1. Visit landing page
2. Click "Start Building"
3. Connect Freighter wallet
4. View dashboard (empty state)
5. Navigate to vault builder
6. Create first vault (visual or AI)
7. Deploy vault
8. Make initial deposit
9. View vault in vaults list
10. Check dashboard updates

### Expected Results
- ✅ Smooth flow with no errors
- ✅ Clear guidance at each step
- ✅ All pages load correctly
- ✅ Wallet integration seamless
- ✅ Vault deploys successfully
- ✅ Deposit confirms
- ✅ Dashboard reflects new vault
- ✅ User understands platform

---

## TC-E2E-002: Create, Deploy, and Manage Vault
**Priority**: P0  
**Precondition**: Wallet connected and funded

### Test Steps
1. Navigate to builder
2. Create vault with 2 assets (70% XLM, 30% USDC)
3. Add rebalance rule (±5% drift)
4. Save draft
5. Load draft
6. Deploy vault
7. Deposit 1000 XLM
8. Wait for rebalance trigger
9. View transaction history
10. Withdraw 500 XLM

### Expected Results
- ✅ Builder works flawlessly
- ✅ Vault deploys with correct config
- ✅ Deposit successful
- ✅ Auto-rebalance triggers correctly
- ✅ History shows all transactions
- ✅ Withdrawal successful
- ✅ Balances accurate throughout

---

## TC-E2E-003: Subscribe to Vault NFT Journey
**Priority**: P1  
**Precondition**: Marketplace has listings

### Test Steps
1. Browse marketplace
2. Filter by profit share >50%
3. View NFT details
4. Purchase NFT
5. Navigate to vault details
6. Deposit into vault
7. Monitor performance
8. Receive profit distributions
9. Withdraw after profit
10. List NFT for resale

### Expected Results
- ✅ Marketplace browsing smooth
- ✅ NFT purchase successful
- ✅ Vault accessible after purchase
- ✅ Deposits work
- ✅ Profit tracking accurate
- ✅ Distributions claimed
- ✅ Withdrawal successful
- ✅ NFT re-listing works

---

## TC-E2E-004: AI-Powered Vault Creation & Optimization
**Priority**: P1  
**Precondition**: Wallet connected

### Test Steps
1. Open AI Chat builder
2. Describe strategy: "Balanced portfolio with daily rebalancing"
3. AI generates vault
4. Deploy AI-generated vault
5. Wait 7 days (or simulate)
6. Navigate to Suggestions
7. Generate AI suggestions
8. Apply suggestion to vault
9. Deploy updated vault
10. Compare performance

### Expected Results
- ✅ AI understands natural language
- ✅ Generated vault makes sense
- ✅ Deployment successful
- ✅ Suggestions are relevant
- ✅ Applying suggestion works
- ✅ Updated vault deploys
- ✅ Performance improves

---

## TC-E2E-005: Backtesting Before Deployment
**Priority**: P1  
**Precondition**: Wallet connected

### Test Steps
1. Create vault strategy in builder
2. Before deploying, navigate to Backtests
3. Configure backtest (30 days, 1000 XLM initial)
4. Run backtest
5. Review results (Sharpe ratio, drawdown)
6. If good, deploy vault
7. If bad, go back to builder and modify
8. Re-run backtest
9. Deploy when satisfied

### Expected Results
- ✅ Backtesting provides insights
- ✅ Results help decision-making
- ✅ Can iterate on strategy
- ✅ Final deployment successful
- ✅ Real performance tracks backtest

---

## TC-E2E-006: Quest Completion Journey
**Priority**: P1  
**Precondition**: New user

### Test Steps
1. Navigate to Quests
2. Start "Beginner" quest: "Connect Wallet" (already done)
3. Start "View Dashboard" quest
4. Complete by viewing dashboard
5. Claim NFT reward
6. Start "Create Your First Vault" quest
7. Complete by deploying vault
8. Claim second NFT
9. View NFT gallery
10. Check completion stats

### Expected Results
- ✅ Quests guide user through platform
- ✅ Each quest validates correctly
- ✅ NFT claiming works
- ✅ Gallery displays NFTs
- ✅ Stats accurate
- ✅ User learns platform features

---

## TC-E2E-007: Multi-Network Vault Management
**Priority**: P1  
**Precondition**: Wallet supports Testnet and Futurenet

### Test Steps
1. Connect to Testnet
2. Create and deploy vault on Testnet
3. Switch to Futurenet
4. Create and deploy vault on Futurenet
5. Switch back to Testnet
6. View Testnet vault (should see it)
7. Switch to Futurenet again
8. View Futurenet vault (should see it)
9. Check dashboard on each network

### Expected Results
- ✅ Network switching works seamlessly
- ✅ Vaults isolated per network
- ✅ No cross-contamination
- ✅ Dashboard shows correct network data
- ✅ All transactions on correct network

---

## TC-E2E-008: Terminal-Assisted Vault Setup
**Priority**: P1  
**Precondition**: Wallet connected

### Test Steps
1. Navigate to Terminal
2. Ask: "What's my balance?"
3. Ask: "Fund my account" (testnet)
4. Ask: "Create a balanced vault"
5. AI guides through setup
6. Deploy via terminal commands
7. Ask: "Add 500 XLM to my new vault"
8. Complete deposit via terminal
9. Ask: "Show my vault performance"
10. View analytics

### Expected Results
- ✅ Terminal understands requests
- ✅ Provides helpful guidance
- ✅ Vault created successfully
- ✅ Deposits work via terminal
- ✅ Analytics accurate
- ✅ Natural language interaction smooth

---

## TC-E2E-009: Portfolio Diversification Workflow
**Priority**: P1  
**Precondition**: User has one vault

### Test Steps
1. View Analytics page (1 vault)
2. Notice high concentration in XLM
3. Navigate to Suggestions
4. AI suggests diversification
5. Create second vault with different assets
6. Deploy second vault
7. Deposit into second vault
8. View Analytics again
9. Observe improved diversification
10. Check risk metrics

### Expected Results
- ✅ Analytics show concentration risk
- ✅ AI identifies diversification need
- ✅ Second vault creation smooth
- ✅ Analytics update with two vaults
- ✅ Portfolio more balanced
- ✅ Risk metrics improve

---

## TC-E2E-010: Voice-to-Vault Complete Flow
**Priority**: P2  
**Precondition**: Microphone permission granted

### Test Steps
1. Navigate to Builder
2. Switch to Voice mode
3. Say: "Create a vault with sixty percent XLM and forty percent USDC"
4. AI transcribes and processes
5. Review generated vault
6. Say: "Add a rebalance rule when drift exceeds five percent"
7. AI adds rule
8. Say: "Deploy this vault"
9. Confirm in UI
10. Sign transaction

### Expected Results
- ✅ Voice recognition accurate
- ✅ AI understands spoken commands
- ✅ Vault configured correctly
- ✅ Deployment works via voice
- ✅ Fallback to UI for sensitive actions
- ✅ Overall experience natural

---

## TC-E2E-011: Vault Performance Monitoring
**Priority**: P1  
**Precondition**: Vault active for 7+ days

### Test Steps
1. View Dashboard (overview)
2. Navigate to specific Vault Detail
3. Review performance chart (7d)
4. Check transaction history
5. Navigate to Analytics
6. Expand vault for detailed metrics
7. Compare with other vaults
8. Navigate to Backtests
9. Backtest similar strategy
10. Compare backtest vs actual

### Expected Results
- ✅ All performance data consistent
- ✅ Charts accurate
- ✅ History complete
- ✅ Analytics detailed
- ✅ Comparison helpful
- ✅ Backtest aligns with reality

---

## TC-E2E-012: Vault Upgrade Workflow
**Priority**: P1  
**Precondition**: Active vault, new strategy idea

### Test Steps
1. View existing vault
2. Navigate to Suggestions
3. AI suggests optimization
4. Review suggestion details
5. Apply suggestion → redirects to Builder
6. Vault loads in AI Chat mode
7. AI pre-fills changes
8. Review and modify if needed
9. Deploy updated vault (new version)
10. Old vault archives, new vault active

### Expected Results
- ✅ Suggestion flow seamless
- ✅ Builder loads existing vault
- ✅ Changes clearly explained
- ✅ Deployment creates new version
- ✅ Migration handled (if applicable)
- ✅ No fund loss

---

## TC-E2E-013: Collaborative Vault Sharing
**Priority**: P2  
**Precondition**: Two users with wallets

### Test Steps
1. User A creates high-performing vault
2. User A lists vault NFT on marketplace
3. User B browses marketplace
4. User B purchases User A's vault NFT
5. User B deposits into vault
6. Both users earn from vault
7. User A receives profit share
8. User B receives yield
9. User B later sells NFT to User C
10. Ownership transfers smoothly

### Expected Results
- ✅ NFT listing works
- ✅ Marketplace facilitates discovery
- ✅ Purchase transfers ownership
- ✅ Both users benefit financially
- ✅ Profit sharing accurate
- ✅ NFT re-sale works
- ✅ Ownership chain clear

---

## TC-E2E-014: Risk Assessment & Adjustment
**Priority**: P1  
**Precondition**: Vault with high volatility

### Test Steps
1. Create aggressive vault (100% volatile asset)
2. Deploy and deposit
3. Monitor for 3 days
4. View Analytics → Risk Metrics
5. Notice high volatility, low Sharpe ratio
6. Navigate to Suggestions
7. AI suggests risk adjustment
8. Apply suggestion (add stable assets)
9. Deploy updated vault
10. Monitor improved risk metrics

### Expected Results
- ✅ Risk metrics accurately calculated
- ✅ High risk identified
- ✅ AI suggests mitigation
- ✅ Adjustment implemented
- ✅ Metrics improve after adjustment
- ✅ User learns risk management

---

## TC-E2E-015: Full Platform Tour (All Features)
**Priority**: P2  
**Precondition**: Fresh user

### Test Steps
1. Landing page → Learn about platform
2. Connect wallet
3. Dashboard → See empty state
4. Builder → Create vault (Visual + AI + Voice)
5. Vaults → Manage deployed vaults
6. Marketplace → Browse and purchase NFT
7. Analytics → Deep dive into performance
8. Backtests → Test strategies
9. Suggestions → Get AI optimization
10. Quests → Complete challenges
11. Terminal → Use AI assistant

### Expected Results
- ✅ Every page loads correctly
- ✅ All features functional
- ✅ Navigation intuitive
- ✅ No errors or dead ends
- ✅ User completes full tour
- ✅ User understands all capabilities
- ✅ Platform cohesive and polished
