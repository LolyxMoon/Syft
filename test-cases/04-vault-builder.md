# Test Cases: Vault Builder

## VISUAL BUILDER MODE

### TC-BUILD-001: Initial Builder Load
**Priority**: P0  
**Precondition**: Wallet connected

### Test Steps
1. Navigate to /app/builder
2. Observe initial state

### Expected Results
- ✅ Page title: "Vault Builder" with Box icon
- ✅ 3 mode tabs: Visual, AI Chat, Voice
- ✅ Visual mode selected by default
- ✅ Left sidebar: Block Palette visible
- ✅ Center: Empty canvas with drag hint
- ✅ Right sidebar: Vault Settings + Validation visible
- ✅ Top bar: Name input, History buttons (undo/redo), Load, Save, Deploy

---

### TC-BUILD-002: Block Palette Interaction
**Priority**: P0  
**Precondition**: Visual mode active

### Test Steps
1. View left sidebar block palette
2. Drag "Asset" block to canvas
3. Drag "Condition" block to canvas
4. Drag "Action" block to canvas
5. Connect blocks

### Expected Results
- ✅ Blocks organized by category: Assets, Conditions, Actions
- ✅ Each block has icon and label
- ✅ Dragging shows ghost preview
- ✅ Blocks snap to grid on drop
- ✅ Connection handles appear on blocks
- ✅ Lines connect blocks smoothly
- ✅ Invalid connections prevented

---

### TC-BUILD-003: Asset Block Configuration
**Priority**: P0  
**Precondition**: Asset block on canvas

### Test Steps
1. Click on Asset block
2. Configure asset type (XLM, USDC, CUSTOM)
3. Set allocation percentage
4. Add multiple assets

### Expected Results
- ✅ Asset selector opens
- ✅ Predefined assets: XLM, USDC, BTC, ETH
- ✅ Custom asset input for contract address
- ✅ Allocation slider (0-100%)
- ✅ Multiple assets can be added
- ✅ Total allocation tracked (must = 100%)
- ✅ Warning if allocations don't sum to 100%

---

### TC-BUILD-004: Condition Block Configuration
**Priority**: P0  
**Precondition**: Condition block on canvas

### Test Steps
1. Click Condition block
2. Configure condition type
3. Set parameters

### Expected Results
- ✅ Condition types: Time-based, APY Threshold, Allocation, Price Change
- ✅ **Time-based**: Interval (number) + Unit (minutes/hours/days/weeks)
- ✅ **APY Threshold**: Asset selector, Threshold (%), Operator (>, <, >=, <=)
- ✅ **Allocation**: Asset, Target % deviation threshold
- ✅ **Price Change**: Asset, Percentage change, Direction
- ✅ All inputs validate properly

---

### TC-BUILD-005: Action Block Configuration
**Priority**: P0  
**Precondition**: Action block on canvas

### Test Steps
1. Click Action block
2. Configure action type
3. Set parameters

### Expected Results
- ✅ Action types: Rebalance, Swap, Stake, Provide Liquidity
- ✅ **Rebalance**: Target allocations for all assets
- ✅ **Swap**: From asset, To asset, Amount %
- ✅ **Stake**: Protocol, Amount %, Duration
- ✅ **Provide Liquidity**: Protocol, Asset pair, Amount %
- ✅ All fields required and validated

---

### TC-BUILD-006: Block Connection Rules
**Priority**: P1  
**Precondition**: Multiple blocks on canvas

### Test Steps
1. Try connecting Asset → Condition → Action
2. Try invalid connections

### Expected Results
- ✅ Valid flow: Asset → Condition → Action
- ✅ Cannot connect Action → Asset (wrong direction)
- ✅ Cannot connect Asset → Action (missing condition)
- ✅ Visual feedback for invalid connections (red line/X)
- ✅ Snapping effect for valid connections
- ✅ Can disconnect by clicking connection line

---

### TC-BUILD-007: Undo/Redo Functionality
**Priority**: P1  
**Precondition**: Blocks on canvas

### Test Steps
1. Add 3 blocks
2. Click Undo button
3. Click Undo again
4. Click Redo button

### Expected Results
- ✅ Undo button enabled after changes
- ✅ First undo removes last block
- ✅ Second undo removes second-to-last block
- ✅ Redo button enabled after undo
- ✅ Redo restores blocks in order
- ✅ Undo/Redo keyboard shortcuts work (Ctrl+Z, Ctrl+Y)
- ✅ History preserved across tab switches

---

### TC-BUILD-008: Validation Panel
**Priority**: P0  
**Precondition**: Vault configuration present

### Test Steps
1. Configure vault with errors
2. View validation panel
3. Fix errors
4. Observe validation updates

