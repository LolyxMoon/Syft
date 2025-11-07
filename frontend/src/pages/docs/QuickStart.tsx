import { Zap } from 'lucide-react';
import { PageHeader, Section, OrderedList, OrderedListItem, Alert, CodeBlock } from '../../components/docs/DocsComponents';
import { Link } from 'react-router-dom';

export default function QuickStart() {
  return (
    <>
      <PageHeader icon={<Zap className="w-8 h-8" />} title="Quick Start Guide" />
      
      <Section>
        <p>
          Get started with Syft in 5 minutes! This guide will walk you through creating your first vault.
        </p>
      </Section>

      <Section>
        <Alert type="info">
          <strong>Before you begin:</strong> Make sure you have completed the{' '}
          <Link to="/docs/getting-started/installation" className="text-[#dce85d] hover:underline">
            installation
          </Link>{' '}
          and have both backend and frontend servers running.
        </Alert>
      </Section>

      <Section title="Step-by-Step Guide">
        <OrderedList>
          <OrderedListItem 
            number={1}
            title="Connect Your Wallet"
            description="Click the 'Connect Wallet' button in the top-right corner. Select Freighter and approve the connection. Make sure you're on Stellar Testnet."
          />
          <OrderedListItem 
            number={2}
            title="Navigate to Vault Builder"
            description="Click on 'Vault Builder' in the sidebar or navigate to /app/builder. You'll see three creation modes: Visual, AI Chat, and Voice."
          />
          <OrderedListItem 
            number={3}
            title="Choose Your Creation Mode"
            description="For beginners, we recommend starting with the AI Chat mode. Simply describe the strategy you want to create."
          />
          <OrderedListItem 
            number={4}
            title="Configure Your Strategy"
            description="Set allocation percentages for different assets, define rebalancing rules, and customize risk parameters."
          />
          <OrderedListItem 
            number={5}
            title="Deploy Your Vault"
            description="Click 'Deploy Vault' to save your configuration and deploy it to the Stellar network. Confirm the transaction in Freighter."
          />
        </OrderedList>
      </Section>

      <Section title="Example: Creating a Simple Vault">
        <p className="mb-4">
          Let's create a basic 60/40 XLM/USDC vault with monthly rebalancing:
        </p>

        <div className="space-y-4">
          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-3">Using Visual Builder:</h4>
            <ol className="space-y-2 text-white/70 text-sm">
              <li>1. Drag an "Asset" block for XLM, set allocation to 60%</li>
              <li>2. Drag another "Asset" block for USDC, set allocation to 40%</li>
              <li>3. Drag a "Rebalance Rule" block, set frequency to "Monthly"</li>
              <li>4. Connect the blocks on the canvas</li>
              <li>5. Click "Deploy Vault"</li>
            </ol>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-3">Using AI Chat:</h4>
            <p className="text-white/70 text-sm mb-3">Simply type or say:</p>
            <div className="bg-black/50 border border-white/10 rounded-lg p-3">
              <p className="text-[#dce85d] font-mono text-sm">
                "Create a vault with 60% XLM and 40% USDC, rebalance monthly"
              </p>
            </div>
            <p className="text-white/70 text-sm mt-3">
              The AI will generate the configuration automatically!
            </p>
          </div>
        </div>
      </Section>

      <Section title="Fund Your Testnet Account">
        <p className="mb-4">
          If you're on testnet and need some XLM for testing, use the Friendbot:
        </p>
        <CodeBlock 
          code={`# Using Terminal AI (easiest way)
# Just type: "Fund my account from the faucet"

# Or use Friendbot directly
https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY`} 
        />
      </Section>

      <Section title="Monitor Your Vault">
        <p className="mb-4">
          Once deployed, you can monitor your vault performance:
        </p>
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Dashboard:</strong> View all your vaults and their performance metrics</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Analytics:</strong> Deep dive into risk metrics, asset correlations, and historical performance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Vault Detail:</strong> Click on any vault to see detailed information and manage deposits/withdrawals</span>
          </li>
        </ul>
      </Section>

      <Section title="Try Terminal AI">
        <p className="mb-4">
          Explore the Terminal AI to execute blockchain operations with natural language:
        </p>
        <div className="bg-[#0a0b0c] border border-[#dce85d]/30 rounded-xl p-5">
          <p className="text-white/70 text-sm mb-3">Example commands:</p>
          <div className="space-y-2 font-mono text-sm">
            <p className="text-white/60">→ <span className="text-[#dce85d]">"Show me my balance"</span></p>
            <p className="text-white/60">→ <span className="text-[#dce85d]">"Swap 100 XLM for USDC"</span></p>
            <p className="text-white/60">→ <span className="text-[#dce85d]">"Mint me a Naruto NFT"</span></p>
            <p className="text-white/60">→ <span className="text-[#dce85d]">"Lend 500 USDC to Blend"</span></p>
            <p className="text-white/60">→ <span className="text-[#dce85d]">"Check my Blend position"</span></p>
          </div>
        </div>
      </Section>

      <Section title="Next Steps">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to="/docs/platform/vault-builder"
            className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Advanced Vault Building →
            </h3>
            <p className="text-white/60 text-sm">
              Learn about complex strategies, rebalancing rules, and optimization
            </p>
          </Link>

          <Link 
            to="/docs/platform/marketplace"
            className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Monetize Your Strategy →
            </h3>
            <p className="text-white/60 text-sm">
              Mint your vault as an NFT and earn from subscribers
            </p>
          </Link>

          <Link 
            to="/docs/platform/analytics"
            className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Analytics & Backtesting →
            </h3>
            <p className="text-white/60 text-sm">
              Analyze performance and test strategies against historical data
            </p>
          </Link>

          <Link 
            to="/docs/smart-contracts"
            className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Smart Contracts →
            </h3>
            <p className="text-white/60 text-sm">
              Understand the underlying Soroban contracts powering Syft
            </p>
          </Link>
        </div>
      </Section>

      <Section>
        <Alert type="success">
          <strong>Congratulations!</strong> You've created your first vault on Syft. 
          Explore the platform to discover more features and optimize your DeFi strategies.
        </Alert>
      </Section>
    </>
  );
}
