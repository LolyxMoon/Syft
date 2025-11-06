# Test Cases: AI Terminal Assistant

## TC-TERMINAL-001: Terminal Page Load
**Priority**: P0  
**Precondition**: Wallet connected

### Test Steps
1. Navigate to /app/terminal
2. Observe interface

### Expected Results
- ✅ Page title: "AI Terminal" with Terminal icon
- ✅ ChatGPT-style interface
- ✅ Welcome message from AI
- ✅ Message input box at bottom
- ✅ Send button (paper plane icon)
- ✅ Empty chat history initially
- ✅ "Powered by AI" indicator

---

## TC-TERMINAL-002: Welcome Message
**Priority**: P1  
**Precondition**: Terminal loaded

### Test Steps
1. View welcome message
2. Connect/disconnect wallet
3. Observe message changes

### Expected Results
- ✅ **Wallet connected**: "Hello! I'm your AI blockchain assistant. I can help you manage assets, deploy contracts, analyze transactions, and more on Stellar."
- ✅ **Wallet not connected**: "Please connect your wallet to interact with the blockchain."
- ✅ Message updates dynamically based on wallet state
- ✅ Helpful quick actions suggested

---

## TC-TERMINAL-003: Send Chat Message
**Priority**: P0  
**Precondition**: Terminal open

### Test Steps
1. Type: "What can you help me with?"
2. Click Send or press Enter
3. Wait for response

### Expected Results
- ✅ Message appears in chat as user message
- ✅ Loading indicator shows (typing animation)
- ✅ AI response appears below
- ✅ Response explains capabilities
- ✅ Smooth scroll to latest message
- ✅ Input clears after sending

---

## TC-TERMINAL-004: Chat Persistence
**Priority**: P1  
**Precondition**: Chat messages sent

### Test Steps
1. Send 5 messages
2. Navigate away from terminal
3. Return to terminal
4. Refresh page

### Expected Results
- ✅ All messages persist (localStorage)
- ✅ Chat history loads on return
- ✅ SessionId maintained
- ✅ Messages in correct order
- ✅ No duplicates

---

## TC-TERMINAL-005: Check Wallet Balance
**Priority**: P0  
**Precondition**: Wallet connected

### Test Steps
1. Type: "What's my XLM balance?"
2. Send message
3. Wait for response

### Expected Results
- ✅ AI processes request
- ✅ Backend calls function: getBalance
- ✅ Response shows:
  - XLM balance
  - USD equivalent
  - Other assets (if any)
- ✅ Formatted clearly
- ✅ Real-time data

---

## TC-TERMINAL-006: Fund from Faucet
**Priority**: P1  
**Precondition**: Testnet/Futurenet connected

### Test Steps
1. Type: "Fund my account from faucet"
2. Wait for processing

### Expected Results
- ✅ AI calls Friendbot
- ✅ Success message: "10,000 XLM funded!"
- ✅ Balance updates
- ✅ Transaction hash provided
- ✅ Only works on test networks

---

## TC-TERMINAL-007: Create Asset (Happy Path)
**Priority**: P0  
**Precondition**: Wallet funded

### Test Steps
1. Type: "Create a token called GOLD with code GOLD"
2. Sign transaction when prompted
3. Wait for confirmation

### Expected Results
- ✅ AI generates create asset command
- ✅ TerminalActionCard appears with transaction details
- ✅ "Sign Transaction" button
- ✅ Freighter opens for signature
- ✅ User signs transaction
- ✅ Transaction submits
- ✅ Success message: "Asset GOLD created!"
- ✅ Asset issuer address shown

---

## TC-TERMINAL-008: Transfer Asset
**Priority**: P0  
**Precondition**: User has assets

### Test Steps
1. Type: "Send 100 XLM to GB7X...4Y2A"
2. Confirm transaction

### Expected Results
- ✅ AI validates address format
- ✅ Action card with transfer details
- ✅ Shows: Amount, Recipient, Fee
- ✅ User signs transaction
- ✅ Success: "100 XLM sent successfully!"
- ✅ Transaction hash link

---

## TC-TERMINAL-009: Setup Trustline
**Priority**: P1  
**Precondition**: Wallet funded

### Test Steps
1. Type: "Add trustline for USDC"
2. Sign transaction

### Expected Results
- ✅ AI identifies USDC contract
- ✅ Action card for trustline setup
- ✅ Explains what trustline does
- ✅ User signs
- ✅ Success: "Trustline added for USDC"
- ✅ Can now receive USDC

---

