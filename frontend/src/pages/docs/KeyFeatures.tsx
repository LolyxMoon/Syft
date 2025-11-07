import { Zap } from 'lucide-react';
import { PageHeader, Section, FeatureItem } from '../../components/docs/DocsComponents';
import { TrendingUp, Image, Database, Shield, Zap as ZapIcon, Layout } from 'lucide-react';

export default function KeyFeatures() {
  return (
    <>
      <PageHeader icon={<Zap className="w-8 h-8" />} title="Key Features" />
      
      <Section>
        <p>
          Syft offers a comprehensive suite of features designed to make DeFi yield strategies accessible,
          profitable, and secure for everyone.
        </p>
      </Section>

      <Section title="Core Features">
        <div className="space-y-4">
          <FeatureItem 
            icon={<Layout className="w-5 h-5" />}
            title="Visual Vault Builder"
            description="Drag-and-drop interface for creating complex yield strategies with real-time validation and preview"
          />
          <FeatureItem 
            icon={<TrendingUp className="w-5 h-5" />}
            title="Automated Yield Strategies"
            description="Create sophisticated DeFi strategies with automatic rebalancing and optimization based on custom rules"
          />
          <FeatureItem 
            icon={<Image className="w-5 h-5" />}
            title="NFT Marketplace"
            description="Monetize your strategies by minting and selling vault NFTs with AI-generated artwork"
          />
          <FeatureItem 
            icon={<Database className="w-5 h-5" />}
            title="Comprehensive Analytics"
            description="Real-time monitoring, backtesting, and performance tracking with risk analysis for all your vaults"
          />
          <FeatureItem 
            icon={<Shield className="w-5 h-5" />}
            title="Non-Custodial Security"
            description="You maintain full control of your assets with audited smart contracts and role-based access control"
          />
          <FeatureItem 
            icon={<ZapIcon className="w-5 h-5" />}
            title="Multi-Network Support"
            description="Works seamlessly across Stellar Testnet, Futurenet, and Mainnet"
          />
        </div>
      </Section>

      <Section title="For Strategy Creators">
        <ul className="space-y-3 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d] mt-1">•</span>
            <span><strong className="text-white">Visual Strategy Builder:</strong> Drag and drop blocks on the canvas to build complex strategies</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d] mt-1">•</span>
            <span><strong className="text-white">AI-Powered Creation:</strong> Chat with AI or use voice commands to create strategies naturally</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d] mt-1">•</span>
            <span><strong className="text-white">Vault NFT Minting:</strong> Convert your vaults into tradeable NFTs with AI-generated artwork</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d] mt-1">•</span>
            <span><strong className="text-white">Revenue Sharing:</strong> Earn passive income from subscribers (e.g., 5% profit share)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d] mt-1">•</span>
            <span><strong className="text-white">Real-time Monitoring:</strong> Track performance, TVL, APY, and user positions</span>
          </li>
        </ul>
      </Section>

      <Section title="For Vault Subscribers">
        <ul className="space-y-3 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d] mt-1">•</span>
            <span><strong className="text-white">Discover Top Strategies:</strong> Browse the marketplace for high-performing vaults</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d] mt-1">•</span>
            <span><strong className="text-white">Subscribe & Earn:</strong> Deposit funds and earn automated yields</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d] mt-1">•</span>
            <span><strong className="text-white">Transparent Performance:</strong> View detailed analytics and historical returns</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d] mt-1">•</span>
            <span><strong className="text-white">Easy Management:</strong> Monitor all positions from a unified dashboard</span>
          </li>
        </ul>
      </Section>
    </>
  );
}
