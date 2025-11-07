#!/usr/bin/env pwsh
# One-time script to register custom pools for an existing vault
# This should be automatic in the future, but for existing vaults we need to run it manually

param(
    [string]$VaultAddress = "CDODF6KDPI2JYC5T6WCYILGNAZDSKNAFMYNSKII33OPGNS3VPOOOFQLS",
    [string]$Network = "testnet"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Register Custom Pools for Vault" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vault: $VaultAddress" -ForegroundColor Green
Write-Host "Network: $Network" -ForegroundColor Green
Write-Host ""

# Custom token pools on testnet
$tokenAddresses = @(
    "CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3",  # AQX
    "CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME",  # VLTK
    "CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5",  # SLX
    "CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE",  # WRX
    "CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O",  # SIXN
    "CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP",  # MBIUS
    "CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL",  # TRIO
    "CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H",  # RELIO
    "CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW",  # TRI
    "CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR"   # NUMER
)

$poolAddresses = @(
    "CDNN77W7A4X3IKVENIKRQMUVBODUF3WRLUZYJ4WQYVNML6SVAORUVXFN",  # XLM/AQX
    "CDV2HI43TPWV36KJS6X6GLXDTZQFWFQI2H3DFD4O47LRTHA3A3KKTAEI",  # XLM/VLTK
    "CC47IJVCOHTNGKBQZFABNMPSAKFRGSXXXVOH3256L6K4WLAQJDJG2DDS",  # XLM/SLX
    "CD6Z46SJGJH6QADZAG5TXQJKCGAW5VP2JSOFRZ3UGOZFHXTZ4AS62E24",  # XLM/WRX
    "CDC2NAQ6RNVZHQ4Q2BBPO4FRZMJDCUCKX5P67W772I5HLTBKRJQLJKOO",  # XLM/SIXN
    "CAM2UB4364HCDFIVQGW2YIONWMMCNZ43MXXVUD43X5ZP3PWAXBW5ABBK",  # XLM/MBIUS
    "CDL44UJMRKE5LZG2SVMNM3T2TSTBDGZUD4MJF3X5DBTYO2A4XU2UGKU2",  # XLM/TRIO
    "CAKKECWO4LPCX5B4O4KENUKPBKFOJJL5HJXOC237TLU2LPKP3DDTGWLL",  # XLM/RELIO
    "CAT3BC6DPFZHQBLDIZKRGIIYIWQTN6S6TGJUNXXLIYHBUDI3T7VPEOUA",  # XLM/TRI
    "CAKFDKYUVLM2ZJURHAIA4W626IZR3Y76KPEDTEK7NZIS5TMSFCYCKOM6"   # XLM/NUMER
)

$tokenNames = @("AQX", "VLTK", "SLX", "WRX", "SIXN", "MBIUS", "TRIO", "RELIO", "TRI", "NUMER")

Write-Host "Registering $($tokenAddresses.Count) custom pools in batch..." -ForegroundColor Yellow
Write-Host ""

# Get deployer address
$deployerAddress = stellar keys address deployer 2>$null
Write-Host "Deployer: $deployerAddress" -ForegroundColor Gray
Write-Host ""

# Build arrays as JSON format for Stellar CLI
$tokenJson = "["
for ($i = 0; $i -lt $tokenAddresses.Count; $i++) {
    $tokenJson += "`"$($tokenAddresses[$i])`""
    if ($i -lt $tokenAddresses.Count - 1) { $tokenJson += "," }
}
$tokenJson += "]"

$poolJson = "["
for ($i = 0; $i -lt $poolAddresses.Count; $i++) {
    $poolJson += "`"$($poolAddresses[$i])`""
    if ($i -lt $poolAddresses.Count - 1) { $poolJson += "," }
}
$poolJson += "]"

Write-Host "Calling register_custom_pools_batch..." -ForegroundColor Yellow

# Call the batch registration function
$result = stellar contract invoke `
    --id $VaultAddress `
    --network $Network `
    --source deployer `
    -- `
    register_custom_pools_batch `
    --caller $deployerAddress `
    --token_addresses $tokenJson `
    --pool_addresses $poolJson 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Registered $($tokenAddresses.Count) custom pools:" -ForegroundColor White
    for ($i = 0; $i -lt $tokenNames.Count; $i++) {
        Write-Host "  ✓ $($tokenNames[$i]) -> Pool $($poolAddresses[$i].Substring(0,8))..." -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Your vault can now swap these tokens automatically!" -ForegroundColor Cyan
    Write-Host "  - Deposit XLM and it will swap to AQX through the registered pool" -ForegroundColor White
    Write-Host "  - Or deposit any custom token directly" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Wrong deployer key (must be vault owner)" -ForegroundColor Gray
    Write-Host "  - Vault not initialized yet" -ForegroundColor Gray
    Write-Host "  - Insufficient balance for gas" -ForegroundColor Gray
    exit 1
}