### Expected Results
- ✅ **Preview tab**: Shows rule summary
- ✅ **Validation tab**: Lists errors and warnings
- ✅ Errors display with red icons and descriptions
- ✅ Warnings display with yellow icons
- ✅ Common errors:
  - "No assets configured"
  - "Asset allocations don't sum to 100%"
  - "No rules defined"
  - "Invalid connection"
- ✅ Validation updates in real-time
- ✅ "Valid" checkmark when all pass

---

### TC-BUILD-009: Strategy Preview
**Priority**: P1  
**Precondition**: Valid vault configured

### Test Steps
1. Switch to "Preview" tab in right sidebar
2. Review generated strategy

### Expected Results
- ✅ Shows readable strategy summary
- ✅ Lists: Assets with allocations
- ✅ Lists: Rules in plain English
- ✅ Example: "When XLM allocation deviates by ±5%, rebalance to 70% XLM, 30% USDC"
- ✅ Easy to understand format

---

### TC-BUILD-010: Save Draft Functionality
**Priority**: P0  
**Precondition**: Vault configuration present

### Test Steps
1. Enter vault name: "Test Vault"
2. Enter description
3. Set visibility (Public/Private)
4. Click "Save Draft"

### Expected Results
- ✅ Vault name required (validation error if empty)
- ✅ Description optional but recommended
- ✅ Public/Private toggle works
- ✅ "Saving..." indicator shows
- ✅ Success toast: "Vault draft saved successfully!"
- ✅ Vault appears in "Load" modal
- ✅ Draft saved to backend with status="draft"

---

### TC-BUILD-011: Load Saved Vault
**Priority**: P0  
**Precondition**: Saved draft exists

### Test Steps
1. Click "Load" button
2. View list of saved vaults
3. Click on a vault
4. Observe canvas

### Expected Results
- ✅ Modal shows list of user's draft vaults
- ✅ Each vault shows: Name, description, created date, status
- ✅ "Load" button on each vault
- ✅ Clicking vault loads it to canvas
- ✅ All blocks and connections restore correctly
- ✅ Vault settings populate (name, description, visibility)
- ✅ Success toast: "Loaded: [Vault Name]"

---

### TC-BUILD-012: Load Template
**Priority**: P1  
**Precondition**: None

### Test Steps
1. Locate "Quick Start Templates" section
2. Click a template (e.g., "Balanced Yield Strategy")

### Expected Results
- ✅ Template loads instantly to canvas
- ✅ Pre-configured blocks with connections
- ✅ Example allocations set
- ✅ Ready-to-deploy configuration
- ✅ User can modify template
- ✅ Available templates:
  - Balanced Yield Strategy
  - Aggressive Growth
  - Conservative Stable

---

### TC-BUILD-013: Deploy Vault (Happy Path)
**Priority**: P0  
**Precondition**: Valid vault configured, wallet funded

### Test Steps
1. Configure valid vault
2. Click "Deploy Vault" button
3. Confirm transaction in wallet
4. Wait for deployment

### Expected Results
- ✅ Validation passes (no errors)
- ✅ "Deploying..." indicator shows with progress
- ✅ Freighter popup opens with transaction
- ✅ Transaction details visible:
  - Contract deployment
  - Initialization
  - Router setup (3 transactions)
- ✅ User signs all transactions
- ✅ Success modal appears with:
  - Vault ID
  - Contract address
  - Transaction hashes
  - "View Vault Details" button
  - "Go to Dashboard" button
- ✅ Vault status changes from "draft" to "active"

---

### TC-BUILD-014: Deploy Vault (Validation Failure)
**Priority**: P1  
**Precondition**: Invalid vault configuration

### Test Steps
1. Create vault with missing assets
2. Click "Deploy Vault"

### Expected Results
- ✅ Deployment blocked
- ✅ Validation tab auto-opens
- ✅ Error toast: "Please fix validation errors before deploying"
- ✅ Errors highlighted in red
- ✅ "Deploy Vault" button disabled or shows warning

---

### TC-BUILD-015: Deploy Vault (User Rejects Transaction)
**Priority**: P1  
**Precondition**: Valid vault, wallet connected

### Test Steps
1. Click "Deploy Vault"
2. Reject transaction in Freighter

### Expected Results
- ✅ Deployment stops
- ✅ "Deploying..." indicator disappears
- ✅ Error toast: "Transaction rejected by user"
- ✅ Vault remains in "draft" status
- ✅ User can retry deployment

---

## AI CHAT MODE

### TC-BUILD-016: Switch to AI Chat Mode
**Priority**: P0  
**Precondition**: Builder page open

### Test Steps
1. Click "AI Chat" tab
2. Observe UI change

### Expected Results
- ✅ Canvas hides
- ✅ Chat interface appears on left
- ✅ Visual preview pane on right
- ✅ Vault settings panel visible
- ✅ Welcome message from AI
- ✅ Input box ready for user message

