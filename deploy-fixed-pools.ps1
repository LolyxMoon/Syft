#!/usr/bin/env pwsh
# Deploy all 10 fixed liquidity pools with authorization fix

param(
    [string]$Network = "testnet",
    [string]$DeployerIdentity = "deployer"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING FIXED LIQUIDITY POOLS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Load token addresses
$TokensEnvFile = "CUSTOM_TOKENS.env"
if (!(Test-Path $TokensEnvFile)) {
    Write-Host "❌ Error: $TokensEnvFile not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Loading token addresses..." -ForegroundColor Yellow
$tokenAddresses = @{}
Get-Content $TokensEnvFile | ForEach-Object {
    if ($_ -match '^([A-Z_]+)_ADDRESS=([A-Z0-9]+)$') {
        $tokenAddresses[$matches[1]] = $matches[2]
        Write-Host "  ✓ $($matches[1]): $($matches[2])" -ForegroundColor Gray
    }
}

# XLM address
$XLM_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

# Get deployer address
Write-Host "`n📋 Getting deployer address..." -ForegroundColor Yellow
$deployerAddress = stellar keys address $DeployerIdentity 2>$null
if ([string]::IsNullOrEmpty($deployerAddress)) {
    Write-Host "❌ Error: Deployer identity '$DeployerIdentity' not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Deployer: $deployerAddress" -ForegroundColor Green

# Pool WASM path
$wasmPath = "target/wasm32-unknown-unknown/release/real_liquidity_pool.optimized.wasm"

# Define all token pairs
$tokenPairs = @(
    @{ Symbol = "AQX"; Address = $tokenAddresses["AQX"] },
    @{ Symbol = "VLTK"; Address = $tokenAddresses["VLTK"] },
    @{ Symbol = "SLX"; Address = $tokenAddresses["SLX"] },
    @{ Symbol = "WRX"; Address = $tokenAddresses["WRX"] },
    @{ Symbol = "SIXN"; Address = $tokenAddresses["SIXN"] },
    @{ Symbol = "MBIUS"; Address = $tokenAddresses["MBIUS"] },
    @{ Symbol = "TRIO"; Address = $tokenAddresses["TRIO"] },
    @{ Symbol = "RELIO"; Address = $tokenAddresses["RELIO"] },
    @{ Symbol = "TRI"; Address = $tokenAddresses["TRI"] },
    @{ Symbol = "NUMER"; Address = $tokenAddresses["NUMER"] }
)

$deployedPools = @()
$liquidityAmount = 100000000000 # 10,000 tokens each (100 billion stroops)

Write-Host "`n🚀 Starting pool deployment..." -ForegroundColor Cyan

foreach ($token in $tokenPairs) {
    if ([string]::IsNullOrEmpty($token.Address)) {
        Write-Host "`n⚠️  Skipping XLM/$($token.Symbol) - Token not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🏊 XLM/$($token.Symbol) Pool" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    # Deploy pool
    Write-Host "1️⃣  Deploying pool contract..." -ForegroundColor Yellow
    $deployOutput = stellar contract deploy `
        --wasm $wasmPath `
        --network $Network `
        --source $DeployerIdentity 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to deploy pool" -ForegroundColor Red
        Write-Host $deployOutput -ForegroundColor Red
        continue
    }

    # Extract pool address from output
    $poolAddress = ($deployOutput | Select-String -Pattern 'C[A-Z0-9]{55}').Matches.Value | Select-Object -Last 1
    
    if ([string]::IsNullOrEmpty($poolAddress)) {
        Write-Host "❌ Could not extract pool address" -ForegroundColor Red
        continue
    }

    Write-Host "   ✅ Pool deployed: $poolAddress" -ForegroundColor Green

    # Initialize pool
    Write-Host "2️⃣  Initializing pool..." -ForegroundColor Yellow
    $initOutput = stellar contract invoke `
        --id $poolAddress `
        --source $DeployerIdentity `
        --network $Network `
        -- `
        initialize `
        --token_a $XLM_ADDRESS `
        --token_b $($token.Address) 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to initialize pool" -ForegroundColor Red
        continue
    }
    Write-Host "   ✅ Pool initialized" -ForegroundColor Green

    # Add liquidity
    Write-Host "3️⃣  Adding liquidity ($liquidityAmount each)..." -ForegroundColor Yellow
    $liquidityOutput = stellar contract invoke `
        --id $poolAddress `
        --source $DeployerIdentity `
        --network $Network `
        -- `
        add_liquidity `
        --user $deployerAddress `
        --amount_a_desired $liquidityAmount `
        --amount_b_desired $liquidityAmount `
        --amount_a_min 0 `
        --amount_b_min 0 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to add liquidity" -ForegroundColor Red
        continue
    }
    Write-Host "   ✅ Liquidity added" -ForegroundColor Green

    # Store pool info
    $deployedPools += @{
        Symbol = $token.Symbol
        TokenAddress = $token.Address
        PoolAddress = $poolAddress
    }

    Write-Host "✅ XLM/$($token.Symbol) Complete!" -ForegroundColor Green
}

# Generate output file
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📝 GENERATING POOL REGISTRY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$outputFile = "FIXED_LIQUIDITY_POOLS.env"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$output = @"
# Fixed Liquidity Pool Deployment Information
# Network: $Network
# Deployed: $timestamp
# Deployer: $deployerAddress
# Authorization Fix: Removed require_auth() and double transfer

"@

foreach ($pool in $deployedPools) {
    $output += "POOL_XLM_$($pool.Symbol)=$($pool.PoolAddress)`n"
}

$output += "`n# Pool Details:`n"
foreach ($pool in $deployedPools) {
    $output += "# XLM/$($pool.Symbol) Pool`n"
    $output += "#   Pool: $($pool.PoolAddress)`n"
    $output += "#   XLM: $XLM_ADDRESS`n"
    $output += "#   $($pool.Symbol): $($pool.TokenAddress)`n`n"
}

$output | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "`n✅ Pool registry saved to: $outputFile" -ForegroundColor Green
Write-Host "`n📊 DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Total Pools Deployed: $($deployedPools.Count)" -ForegroundColor Green

foreach ($pool in $deployedPools) {
    Write-Host "  ✓ XLM/$($pool.Symbol): $($pool.PoolAddress)" -ForegroundColor Gray
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update vault contract with new pool addresses" -ForegroundColor Gray
Write-Host "  2. Rebuild and upload new vault WASM" -ForegroundColor Gray
Write-Host "  3. Update factory with new WASM hash" -ForegroundColor Gray
Write-Host "  4. Test deposits with all custom tokens" -ForegroundColor Gray

Write-Host "`n✅ All done!" -ForegroundColor Green
