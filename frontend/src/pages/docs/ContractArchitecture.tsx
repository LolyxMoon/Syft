import { Code2 } from 'lucide-react';
import { PageHeader, Section, CodeBlock } from '../../components/docs/DocsComponents';

export default function ContractArchitecture() {
  return (
    <>
      <PageHeader icon={<Code2 className="w-8 h-8" />} title="Contract Architecture" />
      
      <Section>
        <p>
          Syft's smart contract architecture is built on Soroban, Stellar's smart contract platform.
          The system consists of modular, upgradeable contracts that work together to provide a
          secure and flexible DeFi infrastructure.
        </p>
      </Section>

      <Section title="Core Contracts">
        <div className="space-y-6">
          <div>
            <h3 className="text-white font-semibold mb-2">Vault Factory Contract</h3>
            <p className="text-white/70 mb-3">
              The central contract responsible for deploying and managing all vault instances.
              Implements factory pattern for efficient vault creation.
            </p>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Deploys new vault instances from template WASM</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Tracks all deployed vaults and their owners</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Handles vault registration and metadata</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Manages vault upgrades and migrations</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">Vault Instance Contract</h3>
            <p className="text-white/70 mb-3">
              Individual vault contracts that execute DeFi strategies. Each vault is an isolated
              contract instance with its own state and logic.
            </p>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Manages vault-specific assets and positions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Executes rebalancing and strategy logic</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Handles deposits, withdrawals, and fee collection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Integrates with liquidity pools and DEX protocols</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">NFT Contract (SIP-009)</h3>
            <p className="text-white/70 mb-3">
              Compliant with Stellar Improvement Proposal 009 for NFT standards. Represents
              vault ownership and strategy blueprints.
            </p>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Mints NFTs for vault creators and traders</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Stores metadata including strategy details and artwork</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Manages royalty distribution (80% to creator, 20% platform)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dce85d]">•</span>
                <span>Enables transferability and marketplace trading</span>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Contract Interaction Flow">
        <CodeBlock language="plaintext" code={`
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Factory    │  │  NFT Minter  │
│   Contract   │  │   Contract   │
└──────┬───────┘  └──────────────┘
       │
       │ deploys
       ▼
┌──────────────┐
│    Vault     │◄─────┐
│  Instance    │      │
└──────┬───────┘      │ interacts
       │              │
       ├──────────────┘
       │
       ▼
┌──────────────┐
│ Liquidity    │
│   Pools      │
└──────────────┘
        `} />
      </Section>

      <Section title="Key Design Patterns">
        <div className="space-y-4">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Factory Pattern</h4>
            <p className="text-white/70 text-sm">
              Centralized factory contract deploys vault instances, ensuring consistent
              initialization and reducing deployment costs through WASM reuse.
            </p>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Proxy/Upgradeable Pattern</h4>
            <p className="text-white/70 text-sm">
              Vaults can be upgraded by updating the WASM hash in the factory, allowing
              bug fixes and feature additions without redeploying all instances.
            </p>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Access Control</h4>
            <p className="text-white/70 text-sm">
              Role-based permissions ensure only vault owners can modify strategies,
              while emergency functions are restricted to administrators.
            </p>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Event Emission</h4>
            <p className="text-white/70 text-sm">
              All critical actions emit events for off-chain indexing, enabling the
              dashboard to display real-time vault activity and analytics.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Security Measures">
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Reentrancy Guards:</strong> Prevent recursive calls that could drain funds</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Emergency Pause:</strong> Admin can pause contracts in case of exploits</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Input Validation:</strong> All parameters checked before execution</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Slippage Protection:</strong> Minimum output amounts prevent sandwich attacks</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Time Locks:</strong> Critical operations require time delays for review</span>
          </li>
        </ul>
      </Section>
    </>
  );
}
