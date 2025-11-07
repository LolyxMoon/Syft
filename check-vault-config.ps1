# Check Vault Configuration
# Shows what router, factory, and assets the vault is configured with

param(
    [Parameter(Mandatory=$true)]
    [string]$VaultAddress
)

$ErrorActionPreference = "Continue"

Write-Host "=== Vault Configuration Check ===" -ForegroundColor Cyan
Write-Host "Vault: $VaultAddress" -ForegroundColor Yellow
Write-Host ""

# Get vault config
Write-Host "Fetching vault configuration..." -ForegroundColor Cyan
$config = stellar contract invoke `
    --id $VaultAddress `
    --network testnet `
    --source deployer `
    -- `
    get_config

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Config retrieved:" -ForegroundColor Green
    Write-Host $config -ForegroundColor Gray
    Write-Host ""
    
    # Parse the config to extract key info
    if ($config -match 'router_address.*?:\s*Some\(([^)]+)\)') {
        $router = $matches[1]
        Write-Host "Router Address: $router" -ForegroundColor Yellow
    } elseif ($config -match 'router_address.*?:\s*None') {
        Write-Host "⚠️  Router Address: NOT SET" -ForegroundColor Red
        Write-Host "   The vault cannot perform swaps without a router!" -ForegroundColor Red
    }
    
    if ($config -match 'factory_address.*?:\s*Some\(([^)]+)\)') {
        $factory = $matches[1]
        Write-Host "Factory Address: $factory" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ Failed to get config" -ForegroundColor Red
    Write-Host $config
}

Write-Host ""

# Get vault state
Write-Host "Fetching vault state..." -ForegroundColor Cyan
$state = stellar contract invoke `
    --id $VaultAddress `
    --network testnet `
    --source deployer `
    -- `
    get_state

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ State retrieved:" -ForegroundColor Green
    Write-Host $state -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to get state" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Check Complete ===" -ForegroundColor Cyan
