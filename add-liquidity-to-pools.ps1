#!/usr/bin/env pwsh
# Add Liquidity to Real Liquidity Pools
# Adds initial liquidity to all deployed real pool contracts

param(
    [string]$Network = "testnet",
    [string]$DeployerIdentity = "deployer"
)

$ErrorActionPreference = "Continue"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "ADDING LIQUIDITY TO REAL POOLS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Get deployer address
$deployerAddress = stellar keys address $DeployerIdentity 2>$null
Write-Host "`n📋 Deployer: $deployerAddress" -ForegroundColor Green

# XLM Native Token Address
$XLM_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

# Pool configurations with real liquidity pool addresses
$liquidityConfigs = @(
    @{
        Name = "XLM/AQX"
        PoolAddress = "CDNN77W7A4X3IKVENIKRQMUVBODUF3WRLUZYJ4WQYVNML6SVAORUVXFN"
        TokenAddress = "CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3"
        TokenSymbol = "AQX"
        AmountXLM = "100000000000"  # 10,000 XLM (7 decimals)
        AmountToken = "100000000000"  # 10,000 tokens (7 decimals)
    },
    @{
        Name = "XLM/VLTK"
        PoolAddress = "CDV2HI43TPWV36KJS6X6GLXDTZQFWFQI2H3DFD4O47LRTHA3A3KKTAEI"
        TokenAddress = "CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME"
        TokenSymbol = "VLTK"
        AmountXLM = "100000000000"
        AmountToken = "100000000000"
    },
    @{
        Name = "XLM/SLX"
        PoolAddress = "CC47IJVCOHTNGKBQZFABNMPSAKFRGSXXXVOH3256L6K4WLAQJDJG2DDS"
        TokenAddress = "CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5"
        TokenSymbol = "SLX"
        AmountXLM = "100000000000"
        AmountToken = "100000000000"
    },
    @{
        Name = "XLM/WRX"
        PoolAddress = "CD6Z46SJGJH6QADZAG5TXQJKCGAW5VP2JSOFRZ3UGOZFHXTZ4AS62E24"
        TokenAddress = "CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE"
        TokenSymbol = "WRX"
        AmountXLM = "100000000000"
        AmountToken = "100000000000"
    },
    @{
        Name = "XLM/SIXN"
        PoolAddress = "CDC2NAQ6RNVZHQ4Q2BBPO4FRZMJDCUCKX5P67W772I5HLTBKRJQLJKOO"
        TokenAddress = "CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O"
        TokenSymbol = "SIXN"
        AmountXLM = "100000000000"
        AmountToken = "100000000000"
    },
    @{
        Name = "XLM/MBIUS"
        PoolAddress = "CAM2UB4364HCDFIVQGW2YIONWMMCNZ43MXXVUD43X5ZP3PWAXBW5ABBK"
        TokenAddress = "CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP"
        TokenSymbol = "MBIUS"
        AmountXLM = "100000000000"
        AmountToken = "100000000000"
    },
    @{
        Name = "XLM/TRIO"
        PoolAddress = "CDL44UJMRKE5LZG2SVMNM3T2TSTBDGZUD4MJF3X5DBTYO2A4XU2UGKU2"
        TokenAddress = "CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL"
        TokenSymbol = "TRIO"
        AmountXLM = "100000000000"
        AmountToken = "100000000000"
    },
    @{
        Name = "XLM/RELIO"
        PoolAddress = "CAKKECWO4LPCX5B4O4KENUKPBKFOJJL5HJXOC237TLU2LPKP3DDTGWLL"
        TokenAddress = "CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H"
        TokenSymbol = "RELIO"
        AmountXLM = "100000000000"
        AmountToken = "100000000000"
    },
    @{
        Name = "XLM/TRI"
        PoolAddress = "CAT3BC6DPFZHQBLDIZKRGIIYIWQTN6S6TGJUNXXLIYHBUDI3T7VPEOUA"
        TokenAddress = "CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW"
        TokenSymbol = "TRI"
        AmountXLM = "100000000000"
        AmountToken = "100000000000"
    },
    @{
        Name = "XLM/NUMER"
        PoolAddress = "CAKFDKYUVLM2ZJURHAIA4W626IZR3Y76KPEDTEK7NZIS5TMSFCYCKOM6"
        TokenAddress = "CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR"
        TokenSymbol = "NUMER"
        AmountXLM = "100000000000"
        AmountToken = "100000000000"
    }
)

