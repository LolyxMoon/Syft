# Test Custom Token Functionality
# This script tests if custom tokens can be queried properly

$ErrorActionPreference = "Continue"

Write-Host "=== Testing Custom Token Functionality ===" -ForegroundColor Cyan
Write-Host ""

# Get token addresses from env file
$tokens = @{
    "AQX" = "CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3"
    "VLTK" = "CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME"
    "SLX" = "CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5"
}

# Test account (deployer)
$testAccount = stellar keys address deployer

Write-Host "Test Account: $testAccount" -ForegroundColor Yellow
Write-Host ""

foreach ($token in $tokens.GetEnumerator()) {
    $symbol = $token.Key
    $address = $token.Value
    
    Write-Host "Testing $symbol ($address)..." -ForegroundColor Cyan
    
    # Test 1: Get token name
    Write-Host "  1. Getting name..." -ForegroundColor Gray
    try {
        $name = stellar contract invoke `
            --id $address `
            --network testnet `
            --source deployer `
            -- `
            name
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Name: $name" -ForegroundColor Green
        } else {
            Write-Host "    ❌ Failed to get name" -ForegroundColor Red
        }
    } catch {
        Write-Host "    ❌ Error: $_" -ForegroundColor Red
    }
    
    # Test 2: Get token symbol
    Write-Host "  2. Getting symbol..." -ForegroundColor Gray
    try {
        $sym = stellar contract invoke `
            --id $address `
            --network testnet `
            --source deployer `
            -- `
            symbol
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Symbol: $sym" -ForegroundColor Green
        } else {
            Write-Host "    ❌ Failed to get symbol" -ForegroundColor Red
        }
    } catch {
        Write-Host "    ❌ Error: $_" -ForegroundColor Red
    }
    
    # Test 3: Get decimals
    Write-Host "  3. Getting decimals..." -ForegroundColor Gray
    try {
        $decimals = stellar contract invoke `
            --id $address `
            --network testnet `
            --source deployer `
            -- `
            decimals
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Decimals: $decimals" -ForegroundColor Green
        } else {
            Write-Host "    ❌ Failed to get decimals" -ForegroundColor Red
        }
    } catch {
        Write-Host "    ❌ Error: $_" -ForegroundColor Red
    }
    
    # Test 4: Check balance
    Write-Host "  4. Checking balance..." -ForegroundColor Gray
    try {
        $balance = stellar contract invoke `
            --id $address `
            --network testnet `
            --source deployer `
            -- `
            balance `
            --account $testAccount
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Balance: $balance" -ForegroundColor Green
        } else {
            Write-Host "    ❌ Failed to get balance" -ForegroundColor Red
        }
    } catch {
        Write-Host "    ❌ Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
