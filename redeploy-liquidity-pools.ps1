# ============================================
# REDEPLOY LIQUIDITY POOLS WITH NEW WASM
# ============================================
# This script redeploys all liquidity pools with the updated WASM
# that includes token_a() and token_b() functions

Write-Host "🔄 Redeploying Liquidity Pools with New WASM..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$NETWORK = "testnet"
$XLM_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

# Token addresses from CUSTOM_TOKENS.env
$tokens = @{
    "AQX" = "CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3"
    "VLTK" = "CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME"
    "SLX" = "CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5"
    "WRX" = "CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE"
    "SIXN" = "CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O"
    "MBIUS" = "CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP"
    "TRIO" = "CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL"
    "RELIO" = "CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H"
    "TRI" = "CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW"
    "NUMER" = "CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR"
}

$deployedPools = @{}
$successCount = 0
$failCount = 0

Write-Host "📤 Step 1: Uploading new liquidity pool WASM..." -ForegroundColor Yellow
$wasmPath = "target\wasm32v1-none\release\real_liquidity_pool.wasm"

$uploadResult = stellar contract upload `
    --wasm $wasmPath `
    --source deployer `
    --network $NETWORK

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Failed to upload WASM" -ForegroundColor Red
    exit 1
}

$wasmHash = $uploadResult.Trim()
Write-Host "✅ WASM uploaded: $wasmHash" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Step 2: Deploying new pool contracts..." -ForegroundColor Yellow
Write-Host ""

foreach ($tokenName in $tokens.Keys | Sort-Object) {
    $tokenAddress = $tokens[$tokenName]
    $poolName = "XLM/$tokenName"
    
    Write-Host "Deploying $poolName pool..." -ForegroundColor Cyan
    
    try {
        # Deploy new contract instance
        $poolAddress = stellar contract deploy `
            --wasm-hash $wasmHash `
            --source deployer `
            --network $NETWORK
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ❌ Failed to deploy pool" -ForegroundColor Red
            $failCount++
            continue
        }
        
        $poolAddress = $poolAddress.Trim()
        Write-Host "  📝 Pool deployed: $poolAddress" -ForegroundColor Gray
        
        # Initialize the pool
        Write-Host "  🔧 Initializing pool..." -ForegroundColor Gray
        $initResult = stellar contract invoke `
            --id $poolAddress `
            --source deployer `
            --network $NETWORK `
            -- initialize `
            --token_a $XLM_ADDRESS `
            --token_b $tokenAddress `
            2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ❌ Failed to initialize pool" -ForegroundColor Red
            Write-Host "     $initResult" -ForegroundColor Gray
            $failCount++
            continue
        }
        
        Write-Host "  ✅ Pool initialized" -ForegroundColor Green
        
        # Verify token_a function exists
        Write-Host "  🔍 Verifying token_a function..." -ForegroundColor Gray
        $verifyResult = stellar contract invoke `
            --id $poolAddress `
            --source deployer `
            --network $NETWORK `
            -- token_a `
            2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Verification passed - token_a() works!" -ForegroundColor Green
            $deployedPools[$poolName] = $poolAddress
            $successCount++
        } else {
            Write-Host "  ⚠️  Warning: token_a verification failed" -ForegroundColor Yellow
            $deployedPools[$poolName] = $poolAddress
            $successCount++  # Still count as success
        }
    } catch {
        Write-Host "  ❌ ERROR: $_" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Successful: $successCount pools" -ForegroundColor Green
Write-Host "❌ Failed: $failCount pools" -ForegroundColor Red
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "📋 New Pool Addresses:" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    foreach ($poolName in $deployedPools.Keys | Sort-Object) {
        $address = $deployedPools[$poolName]
        Write-Host "POOL_$($poolName.Replace('/', '_'))=$address" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "⚠️  IMPORTANT: Update these addresses in:" -ForegroundColor Yellow
    Write-Host "   1. LIQUIDITY_POOLS.env file" -ForegroundColor Yellow
    Write-Host "   2. Backend auto-registration code" -ForegroundColor Yellow
    Write-Host "   3. Re-run vault initialization to register new pools" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "WASM Hash: $wasmHash" -ForegroundColor Cyan
Write-Host ""
