# Check Vault Initialization Status
# This script checks if a vault contract is properly initialized

param(
    [Parameter(Mandatory=$true)]
    [string]$VaultAddress
)

Write-Host "=== Checking Vault Initialization ===" -ForegroundColor Cyan
Write-Host "Vault Address: $VaultAddress" -ForegroundColor Yellow
Write-Host ""

# Check if vault has CONFIG storage
Write-Host "1. Checking CONFIG storage..." -ForegroundColor Cyan
try {
    $configResult = stellar contract invoke `
        --id $VaultAddress `
        --network testnet `
        -- `
        get_config
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CONFIG exists" -ForegroundColor Green
        Write-Host $configResult
    } else {
        Write-Host "❌ CONFIG missing or vault not initialized" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error reading CONFIG: $_" -ForegroundColor Red
}

Write-Host ""

# Check if vault has STATE storage
Write-Host "2. Checking STATE storage..." -ForegroundColor Cyan
try {
    $stateResult = stellar contract invoke `
        --id $VaultAddress `
        --network testnet `
        -- `
        get_state
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ STATE exists" -ForegroundColor Green
        Write-Host $stateResult
    } else {
        Write-Host "❌ STATE missing or vault not initialized" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error reading STATE: $_" -ForegroundColor Red
}

Write-Host ""

# Try to get vault info
Write-Host "3. Getting vault info..." -ForegroundColor Cyan
try {
    $infoResult = stellar contract invoke `
        --id $VaultAddress `
        --network testnet `
        -- `
        get_vault_info
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vault info retrieved" -ForegroundColor Green
        Write-Host $infoResult
    } else {
        Write-Host "❌ Could not get vault info" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error getting vault info: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Diagnosis Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If CONFIG or STATE is missing, the vault needs to be initialized with:" -ForegroundColor Yellow
Write-Host "stellar contract invoke --id $VaultAddress --network testnet --source <owner> -- initialize --config <config>" -ForegroundColor Gray
