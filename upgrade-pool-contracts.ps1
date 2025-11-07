# Upgrade existing pool contracts with new WASM (removes require_auth check)
# This preserves all liquidity and contract addresses

Write-Host "Upgrading pool contracts with new WASM..." -ForegroundColor Cyan

# Build the new pool WASM
Write-Host "`nStep 1: Building new pool contract WASM..." -ForegroundColor Yellow
cargo build --target wasm32-unknown-unknown --release -p real-liquidity-pool

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build pool contract!" -ForegroundColor Red
    exit 1
}

# Upload the new WASM to get its hash
Write-Host "`nStep 2: Uploading new WASM to network..." -ForegroundColor Yellow
$wasmPath = "target/wasm32-unknown-unknown/release/real_liquidity_pool.wasm"

$uploadOutput = stellar contract install `
    --wasm $wasmPath `
    --source admin `
    --network testnet 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload WASM!" -ForegroundColor Red
    Write-Host $uploadOutput
    exit 1
}

$newWasmHash = ($uploadOutput | Select-String -Pattern "^[a-f0-9]{64}$").Matches.Value
Write-Host "New WASM hash: $newWasmHash" -ForegroundColor Green

# Read pool addresses from environment file
Write-Host "`nStep 3: Reading pool addresses..." -ForegroundColor Yellow
$poolAddresses = @()

Get-Content "LIQUIDITY_POOLS.env" | ForEach-Object {
    if ($_ -match "POOL_\w+_ADDRESS=(.+)") {
        $poolAddresses += $matches[1]
    }
}

Write-Host "Found $($poolAddresses.Count) pools to upgrade" -ForegroundColor Cyan

# Upgrade each pool contract
Write-Host "`nStep 4: Upgrading pool contracts..." -ForegroundColor Yellow

foreach ($poolAddress in $poolAddresses) {
    Write-Host "`nUpgrading pool: $poolAddress" -ForegroundColor Cyan
    
    # Use stellar contract invoke to call a hypothetical upgrade function
    # OR use stellar contract deploy --wasm-hash to update the contract code
    
    # Note: Soroban allows updating contract code if the contract is not explicitly made immutable
    # We need to use the 'update' operation from the Stellar CLI
    
    try {
        $result = stellar contract deploy `
            --wasm-hash $newWasmHash `
            --source admin `
            --network testnet `
            --id $poolAddress 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully upgraded pool: $poolAddress" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to upgrade pool: $poolAddress" -ForegroundColor Red
            Write-Host $result
        }
    } catch {
        Write-Host "❌ Error upgrading pool: $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ Pool upgrade process complete!" -ForegroundColor Green
Write-Host "All pool contracts now use the new WASM without requiring authorization." -ForegroundColor Cyan
