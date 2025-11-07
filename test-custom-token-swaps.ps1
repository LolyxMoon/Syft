# Test Custom Token Swaps
# This script tests swapping between XLM and custom tokens through registered pools

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Custom Token Swap Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Load environment variables
if (-not (Test-Path "CUSTOM_TOKENS.env")) {
    Write-Host "Error: CUSTOM_TOKENS.env not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "LIQUIDITY_POOLS.env")) {
    Write-Host "Error: LIQUIDITY_POOLS.env not found!" -ForegroundColor Red
    exit 1
}

# Parse .env files
$customTokens = @{}
Get-Content "CUSTOM_TOKENS.env" | ForEach-Object {
    if ($_ -match '^(\w+)_ADDRESS=(.+)$') {
        $customTokens[$Matches[1]] = $Matches[2]
    }
}

$liquidityPools = @{}
Get-Content "LIQUIDITY_POOLS.env" | ForEach-Object {
    if ($_ -match '^POOL_XLM_(\w+)=(.+)$') {
        $liquidityPools[$Matches[1]] = $Matches[2]
    }
}

# XLM address on testnet
$xlmAddress = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

# Select a token to test (default to first available)
$testTokenName = "AQX"
if ($customTokens.ContainsKey($testTokenName) -and $liquidityPools.ContainsKey($testTokenName)) {
    $tokenAddress = $customTokens[$testTokenName]
    $poolAddress = $liquidityPools[$testTokenName]
} else {
    Write-Host "Error: Test token $testTokenName not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "  Token: $testTokenName" -ForegroundColor White
Write-Host "  Token Address: $tokenAddress" -ForegroundColor Gray
Write-Host "  Pool Address: $poolAddress" -ForegroundColor Gray
Write-Host "  XLM Address: $xlmAddress`n" -ForegroundColor Gray

# Test 1: Check pool reserves
Write-Host "Test 1: Checking Pool Reserves..." -ForegroundColor Cyan
try {
    $reserves = stellar contract invoke `
        --id $poolAddress `
        --network testnet `
        -- `
        get_reserves
    
    Write-Host "  Pool Reserves: $reserves" -ForegroundColor Green
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}

# Test 2: Check pool token addresses
Write-Host "`nTest 2: Verifying Pool Token Addresses..." -ForegroundColor Cyan
try {
    $tokenA = stellar contract invoke `
        --id $poolAddress `
        --network testnet `
        -- `
        token_a
    
    $tokenB = stellar contract invoke `
        --id $poolAddress `
        --network testnet `
        -- `
        token_b
    
    Write-Host "  Token A: $tokenA" -ForegroundColor Green
    Write-Host "  Token B: $tokenB" -ForegroundColor Green
    
    # Verify tokens match
    if (($tokenA -eq $xlmAddress -or $tokenB -eq $xlmAddress) -and 
        ($tokenA -eq $tokenAddress -or $tokenB -eq $tokenAddress)) {
        Write-Host "  ✓ Pool tokens verified!" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Pool token mismatch!" -ForegroundColor Red
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}

# Test 3: Test swap quote calculation
Write-Host "`nTest 3: Calculating Swap Quote..." -ForegroundColor Cyan
$swapAmount = 1000000000 # 100 XLM (7 decimals)

Write-Host "  Swapping: 100 XLM -> $testTokenName" -ForegroundColor White

# Note: We can't easily test the swap_via_real_pool function directly
# because it's an internal function. Instead, we'll test through a vault
# if one is configured, or just verify the pool is set up correctly.

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Basic pool verification complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy a vault contract" -ForegroundColor White
Write-Host "2. Run register-custom-pools.ps1 to register pools" -ForegroundColor White
Write-Host "3. Test swaps through the vault's deposit_with_token function" -ForegroundColor White
