#!/usr/bin/env pwsh
# Deploy Real Liquidity Pool Contracts
# Creates separate pool instances for each token pair

param(
    [string]$Network = "testnet",
    [string]$DeployerIdentity = "deployer",
    [string]$TokensEnvFile = "CUSTOM_TOKENS.env"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING LIQUIDITY POOL CONTRACTS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Load token addresses
if (!(Test-Path $TokensEnvFile)) {
    Write-Host "❌ Error: $TokensEnvFile not found!" -ForegroundColor Red
    Write-Host "Please run deploy-custom-tokens.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📋 Loading token addresses from $TokensEnvFile..." -ForegroundColor Yellow

$tokenAddresses = @{}
Get-Content $TokensEnvFile | ForEach-Object {
    if ($_ -match '^([A-Z_]+)_ADDRESS=([A-Z0-9]+)$') {
        $tokenAddresses[$matches[1]] = $matches[2]
        Write-Host "  ✓ $($matches[1]): $($matches[2])" -ForegroundColor Gray
    }
}

if ($tokenAddresses.Count -eq 0) {
    Write-Host "❌ No token addresses found in $TokensEnvFile" -ForegroundColor Red
    exit 1
}

# Get XLM (native) address
$XLM_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" # Testnet native XLM

# Get deployer address
Write-Host "`n📋 Getting deployer address..." -ForegroundColor Yellow
$deployerAddress = stellar keys address $DeployerIdentity 2>$null
if ([string]::IsNullOrEmpty($deployerAddress)) {
    Write-Host "❌ Error: Deployer identity '$DeployerIdentity' not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Deployer: $deployerAddress" -ForegroundColor Green

# Build the liquidity pool contract
Write-Host "`n🔨 Building liquidity pool contract..." -ForegroundColor Yellow
Push-Location contracts/real-liquidity-pool
$buildResult = stellar contract build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Contract built successfully" -ForegroundColor Green
Pop-Location

$wasmPath = "target/wasm32v1-none/release/real_liquidity_pool.wasm"

# Define pool pairs to create - 10 XLM pairs for all custom tokens
$poolPairs = @(
    @{ TokenA = "XLM"; AddressA = $XLM_ADDRESS; TokenB = "AQX"; AddressB = $tokenAddresses["AQX"] },
    @{ TokenA = "XLM"; AddressA = $XLM_ADDRESS; TokenB = "VLTK"; AddressB = $tokenAddresses["VLTK"] },
    @{ TokenA = "XLM"; AddressA = $XLM_ADDRESS; TokenB = "SLX"; AddressB = $tokenAddresses["SLX"] },
    @{ TokenA = "XLM"; AddressA = $XLM_ADDRESS; TokenB = "WRX"; AddressB = $tokenAddresses["WRX"] },
    @{ TokenA = "XLM"; AddressA = $XLM_ADDRESS; TokenB = "SIXN"; AddressB = $tokenAddresses["SIXN"] },
    @{ TokenA = "XLM"; AddressA = $XLM_ADDRESS; TokenB = "MBIUS"; AddressB = $tokenAddresses["MBIUS"] },
    @{ TokenA = "XLM"; AddressA = $XLM_ADDRESS; TokenB = "TRIO"; AddressB = $tokenAddresses["TRIO"] },
    @{ TokenA = "XLM"; AddressA = $XLM_ADDRESS; TokenB = "RELIO"; AddressB = $tokenAddresses["RELIO"] },
    @{ TokenA = "XLM"; AddressA = $XLM_ADDRESS; TokenB = "TRI"; AddressB = $tokenAddresses["TRI"] },
    @{ TokenA = "XLM"; AddressA = $XLM_ADDRESS; TokenB = "NUMER"; AddressB = $tokenAddresses["NUMER"] }
)

$deployedPools = @()

# Deploy pool for each pair
foreach ($pair in $poolPairs) {
    if ([string]::IsNullOrEmpty($pair.AddressB)) {
        Write-Host "`n⚠️  Skipping $($pair.TokenA)/$($pair.TokenB) - Token not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🏊 Creating Pool: $($pair.TokenA)/$($pair.TokenB)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    # Deploy pool contract
    Write-Host "Deploying pool contract..." -ForegroundColor Yellow
    $deployOutput = stellar contract deploy `
        --wasm $wasmPath `
        --network $Network `
        --source $DeployerIdentity 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host $deployOutput -ForegroundColor Red
        continue
    }

    $poolId = ($deployOutput | Select-String -Pattern "C[A-Z0-9]{55}" | Select-Object -First 1 | ForEach-Object { $_.Matches[0].Value })
    
    if ([string]::IsNullOrEmpty($poolId)) {
        Write-Host "❌ Failed to extract pool contract ID" -ForegroundColor Red
        continue
    }

    Write-Host "✅ Pool contract deployed: $poolId" -ForegroundColor Green

    # Initialize pool with token pair
    Write-Host "Initializing pool with token pair..." -ForegroundColor Yellow
    $initOutput = stellar contract invoke `
        --id $poolId `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        initialize `
        --token_a $($pair.AddressA) `
        --token_b $($pair.AddressB) 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Initialization warning:" -ForegroundColor Yellow
        Write-Host $initOutput -ForegroundColor Gray
    } else {
        Write-Host "✅ Pool initialized" -ForegroundColor Green
    }

    # Verify pool
    Write-Host "Verifying pool..." -ForegroundColor Yellow
    $verifyOutput = stellar contract invoke `
        --id $poolId `
        --network $Network `
        -- `
        get_pool_info 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Pool verified successfully" -ForegroundColor Green
    }

    Write-Host "   Pool Address: $poolId" -ForegroundColor White
    Write-Host "   Token A ($($pair.TokenA)): $($pair.AddressA)" -ForegroundColor White
    Write-Host "   Token B ($($pair.TokenB)): $($pair.AddressB)" -ForegroundColor White

    $deployedPools += @{
        Pair = "$($pair.TokenA)/$($pair.TokenB)"
        PoolAddress = $poolId
        TokenA = $pair.TokenA
        TokenAAddress = $pair.AddressA
        TokenB = $pair.TokenB
        TokenBAddress = $pair.AddressB
    }
}

# Save pool deployment information
Write-Host "`n💾 Saving pool deployment information..." -ForegroundColor Yellow

$envContent = @"
# Liquidity Pool Deployment Information
# Network: $Network
# Deployed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Deployer: $deployerAddress

"@

foreach ($pool in $deployedPools) {
    $pairKey = $pool.Pair -replace "/", "_"
    $envContent += "POOL_${pairKey}=$($pool.PoolAddress)`n"
}

$envContent += @"

# Pool Details:
"@

foreach ($pool in $deployedPools) {
    $envContent += @"

# $($pool.Pair) Pool
#   Pool: $($pool.PoolAddress)
#   $($pool.TokenA): $($pool.TokenAAddress)
#   $($pool.TokenB): $($pool.TokenBAddress)
"@
}

$envContent | Out-File -FilePath "LIQUIDITY_POOLS.env" -Encoding UTF8
Write-Host "✅ Saved to LIQUIDITY_POOLS.env" -ForegroundColor Green

# Summary
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🎉 POOL DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nDeployed Pools:" -ForegroundColor Yellow

foreach ($pool in $deployedPools) {
    Write-Host "  • $($pool.Pair)" -ForegroundColor White
    Write-Host "    $($pool.PoolAddress)" -ForegroundColor Gray
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run initialize-pools.ps1 to add initial liquidity" -ForegroundColor White
Write-Host "2. Pools are now ready for swaps!" -ForegroundColor White
Write-Host "3. Update your vault contracts to use these pool addresses" -ForegroundColor White

Write-Host "`n✨ Liquidity pools are ready!" -ForegroundColor Green
