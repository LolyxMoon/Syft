<div align="center">

# 🌟 Syft

### Build Smarter Vaults on Stellar

**Create, deploy, and manage automated yield strategies. No coding required. Maximum security. Optimal returns.**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Stellar](https://img.shields.io/badge/Built%20on-Stellar-7D4698?logo=stellar)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Powered%20by-Soroban-7D4698)](https://soroban.stellar.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-2021-orange?logo=rust)](https://www.rust-lang.org/)

[Live Demo](https://syft-defi.vercel.app) · [Documentation](./docs) · [Report Bug](https://github.com/zaikaman/Syft/issues) · [Request Feature](https://github.com/zaikaman/Syft/issues)

</div>

---

## 📖 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Getting Started](#-getting-started)
- [📱 Platform Features](#-platform-features)
  - [🎨 Vault Builder](#-vault-builder)
  - [📊 Dashboard](#-dashboard)
  - [🏪 NFT Marketplace](#-nft-marketplace)
  - [📈 Analytics](#-analytics)
  - [🧪 Backtesting](#-backtesting)
  - [💡 AI Suggestions](#-ai-suggestions)
  - [💻 Terminal AI](#-terminal-ai)
- [🛠️ Technology Stack](#️-technology-stack)
- [📦 Smart Contracts](#-smart-contracts)
- [🤖 AI-Powered Features](#-ai-powered-features)
- [🔐 Security](#-security)
- [🌐 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Overview

**Syft** is a next-generation DeFi platform built on Stellar that revolutionizes yield vault creation and management. With three intuitive ways to build strategies—visual drag-and-drop, AI chat, and voice commands—Syft empowers users to create sophisticated DeFi strategies without writing a single line of code.

### Why Syft?

- **🎨 Three Ways to Build**: Visual canvas, AI chat, or voice commands
- **🤖 GPT-5 Nano Powered**: Advanced AI model (gpt-5-nano-2025-08-07) for intelligent strategy creation
- **🖼️ NFT Marketplace**: Monetize your strategies by minting and selling vault NFTs
- **📊 Comprehensive Analytics**: Real-time monitoring, backtesting, and performance tracking
- **🔒 Non-Custodial**: You maintain full control of your assets
- **⚡ Automated Rebalancing**: Smart rules trigger automatic portfolio optimization
- **💰 Passive Income**: Subscribe to top-performing vaults or earn from your own strategies

---

## 🎯 Key Features

### For Strategy Creators

- **Visual Strategy Builder**: Drag-and-drop interface for building complex yield strategies
- **AI-Powered Creation**: Chat with AI or use voice commands to create strategies naturally
- **Vault NFT Minting**: Convert your vaults into tradeable NFTs with AI-generated artwork
- **Revenue Sharing**: Earn passive income from subscribers (e.g., 5% profit share)
- **Real-time Monitoring**: Track performance, TVL, APY, and user positions
- **Advanced Analytics**: Deep insights into vault performance and risk metrics
- **Backtesting Engine**: Test strategies against historical data before deployment

### For Vault Subscribers

- **Discover Top Strategies**: Browse the marketplace for high-performing vaults
- **Subscribe & Earn**: Deposit funds and earn automated yields
- **Transparent Performance**: View detailed analytics and historical returns
- **Easy Management**: Monitor all positions from a unified dashboard
- **NFT Ownership**: Purchase vault NFTs to gain access to exclusive strategies

### For Developers

- **Soroban Smart Contracts**: Secure, audited Rust contracts on Stellar
- **Comprehensive APIs**: RESTful backend for all platform operations
- **WebSocket Support**: Real-time updates for prices, rebalances, and vault states
- **Extensible Architecture**: Modular design for easy feature additions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
│  ┌──────────────┬──────────────┬──────────────────────┐     │
│  │ Vault Builder │  Dashboard   │  Marketplace        │     │
│  │ Analytics     │  Backtesting │  AI Suggestions     │     │
│  │ Terminal AI   │  Voice UI    │  NFT Management     │     │
│  └──────────────┴──────────────┴──────────────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js/Express)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes │ WebSocket │ AI Services │ Monitoring   │   │
│  │  • Vaults   │ • Prices  │ • OpenAI    │ • Sync       │   │
│  │  • Terminal │ • Events  │ • Runware   │ • Rules      │   │
│  │  • NFTs     │ • Updates │ • Tavily    │ • Yields     │   │ 
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Supabase   │   │   Stellar    │   │  External    │
│  (Database)  │   │   Network    │   │   APIs       │
│              │   │              │   │              │
│  • Users     │   │  • Soroban   │   │  • Runware   │
│  • Vaults    │   │  • Testnet   │   │  • Tavily    │
│  • NFTs      │   │  • Futurenet │   │  • Protocols │
│  • Analytics │   │  • Mainnet   │   │  • Oracles   │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Rust** (for smart contracts)
- **Stellar CLI** (for contract deployment)
- **Freighter Wallet** (browser extension)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zaikaman/Syft.git
   cd Syft
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**

   **Backend (.env)**
   ```env
   # Server
   PORT=3001
   NODE_ENV=development
   
   # Stellar Network
   STELLAR_NETWORK=testnet
   STELLAR_RPC_URL=https://soroban-testnet.stellar.org
   STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   
   # Database
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Runware (AI Image Generation)
   RUNWARE_API_KEY=your_runware_api_key
   
   # Tavily (Web Search)
   TAVILY_API_KEY=your_tavily_api_key
   
   # Mode
   MVP_MODE=false  # Set to true for simulation mode
   ```

   **Frontend (.env)**
   ```env
   VITE_PUBLIC_BACKEND_URL=http://localhost:3001
   VITE_STELLAR_NETWORK=testnet
   ```

4. **Build and deploy smart contracts**
   ```bash
   # Build all contracts
   stellar contract build
   
   # Deploy to testnet (example)
   ./deploy-contracts.ps1
   ```

5. **Start the development servers**

   **Terminal 1 - Backend**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

### Quick Start Guide

1. **Connect Wallet**: Click the wallet button in the top-right corner
2. **Create a Vault**: Navigate to Vault Builder and choose your preferred method:
   - 🎨 **Visual**: Drag and drop blocks on the canvas
   - 💬 **AI Chat**: Describe your strategy in natural language
   - 🎤 **Voice**: Talk to create your vault hands-free
3. **Configure Strategy**: Set allocation percentages, rebalancing rules, and risk parameters
4. **Deploy**: Save and deploy your vault to the Stellar network
5. **Monitor**: Track performance from the Dashboard
6. **Monetize**: Mint your vault as an NFT and list it on the marketplace

---

## 📱 Platform Features

### 🎨 Vault Builder

The heart of Syft—where strategies come to life.

**Three Modes of Creation:**

1. **Visual Builder** 🖼️
   - Drag-and-drop block-based interface
   - Real-time validation and feedback
   - Visual strategy preview
   - Support for complex multi-asset strategies
   - Rebalancing rules with custom triggers

2. **AI Chat Builder** 💬
   - Natural language strategy creation
   - Powered by **GPT-5 Nano (gpt-5-nano-2025-08-07)**
   - Contextual suggestions and improvements
   - Automatic configuration generation
   - Edit and refine strategies conversationally

3. **Voice Builder** 🎤
   - Hands-free vault creation
   - Voice-to-text with AI interpretation
   - Real-time strategy building
   - Perfect for on-the-go management

**Features:**
- Template library for common strategies
- Undo/Redo functionality
- Load and edit existing vaults
- Yield comparison across protocols
- Multi-network support (Testnet, Futurenet, Mainnet)

### 📊 Dashboard

Your command center for all vault operations.

**Key Metrics:**
- **Total Value Locked (TVL)**: Aggregate value across all vaults
- **Current APY**: Real-time yield calculations
- **Active Vaults**: Number of deployed strategies
- **Total Earnings**: Cumulative returns across all positions

**Features:**
- Portfolio performance charts (24h, 7d, 30d, All-time)
- Asset allocation breakdown (pie chart)
- Individual vault performance cards
- User position tracking (deposits, shares, value)
- Real-time WebSocket updates for prices and rebalances

**Best Yield Opportunities:**
- Discover high-yield opportunities across protocols
- Smart routing suggestions for optimal yields
- Automated monitoring of DeFi protocols
- One-click optimization recommendations

### 🏪 NFT Marketplace

Monetize your strategies and discover top performers.

**For Creators:**
- **Mint Vault NFTs**: Convert vaults into unique NFTs with AI-generated artwork
- **Set Profit Share**: Define subscription fees (e.g., 5% of subscriber profits)
- **List for Sale**: Showcase your strategy on the marketplace
- **Track Revenue**: Monitor earnings from subscribers

**For Buyers:**
- **Browse Listings**: Discover vaults by performance, APY, or risk level
- **View Analytics**: Detailed performance history and metrics
- **Purchase NFTs**: Gain access to exclusive strategies
- **Subscribe**: Deposit funds and start earning automatically

**NFT Features:**
- AI-generated artwork via **Runware AI**
- On-chain metadata and ownership
- Transfer and resale support
- Provenance tracking

### 📈 Analytics

Comprehensive multi-view analytics dashboard for deep insights into portfolio performance and risk.

**Four Analysis Views:**

1. **Risk Analysis** 🛡️
   - **Risk Metrics Dashboard**:
     - Portfolio Volatility: Real-time volatility measurement
     - Sharpe Ratio: Risk-adjusted return metric
     - Sortino Ratio: Downside risk-adjusted returns
     - Maximum Drawdown: Largest peak-to-trough decline
     - Value at Risk (VaR): Potential loss estimation
     - Beta & Alpha: Market correlation and excess returns
     - Information Ratio: Active management effectiveness
   
   - **Historical Volatility Chart**: Time-series volatility tracking with benchmark comparison
   - **Drawdown Analysis**: Visual drawdown tracking over selected period
   - **Asset Correlation Matrix**: Pairwise correlations between portfolio assets
   - **Risk Distribution**: Value at Risk and concentration analysis

2. **Performance Analysis** 📊
   - **Asset Contribution Analysis**: Visual breakdown of each asset's return contribution
   - **Asset Performance Breakdown Table**:
     - Total return per asset
     - Return contribution percentage
     - Risk contribution percentage
     - Current allocation weight
   
   - **Performance Attribution by Vault**:
     - Individual vault returns
     - Decomposition by: asset selection, timing, rebalancing, fees
     - Compare multiple vaults simultaneously

3. **Liquidity Analysis** 💧
   - **Real Liquidity Metrics** (from Stellar Horizon):
     - Pool Depth: Total value locked in pools
     - Average Slippage: Trading impact estimates
     - 24h Volume: Trading activity
     - Liquidity Score: Composite quality metric (0-100)
   
   - **Liquidity Score Distribution**: Visual ranking of available pools
   - **Top Liquidity Pools**: Real-time data from Stellar DEX

4. **Time Analysis** ⏰
   - **Day of Week Performance**: Average returns by day of week
   - **Volume Distribution**: Trading volume patterns across days
   - **Rebalancing History**: Recent rebalance events with:
     - Timestamp and vault name
     - Transaction cost
     - TVL before/after
     - Impact analysis

**Key Features:**

- **Multi-Period Support**: 7D, 30D, 90D, 1Y analysis windows
- **Real-time Refresh**: Up-to-date data with manual refresh option
- **Interactive Charts**: Zoom, hover, and drill-down capabilities (via Recharts)
- **Network Support**: Works across Stellar Testnet, Futurenet, and Mainnet
- **Responsive Design**: Optimized for desktop and tablet viewing
- **Loading States**: Skeleton screens and error handling for better UX

**Data Sources:**

- Backend API for portfolio and vault analytics
- Stellar Horizon API for real liquidity pool data
- Historical performance tracking from database
- Real-time correlations and risk calculations

### 🧪 Backtesting

Test strategies against historical data before risking real capital.

**Features:**
- **Historical Simulation**: Run strategies on past market data
- **Customizable Parameters**:
  - Start/End dates
  - Initial capital
  - Resolution (hourly, daily, weekly)
- **Performance Metrics**:
  - Total return & annualized return
  - Volatility & Sharpe ratio
  - Maximum drawdown
  - Win rate & profit factor
- **Visual Results**:
  - Equity curve charts
  - Drawdown graphs
  - Trade history timeline
- **Save & Compare**: Store backtest results and compare different strategies

**Use Cases:**
- Validate strategy logic before deployment
- Optimize rebalancing thresholds
- Compare asset allocations
- Assess risk under different market conditions

### 💡 AI Suggestions

Intelligent recommendations to improve your vaults.

**How It Works:**
1. Select a vault from your list
2. AI analyzes performance, risk, and market conditions
3. Receive prioritized suggestions with impact estimates
4. Click "Apply Suggestion" to auto-fill Vault Builder

**Suggestion Types:**
- **Rebalance**: Adjust asset allocations for better performance
- **Add Asset**: Diversify with high-potential tokens
- **Remove Asset**: Reduce exposure to underperformers
- **Adjust Rules**: Optimize rebalancing triggers
- **Risk Adjustment**: Balance risk vs. return profile

**Each Suggestion Includes:**
- **Priority**: Low, Medium, High
- **Expected Impact**: Return increase, risk reduction, efficiency gain
- **Rationale**: Data-driven explanation
- **Implementation Steps**: Clear action items
- **Difficulty**: Easy, Moderate, Advanced
- **Estimated Time**: Time to implement

**Integration with Vault Builder:**
- Click "Apply Suggestion"
- Redirected to Vault Builder
- Current vault config loaded onto canvas
- AI chat pre-filled with improvement prompt
- Refine and deploy with one click

### 💻 Terminal AI

Your intelligent blockchain assistant for the Stellar network.

**Powered by GPT-5 Nano (gpt-5-nano-2025-08-07)**

**Capabilities:**

1. **Wallet Management** 👛
   - Fund account from Friendbot faucet
   - Check XLM and custom asset balances
   - Create new accounts
   - Export secret key (with security warnings)

2. **Asset Operations** 💰
   - Create custom assets (e.g., MYCATTY, SYFT)
   - Transfer assets between accounts
   - Batch transfers for efficiency
   - Check asset information

3. **Trustlines** 🔗
   - Set up trustlines for non-XLM assets
   - Revoke existing trustlines
   - Manage asset permissions

4. **Smart Contracts** 📜
   - Deploy Soroban contracts
   - Invoke contract functions
   - Read contract state (view functions)
   - Upgrade existing contracts
   - Stream contract events

5. **DEX & Liquidity** 💱
   - Swap assets on Stellar DEX
   - Add liquidity to pools
   - Remove liquidity
   - View pool analytics and prices

6. **NFTs** 🎨
   - Mint NFTs with AI-generated artwork
   - Transfer NFT ownership
   - Burn NFTs
   - List and view owned NFTs

7. **Transaction Management** 📋
   - Simulate transactions before submission
   - View transaction history
   - Search transactions on Stellar Explorer
   - Batch operations

8. **Network Analytics** 📊
   - Get network statistics
   - Query price oracles
   - Check protocol yields
   - Monitor gas fees

9. **Web Search & Data Retrieval** 🔍
   - Real-time info via **Tavily API**
   - Look up asset issuers
   - Find contract addresses
   - Fetch documentation
   - Get market data

10. **Federated Addresses** 🌐
    - Resolve federated addresses (user*domain)
    - Convert to Stellar public keys

11. **Advanced Multi-Step Actions** 🎯
    - Balance-based operations (e.g., "swap half my XLM")
    - Automatic balance checks
    - Sequential execution
    - Error handling and retries

12. **Batch Workflows** ⚡
    - Execute multiple transfers in one operation
    - Coordinate complex multi-step actions
    - Optimize gas costs

**Smart Context Management:**
- Automatic conversation summarization at ~80k tokens
- Preserves context while preventing token overflow
- Seamless long-running sessions
- Persistent chat history via localStorage

**Security Features:**
- Wallet connection via Freighter only
- No private key storage
- Transaction simulation before execution
- Clear security warnings for sensitive operations

**Example Commands:**
```
"Show me my balance"
"Fund my account from the faucet"
"Mint me a Goku NFT with lightning powers"
"Transfer 100 XLM to GDSAMPLE..."
"Swap 50% of my XLM for USDC"
"What's the current XLM price?"
"Deploy my vault contract"
"List my NFTs"
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **UI Library**: Custom component library with Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Charts**: Recharts
- **Flow Diagrams**: XYFlow React
- **Animations**: Framer Motion
- **Wallet Integration**: Stellar Wallets Kit (Freighter, Albedo)
- **Voice**: Vapi AI (@vapi-ai/web)
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Real-time**: WebSocket (ws)
- **AI Models**:
  - OpenAI GPT-5 Nano (gpt-5-nano-2025-08-07)
  - Runware AI (image generation)
  - Tavily (web search)
- **Blockchain SDK**: Stellar SDK (@stellar/stellar-sdk)
- **Token Counting**: tiktoken

### Smart Contracts
- **Language**: Rust (Edition 2021)
- **Platform**: Soroban (Stellar)
- **SDK**: soroban-sdk 22.0.8
- **Standards**: OpenZeppelin Stellar Contracts
- **Optimization**: LTO, minimal binary size

### Infrastructure
- **Deployment**: Vercel (Frontend), Heroku (Backend)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Networks**: Stellar Testnet, Futurenet, Mainnet

### Development Tools
- **Build Tool**: Vite
- **Linting**: ESLint
- **Formatting**: Prettier
- **Version Control**: Git
- **Package Manager**: npm

---

## 📦 Smart Contracts

Syft's smart contracts are written in Rust using the Soroban SDK.

### Contract Architecture

```
contracts/
├── vault-factory/          # Factory for deploying vault instances
│   ├── src/
│   │   ├── lib.rs         # Factory logic
│   │   └── vault.rs       # Vault creation
│   └── Cargo.toml
│
├── soroban/               # Main vault contract
│   ├── src/
│   │   ├── lib.rs         # Entry point
│   │   ├── deposit.rs     # Deposit logic
│   │   ├── withdraw.rs    # Withdrawal logic
│   │   ├── rebalance.rs   # Rebalancing logic
│   │   └── admin.rs       # Admin functions
│   └── Cargo.toml
│
├── vault-nft/             # NFT contract for vault tokenization
│   ├── src/
│   │   ├── lib.rs         # NFT minting and management
│   │   └── metadata.rs    # On-chain metadata
│   └── Cargo.toml
│
├── mock-liquidity-pool/   # Mock DEX pool for testing
├── mock-staking-pool/     # Mock staking for testing
└── nft-enumerable/        # NFT enumeration standard
```

### Key Contracts

#### Vault Factory
- Deploys new vault instances
- Manages vault registry
- Upgradeable architecture

#### Vault Contract
- Handles deposits and withdrawals
- Calculates share prices
- Executes rebalancing based on rules
- Interacts with DeFi protocols
- Emits events for monitoring

#### Vault NFT
- Mints NFTs representing vault ownership
- Stores metadata (name, image, strategy)
- Enables marketplace listings
- Profit-sharing mechanism

### Deployment

```bash
# Build all contracts
stellar contract build

# Deploy factory
./deploy-contracts.ps1

# Deploy individual vault
./deploy-mock-liquidity-pool.ps1
```

### Security

- Audited by OpenZeppelin standards
- Non-custodial design
- Role-based access control
- Emergency pause functionality
- Upgrade mechanisms with governance

---

## 🤖 AI-Powered Features

Syft leverages cutting-edge AI to democratize DeFi strategy creation.

### GPT-5 Nano (gpt-5-nano-2025-08-07)

Our exclusive AI model powers:

1. **Natural Language Vault Creation**
   - Describe strategies in plain English
   - AI interprets and generates vault configurations
   - Contextual refinement through conversation

2. **Strategy Optimization**
   - Analyze vault performance
   - Suggest improvements based on market data
   - Generate actionable recommendations

3. **Terminal AI Assistant**
   - Execute blockchain operations via chat
   - Understand complex multi-step requests
   - Provide educational explanations

4. **Voice Commands**
   - Voice-to-text with intent recognition
   - Hands-free vault management
   - Real-time feedback and confirmation

### Runware AI

**AI-Generated NFT Artwork:**
- Transform vault strategies into unique visual art
- Customizable styles and themes
- High-quality image generation
- Automatic metadata embedding

### Tavily API

**Real-time Web Search:**
- Fetch latest DeFi protocol information
- Look up asset details and issuers
- Retrieve documentation and guides
- Market data and news integration

### Context Management

**Smart Token Optimization:**
- Automatic summarization at ~80k tokens
- Preserves conversation history
- Prevents context overflow
- Seamless long-running sessions

---

## 🔐 Security

Security is our top priority. Syft implements multiple layers of protection:

### Smart Contract Security
- ✅ Audited by OpenZeppelin standards
- ✅ Non-custodial architecture (users control private keys)
- ✅ Role-based access control
- ✅ Emergency pause mechanism
- ✅ Upgrade governance
- ✅ Extensive test coverage

### Application Security
- ✅ No private key storage on servers
- ✅ Wallet connection via Freighter only
- ✅ Transaction simulation before execution
- ✅ Clear security warnings for sensitive operations
- ✅ HTTPS encryption for all API calls
- ✅ Environment variable protection

### Database Security
- ✅ Supabase Row-Level Security (RLS)
- ✅ Encrypted at rest
- ✅ Service role key protection
- ✅ Regular backups

### Best Practices
- Always verify transaction details before signing
- Never share your secret key
- Use hardware wallets for large amounts
- Enable 2FA on connected accounts
- Regularly review connected apps

---

## 🌐 Deployment

### Frontend (Vercel)

1. **Connect GitHub Repository**
   - Link Vercel to your GitHub repo
   - Select the `frontend` directory as the root

2. **Configure Build Settings**
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Set Environment Variables**
   ```
   VITE_PUBLIC_BACKEND_URL=https://your-backend.herokuapp.com
   VITE_STELLAR_NETWORK=testnet
   ```

4. **Deploy**
   - Automatic deployment on push to main branch
   - Preview deployments for pull requests

### Backend (Heroku)

1. **Create Heroku App**
   ```bash
   heroku create syft-backend
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=3001
   heroku config:set STELLAR_NETWORK=testnet
   # ... set all other environment variables
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

4. **Enable WebSockets**
   - Add Heroku's WebSocket support
   - Configure session affinity

### Database (Supabase)

1. **Create Project**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project

2. **Run Migrations**
   ```bash
   cd backend/migrations
   # Execute SQL files in order
   ```

3. **Configure Row-Level Security**
   - Enable RLS on all tables
   - Set up access policies

### Smart Contracts (Stellar)

1. **Build Contracts**
   ```bash
   stellar contract build
   ```

2. **Deploy to Network**
   ```bash
   # Testnet
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/vault_factory.wasm \
     --source-account YOUR_SECRET_KEY \
     --network testnet
   
   # Mainnet
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/vault_factory.wasm \
     --source-account YOUR_SECRET_KEY \
     --network mainnet
   ```

3. **Initialize Contracts**
   ```bash
   stellar contract invoke \
     --id CONTRACT_ID \
     --source-account YOUR_SECRET_KEY \
     --network testnet \
     -- initialize --admin YOUR_PUBLIC_KEY
   ```

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, or documentation improvements, your help is appreciated.

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/zaikaman/Syft.git
   cd Syft
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Frontend
   cd frontend
   npm run lint
   npm run build
   
   # Backend
   cd backend
   npm run lint
   npm run build
   
   # Contracts
   stellar contract build
   ```

4. **Submit a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Ensure CI/CD checks pass

### Development Guidelines

- **Code Style**: Follow ESLint and Prettier configurations
- **Commits**: Use conventional commit messages (feat, fix, docs, etc.)
- **Testing**: Write tests for critical functionality
- **Documentation**: Update README and inline docs

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Test coverage
- 🌐 Internationalization
- ♿ Accessibility improvements

---

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

```
Copyright 2025 Syft DeFi Platform

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 🙏 Acknowledgments

- **Stellar Development Foundation**: For the amazing Stellar and Soroban platforms
- **OpenAI**: For GPT-5 Nano AI model
- **Runware**: For AI-generated NFT artwork
- **Tavily**: For real-time web search capabilities
- **OpenZeppelin**: For smart contract standards and security
- **Supabase**: For database and real-time infrastructure
- **Vercel & Heroku**: For deployment platforms

---

## 📞 Contact & Support

- **Website**: [syft-defi.vercel.app](https://syft-defi.vercel.app)
- **GitHub**: [@zaikaman](https://github.com/zaikaman)
- **Issues**: [GitHub Issues](https://github.com/zaikaman/Syft/issues)

---

<div align="center">

### 🌟 Star this repository if you find it helpful!

**Built with ❤️ on Stellar**

[⬆ Back to Top](#-syft)

</div>
