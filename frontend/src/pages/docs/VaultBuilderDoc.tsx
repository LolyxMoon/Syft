import { Palette } from 'lucide-react';
import { PageHeader, Section, FeatureCard, FeatureGrid, Alert } from '../../components/docs/DocsComponents';
import { Layout, Bot, Mic } from 'lucide-react';

export default function VaultBuilderDoc() {
  return (
    <>
      <PageHeader icon={<Palette className="w-8 h-8" />} title="Vault Builder" />
      
      <Section>
        <p>
          The Vault Builder is the heart of Syft—where yield strategies come to life. Create sophisticated
          DeFi vaults using three intuitive modes, each designed for different user preferences and workflows.
        </p>
      </Section>

      <Section title="Three Creation Modes">
        <FeatureGrid>
          <FeatureCard 
            icon={<Layout className="w-6 h-6" />}
            title="Visual Builder"
            description="Drag-and-drop block-based interface with real-time validation and visual strategy preview"
          />
          <FeatureCard 
            icon={<Bot className="w-6 h-6" />}
            title="AI Chat Builder"
            description="Natural language strategy creation powered by GPT-5 Nano with contextual suggestions"
          />
          <FeatureCard 
            icon={<Mic className="w-6 h-6" />}
            title="Voice Builder"
            description="Hands-free vault creation with voice-to-text interpretation and real-time feedback"
          />
        </FeatureGrid>
      </Section>

      <Section title="Visual Builder">
        <p>
          The visual builder provides a block-based canvas where you can drag and drop components to build your strategy:
        </p>
        <div className="mt-4 space-y-3">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Asset Blocks</h4>
            <p className="text-white/70 text-sm">
              Define which assets to include in your vault (XLM, USDC, BTC, ETH, etc.) and set their target allocations
            </p>
          </div>
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Rebalancing Rules</h4>
            <p className="text-white/70 text-sm">
              Set triggers for automatic rebalancing (time-based, threshold-based, or condition-based)
            </p>
          </div>
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">DeFi Protocols</h4>
            <p className="text-white/70 text-sm">
              Connect to lending protocols, liquidity pools, and staking platforms
            </p>
          </div>
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Risk Parameters</h4>
            <p className="text-white/70 text-sm">
              Define maximum drawdown, stop-loss levels, and position size limits
            </p>
          </div>
        </div>
      </Section>

      <Section title="AI Chat Builder">
        <p>
          Describe your strategy in plain English and let GPT-5 Nano generate the configuration:
        </p>
        <div className="mt-4 p-5 bg-[#0a0b0c] border border-[#dce85d]/30 rounded-xl">
          <h4 className="text-white font-medium mb-3">Example Conversations:</h4>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-white/60 mb-1">You:</p>
              <p className="text-[#dce85d] font-mono">"Create a conservative vault with 70% stablecoins and 30% XLM"</p>
            </div>
            <div>
              <p className="text-white/60 mb-1">You:</p>
              <p className="text-[#dce85d] font-mono">"Build an aggressive growth strategy focusing on high-yield protocols"</p>
            </div>
            <div>
              <p className="text-white/60 mb-1">You:</p>
              <p className="text-[#dce85d] font-mono">"I want to rebalance weekly when any asset deviates by more than 5%"</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Voice Builder">
        <p>
          Use voice commands to create and modify vaults hands-free, perfect for on-the-go management:
        </p>
        <ul className="space-y-2 text-white/70 mt-4">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Voice-to-text with intelligent intent recognition</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Real-time visual feedback as you speak</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Confirmation prompts before executing changes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Multi-language support (coming soon)</span>
          </li>
        </ul>
      </Section>

      <Section title="Features">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <span className="text-[#dce85d] text-xl">✓</span>
            <div>
              <h4 className="text-white font-medium">Template Library</h4>
              <p className="text-white/60 text-sm">Start from pre-built templates for common strategies</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <span className="text-[#dce85d] text-xl">✓</span>
            <div>
              <h4 className="text-white font-medium">Real-time Validation</h4>
              <p className="text-white/60 text-sm">Instant feedback on configuration errors and warnings</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <span className="text-[#dce85d] text-xl">✓</span>
            <div>
              <h4 className="text-white font-medium">Undo/Redo</h4>
              <p className="text-white/60 text-sm">Full history tracking with ability to revert changes</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#0a0b0c] border border-white/10 rounded-lg">
            <span className="text-[#dce85d] text-xl">✓</span>
            <div>
              <h4 className="text-white font-medium">Yield Comparison</h4>
              <p className="text-white/60 text-sm">Compare expected yields across different protocols</p>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <Alert type="success">
          <strong>Pro Tip:</strong> Start with the AI Chat builder to quickly generate a configuration,
          then switch to Visual Builder to fine-tune the details!
        </Alert>
      </Section>
    </>
  );
}
