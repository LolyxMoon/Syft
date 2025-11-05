# Redeploy NFT Contract with burn function
# This script rebuilds and redeploys the vault-nft contract

Write-Host "🔨 Building NFT contract..." -ForegroundColor Cyan

# Build the contract
Set-Location contracts\vault-nft
cargo build --target wasm32-unknown-unknown --release

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Deploy the contract
Write-Host "🚀 Deploying NFT contract to testnet..." -ForegroundColor Cyan

# Load the deployer secret key from backend .env
$envFile = "backend\.env"
if (Test-Path $envFile) {
    $deployerSecret = (Get-Content $envFile | Select-String -Pattern "^DEPLOYER_SECRET_KEY=(.+)$").Matches.Groups[1].Value
    if ($deployerSecret) {
        Write-Host "✅ Found deployer secret key" -ForegroundColor Green
        $contractId = stellar contract deploy `
            --wasm ../../target/wasm32-unknown-unknown/release/vault_nft.wasm `
            --source-account $deployerSecret `
            --network testnet
    } else {
        Write-Host "❌ DEPLOYER_SECRET_KEY not found in backend\.env" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ backend\.env file not found" -ForegroundColor Red
    exit 1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ NFT Contract deployed successfully!" -ForegroundColor Green
Write-Host "📝 Contract ID: $contractId" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔄 Updating environment variables..." -ForegroundColor Cyan

# Go back to root
Set-Location ..\..

# Update backend .env
$envPath = "backend\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $envContent = $envContent -replace 'NFT_CONTRACT_ADDRESS=.*', "NFT_CONTRACT_ADDRESS=$contractId"
    $envContent | Set-Content $envPath
    Write-Host "✅ Updated backend\.env" -ForegroundColor Green
} else {
    Write-Host "⚠️  backend\.env not found" -ForegroundColor Yellow
}

# Update frontend .env
$frontendEnvPath = "frontend\.env"
if (Test-Path $frontendEnvPath) {
    $frontendEnvContent = Get-Content $frontendEnvPath
    $frontendEnvContent = $frontendEnvContent -replace 'VITE_NFT_CONTRACT_ADDRESS=.*', "VITE_NFT_CONTRACT_ADDRESS=$contractId"
    $frontendEnvContent | Set-Content $frontendEnvPath
    Write-Host "✅ Updated frontend\.env" -ForegroundColor Green
} else {
    Write-Host "⚠️  frontend\.env not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ All done! Your NFT contract now includes the burn function." -ForegroundColor Green
Write-Host "📌 New Contract Address: $contractId" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Restart your backend server (if running on Heroku, it will auto-deploy)" -ForegroundColor White
Write-Host "   2. Test the burn function with: burn_nft { tokenId: 'NFT_1' }" -ForegroundColor White
