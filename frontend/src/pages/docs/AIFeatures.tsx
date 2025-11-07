import { Bot } from 'lucide-react';
import { PageHeader, Section } from '../../components/docs/DocsComponents';
import { Link } from 'react-router-dom';

export default function AIFeatures() {
  return (
    <>
      <PageHeader icon={<Bot className="w-8 h-8" />} title="AI-Powered Features" />
      
      <Section>
        <p>
          Syft leverages cutting-edge AI to democratize DeFi strategy creation. From natural language
          vault building to AI-generated NFT artwork, our platform makes advanced DeFi accessible to everyone.
        </p>
      </Section>

      <Section title="AI Services">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/docs/ai-features/gpt-5-nano"
            className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl hover:border-[#dce85d]/40 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              GPT-5 Nano →
            </h3>
            <p className="text-white/60 text-sm">
              Natural language processing for vault creation and Terminal AI
            </p>
          </Link>

          <Link 
            to="/docs/ai-features/runware-ai"
            className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl hover:border-[#dce85d]/40 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Runware AI →
            </h3>
            <p className="text-white/60 text-sm">
              AI-generated artwork for vault NFTs
            </p>
          </Link>

          <Link 
            to="/docs/ai-features/tavily-search"
            className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl hover:border-[#dce85d]/40 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Tavily Search →
            </h3>
            <p className="text-white/60 text-sm">
              Real-time web search for market data and information
            </p>
          </Link>
        </div>
      </Section>

      <Section title="Key Capabilities">
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Natural Language Understanding:</strong> Describe strategies in plain English</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Strategy Optimization:</strong> AI-powered suggestions to improve vaults</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Blockchain Operations:</strong> Execute complex transactions via chat</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Visual Content Generation:</strong> Create unique NFT artwork automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Real-time Information:</strong> Fetch latest DeFi data and market insights</span>
          </li>
        </ul>
      </Section>
    </>
  );
}
