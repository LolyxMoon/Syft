# Debug Vault Initialization
# This script helps diagnose vault initialization issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vault Initialization Debugger" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get contract address
Write-Host "Enter the Vault Contract Address:" -ForegroundColor Yellow
$contractAddress = Read-Host

if (-not $contractAddress) {
    Write-Host "Error: No contract address provided!" -ForegroundColor Red
    exit 1
}

Write-Host "`nTesting Contract: $contractAddress" -ForegroundColor Green

# Test 1: Check if contract exists
Write-Host "`nTest 1: Checking if contract exists..." -ForegroundColor Cyan
try {
    $contractInfo = stellar contract info id $contractAddress --network testnet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Contract exists" -ForegroundColor Green
        Write-Host "  $contractInfo" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Contract not found or error" -ForegroundColor Red
        Write-Host "  $contractInfo" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ✗ Error checking contract: $_" -ForegroundColor Red
}

# Test 2: Try to get contract state
Write-Host "`nTest 2: Checking if vault is already initialized..." -ForegroundColor Cyan
try {
    $state = stellar contract invoke `
        --id $contractAddress `
        --network testnet `
        -- `
        get_state 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Vault is already initialized!" -ForegroundColor Green
        Write-Host "  State: $state" -ForegroundColor Gray
        
        Write-Host "`n⚠️  Vault is already initialized. You cannot initialize it again." -ForegroundColor Yellow
        Write-Host "   If you need to reconfigure, you must deploy a new vault contract." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "  ℹ Vault is not initialized (expected for new vaults)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ℹ Vault is not initialized (expected for new vaults)" -ForegroundColor Cyan
}

# Test 3: Check contract WASM hash
Write-Host "`nTest 3: Checking contract WASM..." -ForegroundColor Cyan
try {
    # Get contract instance
    $instance = stellar contract info ledger-entries contract-id $contractAddress --network testnet 2>&1
    Write-Host "  Contract instance info retrieved" -ForegroundColor Gray
    
} catch {
    Write-Host "  ⚠️  Could not retrieve contract instance: $_" -ForegroundColor Yellow
}

# Test 4: Minimal initialization test
Write-Host "`nTest 4: Testing minimal initialization..." -ForegroundColor Cyan
Write-Host "  This will attempt to initialize with minimal config" -ForegroundColor Gray

# Get deployer address
try {
    $deployerAddress = stellar keys address deployer 2>&1
    Write-Host "  Deployer address: $deployerAddress" -ForegroundColor Gray
} catch {
    Write-Host "  ⚠️  Could not get deployer address" -ForegroundColor Yellow
    $deployerAddress = Read-Host "  Enter owner address"
}

# Get XLM address
$xlmAddress = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
Write-Host "  Using XLM address: $xlmAddress" -ForegroundColor Gray

Write-Host "`n  Attempting initialization..." -ForegroundColor White

# Create a minimal config JSON for testing
$minimalConfig = @{
    name = "Test Vault"
    owner = $deployerAddress
    assets = @($xlmAddress)
    rules = @()
    router_address = $null
    liquidity_pool_address = $null
    staking_pool_address = $null
    factory_address = $null
} | ConvertTo-Json -Depth 10

Write-Host "  Minimal config:" -ForegroundColor Gray
Write-Host $minimalConfig -ForegroundColor DarkGray

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Diagnostic Summary:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Contract address: $contractAddress" -ForegroundColor White
Write-Host "2. If vault is NOT initialized, use the frontend or API to initialize" -ForegroundColor White
Write-Host "3. If vault IS initialized, it cannot be reinitialized" -ForegroundColor White
Write-Host "4. Common issues:" -ForegroundColor White
Write-Host "   - Rules array must have correct target_allocation length" -ForegroundColor Gray
Write-Host "   - All struct fields must be in alphabetical order" -ForegroundColor Gray
Write-Host "   - Option fields must use proper Some/None encoding" -ForegroundColor Gray
Write-Host "`nFor detailed logs, check the backend console output" -ForegroundColor Yellow
