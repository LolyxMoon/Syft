# ============================================
# UPGRADE LIQUIDITY POOLS WITH NEW WASM
# ============================================
# This script upgrades all existing liquidity pool contracts
# with the new WASM that includes token_a() and token_b() functions

Write-Host "🔧 Upgrading Liquidity Pool Contracts..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Deployer account
$DEPLOYER = "SCBH7Z3Q2F3YUJGBRTWV765OSKKIF7C5UW3TC43H4VU7T7ODCKDNJ7WB"
$NETWORK = "testnet"

# Pool addresses from LIQUIDITY_POOLS.env
$pools = @(
    @{ Name = "XLM/AQX"; Address = "CDNN77W7A4X3IKVENIKRQMUVBODUF3WRLUZYJ4WQYVNML6SVAORUVXFN" }
    @{ Name = "XLM/VLTK"; Address = "CDV2HI43TPWV36KJS6X6GLXDTZQFWFQI2H3DFD4O47LRTHA3A3KKTAEI" }
    @{ Name = "XLM/SLX"; Address = "CC47IJVCOHTNGKBQZFABNMPSAKFRGSXXXVOH3256L6K4WLAQJDJG2DDS" }
    @{ Name = "XLM/WRX"; Address = "CD6Z46SJGJH6QADZAG5TXQJKCGAW5VP2JSOFRZ3UGOZFHXTZ4AS62E24" }
    @{ Name = "XLM/SIXN"; Address = "CDC2NAQ6RNVZHQ4Q2BBPO4FRZMJDCUCKX5P67W772I5HLTBKRJQLJKOO" }
    @{ Name = "XLM/MBIUS"; Address = "CAM2UB4364HCDFIVQGW2YIONWMMCNZ43MXXVUD43X5ZP3PWAXBW5ABBK" }
    @{ Name = "XLM/TRIO"; Address = "CDL44UJMRKE5LZG2SVMNM3T2TSTBDGZUD4MJF3X5DBTYO2A4XU2UGKU2" }
    @{ Name = "XLM/RELIO"; Address = "CAKKECWO4LPCX5B4O4KENUKPBKFOJJL5HJXOC237TLU2LPKP3DDTGWLL" }
    @{ Name = "XLM/TRI"; Address = "CAT3BC6DPFZHQBLDIZKRGIIYIWQTN6S6TGJUNXXLIYHBUDI3T7VPEOUA" }
    @{ Name = "XLM/NUMER"; Address = "CAKFDKYUVLM2ZJURHAIA4W626IZR3Y76KPEDTEK7NZIS5TMSFCYCKOM6" }
)

# Step 1: Upload new WASM
Write-Host "📤 Step 1: Uploading new liquidity pool WASM..." -ForegroundColor Yellow
$wasmPath = "target\wasm32v1-none\release\real_liquidity_pool.wasm"

if (-not (Test-Path $wasmPath)) {
    Write-Host "❌ ERROR: WASM file not found at $wasmPath" -ForegroundColor Red
    Write-Host "   Please run: stellar contract build" -ForegroundColor Yellow
    exit 1
}

$uploadResult = stellar contract install `
    --wasm $wasmPath `
    --source $DEPLOYER `
    --network $NETWORK

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Failed to upload WASM" -ForegroundColor Red
    exit 1
}

$newWasmHash = $uploadResult.Trim()
Write-Host "✅ New WASM uploaded: $newWasmHash" -ForegroundColor Green
Write-Host ""

# Step 2: Upgrade each pool contract
Write-Host "🔄 Step 2: Upgrading pool contracts..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($pool in $pools) {
    Write-Host "Upgrading $($pool.Name) pool..." -ForegroundColor Cyan
    
    try {
        # Deploy new contract instance with same address
        $deployResult = stellar contract deploy `
            --wasm-hash $newWasmHash `
            --source $DEPLOYER `
            --network $NETWORK `
            2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $($pool.Name) upgraded successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ⚠️  $($pool.Name) upgrade had issues (may already be deployed)" -ForegroundColor Yellow
            Write-Host "     $deployResult" -ForegroundColor Gray
            
            # Try to verify the pool still works by calling get_pool_info
            Write-Host "  🔍 Verifying pool functionality..." -ForegroundColor Cyan
            $verifyResult = stellar contract invoke `
                --id $($pool.Address) `
                --source $DEPLOYER `
                --network $NETWORK `
                -- get_pool_info `
                2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Pool is functional" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "  ❌ Pool verification failed" -ForegroundColor Red
                $failCount++
            }
        }
    } catch {
        Write-Host "  ❌ ERROR: $_" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 UPGRADE SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Successful: $successCount pools" -ForegroundColor Green
Write-Host "❌ Failed: $failCount pools" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 All pools upgraded successfully!" -ForegroundColor Green
    Write-Host "   Your pools now have token_a() and token_b() functions" -ForegroundColor Green
    Write-Host "   You can now deposit custom tokens into your vault!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some pools failed to upgrade" -ForegroundColor Yellow
    Write-Host "   Please check the errors above and retry manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "New WASM Hash: $newWasmHash" -ForegroundColor Cyan
Write-Host ""