---

### TC-BUILD-017: Natural Language Vault Creation
**Priority**: P0  
**Precondition**: AI Chat mode active

### Test Steps
1. Type: "Create a balanced vault with 70% XLM and 30% USDC that rebalances when allocation drifts by 5%"
2. Send message
3. Wait for AI response

### Expected Results
- ✅ AI processes request
- ✅ Loading indicator shows
- ✅ AI response explains the vault configuration
- ✅ Visual preview updates with blocks on right side
- ✅ Vault name auto-filled
- ✅ Description auto-generated
- ✅ Ready to deploy

---

### TC-BUILD-018: Apply AI Suggestion from Suggestions Page
**Priority**: P1  
**Precondition**: User navigated from Suggestions page with actionPrompt

### Test Steps
1. Navigate to /app/suggestions
2. Click "Apply Suggestion" on a suggestion
3. Observe Builder behavior

### Expected Results
- ✅ Redirected to /app/builder with mode=chat
- ✅ AI Chat mode auto-selected
- ✅ Suggestion vault auto-loaded into canvas
- ✅ AI pre-fills input with suggestion action prompt
- ✅ User can review and modify suggestion
- ✅ AI explains the suggested changes

---

### TC-BUILD-019: Chat History Persistence
**Priority**: P2  
**Precondition**: AI Chat mode, messages sent

### Test Steps
1. Send 3 messages to AI
2. Switch to Visual mode
3. Switch back to AI Chat mode

### Expected Results
- ✅ Chat history preserved
- ✅ All messages still visible
- ✅ Can continue conversation
- ✅ Visual preview stays in sync

---

### TC-BUILD-020: AI Error Handling
**Priority**: P1  
**Precondition**: AI Chat mode

### Test Steps
1. Send unclear message: "do something"
2. Send impossible request: "create vault with 150% allocation"

### Expected Results
- ✅ AI asks clarifying questions
- ✅ AI explains constraints (allocation = 100%)
- ✅ AI suggests valid alternatives
- ✅ No crashes or blank responses

---

## VOICE MODE

### TC-BUILD-021: Switch to Voice Mode
**Priority**: P1  
**Precondition**: Microphone permission granted

### Test Steps
1. Click "Voice" tab
2. Observe UI

### Expected Results
- ✅ Voice interface appears
- ✅ Microphone icon visible
- ✅ "Click to speak" instruction
- ✅ Visual preview pane on right
- ✅ Browser requests mic permission (first time)

---

### TC-BUILD-022: Voice Vault Creation
**Priority**: P1  
**Precondition**: Voice mode active, mic allowed

### Test Steps
1. Click microphone button
2. Speak: "Create a vault with 60% XLM and 40% USDC"
3. Stop recording

### Expected Results
- ✅ Recording indicator shows
- ✅ Audio waveform visualizes voice
- ✅ Voice transcribed to text
- ✅ AI processes voice command
- ✅ Response played via text-to-speech
- ✅ Visual preview updates
- ✅ Vault configuration applied

---

### TC-BUILD-023: Voice Mode Error Handling
**Priority**: P2  
**Precondition**: Voice mode active

### Test Steps
1. Deny microphone permission
2. Try to use voice mode

### Expected Results
- ✅ Error message: "Microphone access denied"
- ✅ Instructions to enable mic in browser
- ✅ Fallback to text input available

---

## CROSS-MODE TESTS

### TC-BUILD-024: Mode Switching Preserves State
**Priority**: P1  
**Precondition**: Vault partially configured

### Test Steps
1. Create vault in Visual mode with 2 assets
2. Switch to AI Chat mode
3. Switch to Voice mode
4. Switch back to Visual mode

### Expected Results
- ✅ Vault configuration persists across modes
- ✅ Blocks remain on canvas
- ✅ Settings (name, description) preserved
- ✅ No data loss during switches

---

### TC-BUILD-025: Yield Opportunities Tab
**Priority**: P1  
**Precondition**: Asset block added

### Test Steps
1. Add XLM asset to vault
2. Click "Yields" tab in right sidebar
3. View yield opportunities

### Expected Results
- ✅ Shows yields for XLM across protocols
- ✅ Displays: Soroswap, Mock Pools, Manual
- ✅ APY percentages visible
- ✅ Updates in real-time
- ✅ Helps user make informed decisions

---

### TC-BUILD-026: Custom Token Warning
**Priority**: P1  
**Precondition**: Custom token added

### Test Steps
1. Add custom token by contract address
2. Observe warning banner

### Expected Results
- ✅ Yellow warning banner appears below header
- ✅ Message: "Custom tokens are available for demonstration purposes only..."
- ✅ Explains testnet limitations
- ✅ User can still proceed with deployment
