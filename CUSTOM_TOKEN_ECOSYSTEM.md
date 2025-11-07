# Custom Token Ecosystem Setup Guide

## Overview

This system provides a complete, functional custom token ecosystem for Syft vaults with **real liquidity pools** that actually perform swaps and hold tokens.

### What's Included

1. **Custom Token Contract** (`contracts/custom-token/`)
   - Reusable SEP-41 compliant token
   - Configurable name, symbol, and decimals
   - Mintable by admin

2. **Real Liquidity Pool Contract** (`contracts/real-liquidity-pool/`)
   - Uniswap V2-style constant product AMM (x * y = k)
   - Real token transfers and balance tracking
   - Add/remove liquidity with LP tokens
   - Token swaps with 0.3% fee
   - Slippage protection

3. **Three Custom Tokens**
   - ALPHA - Syft Token Alpha
   - BETA - Syft Token Beta
   - GAMMA - Syft Token Gamma

4. **Three Liquidity Pools**
   - XLM/ALPHA Pool (10,000 XLM + 10,000 ALPHA)
   - XLM/BETA Pool (10,000 XLM + 10,000 BETA)
   - XLM/GAMMA Pool (10,000 XLM + 10,000 GAMMA)

## Quick Start

### Prerequisites

- Stellar CLI installed
- Rust toolchain installed
- Deployer identity configured: `stellar keys generate --global deployer --network testnet`
- Deployer funded with XLM

### One-Command Setup

Run the master setup script to deploy everything:

```powershell
.\setup-custom-token-ecosystem.ps1
```

This will:
1. Deploy 3 custom tokens (ALPHA, BETA, GAMMA)
2. Deploy 3 liquidity pool contracts
3. Initialize pools with initial liquidity
4. Update backend configuration

**Time:** ~5-10 minutes depending on network

## Manual Setup (Step by Step)

If you prefer to run each step individually:

### Step 1: Deploy Custom Tokens

```powershell
.\deploy-custom-tokens.ps1 -Network testnet -DeployerIdentity deployer
```

Creates `CUSTOM_TOKENS.env` with token addresses.

### Step 2: Deploy Liquidity Pools

```powershell
.\deploy-liquidity-pools.ps1 -Network testnet -DeployerIdentity deployer
```

Creates `LIQUIDITY_POOLS.env` with pool addresses.

### Step 3: Add Initial Liquidity

```powershell
.\initialize-pools.ps1 -Network testnet -DeployerIdentity deployer
```

Adds 10,000 XLM + 10,000 tokens to each pool.

## Using the Tokens

### In VaultBuilder

1. Restart your backend: `cd backend && npm run dev`
2. Open VaultBuilder in the frontend
3. Add asset blocks with ALPHA, BETA, or GAMMA
4. Create swap actions between XLM and custom tokens
5. Deploy and test your vault!

### Minting Tokens to Users

To give users test tokens:

```powershell
stellar contract invoke `
  --id <TOKEN_ADDRESS> `
  --network testnet `
  --source deployer `
  -- mint `
  --to <USER_ADDRESS> `
  --amount 1000000000
```

Example:
```powershell
# Mint 100 ALPHA to a user (100 * 10^7 = 1000000000)
stellar contract invoke `
  --id CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX `
  --network testnet `
  --source deployer `
  -- mint `
  --to GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX `
  --amount 1000000000
```

### Testing Swaps

Swap XLM for ALPHA through the pool:

```powershell
stellar contract invoke `
  --id <POOL_ADDRESS> `
  --network testnet `
  --source user `
  -- swap `
  --user <USER_ADDRESS> `
  --token_in <XLM_ADDRESS> `
  --amount_in 1000000000 `
  --amount_out_min 900000000
```

### Checking Pool Reserves

```powershell
stellar contract invoke `
  --id <POOL_ADDRESS> `
  --network testnet `
  -- get_pool_info
