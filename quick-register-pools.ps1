# Quick Register Custom Pools
# Simple script to register custom token pools with your vault
# Run this AFTER vault is initialized but BEFORE trying to swap custom tokens

param(
    [string]$VaultAddress = "",
    [string]$Network = "testnet"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Register Custom Token Pools" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get vault address if not provided
if (-not $VaultAddress) {
    if ($env:VAULT_ADDRESS) {
        $VaultAddress = $env:VAULT_ADDRESS
        Write-Host "Using vault from environment: $VaultAddress" -ForegroundColor Green
    } else {
        Write-Host "Enter your Vault Contract Address:" -ForegroundColor Yellow
        $VaultAddress = Read-Host
    }
}

if (-not $VaultAddress) {
    Write-Host "Error: No vault address provided!" -ForegroundColor Red
    exit 1
}

Write-Host "Vault: $VaultAddress`n" -ForegroundColor Green

# Custom token addresses (from CUSTOM_TOKENS.env)
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

# Liquidity pool addresses (from LIQUIDITY_POOLS.env)
$pools = @{
    "AQX" = "CDNN77W7A4X3IKVENIKRQMUVBODUF3WRLUZYJ4WQYVNML6SVAORUVXFN"
    "VLTK" = "CDV2HI43TPWV36KJS6X6GLXDTZQFWFQI2H3DFD4O47LRTHA3A3KKTAEI"
    "SLX" = "CC47IJVCOHTNGKBQZFABNMPSAKFRGSXXXVOH3256L6K4WLAQJDJG2DDS"
    "WRX" = "CD6Z46SJGJH6QADZAG5TXQJKCGAW5VP2JSOFRZ3UGOZFHXTZ4AS62E24"
    "SIXN" = "CDC2NAQ6RNVZHQ4Q2BBPO4FRZMJDCUCKX5P67W772I5HLTBKRJQLJKOO"
    "MBIUS" = "CAM2UB4364HCDFIVQGW2YIONWMMCNZ43MXXVUD43X5ZP3PWAXBW5ABBK"
    "TRIO" = "CDL44UJMRKE5LZG2SVMNM3T2TSTBDGZUD4MJF3X5DBTYO2A4XU2UGKU2"
    "RELIO" = "CAKKECWO4LPCX5B4O4KENUKPBKFOJJL5HJXOC237TLU2LPKP3DDTGWLL"
    "TRI" = "CAT3BC6DPFZHQBLDIZKRGIIYIWQTN6S6TGJUNXXLIYHBUDI3T7VPEOUA"
    "NUMER" = "CAKFDKYUVLM2ZJURHAIA4W626IZR3Y76KPEDTEK7NZIS5TMSFCYCKOM6"
}

Write-Host "Registering $($tokens.Count) custom token pools...`n" -ForegroundColor Cyan

$success = 0
$failed = 0

foreach ($tokenName in $tokens.Keys | Sort-Object) {
    $tokenAddr = $tokens[$tokenName]
    $poolAddr = $pools[$tokenName]
    
    Write-Host "  [$tokenName] " -NoNewline -ForegroundColor White
    Write-Host "Token: $($tokenAddr.Substring(0,8))... Pool: $($poolAddr.Substring(0,8))..." -ForegroundColor Gray
    
    try {
        $result = stellar contract invoke `
            --id $VaultAddress `
            --network $Network `
            --source deployer `
            -- `
            register_custom_pool `
            --caller $(stellar keys address deployer) `
            --token_address $tokenAddr `
            --pool_address $poolAddr 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ Registered" -ForegroundColor Green
            $success++
        } else {
            Write-Host "    ✗ Failed: $result" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "    ✗ Error: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor White
Write-Host "  ✓ Success: $success" -ForegroundColor Green
Write-Host "  ✗ Failed:  $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "========================================" -ForegroundColor Cyan

if ($success -gt 0) {
    Write-Host "`n🎉 Custom pools registered! You can now:" -ForegroundColor Green
    Write-Host "  1. Deposit custom tokens (AQX, VLTK, etc.) into your vault" -ForegroundColor White
    Write-Host "  2. Vault will automatically use custom pools for swaps" -ForegroundColor White
    Write-Host "  3. Check logs for 'Found custom pool' messages" -ForegroundColor White
}

if ($failed -gt 0) {
    Write-Host "`n⚠️  Some registrations failed. Common issues:" -ForegroundColor Yellow
    Write-Host "  - Vault not initialized yet" -ForegroundColor Gray
    Write-Host "  - Wrong deployer/owner key" -ForegroundColor Gray
    Write-Host "  - Insufficient balance for gas" -ForegroundColor Gray
}
