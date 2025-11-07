import { Factory } from 'lucide-react';
import { PageHeader, Section, CodeBlock, Alert } from '../../components/docs/DocsComponents';

export default function VaultFactoryDoc() {
  return (
    <>
      <PageHeader icon={<Factory className="w-8 h-8" />} title="Vault Factory Contract" />
      
      <Section>
        <p>
          The Vault Factory is the core contract that manages the lifecycle of all vaults on Syft.
          It handles vault deployment, upgrades, and maintains a registry of all active vaults.
        </p>
      </Section>

      <Alert type="info" title="Contract Address">
        <code className="text-sm">CCODOMK6HSVVKX7FP2CCUVL7VKKOYCO3AJPWC5C656RP4FXGFPWU3YM2</code>
        <p className="text-sm mt-2 text-white/60">Testnet deployment</p>
      </Alert>

      <Section title="Key Functions">
        <div className="space-y-6">
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-[#dce85d]">•</span>
              create_vault
            </h3>
            <p className="text-white/70 mb-3 text-sm">
              Deploys a new vault instance for a user with specified configuration.
            </p>
            <CodeBlock language="rust" code={`pub fn create_vault(
    env: Env,
    owner: Address,
    name: String,
    pools: Vec<Address>,
    weights: Vec<u32>,
    rebalance_interval: u64
) -> Address`} />
            <p className="text-white/60 text-sm mt-2">
              Returns the address of the newly created vault contract.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-[#dce85d]">•</span>
              register_pool
            </h3>
            <p className="text-white/70 mb-3 text-sm">
              Registers a liquidity pool that vaults can interact with.
            </p>
            <CodeBlock language="rust" code={`pub fn register_pool(
    env: Env,
    pool_address: Address,
    token_a: Address,
    token_b: Address
) -> bool`} />
            <p className="text-white/60 text-sm mt-2">
              Returns true if registration successful. Only admin can register pools.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-[#dce85d]">•</span>
              get_user_vaults
            </h3>
            <p className="text-white/70 mb-3 text-sm">
              Retrieves all vaults owned by a specific address.
            </p>
            <CodeBlock language="rust" code={`pub fn get_user_vaults(
    env: Env,
    owner: Address
) -> Vec<Address>`} />
            <p className="text-white/60 text-sm mt-2">
              Returns array of vault contract addresses owned by the user.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-[#dce85d]">•</span>
              update_vault_wasm
            </h3>
            <p className="text-white/70 mb-3 text-sm">
              Updates the WASM hash used for new vault deployments (admin only).
            </p>
            <CodeBlock language="rust" code={`pub fn update_vault_wasm(
    env: Env,
    admin: Address,
    new_wasm_hash: BytesN<32>
) -> bool`} />
            <p className="text-white/60 text-sm mt-2">
              Allows upgrading vault logic for all future deployments.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Usage Example">
        <p className="text-white/70 mb-4">
          Example TypeScript code for interacting with the Vault Factory:
        </p>
        <CodeBlock language="typescript" code={`import * as StellarSDK from '@stellar/stellar-sdk';

// Initialize factory contract
const factoryAddress = 'CCODOMK6HSVVKX7FP2CCUVL7VKKOYCO3AJPWC5C656RP4FXGFPWU3YM2';
const factory = new StellarSDK.Contract(factoryAddress);

// Create a new vault
const pools = [
  'POOL_ADDRESS_1',
  'POOL_ADDRESS_2'
];
const weights = [60, 40]; // 60% pool1, 40% pool2
const rebalanceInterval = 86400; // 24 hours in seconds

const tx = new StellarSDK.TransactionBuilder(account, {
  fee: StellarSDK.BASE_FEE,
  networkPassphrase: StellarSDK.Networks.TESTNET
})
  .addOperation(
    factory.call(
      'create_vault',
      StellarSDK.Address.fromString(userPublicKey),
      'My DeFi Vault',
      pools,
      weights,
      rebalanceInterval
    )
  )
  .setTimeout(30)
  .build();

// Sign and submit transaction
const result = await submitTransaction(tx);
const vaultAddress = result.returnValue; // Address of new vault`} />
      </Section>

      <Section title="Events">
        <div className="space-y-3">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-1 text-sm">VaultCreated</h4>
            <p className="text-white/60 text-sm">
              Emitted when a new vault is deployed. Contains vault address and owner.
            </p>
          </div>
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-1 text-sm">PoolRegistered</h4>
            <p className="text-white/60 text-sm">
              Emitted when a new liquidity pool is registered for vault use.
            </p>
          </div>
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-1 text-sm">WasmUpdated</h4>
            <p className="text-white/60 text-sm">
              Emitted when the vault WASM hash is updated by admin.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
