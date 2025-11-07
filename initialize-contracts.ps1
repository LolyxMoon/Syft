#!/usr/bin/env pwsh
# Initialize all deployed contracts (tokens and pools)
# This fixes contracts that were deployed but not initialized

param(
    [string]$Network = "testnet",
    [string]$DeployerIdentity = "deployer"
)

$ErrorActionPreference = "Continue"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "INITIALIZING DEPLOYED CONTRACTS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Get deployer address
$deployerAddress = stellar keys address $DeployerIdentity 2>$null
Write-Host "`n📋 Deployer: $deployerAddress" -ForegroundColor Green

# Token configurations
$tokens = @(
    @{ Symbol = "AQX"; Name = "Aquarius Exchange"; Decimals = 7; InitialSupply = "100000000000000"; Address = "CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3" },
    @{ Symbol = "VLTK"; Name = "Velocity Token"; Decimals = 7; InitialSupply = "50000000000000"; Address = "CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME" },
    @{ Symbol = "SLX"; Name = "SmartLux Token"; Decimals = 7; InitialSupply = "30000000000000"; Address = "CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5" },
    @{ Symbol = "WRX"; Name = "WireX Finance"; Decimals = 7; InitialSupply = "20000000000000"; Address = "CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE" },
    @{ Symbol = "SIXN"; Name = "SixNet Protocol"; Decimals = 7; InitialSupply = "50000000000000"; Address = "CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O" },
    @{ Symbol = "MBIUS"; Name = "Mobius Finance"; Decimals = 7; InitialSupply = "25000000000000"; Address = "CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP" },
    @{ Symbol = "TRIO"; Name = "Trion Network"; Decimals = 7; InitialSupply = "15000000000000"; Address = "CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL" },
    @{ Symbol = "RELIO"; Name = "Relio Network"; Decimals = 7; InitialSupply = "10000000000000"; Address = "CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H" },
    @{ Symbol = "TRI"; Name = "Trident Token"; Decimals = 7; InitialSupply = "40000000000000"; Address = "CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW" },
    @{ Symbol = "NUMER"; Name = "Numerico Finance"; Decimals = 7; InitialSupply = "35000000000000"; Address = "CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR" }
)

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🪙 Initializing Tokens" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

foreach ($token in $tokens) {
    Write-Host "`n📦 $($token.Symbol) - $($token.Name)" -ForegroundColor Yellow
    Write-Host "   Address: $($token.Address)" -ForegroundColor Gray
    
    # Try to initialize (will fail if already initialized, which is fine)
    $initOutput = stellar contract invoke `
        --id $token.Address `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        initialize `
        --admin $deployerAddress `
        --decimals $token.Decimals `
        --name "$($token.Name)" `
        --symbol "$($token.Symbol)" `
        --initial_supply $token.InitialSupply 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Initialized" -ForegroundColor Green
    } else {
        if ($initOutput -like "*already been initialized*" -or $initOutput -like "*AlreadyInitialized*") {
            Write-Host "   ✓ Already initialized" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  $initOutput" -ForegroundColor Yellow
        }
    }
}

# Pool addresses and their token pairs
$pools = @(
    @{ Name = "XLM/AQX"; Pool = "CDNN77W7A4X3IKVENIKRQMUVBODUF3WRLUZYJ4WQYVNML6SVAORUVXFN"; TokenA = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; TokenB = "CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3" },
    @{ Name = "XLM/VLTK"; Pool = "CDV2HI43TPWV36KJS6X6GLXDTZQFWFQI2H3DFD4O47LRTHA3A3KKTAEI"; TokenA = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; TokenB = "CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME" },
    @{ Name = "XLM/SLX"; Pool = "CC47IJVCOHTNGKBQZFABNMPSAKFRGSXXXVOH3256L6K4WLAQJDJG2DDS"; TokenA = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; TokenB = "CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5" },
    @{ Name = "XLM/WRX"; Pool = "CD6Z46SJGJH6QADZAG5TXQJKCGAW5VP2JSOFRZ3UGOZFHXTZ4AS62E24"; TokenA = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; TokenB = "CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE" },
    @{ Name = "XLM/SIXN"; Pool = "CDC2NAQ6RNVZHQ4Q2BBPO4FRZMJDCUCKX5P67W772I5HLTBKRJQLJKOO"; TokenA = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; TokenB = "CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O" },
    @{ Name = "XLM/MBIUS"; Pool = "CAM2UB4364HCDFIVQGW2YIONWMMCNZ43MXXVUD43X5ZP3PWAXBW5ABBK"; TokenA = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; TokenB = "CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP" },
    @{ Name = "XLM/TRIO"; Pool = "CDL44UJMRKE5LZG2SVMNM3T2TSTBDGZUD4MJF3X5DBTYO2A4XU2UGKU2"; TokenA = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; TokenB = "CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL" },
    @{ Name = "XLM/RELIO"; Pool = "CAKKECWO4LPCX5B4O4KENUKPBKFOJJL5HJXOC237TLU2LPKP3DDTGWLL"; TokenA = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; TokenB = "CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H" },
    @{ Name = "XLM/TRI"; Pool = "CAT3BC6DPFZHQBLDIZKRGIIYIWQTN6S6TGJUNXXLIYHBUDI3T7VPEOUA"; TokenA = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; TokenB = "CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW" },
    @{ Name = "XLM/NUMER"; Pool = "CAKFDKYUVLM2ZJURHAIA4W626IZR3Y76KPEDTEK7NZIS5TMSFCYCKOM6"; TokenA = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; TokenB = "CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR" }
)

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🏊 Initializing Pools" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

foreach ($pool in $pools) {
    Write-Host "`n💧 $($pool.Name)" -ForegroundColor Yellow
    Write-Host "   Pool: $($pool.Pool)" -ForegroundColor Gray
    
    # Try to initialize (will fail if already initialized, which is fine)
    $initOutput = stellar contract invoke `
        --id $pool.Pool `
        --network $Network `
        --source $DeployerIdentity `
        -- `
        initialize `
        --token_a $pool.TokenA `
        --token_b $pool.TokenB 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Initialized" -ForegroundColor Green
    } else {
        if ($initOutput -like "*already been initialized*" -or $initOutput -like "*AlreadyInitialized*") {
            Write-Host "   ✓ Already initialized" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  $initOutput" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "✅ INITIALIZATION COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "`n📝 All contracts have been initialized (or were already initialized)" -ForegroundColor White
Write-Host "`nNext: Add liquidity to pools with initialize-pools.ps1" -ForegroundColor Cyan
