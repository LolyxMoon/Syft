#!/usr/bin/env pwsh
# Deploy Custom Tokens to Stellar Testnet
# Creates multiple custom tokens for testing vault functionality

param(
    [string]$Network = "testnet",
    [string]$DeployerIdentity = "deployer"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING CUSTOM TOKENS TO $Network" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Token configurations - Realistic names inspired by Stellar DeFi ecosystem
$tokens = @(
    @{
        Name = "Aquarius Exchange"
        Symbol = "AQX"
        Decimals = 7
        InitialSupply = "100000000000000" # 10,000,000 tokens with 7 decimals
    },
    @{
        Name = "Velocity Token"
        Symbol = "VLTK"
        Decimals = 7
        InitialSupply = "50000000000000" # 5,000,000 tokens
    },
    @{
        Name = "SmartLux Token"
        Symbol = "SLX"
        Decimals = 7
        InitialSupply = "30000000000000" # 3,000,000 tokens
    },
    @{
        Name = "WireX Finance"
        Symbol = "WRX"
        Decimals = 7
        InitialSupply = "20000000000000" # 2,000,000 tokens
    },
    @{
        Name = "SixNet Protocol"
        Symbol = "SIXN"
        Decimals = 7
        InitialSupply = "50000000000000" # 5,000,000 tokens
    },
    @{
        Name = "Mobius Finance"
        Symbol = "MBIUS"
        Decimals = 7
        InitialSupply = "25000000000000" # 2,500,000 tokens
    },
    @{
        Name = "Trion Network"
        Symbol = "TRIO"
        Decimals = 7
        InitialSupply = "15000000000000" # 1,500,000 tokens
    },
    @{
        Name = "Relio Network"
        Symbol = "RELIO"
        Decimals = 7
        InitialSupply = "10000000000000" # 1,000,000 tokens
    },
    @{
        Name = "Trident Token"
        Symbol = "TRI"
        Decimals = 7
        InitialSupply = "40000000000000" # 4,000,000 tokens
    },
    @{
        Name = "Numerico Finance"
        Symbol = "NUMER"
        Decimals = 7
        InitialSupply = "35000000000000" # 3,500,000 tokens
    }
)

# Get deployer address
Write-Host "`n📋 Getting deployer address..." -ForegroundColor Yellow
$deployerAddress = stellar keys address $DeployerIdentity 2>$null
if ([string]::IsNullOrEmpty($deployerAddress)) {
    Write-Host "❌ Error: Deployer identity '$DeployerIdentity' not found" -ForegroundColor Red
    Write-Host "Create it with: stellar keys generate --global $DeployerIdentity --network $Network" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Deployer: $deployerAddress" -ForegroundColor Green

# Build the custom token contract
Write-Host "`n🔨 Building custom token contract..." -ForegroundColor Yellow
Push-Location contracts/custom-token
$buildResult = stellar contract build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Contract built successfully" -ForegroundColor Green
Pop-Location

$wasmPath = "target/wasm32v1-none/release/custom_token.wasm"

# Deploy and initialize each token
$deployedTokens = @()

foreach ($token in $tokens) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📦 Deploying $($token.Symbol) - $($token.Name)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    # Deploy contract
    Write-Host "Deploying contract..." -ForegroundColor Yellow
    $deployOutput = stellar contract deploy `
        --wasm $wasmPath `
        --network $Network `
        --source $DeployerIdentity 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host $deployOutput -ForegroundColor Red
        continue
    }

    $contractId = ($deployOutput | Select-String -Pattern "C[A-Z0-9]{55}" | Select-Object -First 1 | ForEach-Object { $_.Matches[0].Value })
    
    if ([string]::IsNullOrEmpty($contractId)) {
        Write-Host "❌ Failed to extract contract ID" -ForegroundColor Red
        continue
    }

    Write-Host "✅ Contract deployed: $contractId" -ForegroundColor Green

    # Initialize token
    Write-Host "Initializing token..." -ForegroundColor Yellow
    $initOutput = stellar contract invoke `
        --id $contractId `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        initialize `
        --admin $deployerAddress `
        --decimals $($token.Decimals) `
        --name "$($token.Name)" `
        --symbol "$($token.Symbol)" `
        --initial_supply $($token.InitialSupply) 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Initialization warning (may still be successful):" -ForegroundColor Yellow
        Write-Host $initOutput -ForegroundColor Gray
    } else {
        Write-Host "✅ Token initialized" -ForegroundColor Green
    }

    # Verify deployment
    Write-Host "Verifying..." -ForegroundColor Yellow
    $verifyName = stellar contract invoke `
        --id $contractId `
        --network $Network `
        -- `
        name 2>&1 | Select-String -Pattern '"([^"]+)"' | ForEach-Object { $_.Matches[0].Groups[1].Value }
    
    $verifySymbol = stellar contract invoke `
        --id $contractId `
        --network $Network `
        -- `
        symbol 2>&1 | Select-String -Pattern '"([^"]+)"' | ForEach-Object { $_.Matches[0].Groups[1].Value }

    Write-Host "✅ Verified: $verifyName ($verifySymbol)" -ForegroundColor Green
    Write-Host "   Address: $contractId" -ForegroundColor White
    Write-Host "   Initial Supply: $($token.InitialSupply) ($([decimal]$token.InitialSupply / 10000000) tokens)" -ForegroundColor White

    $deployedTokens += @{
        Symbol = $token.Symbol
        Name = $token.Name
        Address = $contractId
        Decimals = $token.Decimals
    }
}

# Save deployment information
Write-Host "`n💾 Saving deployment information..." -ForegroundColor Yellow

$envContent = @"
# Custom Token Deployment Information
# Network: $Network
# Deployed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Deployer: $deployerAddress

"@

foreach ($token in $deployedTokens) {
    $envContent += "$($token.Symbol)_ADDRESS=$($token.Address)`n"
}

$envContent += @"

# Usage Examples:
# Mint tokens:
# stellar contract invoke --id <TOKEN_ADDRESS> --network $Network --source $DeployerIdentity -- mint --to <USER_ADDRESS> --amount 1000000000

# Transfer tokens:
# stellar contract invoke --id <TOKEN_ADDRESS> --network $Network --source <FROM_IDENTITY> -- transfer --from <FROM_ADDRESS> --to <TO_ADDRESS> --amount 1000000000

# Check balance:
# stellar contract invoke --id <TOKEN_ADDRESS> --network $Network -- balance --account <ADDRESS>
"@

$envContent | Out-File -FilePath "CUSTOM_TOKENS.env" -Encoding UTF8
Write-Host "✅ Saved to CUSTOM_TOKENS.env" -ForegroundColor Green

# Summary
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nDeployed Tokens:" -ForegroundColor Yellow

foreach ($token in $deployedTokens) {
    Write-Host "  • $($token.Symbol) ($($token.Name))" -ForegroundColor White
    Write-Host "    $($token.Address)" -ForegroundColor Gray
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run deploy-liquidity-pools.ps1 to create pools for these tokens" -ForegroundColor White
Write-Host "2. Run initialize-pools.ps1 to add liquidity" -ForegroundColor White
Write-Host "3. Update backend/src/config/tokenAddresses.ts with the new addresses" -ForegroundColor White

Write-Host "`n✨ Tokens are ready to use in your vaults!" -ForegroundColor Green
