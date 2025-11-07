#!/usr/bin/env pwsh
# Add more liquidity to existing fixed pools (9,900 more tokens each to reach 10,000 total)

param(
    [string]$Network = "testnet",
    [string]$DeployerIdentity = "deployer"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "ADDING LIQUIDITY TO FIXED POOLS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Load pool addresses
$PoolsEnvFile = "FIXED_LIQUIDITY_POOLS.env"
if (!(Test-Path $PoolsEnvFile)) {
    Write-Host "❌ Error: $PoolsEnvFile not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Loading pool addresses..." -ForegroundColor Yellow
$poolAddresses = @{}
Get-Content $PoolsEnvFile | ForEach-Object {
    if ($_ -match '^POOL_XLM_([A-Z]+)=([A-Z0-9]+)$') {
        $poolAddresses[$matches[1]] = $matches[2]
        Write-Host "  ✓ XLM/$($matches[1]): $($matches[2])" -ForegroundColor Gray
    }
}

# Get deployer address
Write-Host "`n📋 Getting deployer address..." -ForegroundColor Yellow
$deployerAddress = stellar keys address $DeployerIdentity 2>$null
if ([string]::IsNullOrEmpty($deployerAddress)) {
    Write-Host "❌ Error: Deployer identity '$DeployerIdentity' not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Deployer: $deployerAddress" -ForegroundColor Green

# Additional liquidity to add (9,900 tokens = 99,000,000,000 stroops)
$additionalLiquidity = 99000000000

Write-Host "`n💰 Adding $additionalLiquidity stroops (9,900 tokens) to each pool..." -ForegroundColor Cyan
Write-Host "Total per pool after: 10,000 tokens each side" -ForegroundColor Gray

foreach ($token in $poolAddresses.Keys) {
    $poolAddress = $poolAddresses[$token]
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🏊 XLM/$token Pool" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Pool: $poolAddress" -ForegroundColor Gray

    Write-Host "Adding liquidity..." -ForegroundColor Yellow
    $liquidityOutput = stellar contract invoke `
        --id $poolAddress `
        --source $DeployerIdentity `
        --network $Network `
        -- `
        add_liquidity `
        --user $deployerAddress `
        --amount_a_desired $additionalLiquidity `
        --amount_b_desired $additionalLiquidity `
        --amount_a_min 0 `
        --amount_b_min 0 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to add liquidity to XLM/$token" -ForegroundColor Red
        Write-Host $liquidityOutput -ForegroundColor Red
        continue
    }
    
    Write-Host "✅ Liquidity added to XLM/$token" -ForegroundColor Green
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ LIQUIDITY ADDITION COMPLETE" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Each pool now has 10,000 XLM + 10,000 custom tokens" -ForegroundColor Gray
Write-Host "Total: 100,000 XLM across 10 pools" -ForegroundColor Gray
