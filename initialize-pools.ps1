#!/usr/bin/env pwsh
# Initialize Liquidity Pools with Initial Liquidity
# Adds liquidity to all deployed pools to enable swapping

param(
    [string]$Network = "testnet",
    [string]$DeployerIdentity = "deployer",
    [string]$PoolsEnvFile = "LIQUIDITY_POOLS.env",
    [string]$TokensEnvFile = "CUSTOM_TOKENS.env"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "INITIALIZING LIQUIDITY POOLS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Load pool addresses
if (!(Test-Path $PoolsEnvFile)) {
    Write-Host "❌ Error: $PoolsEnvFile not found!" -ForegroundColor Red
    Write-Host "Please run deploy-liquidity-pools.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Load token addresses
if (!(Test-Path $TokensEnvFile)) {
    Write-Host "❌ Error: $TokensEnvFile not found!" -ForegroundColor Red
    Write-Host "Please run deploy-custom-tokens.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📋 Loading addresses..." -ForegroundColor Yellow

$poolAddresses = @{}
Get-Content $PoolsEnvFile | ForEach-Object {
    if ($_ -match '^POOL_([A-Z_]+)=([A-Z0-9]+)$') {
        $poolAddresses[$matches[1]] = $matches[2]
        Write-Host "  ✓ Pool $($matches[1]): $($matches[2])" -ForegroundColor Gray
    }
}

$tokenAddresses = @{}
Get-Content $TokensEnvFile | ForEach-Object {
    if ($_ -match '^([A-Z_]+)_ADDRESS=([A-Z0-9]+)$') {
        $tokenAddresses[$matches[1]] = $matches[2]
    }
}

# Get XLM address
$XLM_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

# Get deployer address
Write-Host "`n📋 Getting deployer address..." -ForegroundColor Yellow
$deployerAddress = stellar keys address $DeployerIdentity 2>$null
if ([string]::IsNullOrEmpty($deployerAddress)) {
    Write-Host "❌ Error: Deployer identity '$DeployerIdentity' not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Deployer: $deployerAddress" -ForegroundColor Green

# Define liquidity amounts (with 7 decimals) - 10 token pools
$liquidityConfigs = @(
    @{
        PoolKey = "XLM_AQX"
        TokenA = "XLM"
        TokenAAddress = $XLM_ADDRESS
        TokenB = "AQX"
        TokenBAddress = $tokenAddresses["AQX"]
        AmountA = "100000000000" # 10,000 XLM
        AmountB = "100000000000" # 10,000 AQX
    },
    @{
        PoolKey = "XLM_VLTK"
        TokenA = "XLM"
        TokenAAddress = $XLM_ADDRESS
        TokenB = "VLTK"
        TokenBAddress = $tokenAddresses["VLTK"]
        AmountA = "100000000000" # 10,000 XLM
        AmountB = "100000000000" # 10,000 VLTK
    },
    @{
        PoolKey = "XLM_SLX"
        TokenA = "XLM"
        TokenAAddress = $XLM_ADDRESS
        TokenB = "SLX"
        TokenBAddress = $tokenAddresses["SLX"]
        AmountA = "100000000000" # 10,000 XLM
        AmountB = "100000000000" # 10,000 SLX
    },
    @{
        PoolKey = "XLM_WRX"
        TokenA = "XLM"
        TokenAAddress = $XLM_ADDRESS
        TokenB = "WRX"
        TokenBAddress = $tokenAddresses["WRX"]
        AmountA = "100000000000" # 10,000 XLM
        AmountB = "100000000000" # 10,000 WRX
    },
    @{
        PoolKey = "XLM_SIXN"
        TokenA = "XLM"
        TokenAAddress = $XLM_ADDRESS
        TokenB = "SIXN"
        TokenBAddress = $tokenAddresses["SIXN"]
        AmountA = "100000000000" # 10,000 XLM
        AmountB = "100000000000" # 10,000 SIXN
    },
    @{
        PoolKey = "XLM_MBIUS"
        TokenA = "XLM"
        TokenAAddress = $XLM_ADDRESS
        TokenB = "MBIUS"
        TokenBAddress = $tokenAddresses["MBIUS"]
        AmountA = "100000000000" # 10,000 XLM
        AmountB = "100000000000" # 10,000 MBIUS
    },
    @{
        PoolKey = "XLM_TRIO"
        TokenA = "XLM"
        TokenAAddress = $XLM_ADDRESS
        TokenB = "TRIO"
        TokenBAddress = $tokenAddresses["TRIO"]
        AmountA = "100000000000" # 10,000 XLM
        AmountB = "100000000000" # 10,000 TRIO
    },
    @{
        PoolKey = "XLM_RELIO"
        TokenA = "XLM"
        TokenAAddress = $XLM_ADDRESS
        TokenB = "RELIO"
        TokenBAddress = $tokenAddresses["RELIO"]
        AmountA = "100000000000" # 10,000 XLM
        AmountB = "100000000000" # 10,000 RELIO
    },
    @{
        PoolKey = "XLM_TRI"
        TokenA = "XLM"
        TokenAAddress = $XLM_ADDRESS
        TokenB = "TRI"
        TokenBAddress = $tokenAddresses["TRI"]
        AmountA = "100000000000" # 10,000 XLM
        AmountB = "100000000000" # 10,000 TRI
    },
    @{
        PoolKey = "XLM_NUMER"
        TokenA = "XLM"
        TokenAAddress = $XLM_ADDRESS
        TokenB = "NUMER"
        TokenBAddress = $tokenAddresses["NUMER"]
        AmountA = "100000000000" # 10,000 XLM
        AmountB = "100000000000" # 10,000 NUMER
    }
)

$successfulPools = @()

foreach ($config in $liquidityConfigs) {
    $poolAddress = $poolAddresses[$config.PoolKey]
    
    if ([string]::IsNullOrEmpty($poolAddress)) {
        Write-Host "`n⚠️  Skipping $($config.TokenA)/$($config.TokenB) - Pool not found" -ForegroundColor Yellow
        continue
    }

    if ([string]::IsNullOrEmpty($config.TokenBAddress)) {
        Write-Host "`n⚠️  Skipping $($config.TokenA)/$($config.TokenB) - Token not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "💧 Adding Liquidity: $($config.TokenA)/$($config.TokenB)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Pool: $poolAddress" -ForegroundColor White

    # Step 1: Mint tokens to deployer (for custom tokens)
    if ($config.TokenB -ne "XLM") {
        Write-Host "`n1️⃣  Minting $($config.TokenB) tokens to deployer..." -ForegroundColor Yellow
        $mintOutput = stellar contract invoke `
            --id $config.TokenBAddress `
            --network $Network `
            --source $DeployerIdentity `
            -- `
            mint `
            --to $deployerAddress `
            --amount $config.AmountB 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Mint warning (may already have tokens):" -ForegroundColor Yellow
            Write-Host $mintOutput -ForegroundColor Gray
        } else {
            Write-Host "✅ Minted $([decimal]$config.AmountB / 10000000) $($config.TokenB)" -ForegroundColor Green
        }
    }

    # Step 2: Approve pool to spend tokens
    Write-Host "`n2️⃣  Approving pool to spend tokens..." -ForegroundColor Yellow
    
    # Get current ledger for approval expiration
    $currentLedger = 1000000 # Use a large number for testnet
    
    # Approve Token A (XLM)
    $approveAOutput = stellar contract invoke `
        --id $config.TokenAAddress `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        approve `
        --from $deployerAddress `
        --spender $poolAddress `
        --amount $config.AmountA `
        --expiration_ledger $currentLedger 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Warning approving $($config.TokenA):" -ForegroundColor Yellow
        Write-Host $approveAOutput -ForegroundColor Gray
    } else {
        Write-Host "✅ Approved $($config.TokenA)" -ForegroundColor Green
    }

    # Approve Token B
    $approveBOutput = stellar contract invoke `
        --id $config.TokenBAddress `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        approve `
        --from $deployerAddress `
        --spender $poolAddress `
        --amount $config.AmountB `
        --expiration_ledger $currentLedger 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Warning approving $($config.TokenB):" -ForegroundColor Yellow
        Write-Host $approveBOutput -ForegroundColor Gray
    } else {
        Write-Host "✅ Approved $($config.TokenB)" -ForegroundColor Green
    }

    # Step 3: Add liquidity to pool
    Write-Host "`n3️⃣  Adding liquidity to pool..." -ForegroundColor Yellow
    Write-Host "   Amount A: $([decimal]$config.AmountA / 10000000) $($config.TokenA)" -ForegroundColor White
    Write-Host "   Amount B: $([decimal]$config.AmountB / 10000000) $($config.TokenB)" -ForegroundColor White

    $minAmount = [Math]::Floor([decimal]$config.AmountA * 0.95) # 5% slippage tolerance

    $addLiqOutput = stellar contract invoke `
        --id $poolAddress `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        add_liquidity `
        --user $deployerAddress `
        --amount_a_desired $config.AmountA `
        --amount_b_desired $config.AmountB `
        --amount_a_min $minAmount `
        --amount_b_min $minAmount 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to add liquidity:" -ForegroundColor Red
        Write-Host $addLiqOutput -ForegroundColor Red
        continue
    }

    Write-Host "✅ Liquidity added successfully!" -ForegroundColor Green

    # Step 4: Verify pool reserves
    Write-Host "`n4️⃣  Verifying pool reserves..." -ForegroundColor Yellow
    $reservesOutput = stellar contract invoke `
        --id $poolAddress `
        --network $Network `
        -- `
        get_reserves 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Pool reserves:" -ForegroundColor Green
        Write-Host $reservesOutput -ForegroundColor Gray
    }

    $successfulPools += @{
        Pair = "$($config.TokenA)/$($config.TokenB)"
        PoolAddress = $poolAddress
        ReserveA = $config.AmountA
        ReserveB = $config.AmountB
    }

    Write-Host "`n✅ $($config.TokenA)/$($config.TokenB) pool is ready for swaps!" -ForegroundColor Green
}

# Summary
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🎉 LIQUIDITY INITIALIZATION COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nActive Pools with Liquidity:" -ForegroundColor Yellow

foreach ($pool in $successfulPools) {
    Write-Host "  ✅ $($pool.Pair)" -ForegroundColor Green
    Write-Host "     Pool: $($pool.PoolAddress)" -ForegroundColor White
    Write-Host "     Reserve A: $([decimal]$pool.ReserveA / 10000000)" -ForegroundColor White
    Write-Host "     Reserve B: $([decimal]$pool.ReserveB / 10000000)" -ForegroundColor White
}

if ($successfulPools.Count -eq 0) {
    Write-Host "  ⚠️  No pools were successfully initialized" -ForegroundColor Yellow
} else {
    Write-Host "`n✨ Your custom tokens are now fully functional!" -ForegroundColor Green
    Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Update backend/src/config/tokenAddresses.ts" -ForegroundColor White
    Write-Host "2. Configure your vaults to use these pools for swaps" -ForegroundColor White
    Write-Host "3. Test swaps: stellar contract invoke --id <POOL> --network $Network -- swap ..." -ForegroundColor White
    Write-Host "4. Build vaults in the VaultBuilder with your new tokens!" -ForegroundColor White
}
