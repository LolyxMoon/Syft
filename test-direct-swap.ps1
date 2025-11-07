# Test XLM to AQX swap directly through the pool
# This verifies the liquidity pool works before trying vault deposits

$ErrorActionPreference = "Stop"

Write-Host "=== Testing XLM → AQX Swap ===" -ForegroundColor Cyan
Write-Host ""

# Addresses
$xlmAddress = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
$aqxAddress = "CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3"
$poolAddress = "CDNN77W7A4X3IKVENIKRQMUVBODUF3WRLUZYJ4WQYVNML6SVAORUVXFN"
$userAddress = stellar keys address deployer

Write-Host "Pool: $poolAddress" -ForegroundColor Yellow
Write-Host "User: $userAddress" -ForegroundColor Yellow
Write-Host ""

# Check pool reserves
Write-Host "1. Checking pool reserves..." -ForegroundColor Cyan
$reserves = stellar contract invoke `
    --id $poolAddress `
    --network testnet `
    --source deployer `
    -- `
    get_reserves

Write-Host "Reserves: $reserves" -ForegroundColor Green
Write-Host ""

# Check user XLM balance before
Write-Host "2. Checking XLM balance..." -ForegroundColor Cyan
$xlmBefore = stellar contract invoke `
    --id $xlmAddress `
    --network testnet `
    --source deployer `
    -- `
    balance `
    --id $userAddress

Write-Host "XLM Balance: $xlmBefore" -ForegroundColor Green
Write-Host ""

# Check user AQX balance before
Write-Host "3. Checking AQX balance..." -ForegroundColor Cyan
$aqxBefore = stellar contract invoke `
    --id $aqxAddress `
    --network testnet `
    --source deployer `
    -- `
    balance `
    --account $userAddress

Write-Host "AQX Balance: $aqxBefore" -ForegroundColor Green
Write-Host ""

# Approve pool to spend XLM
Write-Host "4. Approving pool to spend 10000000 stroops (1 XLM)..." -ForegroundColor Cyan
stellar contract invoke `
    --id $xlmAddress `
    --network testnet `
    --source deployer `
    --send yes `
    -- `
    approve `
    --from $userAddress `
    --spender $poolAddress `
    --amount 10000000 `
    --expiration_ledger 99999999

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Approval failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Approved" -ForegroundColor Green
Write-Host ""

# Execute swap
Write-Host "5. Executing swap: 1 XLM → AQX..." -ForegroundColor Cyan
Write-Host "Calling: swap(user, token_in, amount_in, amount_out_min)" -ForegroundColor Gray

$swapResult = stellar contract invoke `
    --id $poolAddress `
    --network testnet `
    --source deployer `
    --send yes `
    -- `
    swap `
    --user $userAddress `
    --token_in $xlmAddress `
    --amount_in 10000000 `
    --amount_out_min 0

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Swap failed" -ForegroundColor Red
    Write-Host $swapResult
    exit 1
}

Write-Host "✅ Swap executed!" -ForegroundColor Green
Write-Host "Amount out: $swapResult" -ForegroundColor Green
Write-Host ""

# Check balances after
Write-Host "6. Checking balances after swap..." -ForegroundColor Cyan
$xlmAfter = stellar contract invoke `
    --id $xlmAddress `
    --network testnet `
    --source deployer `
    -- `
    balance `
    --id $userAddress

$aqxAfter = stellar contract invoke `
    --id $aqxAddress `
    --network testnet `
    --source deployer `
    -- `
    balance `
    --account $userAddress

Write-Host "XLM Balance: $xlmBefore → $xlmAfter" -ForegroundColor Green
Write-Host "AQX Balance: $aqxBefore → $aqxAfter" -ForegroundColor Green
Write-Host ""
Write-Host "=== Swap Test Complete ===" -ForegroundColor Cyan
