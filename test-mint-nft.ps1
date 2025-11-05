# Test NFT Minting Script
# This script mints a test NFT to verify the contract works

param(
    [string]$ToAddress = "GBWFMVVVEN2SHMMW6RFNISPOUBKS3XIAIE6AUKPXGQ5YLMMU57YDPPTL",
    [string]$NFTName = "Test Quest NFT",
    [string]$Description = "A test NFT for quest rewards",
    [string]$ImageUrl = "http://localhost:5173/explorer.png"
)

$NFT_CONTRACT = "CBQP4YJFBCVCHCADGOD2NFFNO77Z4WIZ5A72UFTIZI3VMSTOZ6NUYWBV"

Write-Host "🎨 Minting NFT to: $ToAddress" -ForegroundColor Cyan
Write-Host "📝 NFT Name: $NFTName" -ForegroundColor Cyan
Write-Host "🖼️  Image URL: $ImageUrl" -ForegroundColor Cyan
Write-Host ""

# Mint the NFT
Write-Host "⏳ Minting NFT..." -ForegroundColor Yellow

stellar contract invoke `
  --id $NFT_CONTRACT `
  --source deployer `
  --network testnet `
  -- mint_nft `
  --minter $ToAddress `
  --vault_address $NFT_CONTRACT `
  --ownership_percentage 10000 `
  --metadata "{""name"":""$NFTName"",""description"":""$Description"",""image_url"":""$ImageUrl"",""vault_performance"":0}"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ NFT minted successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 To view the NFT, run:" -ForegroundColor Cyan
    Write-Host "stellar contract invoke --id $NFT_CONTRACT --source deployer --network testnet -- get_nft --nft_id 1" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to mint NFT" -ForegroundColor Red
}
