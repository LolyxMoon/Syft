# Vault Contract State Diagnostic and Repair Tool
# This script helps diagnose and fix vault initialization issues

param(
    [Parameter(Mandatory=$false)]
    [string]$VaultAddress,
    
    [Parameter(Mandatory=$false)]
    [switch]$ListAll,
    
    [Parameter(Mandatory=$false)]
    [switch]$Reinitialize
)

$ErrorActionPreference = "Continue"

function Test-VaultInitialization {
    param([string]$Address)
    
    Write-Host "`n=== Checking Vault: $Address ===" -ForegroundColor Cyan
    
    $status = @{
        Address = $Address
        ConfigExists = $false
        StateExists = $false
        Initialized = $false
    }
    
    # Check CONFIG
    Write-Host "Checking CONFIG..." -ForegroundColor Gray
    try {
        $config = stellar contract invoke `
            --id $Address `
            --network testnet `
            --source deployer `
            -- `
            get_config 2>&1
        
        if ($LASTEXITCODE -eq 0 -and $config -notlike "*error*" -and $config -notlike "*Error*") {
            Write-Host "  ✅ CONFIG exists" -ForegroundColor Green
            $status.ConfigExists = $true
        } else {
            Write-Host "  ❌ CONFIG missing: $config" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Error reading CONFIG: $_" -ForegroundColor Red
    }
    
    # Check STATE
    Write-Host "Checking STATE..." -ForegroundColor Gray
    try {
        $state = stellar contract invoke `
            --id $Address `
            --network testnet `
            --source deployer `
            -- `
            get_state 2>&1
        
        if ($LASTEXITCODE -eq 0 -and $state -notlike "*error*" -and $state -notlike "*Error*") {
            Write-Host "  ✅ STATE exists" -ForegroundColor Green
            $status.StateExists = $true
        } else {
            Write-Host "  ❌ STATE missing: $state" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Error reading STATE: $_" -ForegroundColor Red
    }
    
    $status.Initialized = $status.ConfigExists -and $status.StateExists
    
    if ($status.Initialized) {
        Write-Host "`n✅ Vault is properly initialized" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Vault is NOT initialized properly" -ForegroundColor Red
        Write-Host "   Missing:" -ForegroundColor Yellow
        if (-not $status.ConfigExists) { Write-Host "   - CONFIG storage" -ForegroundColor Yellow }
        if (-not $status.StateExists) { Write-Host "   - STATE storage" -ForegroundColor Yellow }
    }
    
    return $status
}

# Main execution
Write-Host "=== Vault Contract State Diagnostic Tool ===" -ForegroundColor Cyan
Write-Host ""

if ($ListAll) {
    Write-Host "Fetching all vaults from database..." -ForegroundColor Yellow
    # TODO: Add database query here to list all vaults
    Write-Host "Database query not implemented. Please provide vault address manually." -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrEmpty($VaultAddress)) {
    Write-Host "Error: Please provide a vault address with -VaultAddress parameter" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\check-vault-state.ps1 -VaultAddress <address>" -ForegroundColor Gray
    Write-Host "  .\check-vault-state.ps1 -VaultAddress <address> -Reinitialize" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Test the vault
$result = Test-VaultInitialization -Address $VaultAddress

if (-not $result.Initialized -and $Reinitialize) {
    Write-Host "`n=== Attempting to Reinitialize Vault ===" -ForegroundColor Cyan
    Write-Host "WARNING: This will overwrite existing vault configuration!" -ForegroundColor Red
    Write-Host ""
    
    $confirm = Read-Host "Type 'yes' to continue"
    if ($confirm -eq "yes") {
        Write-Host "Reinitialization not implemented. Please initialize manually:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "stellar contract invoke --id $VaultAddress --network testnet --source <owner> -- initialize --config <config>" -ForegroundColor Gray
    } else {
        Write-Host "Cancelled." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