## TC-TERMINAL-010: Deploy Smart Contract (Complete Flow with File Upload)
**Priority**: P1  
**Precondition**: Contract WASM file available (.wasm file - optimized or unoptimized)

### Test Steps
1. Click the WASM upload button (file icon with upload arrow) next to the message input
2. Select a `.wasm` file from your computer (can be unoptimized)
3. System automatically validates and optimizes the WASM
4. Sign installation transaction in Freighter popup
5. Wait for WASM installation confirmation with hash
6. Type: "Deploy a contract with WASM hash [hash_from_step_5]"
7. Sign deployment transaction in Freighter popup

### Expected Results - Upload & Validation Phase
- ✅ File picker opens accepting only .wasm files
- ✅ Upload progress message appears: "📤 Uploading [filename] (X.XX KB)..."
- ✅ System validates WASM format (checks magic number, version)
- ✅ Invalid WASMs show clear error: "❌ Invalid WASM file: Missing magic number..."
- ✅ File validation passes: "✅ WASM validation passed"

### Expected Results - Auto-Optimization Phase
- ✅ System automatically optimizes WASM: "🔧 Optimizing WASM for Soroban..."
- ✅ Tries stellar-cli first, falls back to wasm-opt if unavailable
- ✅ Shows optimization results: "Original: X KB → Optimized: Y KB (Z% reduction)"
- ✅ If already optimized: "Already optimized" message shown
- ✅ If optimization unavailable: Uses original with warning

### Expected Results - Installation Phase
- ✅ AI shows installation action card with optimized WASM details
- ✅ Action card shows: 
  - Original size vs final size
  - Optimization method used (stellar-cli/wasm-opt/none)
  - Uploader address, network, estimated fee
- ✅ User signs transaction via Freighter
- ✅ WASM uploaded to Stellar network
- ✅ WASM hash returned and displayed
- ✅ Success message: "✅ WASM Installed Successfully! WASM Hash: `[hash]`"
- ✅ Shows optimization stats in success message

### Expected Results - Deployment Phase
- ✅ User can copy WASM hash or use it in chat
- ✅ AI processes deploy command with hash
- ✅ Action card with deployment details
- ✅ Shows: WASM hash (truncated), deployer, network, fee
- ✅ User signs deployment via Freighter
- ✅ Contract deployed successfully
- ✅ Contract ID returned
- ✅ Success message with Contract ID and Stellar Expert link
- ✅ Link to view transaction on Stellar Expert

### Alternative Flow (Hash Already Known)
1. Type: "Deploy a contract with WASM hash [existing_hash]"
2. Sign deployment transaction
3. Get Contract ID immediately

### Error Handling
- ✅ Invalid file type shows error: "❌ Please upload a valid .wasm file"
- ✅ Corrupted WASM shows: "❌ Invalid WASM file: Missing magic number. File may be corrupted."
- ✅ Wrong WASM version shows: "❌ Unsupported WASM version: X. Expected version 1."
- ✅ Wallet not connected shows: "❌ Wallet must be connected to upload WASM"
- ✅ Upload failure shows clear error message with retry option
- ✅ Deployment with invalid hash shows: "❌ Invalid WASM hash or WASM not found"
- ✅ Parsing errors from network show helpful messages with troubleshooting steps

### Optimization Scenarios
**Scenario 1: Unoptimized WASM (>200KB with debug info)**
- System detects unoptimized state
- Runs stellar contract optimize
- Shows significant size reduction (typically 30-70%)
- User sees: "🔧 Optimized: 450 KB → 120 KB (73% reduction using stellar-cli)"

**Scenario 2: Already Optimized WASM (<100KB, no debug)**
- System detects optimization not needed
- Skips optimization step
- User sees: "Already optimized"
- Proceeds directly to installation

**Scenario 3: Optimization Tools Unavailable**
- stellar-cli not installed or fails
- wasm-opt not available or fails
- System falls back to original WASM with warning
- User sees: "⚠️ Optimization unavailable - using original"
- Installation still proceeds if WASM is valid

---

## TC-TERMINAL-011: Invoke Contract Function
**Priority**: P1  
**Precondition**: Contract deployed

### Test Steps
1. Type: "Call function 'transfer' on contract [CONTRACT_ID] with params [...]"
2. Sign transaction

### Expected Results
- ✅ AI parses function name and params
- ✅ Builds invocation transaction
- ✅ Action card shows function call details
- ✅ User signs
- ✅ Function executes
- ✅ Return value displayed
- ✅ Success or error message

---