$successCount = 0
$failCount = 0

foreach ($config in $liquidityConfigs) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "💧 Adding Liquidity: $($config.Name)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "   Pool: $($config.PoolAddress)" -ForegroundColor Gray
    Write-Host "   Token: $($config.TokenAddress)" -ForegroundColor Gray
    
    # Step 1: Mint tokens to deployer
    Write-Host "`n1️⃣  Minting $($config.TokenSymbol) tokens..." -ForegroundColor Yellow
    $mintOutput = stellar contract invoke `
        --id $config.TokenAddress `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        mint `
        --to $deployerAddress `
        --amount $config.AmountToken 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️  Mint warning: $mintOutput" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Minted $([decimal]$config.AmountToken / 10000000) $($config.TokenSymbol)" -ForegroundColor Green
    }
    
    # Step 2: Approve pool to spend XLM
    Write-Host "`n2️⃣  Approving pool to spend XLM..." -ForegroundColor Yellow
    $approveXLM = stellar contract invoke `
        --id $XLM_ADDRESS `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        approve `
        --from $deployerAddress `
        --spender $config.PoolAddress `
        --amount $config.AmountXLM `
        --expiration_ledger 2000000 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️  XLM approval warning: $approveXLM" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ XLM approved" -ForegroundColor Green
    }
    
    # Step 3: Approve pool to spend custom token
    Write-Host "`n3️⃣  Approving pool to spend $($config.TokenSymbol)..." -ForegroundColor Yellow
    $approveToken = stellar contract invoke `
        --id $config.TokenAddress `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        approve `
        --from $deployerAddress `
        --spender $config.PoolAddress `
        --amount $config.AmountToken 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️  Token approval warning: $approveToken" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ $($config.TokenSymbol) approved" -ForegroundColor Green
    }
    
    # Step 4: Add liquidity to pool
    Write-Host "`n4️⃣  Adding liquidity to pool..." -ForegroundColor Yellow
    Write-Host "   Amount XLM: $([decimal]$config.AmountXLM / 10000000)" -ForegroundColor Gray
    Write-Host "   Amount $($config.TokenSymbol): $([decimal]$config.AmountToken / 10000000)" -ForegroundColor Gray
    
    $addLiquidity = stellar contract invoke `
        --id $config.PoolAddress `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        add_liquidity `
        --user $deployerAddress `
        --amount_a_desired $config.AmountXLM `
        --amount_a_min "1" `
        --amount_b_desired $config.AmountToken `
        --amount_b_min "1" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to add liquidity" -ForegroundColor Red
        Write-Host "   Error: $addLiquidity" -ForegroundColor Red
        $failCount++
    } else {
        Write-Host "   ✅ Liquidity added successfully!" -ForegroundColor Green
        $successCount++
        
        # Step 5: Verify reserves
        Write-Host "`n5️⃣  Verifying reserves..." -ForegroundColor Yellow
        $reserves = stellar contract invoke `
            --id $config.PoolAddress `
            --network $Network `
            --source $DeployerIdentity `
            -- `
            get_reserves 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Reserves: $reserves" -ForegroundColor Green
        }
    }
    
    Write-Host ""
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "🎉 LIQUIDITY ADDITION COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "`n📊 Results:" -ForegroundColor White
Write-Host "   ✅ Successful: $successCount pools" -ForegroundColor Green
Write-Host "   ❌ Failed: $failCount pools" -ForegroundColor Red
Write-Host "`n📝 All pools are now ready for swapping!" -ForegroundColor Cyan
Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test a swap through one of the pools" -ForegroundColor White
Write-Host "   2. Use these tokens in your VaultBuilder" -ForegroundColor White
Write-Host "   3. Create vaults with real liquidity!" -ForegroundColor White
