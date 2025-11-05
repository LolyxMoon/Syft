# NFT Contract Deployment Guide

This guide explains how to deploy the Vault NFT contract for quest rewards.

## Prerequisites

1. **Stellar CLI** installed (`stellar` command available)
2. **Testnet account** with funded XLM
3. **Environment setup** in your shell

## Step 1: Build the Contract

```powershell
cd contracts/vault-nft
stellar contract build
```

This creates a WASM file in `target/wasm32v1-none/release/vault_nft.wasm`

**Note:** The path changed from `wasm32-unknown-unknown` to `wasm32v1-none` in newer versions of the Stellar CLI.

## Step 2: Deploy to Testnet

```powershell
# Navigate to project root
cd ../..

# Set your testnet identity (replace with your actual identity name)
$IDENTITY = "deployer"

# Deploy the contract (run from project root)
stellar contract deploy `
  --wasm target/wasm32v1-none/release/vault_nft.wasm `
  --source $IDENTITY `
  --network testnet

# The command will output the contract address, save it for later
```

**Example output:**
```
✅ Deployed!
CBQP4YJFBCVCHCADGOD2NFFNO77Z4WIZ5A72UFTIZI3VMSTOZ6NUYWBV
```

## Step 3: Save Contract Address

Add the contract address to your backend `.env` file:

```env
NFT_CONTRACT_ADDRESS=<CONTRACT_ID_FROM_ABOVE>
```

Also add to `frontend/.env`:

```env
VITE_NFT_CONTRACT_ADDRESS=<CONTRACT_ID_FROM_ABOVE>
```

## Step 4: Test Minting

Test the contract by minting an NFT manually:

```powershell
# Mint an NFT to a test address
stellar contract invoke `
  --id $CONTRACT_ID `
  --source $IDENTITY `
  --network testnet `
  -- mint_nft `
  --minter <YOUR_STELLAR_ADDRESS> `
  --vault_address $CONTRACT_ID `
  --ownership_percentage 10000 `
  --metadata '{"name":"Test NFT","description":"Test","image_url":"https://example.com/nft.png","vault_performance":0}'
```

## Step 5: Verify

Query the NFT to verify it was minted:

```powershell
stellar contract invoke `
  --id $CONTRACT_ID `
  --source $IDENTITY `
  --network testnet `
  -- get_nft `
  --nft_id 1
```

## Frontend URL Setup

Make sure to set your frontend URL in the backend `.env` so NFT images are hosted correctly:

```env
FRONTEND_URL=https://your-app.vercel.app
# or for local development
FRONTEND_URL=http://localhost:5173
```

## Troubleshooting

### "Contract not initialized"
- Make sure you deployed the contract successfully
- Verify the contract ID is correct in your .env files

### "Unauthorized" errors
- Ensure the minter address matches the user's wallet address
- Check that you're on the correct network (testnet)

### Image not loading in NFT metadata
- Verify the image files exist in `frontend/public/`
- Check that FRONTEND_URL is set correctly
- Ensure images are publicly accessible after deployment

## Notes

- **Quest NFTs** use a fixed 100% ownership (10000 basis points)
- The `vault_address` for quest NFTs can be set to the contract address itself
- NFT IDs are auto-incremented starting from 1
- Images must be hosted (not embedded) - they're referenced by URL in metadata