## TC-TERMINAL-012: Swap Assets via DEX
**Priority**: P1  
**Precondition**: Assets in wallet

### Test Steps
1. Type: "Swap 50 XLM for USDC on Soroswap"
2. Confirm swap

### Expected Results
- ✅ AI finds best swap route
- ✅ Shows exchange rate
- ✅ Calculates slippage
- ✅ Action card with swap details
- ✅ User confirms and signs
- ✅ Swap executes
- ✅ Success: "Swapped 50 XLM → X USDC"

---

## TC-TERMINAL-013: Add Liquidity to Pool
**Priority**: P2  
**Precondition**: Wallet has pair assets

### Test Steps
1. Type: "Add 100 XLM and 100 USDC to liquidity pool"
2. Confirm transaction

### Expected Results
- ✅ AI identifies pool
- ✅ Calculates LP tokens to receive
- ✅ Action card with details
- ✅ User signs
- ✅ Liquidity added
- ✅ LP tokens received
- ✅ Success message

---

## TC-TERMINAL-014: Mint NFT with AI Art
**Priority**: P1  
**Precondition**: NFT contract available

### Test Steps
1. Type: "Mint an NFT with AI art showing a cosmic nebula"
2. Wait for AI art generation
3. Confirm minting

### Expected Results
- ✅ AI generates image based on prompt
- ✅ Image preview shown
- ✅ Metadata prepared
- ✅ Action card to mint NFT
- ✅ User signs
- ✅ NFT minted
- ✅ Token ID and image URL returned

---

## TC-TERMINAL-015: Query Transaction History
**Priority**: P1  
**Precondition**: Account has transactions

### Test Steps
1. Type: "Show my last 10 transactions"
2. View results

### Expected Results
- ✅ AI fetches transaction history
- ✅ Table or list format:
  - Date/Time
  - Type (Payment, Create, etc.)
  - Amount
  - Status
  - Hash (truncated, clickable)
- ✅ Links to Stellar Expert
- ✅ Can request more: "Show next 10"

---

## TC-TERMINAL-016: Get Network Stats
**Priority**: P2  
**Precondition**: None

### Test Steps
1. Type: "What are the current network stats?"
2. View response

### Expected Results
- ✅ AI fetches Stellar network data
- ✅ Shows:
  - Current ledger
  - Transaction count
  - Average fee
  - Network status
  - Protocol version
- ✅ Formatted clearly

---

## TC-TERMINAL-017: Price Oracle Query
**Priority**: P2  
**Precondition**: Price data available

### Test Steps
1. Type: "What's the current price of XLM?"
2. View response

### Expected Results
- ✅ AI fetches price data
- ✅ Shows: XLM price in USD
- ✅ 24h change percentage
- ✅ Market cap (optional)
- ✅ Source noted (e.g., CoinGecko)

---

## TC-TERMINAL-018: Error Handling
**Priority**: P1  
**Precondition**: Various error conditions

### Test Steps
1. Send invalid command
2. Try transaction with insufficient balance
3. Use malformed address

### Expected Results
- ✅ AI explains error clearly
- ✅ "I don't understand. Did you mean...?"
- ✅ "Insufficient balance. You have X but need Y"
- ✅ "Invalid address format. Please check and try again"
- ✅ Helpful suggestions provided
- ✅ No crashes

---

## TC-TERMINAL-019: Job Polling for Async Operations
**Priority**: P1  
**Precondition**: Long-running command

### Test Steps
1. Send command that creates backend job
2. Observe polling behavior

### Expected Results
- ✅ Job ID created
- ✅ Polling starts (every 500ms)
- ✅ Max timeout: 10 minutes (1200 attempts)
- ✅ Status updates: pending → running → completed
- ✅ Loading message or progress bar
- ✅ Result renders when complete
- ✅ Timeout error if exceeds limit

---

## TC-TERMINAL-020: Transaction Action Cards
**Priority**: P0  
**Precondition**: Transaction command sent

### Test Steps
1. Send command requiring signature
2. View action card
3. Sign transaction

### Expected Results
- ✅ TerminalActionCard renders below AI message
- ✅ Card shows:
  - Transaction type
  - Operation details
  - Estimated fee
  - "Sign Transaction" button
  - "Cancel" button
- ✅ Sign button triggers Freighter
- ✅ After signing: "Signing..." → "Submitted" → "Confirmed"
- ✅ Success checkmark or error icon
- ✅ Transaction hash link

---

## TC-TERMINAL-021: Clear Chat History
**Priority**: P2  
**Precondition**: Chat messages exist

