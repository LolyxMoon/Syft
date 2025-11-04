# Deploy Mock Liquidity Pool to Stellar Testnet

Write-Host "Deploying Mock Liquidity Pool..." -ForegroundColor Cyan

# Load environment variables from .env file if it exists
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#].+?)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

# Check required environment variables
$SOURCE_ACCOUNT = $env:DEPLOYER_SECRET_KEY
$NETWORK = if ($env:NETWORK) { $env:NETWORK } else { "testnet" }

if (-not $SOURCE_ACCOUNT) {
    Write-Host "Error: DEPLOYER_SECRET_KEY not found in .env" -ForegroundColor Red
    Write-Host "`nPlease create a .env file with:" -ForegroundColor Yellow
    Write-Host "DEPLOYER_SECRET_KEY=<your-secret-key>" -ForegroundColor Yellow
    exit 1
}

$WASM_PATH = "target/wasm32-unknown-unknown/release/mock_liquidity_pool.wasm"

Write-Host "Uploading contract WASM..." -ForegroundColor Yellow

# Upload the contract WASM
$uploadOutput = stellar contract upload `
    --wasm $WASM_PATH `
    --source $SOURCE_ACCOUNT `
    --network $NETWORK 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error uploading contract:" -ForegroundColor Red
    Write-Host $uploadOutput
    exit 1
}

$WASM_HASH = $uploadOutput | Select-String -Pattern "^[A-Fa-f0-9]{64}$" | ForEach-Object { $_.Matches[0].Value }

if (-not $WASM_HASH) {
    Write-Host "Error: Could not extract WASM hash from upload output" -ForegroundColor Red
    Write-Host "Output was:" -ForegroundColor Red
    Write-Host $uploadOutput
    exit 1
}

Write-Host "✓ WASM uploaded!" -ForegroundColor Green
Write-Host "WASM Hash: $WASM_HASH" -ForegroundColor Cyan

Write-Host "`nDeploying contract instance..." -ForegroundColor Yellow

# Deploy the contract instance
$deployOutput = stellar contract deploy `
    --wasm-hash $WASM_HASH `
    --source $SOURCE_ACCOUNT `
    --network $NETWORK 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error deploying contract:" -ForegroundColor Red
    Write-Host $deployOutput
    exit 1
}

$LIQUIDITY_POOL_ID = $deployOutput | Select-String -Pattern "^C[A-Z0-9]{55}$" | ForEach-Object { $_.Matches[0].Value }

if (-not $LIQUIDITY_POOL_ID) {
    Write-Host "Error: Could not extract contract ID from deployment output" -ForegroundColor Red
    Write-Host "Output was:" -ForegroundColor Red
    Write-Host $deployOutput
    exit 1
}

Write-Host "`n✓ Mock Liquidity Pool deployed!" -ForegroundColor Green
Write-Host "Contract ID: $LIQUIDITY_POOL_ID" -ForegroundColor Cyan

# Save the address to a file
$outputContent = @"
# Mock Liquidity Pool Deployment
# Network: $NETWORK
# Deployed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

MOCK_LIQUIDITY_POOL_ADDRESS=$LIQUIDITY_POOL_ID
MOCK_LIQUIDITY_POOL_WASM_HASH=$WASM_HASH

# To use this in your vault deployment:
# 1. Copy the MOCK_LIQUIDITY_POOL_ADDRESS above
# 2. Update vault configuration to use this pool address
# 3. Replace Soroswap router calls with mock pool calls for testing
"@

$outputContent | Out-File -FilePath "MOCK_LIQUIDITY_POOL.env" -Encoding UTF8

Write-Host "`n✓ Deployment information saved to MOCK_LIQUIDITY_POOL.env" -ForegroundColor Green
Write-Host "`nMock Liquidity Pool Details:" -ForegroundColor Yellow
Write-Host "  Contract ID: $LIQUIDITY_POOL_ID" -ForegroundColor White
Write-Host "  WASM Hash: $WASM_HASH" -ForegroundColor White
Write-Host "  Network: $NETWORK" -ForegroundColor White
Write-Host "`nThe mock pool provides simplified add_liquidity and remove_liquidity functions." -ForegroundColor Cyan
Write-Host "Use this for testing vault liquidity provision without Soroswap authorization issues." -ForegroundColor Cyan
