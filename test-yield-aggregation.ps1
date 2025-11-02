# Test Script for Cross-Protocol Yield Aggregation Feature
# Run this after starting the backend server

$baseUrl = "http://localhost:3001"

Write-Host "`n🚀 Testing Cross-Protocol Yield Aggregation Feature`n" -ForegroundColor Cyan

# Test 1: Compare XLM yields
Write-Host "📊 Test 1: Comparing XLM yields across protocols..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/protocols/compare/XLM?network=testnet" -Method Get
    if ($response.success) {
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Found $($response.data.protocols.Count) protocols" -ForegroundColor White
        Write-Host "   Best APY: $($response.data.bestYield.apy)% ($($response.data.bestYield.protocolName))" -ForegroundColor White
        Write-Host "   Average APY: $($response.data.averageApy)%" -ForegroundColor White
    }
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

# Test 2: Get yield opportunities
Write-Host "`n📈 Test 2: Getting yield opportunities..." -ForegroundColor Yellow
try {
    $xlmAddress = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
    $response = Invoke-RestMethod -Uri "$baseUrl/api/protocols/opportunities?assets=$xlmAddress&network=testnet" -Method Get
    if ($response.success) {
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Found $($response.data.Count) opportunities" -ForegroundColor White
        foreach ($opp in $response.data) {
            Write-Host "   - $($opp.protocolName): $($opp.apy)% APY [$($opp.type), $($opp.risk) risk]" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

# Test 3: Calculate optimal routing
Write-Host "`n🎯 Test 3: Calculating optimal routing for 1000 XLM..." -ForegroundColor Yellow
try {
    $body = @{
        asset = "XLM"
        amount = 1000
        network = "testnet"
        config = @{
            maxProtocols = 3
            riskTolerance = "medium"
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/protocols/route" -Method Post -Body $body -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Blended APY: $($response.data.expectedBlendedApy)%" -ForegroundColor White
        Write-Host "   Allocations:" -ForegroundColor White
        foreach ($alloc in $response.data.allocations) {
            Write-Host "   - $($alloc.protocolId): $$($alloc.amount) ($($alloc.percentage)%) @ $($alloc.expectedApy)% APY" -ForegroundColor White
        }
        Write-Host "   Rationale: $($response.data.rationale)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

# Test 4: Check rebalancing suggestion
Write-Host "`n🔄 Test 4: Checking rebalancing suggestion..." -ForegroundColor Yellow
try {
    $body = @{
        currentAllocations = @(
            @{
                protocolId = "soroswap"
                amount = 1000
                apy = 8.5
            }
        )
        asset = "XLM"
        network = "testnet"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/protocols/rebalance-check" -Method Post -Body $body -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Should rebalance: $($response.data.shouldRebalance)" -ForegroundColor White
        Write-Host "   Current APY: $($response.data.currentBlendedApy)%" -ForegroundColor White
        Write-Host "   Proposed APY: $($response.data.proposedBlendedApy)%" -ForegroundColor White
        Write-Host "   Improvement: +$($response.data.improvement)%" -ForegroundColor $(if ($response.data.improvement -gt 0) { "Green" } else { "Gray" })
    }
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

# Test 5: Compare strategies
Write-Host "`n⚖️  Test 5: Comparing single vs diversified strategy..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/protocols/strategy-comparison?asset=XLM&amount=1000&network=testnet" -Method Get
    
    if ($response.success) {
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Single Best: $($response.data.singleBest.protocol) @ $($response.data.singleBest.apy)% APY" -ForegroundColor White
        Write-Host "   Diversified: $($response.data.diversified.expectedBlendedApy)% APY" -ForegroundColor White
        $diff = $response.data.difference
        $sign = if ($diff -gt 0) { "+" } else { "" }
        $color = if ($diff -gt 0) { "Green" } else { "Red" }
        Write-Host "   Difference: $sign$diff% APY" -ForegroundColor $color
    }
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host "`n✨ All tests completed!`n" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check frontend component at /app/builder" -ForegroundColor White
Write-Host "2. Integrate into vault deposit flow" -ForegroundColor White
Write-Host "3. Add to vault dashboard for existing vaults`n" -ForegroundColor White