### Test Steps
1. Send multiple messages
2. Click "Clear Chat" button (if available)
3. Confirm action

### Expected Results
- ✅ Confirmation modal: "Clear all messages?"
- ✅ User confirms
- ✅ All messages removed
- ✅ Welcome message reappears
- ✅ SessionId resets
- ✅ LocalStorage cleared

---

## TC-TERMINAL-022: Copy Message Content
**Priority**: P2  
**Precondition**: Messages in chat

### Test Steps
1. Hover over AI response
2. Click "Copy" icon
3. Paste elsewhere

### Expected Results
- ✅ Copy button appears on hover
- ✅ Clicking copies message text
- ✅ Toast: "Copied to clipboard!"
- ✅ Text preserves formatting

---

## TC-TERMINAL-023: Multi-turn Conversations
**Priority**: P1  
**Precondition**: Terminal open

### Test Steps
1. Type: "Create a token"
2. AI asks: "What should we name it?"
3. Reply: "DIAMOND"
4. Continue conversation

### Expected Results
- ✅ AI maintains context across messages
- ✅ Remembers previous requests
- ✅ Can ask follow-up questions
- ✅ Natural conversation flow
- ✅ SessionId tracks conversation

---

## TC-TERMINAL-024: Batch Operations
**Priority**: P2  
**Precondition**: Wallet funded

### Test Steps
1. Type: "Send 10 XLM to 5 different addresses: [list]"
2. Confirm batch transaction

### Expected Results
- ✅ AI parses multiple operations
- ✅ Builds batch transaction
- ✅ Shows all operations in action card
- ✅ Single signature for all
- ✅ All operations execute
- ✅ Summary of results

---

## TC-TERMINAL-025: Mobile Terminal View
**Priority**: P1  
**Precondition**: Mobile device

### Test Steps
1. Open terminal on mobile
2. Send messages
3. Sign transactions

### Expected Results
- ✅ Chat interface full-width
- ✅ Messages stack properly
- ✅ Input fixed at bottom
- ✅ Keyboard doesn't obscure input
- ✅ Action cards responsive
- ✅ Freighter integration works
- ✅ Smooth scrolling

---

## TC-TERMINAL-026: Terminal Performance
**Priority**: P2  
**Precondition**: Long conversation (50+ messages)

### Test Steps
1. Send 50+ messages
2. Scroll through history
3. Continue chatting

### Expected Results
- ✅ Smooth scrolling (60fps)
- ✅ No lag typing or sending
- ✅ Virtual scrolling for many messages
- ✅ Memory usage reasonable
- ✅ No slowdown over time

---

## TC-TERMINAL-027: Markdown Rendering
**Priority**: P2  
**Precondition**: AI responds with formatted text

### Test Steps
1. Ask: "Explain how trustlines work"
2. View response

### Expected Results
- ✅ Markdown rendered: **bold**, *italic*, `code`
- ✅ Lists formatted properly
- ✅ Code blocks syntax highlighted
- ✅ Links clickable
- ✅ Headers styled appropriately

---

## TC-TERMINAL-028: Rate Limiting
**Priority**: P2  
**Precondition**: Many requests sent

### Test Steps
1. Send 20 messages rapidly
2. Observe behavior

### Expected Results
- ✅ Rate limit warning if exceeded
- ✅ Message: "Please wait X seconds"
- ✅ Send button disabled temporarily
- ✅ Countdown shown
- ✅ Re-enables after cooldown

---

## TC-TERMINAL-029: Network Offline Handling
**Priority**: P1  
**Precondition**: No internet

### Test Steps
1. Disconnect internet
2. Try sending message
3. Reconnect

### Expected Results
- ✅ Error: "Network error. Check your connection"
- ✅ Message not sent
- ✅ Retry button available
- ✅ After reconnect, can retry
- ✅ Message queue preserved

---

## TC-TERMINAL-030: Function Calling Examples
**Priority**: P1  
**Precondition**: AI documentation

### Test Steps
1. Test all documented functions
2. Verify each works correctly

### Expected Results
- ✅ All functions callable via natural language
- ✅ Functions tested:
  - getBalance
  - fundFromFaucet
  - createAsset
  - transfer
  - setupTrustline
  - deployContract
  - invokeContract
  - swap
  - addLiquidity
  - mintNFT
  - transferNFT
  - burnNFT
  - listNFT
  - getTransactionHistory
  - getNetworkStats
  - getPriceOracle
- ✅ Each returns expected result
