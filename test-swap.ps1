#!/usr/bin/env pwsh
# Test Swap: XLM -> AQX
# Tests a real swap through the XLM/AQX liquidity pool

param(
    [string]$Network = "testnet",
    [string]$UserIdentity = "deployer",
    [string]$AmountIn = "10000000"  # 1 XLM (with 7 decimals)
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔄 TESTING SWAP: XLM -> AQX" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Addresses
$XLM_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
$AQX_ADDRESS = "CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3"
$POOL_ADDRESS = "CDNN77W7A4X3IKVENIKRQMUVBODUF3WRLUZYJ4WQYVNML6SVAORUVXFN"

# Get user address
$userAddress = stellar keys address $UserIdentity 2>$null
Write-Host "`n👤 User: $userAddress" -ForegroundColor Green
Write-Host "💰 Swapping: $([decimal]$AmountIn / 10000000) XLM" -ForegroundColor Yellow

# Step 1: Check initial balances
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 INITIAL BALANCES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`nChecking XLM balance..."
$xlmBalanceOutput = stellar contract invoke `
    --id $XLM_ADDRESS `
    --network $Network `
    --source $UserIdentity `
    -- `
    balance `
    --id $userAddress 2>&1

if ($LASTEXITCODE -eq 0) {
    $xlmBalance = ($xlmBalanceOutput | Select-String -Pattern '\d+' | ForEach-Object { $_.Matches[0].Value })
    Write-Host "✅ XLM Balance: $([decimal]$xlmBalance / 10000000)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not fetch XLM balance" -ForegroundColor Yellow
}

Write-Host "`nChecking AQX balance..."
$aqxBalanceBefore = stellar contract invoke `
    --id $AQX_ADDRESS `
    --network $Network `
    --source $UserIdentity `
    -- `
    balance `
    --id $userAddress 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ AQX Balance: $([decimal]$aqxBalanceBefore / 10000000)" -ForegroundColor Green
} else {
    Write-Host "⚠️  AQX Balance: 0 (no balance yet)" -ForegroundColor Yellow
    $aqxBalanceBefore = "0"
}

# Step 2: Check pool reserves
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🏊 POOL RESERVES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$reserves = stellar contract invoke `
    --id $POOL_ADDRESS `
    --network $Network `
    --source $UserIdentity `
    -- `
    get_reserves 2>&1

Write-Host "Reserves: $reserves" -ForegroundColor Gray

# Step 3: Approve pool to spend XLM
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ APPROVING SWAP" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`nApproving pool to spend XLM..."
$approve = stellar contract invoke `
    --id $XLM_ADDRESS `
    --network $Network `
    --source $UserIdentity `
    -- `
    approve `
    --from $userAddress `
    --spender $POOL_ADDRESS `
    --amount $AmountIn `
    --expiration_ledger 2000000 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Approval successful" -ForegroundColor Green
} else {
    Write-Host "❌ Approval failed: $approve" -ForegroundColor Red
    exit 1
}

# Step 4: Execute swap
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔄 EXECUTING SWAP" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`nSwapping $([decimal]$AmountIn / 10000000) XLM for AQX..."
Write-Host "Pool: $POOL_ADDRESS" -ForegroundColor Gray

$swap = stellar contract invoke `
    --id $POOL_ADDRESS `
    --network $Network `
    --source $UserIdentity `
    -- `
    swap `
    --user $userAddress `
    --token_in $XLM_ADDRESS `
    --amount_in $AmountIn `
    --amount_out_min "1" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SWAP SUCCESSFUL!" -ForegroundColor Green
    Write-Host "   Output: $swap" -ForegroundColor White
} else {
    Write-Host "❌ SWAP FAILED!" -ForegroundColor Red
    Write-Host "   Error: $swap" -ForegroundColor Red
    exit 1
}

# Step 5: Check final balances
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 FINAL BALANCES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`nChecking XLM balance..."
$xlmBalanceAfter = stellar contract invoke `
    --id $XLM_ADDRESS `
    --network $Network `
    --source $UserIdentity `
    -- `
    balance `
    --id $userAddress 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ XLM Balance: $([decimal]$xlmBalanceAfter / 10000000)" -ForegroundColor Green
}

Write-Host "`nChecking AQX balance..."
$aqxBalanceAfter = stellar contract invoke `
    --id $AQX_ADDRESS `
    --network $Network `
    --source $UserIdentity `
    -- `
    balance `
    --id $userAddress 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ AQX Balance: $([decimal]$aqxBalanceAfter / 10000000)" -ForegroundColor Green
    
    # Calculate received amount
    $aqxReceived = [decimal]$aqxBalanceAfter - [decimal]$aqxBalanceBefore
    Write-Host "`n💰 AQX Received: $($aqxReceived / 10000000)" -ForegroundColor Cyan
    
    # Calculate effective price
    $effectivePrice = ([decimal]$AmountIn / 10000000) / ($aqxReceived / 10000000)
    Write-Host "💵 Effective Price: $effectivePrice XLM per AQX" -ForegroundColor Cyan
}

# Step 6: Check pool reserves after swap
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🏊 POOL RESERVES AFTER SWAP" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$reservesAfter = stellar contract invoke `
    --id $POOL_ADDRESS `
    --network $Network `
    --source $UserIdentity `
    -- `
    get_reserves 2>&1

Write-Host "Reserves: $reservesAfter" -ForegroundColor Gray

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "✅ SWAP TEST COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "`n🎉 Your real liquidity pool is working!" -ForegroundColor Cyan
Write-Host "💡 You can now use these tokens in VaultBuilder!" -ForegroundColor Yellow