```

## Architecture

### Token Contract Features

- **Initialize**: Set name, symbol, decimals, and mint initial supply
- **Mint**: Admin-only function to create new tokens
- **Transfer**: Standard token transfer
- **Balance**: Check token balance
- **Metadata**: Read name, symbol, decimals

### Liquidity Pool Features

- **Initialize**: Set the two tokens for the pool
- **Add Liquidity**: Deposit tokens, receive LP tokens
- **Remove Liquidity**: Burn LP tokens, receive underlying tokens
- **Swap**: Exchange one token for another with 0.3% fee
- **Get Reserves**: Check current pool balances

### How Swaps Work

The pool uses the constant product formula:

```
x * y = k (constant)

amount_out = (amount_in * 997 * reserve_out) / (reserve_in * 1000 + amount_in * 997)
```

Where:
- 997/1000 represents the 0.3% fee
- Slippage protection ensures minimum output

## Configuration Files

### CUSTOM_TOKENS.env

Contains deployed token addresses:
```
ALPHA_ADDRESS=CXXXXX...
BETA_ADDRESS=CXXXXX...
GAMMA_ADDRESS=CXXXXX...
```

### LIQUIDITY_POOLS.env

Contains deployed pool addresses:
```
POOL_XLM_ALPHA=CXXXXX...
POOL_XLM_BETA=CXXXXX...
POOL_XLM_GAMMA=CXXXXX...
```

### backend/.env

Updated automatically with:
```
ALPHA_ADDRESS=CXXXXX...
BETA_ADDRESS=CXXXXX...
GAMMA_ADDRESS=CXXXXX...
POOL_XLM_ALPHA=CXXXXX...
POOL_XLM_BETA=CXXXXX...
POOL_XLM_GAMMA=CXXXXX...
```

## Troubleshooting

### "Token not initialized" error

Make sure you ran the initialization step after deployment.

### "Insufficient liquidity" error

Check that the initialize-pools script completed successfully. Verify reserves with `get_pool_info`.

### "Unauthorized" error

Ensure you're using the correct deployer identity that deployed the contracts.

### Swap fails with "SlippageExceeded"

Increase the `amount_out_min` parameter or reduce the swap amount.

### Can't find tokens in VaultBuilder

1. Check that backend/.env has the token addresses
2. Restart the backend server
3. Clear browser cache and refresh

## Advanced Usage

### Creating Additional Token Pairs

To create a new token or pool:

1. Deploy another custom token instance
2. Deploy a new liquidity pool
3. Initialize the pool with the token pair
4. Add initial liquidity

### Integrating with Vault Contracts

Your vault contracts can use these pools by calling:

```rust
// In your vault contract
let pool_client = RealLiquidityPoolClient::new(&env, &pool_address);
let amount_out = pool_client.swap(
    &user,
    &token_in,
    &amount_in,
    &min_amount_out
);
```

## Explorer Links

After deployment, you can view your contracts on Stellar Expert:

- Tokens: `https://stellar.expert/explorer/testnet/contract/<TOKEN_ADDRESS>`
- Pools: `https://stellar.expert/explorer/testnet/contract/<POOL_ADDRESS>`

## Support

If you encounter issues:

1. Check the deployment logs for errors
2. Verify contract addresses in .env files
3. Test individual pool functions manually
4. Check Stellar Expert for transaction history

## Benefits Over Mock Pools

✅ **Real token transfers** - Actual balance changes on-chain
✅ **Proper price discovery** - Constant product formula
✅ **Liquidity tracking** - LP tokens represent pool ownership
✅ **Fee accumulation** - 0.3% fee builds pool reserves
✅ **Production-ready** - Same pattern as Uniswap V2
✅ **Explorer visibility** - All transactions visible on Stellar Expert
✅ **Full vault compatibility** - Works with your existing vault contracts

---

**Ready to build?** Run `.\setup-custom-token-ecosystem.ps1` and start creating vaults with functional custom tokens! 🚀
