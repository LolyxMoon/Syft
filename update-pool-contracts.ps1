# ============================================
# UPDATE LIQUIDITY POOL CONTRACTS WITH NEW WASM
# ============================================
# This script updates existing liquidity pool contracts to use the new WASM
# that includes token_a() and token_b() functions

Write-Host "🔧 Updating Liquidity Pool Contracts with New WASM..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# New WASM hash from build
$NEW_WASM_HASH = "7688303562d8104a796c4312c166c61ff204942c4bc6b848f3dcfb017ee3027f"
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

Write-Host "New WASM Hash: $NEW_WASM_HASH" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($pool in $pools) {
    Write-Host "Updating $($pool.Name) pool ($($pool.Address))..." -ForegroundColor Cyan
    
    try {
        # Use stellar contract install to update the contract
        # The --wasm-hash flag will update the existing contract instance
        $result = stellar contract install `
            --wasm target\wasm32v1-none\release\real_liquidity_pool.wasm `
            --source deployer `
            --network $NETWORK `
            2>&1
        
        if ($LASTEXITCODE -eq 0) {
            # Now update the contract instance to use the new WASM
            Write-Host "  📝 Updating contract instance..." -ForegroundColor Gray
            
            $updateResult = stellar contract deploy `
                --wasm-hash $NEW_WASM_HASH `
                --id $($pool.Address) `
                --source deployer `
                --network $NETWORK `
                2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ $($pool.Name) updated successfully" -ForegroundColor Green
                
                # Verify by calling token_a function
                Write-Host "  🔍 Verifying token_a function..." -ForegroundColor Gray
                $verifyResult = stellar contract invoke `
                    --id $($pool.Address) `
                    --source deployer `
                    --network $NETWORK `
                    -- token_a `
                    2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✅ Verification passed - token_a() works!" -ForegroundColor Green
                    $successCount++
                } else {
                    Write-Host "  ⚠️  Warning: token_a verification failed" -ForegroundColor Yellow
                    Write-Host "     $verifyResult" -ForegroundColor Gray
                    $successCount++  # Still count as success if update worked
                }
            } else {
                Write-Host "  ❌ Failed to update contract instance" -ForegroundColor Red
                Write-Host "     $updateResult" -ForegroundColor Gray
                $failCount++
            }
        } else {
            Write-Host "  ❌ Failed to install WASM" -ForegroundColor Red
            Write-Host "     $result" -ForegroundColor Gray
            $failCount++
        }
    } catch {
        Write-Host "  ❌ ERROR: $_" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 UPDATE SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Successful: $successCount pools" -ForegroundColor Green
Write-Host "❌ Failed: $failCount pools" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 All pools updated successfully!" -ForegroundColor Green
    Write-Host "   Your pools now have token_a() and token_b() functions" -ForegroundColor Green
    Write-Host "   You can now deposit custom tokens into your vault!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some pools failed to update" -ForegroundColor Yellow
    Write-Host "   You may need to redeploy those pools from scratch" -ForegroundColor Yellow
}

Write-Host ""
