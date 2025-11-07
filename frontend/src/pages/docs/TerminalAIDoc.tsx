import { Terminal } from 'lucide-react';
import { PageHeader, Section, CodeBlock, Alert } from '../../components/docs/DocsComponents';

export default function TerminalAIDoc() {
  return (
    <>
      <PageHeader icon={<Terminal className="w-8 h-8" />} title="Terminal AI" />
      
      <Section>
        <p>
          Terminal AI is your intelligent blockchain assistant, powered by GPT-5 Nano. Execute complex 
          blockchain operations on Stellar using natural language commands—no need to remember CLI syntax 
          or navigate through multiple interfaces.
        </p>
      </Section>

      <Section title="What Can Terminal AI Do?">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-[#dce85d] font-semibold mb-3">Wallet Management</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Fund account from Friendbot faucet</li>
              <li>• Check XLM and asset balances</li>
              <li>• Create new Stellar accounts</li>
              <li>• View transaction history</li>
            </ul>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-[#dce85d] font-semibold mb-3">Asset Operations</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Create custom assets</li>
              <li>• Transfer tokens between accounts</li>
              <li>• Batch transfers for efficiency</li>
              <li>• Set up and revoke trustlines</li>
            </ul>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-[#dce85d] font-semibold mb-3">DEX & Liquidity</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Swap assets on Stellar DEX</li>
              <li>• Add/remove liquidity from pools</li>
              <li>• View pool analytics and prices</li>
              <li>• Check slippage estimates</li>
            </ul>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-[#dce85d] font-semibold mb-3">Blend Protocol</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Lend assets to earn interest</li>
              <li>• Borrow against collateral</li>
              <li>• Repay loans and withdraw</li>
              <li>• Track position health factor</li>
            </ul>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-[#dce85d] font-semibold mb-3">NFT Operations</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Mint NFTs with AI-generated art</li>
              <li>• Transfer NFT ownership</li>
              <li>• Burn NFTs</li>
              <li>• List and view owned NFTs</li>
            </ul>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-[#dce85d] font-semibold mb-3">Web Search & Data</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Real-time info via Tavily API</li>
              <li>• Look up asset issuers</li>
              <li>• Find contract addresses</li>
              <li>• Get market data</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Example Commands">
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Basic Operations</h4>
            <CodeBlock 
              code={`"Show me my balance"
"Fund my account from the faucet"
"What's my account address?"
"Check the current XLM price"`}
            />
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Asset Transfers</h4>
            <CodeBlock 
              code={`"Transfer 100 XLM to GDSAMPLE..."
"Send 50 USDC to my friend's address"
"Swap 200 XLM for USDC"
"Swap half of my XLM to USDC"`}
            />
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Blend Protocol</h4>
            <CodeBlock 
              code={`"Lend 1000 USDC to Blend"
"Borrow 500 XLM from Blend"
"Check my Blend position"
"What's the current APY on USDC?"
"Repay my XLM loan"
"Withdraw my USDC from Blend"`}
            />
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">NFT Operations</h4>
            <CodeBlock 
              code={`"Mint me a Goku NFT with lightning powers"
"Mint a cyberpunk cityscape NFT"
"List my NFTs"
"Transfer my NFT #123 to GDSAMPLE..."`}
            />
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Advanced Queries</h4>
            <CodeBlock 
              code={`"What are the top DeFi protocols on Stellar?"
"Find the USDC issuer address"
"Show me liquidity pools with XLM"
"Search for recent transactions on my account"`}
            />
          </div>
        </div>
      </Section>

      <Section title="Smart Features">
        <div className="space-y-3">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Context Management</h4>
            <p className="text-white/70 text-sm">
              Terminal AI automatically summarizes conversations at ~80k tokens to prevent context overflow
              while preserving important information. Your chat history is saved locally for seamless sessions.
            </p>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Balance-Based Operations</h4>
            <p className="text-white/70 text-sm">
              Execute operations based on your current balance. For example, "swap half my XLM" automatically
              checks your balance and calculates the correct amount.
            </p>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Transaction Simulation</h4>
            <p className="text-white/70 text-sm">
              All transactions are simulated before execution to ensure they will succeed. You'll see
              estimated fees and outcomes before confirming in your wallet.
            </p>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Multi-Step Workflows</h4>
            <p className="text-white/70 text-sm">
              Terminal AI can execute complex multi-step operations like setting up trustlines before
              transfers, or providing collateral before borrowing.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <Alert type="warning">
          <strong>Security Note:</strong> Terminal AI only operates through your connected Freighter wallet.
          Your private keys never leave your browser, and you must approve every transaction.
        </Alert>
      </Section>

      <Section title="Powered by GPT-5 Nano">
        <p>
          Terminal AI uses the cutting-edge <strong>gpt-5-nano-2025-08-07</strong> model, which provides:
        </p>
        <ul className="space-y-2 text-white/70 mt-4">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Advanced natural language understanding for complex queries</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Context-aware responses based on conversation history</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Educational explanations for blockchain concepts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Intelligent error handling and suggestions</span>
          </li>
        </ul>
      </Section>
    </>
  );
}
