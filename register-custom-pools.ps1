# Register Custom Token Pools with Vault
# This script registers all custom token liquidity pools with the vault contract
# so it can properly route swaps through the custom pools

# Load environment variables
Write-Host "Loading environment variables..." -ForegroundColor Cyan

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

# Get vault address from user or environment
$vaultAddress = $env:VAULT_ADDRESS
if (-not $vaultAddress) {
    Write-Host "Enter the Vault Contract Address:" -ForegroundColor Yellow
    $vaultAddress = Read-Host
}

if (-not $vaultAddress) {
    Write-Host "Error: No vault address provided!" -ForegroundColor Red
    exit 1
}

Write-Host "`nVault Address: $vaultAddress" -ForegroundColor Green
Write-Host "Found $($customTokens.Count) custom tokens" -ForegroundColor Cyan
Write-Host "Found $($liquidityPools.Count) liquidity pools" -ForegroundColor Cyan

# Register each custom token pool
Write-Host "`nRegistering custom token pools..." -ForegroundColor Cyan

$successCount = 0
$failCount = 0

foreach ($tokenName in $customTokens.Keys) {
    $tokenAddress = $customTokens[$tokenName]
    $poolAddress = $liquidityPools[$tokenName]
    
    if (-not $poolAddress) {
        Write-Host "  [SKIP] $tokenName - No pool found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "`n  Registering $tokenName..." -ForegroundColor White
    Write-Host "    Token: $tokenAddress" -ForegroundColor Gray
    Write-Host "    Pool:  $poolAddress" -ForegroundColor Gray
    
    try {
        # Call register_custom_pool function
        stellar contract invoke `
            --id $vaultAddress `
            --network testnet `
            --source deployer `
            -- `
            register_custom_pool `
            --caller $(stellar keys address deployer) `
            --token_address $tokenAddress `
            --pool_address $poolAddress
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ Registered successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "    ✗ Registration failed" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "    ✗ Error: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Registration Complete!" -ForegroundColor Green
Write-Host "  Success: $successCount" -ForegroundColor Green
Write-Host "  Failed:  $failCount" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan

# Save vault address to env file for future use
if (-not (Test-Path "VAULT.env")) {
    "VAULT_ADDRESS=$vaultAddress" | Out-File -FilePath "VAULT.env" -Encoding utf8
    Write-Host "`nVault address saved to VAULT.env" -ForegroundColor Green
}
