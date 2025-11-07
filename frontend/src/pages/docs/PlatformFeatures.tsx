import { Layout } from 'lucide-react';
import { PageHeader, Section } from '../../components/docs/DocsComponents';
import { Link } from 'react-router-dom';

export default function PlatformFeatures() {
  return (
    <>
      <PageHeader icon={<Layout className="w-8 h-8" />} title="Platform Features" />
      
      <Section>
        <p>
          Syft offers a comprehensive suite of features designed to make DeFi accessible and profitable.
          Explore each feature in detail below.
        </p>
      </Section>

      <Section title="Core Features">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to="/docs/platform/vault-builder"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Vault Builder →
            </h3>
            <p className="text-white/60 text-sm">
              Create automated yield strategies with visual, AI, or voice interfaces
            </p>
          </Link>

          <Link 
            to="/docs/platform/terminal-ai"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Terminal AI →
            </h3>
            <p className="text-white/60 text-sm">
              Execute blockchain operations with natural language commands
            </p>
          </Link>

          <Link 
            to="/docs/platform/dashboard"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Dashboard →
            </h3>
            <p className="text-white/60 text-sm">
              Monitor all your vaults and positions in one place
            </p>
          </Link>

          <Link 
            to="/docs/platform/marketplace"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              NFT Marketplace →
            </h3>
            <p className="text-white/60 text-sm">
              Discover, buy, and sell vault strategies as NFTs
            </p>
          </Link>

          <Link 
            to="/docs/platform/analytics"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Analytics →
            </h3>
            <p className="text-white/60 text-sm">
              Deep insights into risk, performance, liquidity, and timing
            </p>
          </Link>

          <Link 
            to="/docs/platform/backtesting"
            className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Backtesting →
            </h3>
            <p className="text-white/60 text-sm">
              Test strategies against historical data before deployment
            </p>
          </Link>
        </div>
      </Section>
    </>
  );
}
