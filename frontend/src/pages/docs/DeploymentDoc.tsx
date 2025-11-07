import { Rocket } from 'lucide-react';
import { PageHeader, Section, CodeBlock, Alert, OrderedList } from '../../components/docs/DocsComponents';

export default function DeploymentDoc() {
  return (
    <>
      <PageHeader icon={<Rocket className="w-8 h-8" />} title="Contract Deployment" />
      
      <Section>
        <p>
          This guide covers deploying Syft's smart contracts to Stellar's Soroban testnet and mainnet.
          Follow these steps to deploy the Vault Factory, NFT, and associated contracts.
        </p>
      </Section>

      <Alert type="warning" title="Prerequisites">
        <ul className="space-y-1 text-sm">
          <li>• Soroban CLI installed (<code>cargo install soroban-cli</code>)</li>
          <li>• Rust toolchain with wasm32 target</li>
          <li>• Funded Stellar account (for testnet use friendbot)</li>
          <li>• Node.js 18+ for deployment scripts</li>
        </ul>
      </Alert>

      <Section title="Build Contracts">
        <p className="text-white/70 mb-4">
          First, compile all contracts to WASM:
        </p>
        <CodeBlock language="bash" code={`# Navigate to contracts directory
cd contracts

# Build all contracts
cargo build --target wasm32-unknown-unknown --release

# Optimize WASM files (reduces size)
soroban contract optimize \\
  --wasm target/wasm32-unknown-unknown/release/vault_factory.wasm

soroban contract optimize \\
  --wasm target/wasm32-unknown-unknown/release/nft_contract.wasm

soroban contract optimize \\
  --wasm target/wasm32-unknown-unknown/release/vault_instance.wasm`} />
      </Section>

      <Section title="Deploy to Testnet">
        <OrderedList items={[
          {
            title: 'Configure Network',
            description: 'Set up Soroban CLI for testnet',
            code: {
              language: 'bash',
              code: `soroban network add testnet \\
  --rpc-url https://soroban-testnet.stellar.org:443 \\
  --network-passphrase "Test SDF Network ; September 2015"

# Generate or import identity
soroban keys generate deployer --network testnet

# Fund account with friendbot
curl "https://friendbot.stellar.org?addr=$(soroban keys address deployer)"`
            }
          },
          {
            title: 'Deploy Vault Factory',
            description: 'Upload and instantiate the factory contract',
            code: {
              language: 'bash',
              code: `# Install WASM on-chain
soroban contract install \\
  --wasm target/wasm32-unknown-unknown/release/vault_factory.wasm \\
  --source deployer \\
  --network testnet

# Returns WASM hash, save it
FACTORY_WASM_HASH=<hash_from_previous_command>

# Deploy contract instance
soroban contract deploy \\
  --wasm-hash $FACTORY_WASM_HASH \\
  --source deployer \\
  --network testnet

# Returns contract address
FACTORY_ADDRESS=<address_from_previous_command>`
            }
          },
          {
            title: 'Initialize Factory',
            description: 'Set admin and vault WASM hash',
            code: {
              language: 'bash',
              code: `# First install vault instance WASM
VAULT_WASM_HASH=$(soroban contract install \\
  --wasm target/wasm32-unknown-unknown/release/vault_instance.wasm \\
  --source deployer \\
  --network testnet)

# Initialize factory
soroban contract invoke \\
  --id $FACTORY_ADDRESS \\
  --source deployer \\
  --network testnet \\
  -- initialize \\
  --admin $(soroban keys address deployer) \\
  --vault_wasm_hash $VAULT_WASM_HASH`
            }
          },
          {
            title: 'Deploy NFT Contract',
            description: 'Deploy and initialize the NFT minter',
            code: {
              language: 'bash',
              code: `# Install NFT WASM
NFT_WASM_HASH=$(soroban contract install \\
  --wasm target/wasm32-unknown-unknown/release/nft_contract.wasm \\
  --source deployer \\
  --network testnet)

# Deploy NFT contract
NFT_ADDRESS=$(soroban contract deploy \\
  --wasm-hash $NFT_WASM_HASH \\
  --source deployer \\
  --network testnet)

# Initialize NFT contract
soroban contract invoke \\
  --id $NFT_ADDRESS \\
  --source deployer \\
  --network testnet \\
  -- initialize \\
  --name "Syft Strategy NFT" \\
  --symbol "SYFT" \\
  --admin $(soroban keys address deployer)`
            }
          }
        ]} />
      </Section>

      <Section title="Using Deployment Scripts">
        <p className="text-white/70 mb-4">
          Syft includes PowerShell scripts for automated deployment:
        </p>
        <CodeBlock language="powershell" code={`# Deploy all contracts
.\\deploy-contracts.ps1

# Initialize with custom tokens
.\\initialize-contracts.ps1

# Register liquidity pools
.\\register-pools-for-vault.ps1

# Deploy and setup custom token ecosystem
.\\setup-custom-token-ecosystem.ps1`} />
        <Alert type="info" title="Script Configuration">
          Edit the <code>.env</code> files to configure contract addresses and parameters before running scripts.
        </Alert>
      </Section>

      <Section title="Verify Deployment">
        <p className="text-white/70 mb-4">
          Check that contracts are deployed correctly:
        </p>
        <CodeBlock language="bash" code={`# Check factory state
soroban contract invoke \\
  --id $FACTORY_ADDRESS \\
  --network testnet \\
  -- get_config

# Check NFT contract
soroban contract invoke \\
  --id $NFT_ADDRESS \\
  --network testnet \\
  -- name

# Create test vault to verify factory works
soroban contract invoke \\
  --id $FACTORY_ADDRESS \\
  --source deployer \\
  --network testnet \\
  -- create_vault \\
  --owner $(soroban keys address deployer) \\
  --name "Test Vault" \\
  --pools '["POOL_1", "POOL_2"]' \\
  --weights '[60, 40]' \\
  --rebalance_interval 86400`} />
      </Section>

      <Section title="Environment Variables">
        <p className="text-white/70 mb-4">
          Save deployed addresses to environment files:
        </p>
        <CodeBlock language="bash" code={`# Create .env file
cat > .env << EOF
VAULT_FACTORY_ADDRESS=$FACTORY_ADDRESS
NFT_CONTRACT_ADDRESS=$NFT_ADDRESS
VAULT_WASM_HASH=$VAULT_WASM_HASH
DEPLOYER_SECRET_KEY=<your_secret_key>
NETWORK=testnet
RPC_URL=https://soroban-testnet.stellar.org:443
EOF`} />
      </Section>

      <Section title="Mainnet Deployment">
        <Alert type="warning" title="Important">
          Before deploying to mainnet:
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Complete security audit of all contracts</li>
            <li>• Thoroughly test on testnet</li>
            <li>• Have emergency pause mechanisms ready</li>
            <li>• Prepare monitoring and alerting systems</li>
            <li>• Document all deployment steps and addresses</li>
          </ul>
        </Alert>
        <p className="text-white/70 mt-4">
          For mainnet, change <code>--network testnet</code> to <code>--network mainnet</code> and
          use the appropriate RPC URL and network passphrase.
        </p>
      </Section>
    </>
  );
}
