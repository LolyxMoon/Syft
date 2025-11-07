#!/usr/bin/env pwsh
# Initialize Custom Tokens and Liquidity Pools
# Run this after deployment to complete initialization

param(
    [string]$Network = "testnet",
    [string]$DeployerIdentity = "deployer"
)

$ErrorActionPreference = "Continue"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "INITIALIZING TOKENS AND POOLS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Get deployer address
$deployerAddress = stellar keys address $DeployerIdentity 2>$null
if ([string]::IsNullOrEmpty($deployerAddress)) {
    Write-Host "❌ Error: Deployer identity '$DeployerIdentity' not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Deployer: $deployerAddress" -ForegroundColor Green

# Load token addresses
if (-not (Test-Path "CUSTOM_TOKENS.env")) {
    Write-Host "❌ CUSTOM_TOKENS.env not found. Run deploy-custom-tokens.ps1 first." -ForegroundColor Red
    exit 1
}

$tokenAddresses = @{}
Get-Content "CUSTOM_TOKENS.env" | ForEach-Object {
    if ($_ -match '^(\w+)_ADDRESS=(.+)$') {
        $tokenAddresses[$matches[1]] = $matches[2]
    }
}

# Token configurations
$tokens = @(
    @{ Symbol = "AQX"; Name = "Aquarius Exchange"; Decimals = 7; InitialSupply = "100000000000000" },
    @{ Symbol = "VLTK"; Name = "Velocity Token"; Decimals = 7; InitialSupply = "50000000000000" },
    @{ Symbol = "SLX"; Name = "SmartLux Token"; Decimals = 7; InitialSupply = "30000000000000" },
    @{ Symbol = "WRX"; Name = "WireX Finance"; Decimals = 7; InitialSupply = "20000000000000" },
    @{ Symbol = "SIXN"; Name = "SixNet Protocol"; Decimals = 7; InitialSupply = "50000000000000" },
    @{ Symbol = "MBIUS"; Name = "Mobius Finance"; Decimals = 7; InitialSupply = "25000000000000" },
    @{ Symbol = "TRIO"; Name = "Trion Network"; Decimals = 7; InitialSupply = "15000000000000" },
    @{ Symbol = "RELIO"; Name = "Relio Network"; Decimals = 7; InitialSupply = "10000000000000" },
    @{ Symbol = "TRI"; Name = "Trident Token"; Decimals = 7; InitialSupply = "40000000000000" },
    @{ Symbol = "NUMER"; Name = "Numerico Finance"; Decimals = 7; InitialSupply = "35000000000000" }
)

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "INITIALIZING TOKENS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

foreach ($token in $tokens) {
    $contractId = $tokenAddresses[$token.Symbol]
    
    if ([string]::IsNullOrEmpty($contractId)) {
        Write-Host "`n⚠️  Skipping $($token.Symbol) - Address not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "`n🔧 Initializing $($token.Symbol) - $($token.Name)" -ForegroundColor Yellow
    
    # Try to initialize
    $initOutput = stellar contract invoke `
        --id $contractId `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        initialize `
        --admin $deployerAddress `
        --decimals $($token.Decimals) `
        --name "$($token.Name)" `
        --symbol "$($token.Symbol)" `
        --initial_supply $($token.InitialSupply) 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Initialized successfully" -ForegroundColor Green
    } else {
        # Check if already initialized
        $nameCheck = stellar contract invoke `
            --id $contractId `
            --network $Network `
            -- `
            name 2>&1
            
        if ($LASTEXITCODE -eq 0 -and $nameCheck -match '"') {
            Write-Host "   ℹ️  Already initialized" -ForegroundColor Cyan
        } else {
            Write-Host "   ⚠️  Initialization failed: $initOutput" -ForegroundColor Yellow
        }
    }
    
    # Small delay to avoid rate limiting
    Start-Sleep -Milliseconds 500
}

Write-Host "`n✅ Token initialization complete!" -ForegroundColor Green
Write-Host "`nNote: Some tokens may have already been initialized during deployment." -ForegroundColor Cyan
Write-Host "You can now proceed with pool initialization using initialize-pools.ps1" -ForegroundColor Cyan
