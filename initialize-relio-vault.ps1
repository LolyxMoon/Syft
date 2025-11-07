#!/usr/bin/env pwsh
# Initialize RELIO test vault

$vaultId = "CCX57GELCLMUZGDLU5ZKNVHGCLYSDJJLWZAW3MWWTDDE46OLGQ4BBVNX"

Write-Host "Initializing vault: $vaultId" -ForegroundColor Cyan

stellar contract invoke `
  --id $vaultId `
  --source deployer `
  --network testnet `
  -- `
  initialize `
  --config '{"owner":"GBWFMVVVEN2SHMMW6RFNISPOUBKS3XIAIE6AUKPXGQ5YLMMU57YDPPTL","name":"relio-test","assets":["CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H"],"rules":[],"router_address":"CCMAPXWVZD4USEKDWRYS7DA4Y3D7E2SDMGBFJUCEXTC7VN6CUBGWPFUS","liquidity_pool_address":null,"staking_pool_address":null,"factory_address":"CCODOMK6HSVVKX7FP2CCUVL7VKKOYCO3AJPWC5C656RP4FXGFPWU3YM2"}'

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Vault initialized successfully!" -ForegroundColor Green
    Write-Host "`nNow test deposit with:" -ForegroundColor Yellow
    Write-Host "stellar contract invoke --id $vaultId --source deployer --network testnet -- deposit_with_token --user GBWFMVVVEN2SHMMW6RFNISPOUBKS3XIAIE6AUKPXGQ5YLMMU57YDPPTL --amount 10000000 --deposit_token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Initialization failed" -ForegroundColor Red
}
