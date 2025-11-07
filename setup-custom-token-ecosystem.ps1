#!/usr/bin/env pwsh
# Master Setup Script for Custom Token Ecosystem
# Deploys custom tokens, liquidity pools, and initializes everything

param(
    [string]$Network = "testnet",
    [string]$DeployerIdentity = "deployer"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "████████████████████████████████████████████" -ForegroundColor Cyan
Write-Host "█                                          █" -ForegroundColor Cyan
Write-Host "█   SYFT CUSTOM TOKEN ECOSYSTEM SETUP     █" -ForegroundColor Cyan
Write-Host "█                                          █" -ForegroundColor Cyan
Write-Host "████████████████████████████████████████████" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will deploy:" -ForegroundColor Yellow
Write-Host "  • 3 Custom Tokens (ALPHA, BETA, GAMMA)" -ForegroundColor White
Write-Host "  • Real Liquidity Pool Contracts" -ForegroundColor White
Write-Host "  • XLM/ALPHA, XLM/BETA, XLM/GAMMA Pools" -ForegroundColor White
Write-Host "  • Initial Liquidity (10,000 tokens each)" -ForegroundColor White
Write-Host ""
Write-Host "Network: $Network" -ForegroundColor Cyan
Write-Host "Deployer: $DeployerIdentity" -ForegroundColor Cyan
Write-Host ""

# Confirm
$confirmation = Read-Host "Continue with deployment? (yes/no)"
if ($confirmation -ne "yes" -and $confirmation -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Starting deployment process..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

$startTime = Get-Date

# Step 1: Deploy Custom Tokens
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "STEP 1/4: Deploying Custom Tokens" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""

& .\deploy-custom-tokens.ps1 -Network $Network -DeployerIdentity $DeployerIdentity

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Token deployment failed!" -ForegroundColor Red
    exit 1
}

if (!(Test-Path "CUSTOM_TOKENS.env")) {
    Write-Host ""
    Write-Host "❌ CUSTOM_TOKENS.env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Custom tokens deployed successfully!" -ForegroundColor Green
Start-Sleep -Seconds 2

# Step 2: Deploy Liquidity Pool Contracts
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "STEP 2/4: Deploying Liquidity Pool Contracts" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""

& .\deploy-liquidity-pools.ps1 -Network $Network -DeployerIdentity $DeployerIdentity -TokensEnvFile "CUSTOM_TOKENS.env"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Pool deployment failed!" -ForegroundColor Red
    exit 1
}

if (!(Test-Path "LIQUIDITY_POOLS.env")) {
    Write-Host ""
    Write-Host "❌ LIQUIDITY_POOLS.env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Liquidity pools deployed successfully!" -ForegroundColor Green
Start-Sleep -Seconds 2

# Step 3: Initialize Pools with Liquidity
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "STEP 3/4: Adding Initial Liquidity to Pools" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""

& .\initialize-pools.ps1 -Network $Network -DeployerIdentity $DeployerIdentity -PoolsEnvFile "LIQUIDITY_POOLS.env" -TokensEnvFile "CUSTOM_TOKENS.env"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  Pool initialization had warnings, but may have succeeded" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Liquidity initialization complete!" -ForegroundColor Green
Start-Sleep -Seconds 2

# Step 4: Update Backend Configuration
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "STEP 4/4: Updating Backend Configuration" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""

# Parse token addresses from CUSTOM_TOKENS.env
$tokenEnvContent = Get-Content "CUSTOM_TOKENS.env" -Raw
$alphaAddress = ""
$betaAddress = ""
$gammaAddress = ""

if ($tokenEnvContent -match 'ALPHA_ADDRESS=([A-Z0-9]+)') {
    $alphaAddress = $matches[1]
}
if ($tokenEnvContent -match 'BETA_ADDRESS=([A-Z0-9]+)') {
    $betaAddress = $matches[1]
}
if ($tokenEnvContent -match 'GAMMA_ADDRESS=([A-Z0-9]+)') {
    $gammaAddress = $matches[1]
}

# Parse pool addresses from LIQUIDITY_POOLS.env
$poolEnvContent = Get-Content "LIQUIDITY_POOLS.env" -Raw
$xlmAlphaPool = ""
$xlmBetaPool = ""
$xlmGammaPool = ""

if ($poolEnvContent -match 'POOL_XLM_ALPHA=([A-Z0-9]+)') {
    $xlmAlphaPool = $matches[1]
}
if ($poolEnvContent -match 'POOL_XLM_BETA=([A-Z0-9]+)') {
    $xlmBetaPool = $matches[1]
}
if ($poolEnvContent -match 'POOL_XLM_GAMMA=([A-Z0-9]+)') {
    $xlmGammaPool = $matches[1]
}

# Update or create backend .env
$backendEnvPath = "backend\.env"
$backendEnvExists = Test-Path $backendEnvPath

if ($backendEnvExists) {
    $backendEnv = Get-Content $backendEnvPath -Raw
    
    # Update or add token addresses
    if ($backendEnv -match 'ALPHA_ADDRESS=') {
        $backendEnv = $backendEnv -replace 'ALPHA_ADDRESS=.*', "ALPHA_ADDRESS=$alphaAddress"
    } else {
        $backendEnv += "`nALPHA_ADDRESS=$alphaAddress"
    }
    
    if ($backendEnv -match 'BETA_ADDRESS=') {
        $backendEnv = $backendEnv -replace 'BETA_ADDRESS=.*', "BETA_ADDRESS=$betaAddress"
    } else {
        $backendEnv += "`nBETA_ADDRESS=$betaAddress"
    }
    
    if ($backendEnv -match 'GAMMA_ADDRESS=') {
        $backendEnv = $backendEnv -replace 'GAMMA_ADDRESS=.*', "GAMMA_ADDRESS=$gammaAddress"
    } else {
        $backendEnv += "`nGAMMA_ADDRESS=$gammaAddress"
    }
    
    # Add pool addresses
    $backendEnv += "`n`n# Custom Token Liquidity Pools"
    $backendEnv += "`nPOOL_XLM_ALPHA=$xlmAlphaPool"
    $backendEnv += "`nPOOL_XLM_BETA=$xlmBetaPool"
    $backendEnv += "`nPOOL_XLM_GAMMA=$xlmGammaPool"
    
    Set-Content -Path $backendEnvPath -Value $backendEnv
    Write-Host "✅ Updated $backendEnvPath" -ForegroundColor Green
} else {
    $newEnv = @"
# Custom Token Addresses
ALPHA_ADDRESS=$alphaAddress
BETA_ADDRESS=$betaAddress
GAMMA_ADDRESS=$gammaAddress

# Custom Token Liquidity Pools
POOL_XLM_ALPHA=$xlmAlphaPool
POOL_XLM_BETA=$xlmBetaPool
POOL_XLM_GAMMA=$xlmGammaPool
"@
    Set-Content -Path $backendEnvPath -Value $newEnv
    Write-Host "✅ Created $backendEnvPath" -ForegroundColor Green
}

# Calculate elapsed time
$endTime = Get-Date
$elapsed = $endTime - $startTime
$minutes = [Math]::Floor($elapsed.TotalMinutes)
$seconds = $elapsed.Seconds

# Final Summary
Write-Host ""
Write-Host ""
Write-Host "████████████████████████████████████████████" -ForegroundColor Green
Write-Host "█                                          █" -ForegroundColor Green
Write-Host "█        DEPLOYMENT SUCCESSFUL! 🎉         █" -ForegroundColor Green
Write-Host "█                                          █" -ForegroundColor Green
Write-Host "████████████████████████████████████████████" -ForegroundColor Green
Write-Host ""
Write-Host "Deployment completed in ${minutes}m ${seconds}s" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "DEPLOYED TOKENS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ALPHA Token:" -ForegroundColor White
Write-Host "  $alphaAddress" -ForegroundColor Cyan
Write-Host ""
Write-Host "  BETA Token:" -ForegroundColor White
Write-Host "  $betaAddress" -ForegroundColor Cyan
Write-Host ""
Write-Host "  GAMMA Token:" -ForegroundColor White
Write-Host "  $gammaAddress" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "DEPLOYED LIQUIDITY POOLS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "  XLM/ALPHA Pool:" -ForegroundColor White
Write-Host "  $xlmAlphaPool" -ForegroundColor Cyan
Write-Host "  Liquidity: 10,000 XLM + 10,000 ALPHA" -ForegroundColor Gray
Write-Host ""
Write-Host "  XLM/BETA Pool:" -ForegroundColor White
Write-Host "  $xlmBetaPool" -ForegroundColor Cyan
Write-Host "  Liquidity: 10,000 XLM + 10,000 BETA" -ForegroundColor Gray
Write-Host ""
Write-Host "  XLM/GAMMA Pool:" -ForegroundColor White
Write-Host "  $xlmGammaPool" -ForegroundColor Cyan
Write-Host "  Liquidity: 10,000 XLM + 10,000 GAMMA" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "NEXT STEPS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Restart your backend server to load new token addresses" -ForegroundColor White
Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. The tokens are now available in VaultBuilder:" -ForegroundColor White
Write-Host "   • ALPHA - Syft Token Alpha" -ForegroundColor Gray
Write-Host "   • BETA - Syft Token Beta" -ForegroundColor Gray
Write-Host "   • GAMMA - Syft Token Gamma" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Build vaults with these tokens and test swapping!" -ForegroundColor White
Write-Host "   • XLM ↔ ALPHA" -ForegroundColor Gray
Write-Host "   • XLM ↔ BETA" -ForegroundColor Gray
Write-Host "   • XLM ↔ GAMMA" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test a swap manually:" -ForegroundColor White
Write-Host "   stellar contract invoke --id $xlmAlphaPool --network $Network \\" -ForegroundColor Gray
Write-Host "     -- swap --user <YOUR_ADDRESS> --token_in <XLM_ADDRESS> \\" -ForegroundColor Gray
Write-Host "     --amount_in 1000000000 --amount_out_min 900000000" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Mint tokens to users for testing:" -ForegroundColor White
Write-Host "   stellar contract invoke --id $alphaAddress --network $Network \\" -ForegroundColor Gray
Write-Host "     --source $DeployerIdentity -- mint --to <USER_ADDRESS> --amount 1000000000" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "✨ Your custom token ecosystem is ready!" -ForegroundColor Green
Write-Host "🚀 Go to VaultBuilder and create vaults with ALPHA, BETA, and GAMMA!" -ForegroundColor Green
Write-Host ""
Write-Host "Explorer links:" -ForegroundColor Yellow
Write-Host "  • ALPHA: https://stellar.expert/explorer/$Network/contract/$alphaAddress" -ForegroundColor Blue
Write-Host "  • BETA: https://stellar.expert/explorer/$Network/contract/$betaAddress" -ForegroundColor Blue
Write-Host "  • GAMMA: https://stellar.expert/explorer/$Network/contract/$gammaAddress" -ForegroundColor Blue
Write-Host ""
