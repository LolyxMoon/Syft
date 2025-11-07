import { Store } from 'lucide-react';
import { PageHeader, Section, Alert, FeatureCard, FeatureGrid } from '../../components/docs/DocsComponents';
import { Image, DollarSign, Users, TrendingUp } from 'lucide-react';

export default function MarketplaceDoc() {
  return (
    <>
      <PageHeader icon={<Store className="w-8 h-8" />} title="NFT Marketplace" />
      
      <Section>
        <p>
          The NFT Marketplace allows strategy creators to monetize their vaults and enables subscribers
          to discover and invest in top-performing strategies. Each vault can be minted as a unique NFT
          with AI-generated artwork.
        </p>
      </Section>

      <Section title="For Strategy Creators">
        <FeatureGrid>
          <FeatureCard 
            icon={<Image className="w-6 h-6" />}
            title="Mint Vault NFTs"
            description="Convert your vaults into tradeable NFTs with AI-generated artwork using Runware AI"
          />
          <FeatureCard 
            icon={<DollarSign className="w-6 h-6" />}
            title="Set Profit Share"
            description="Define subscription fees and profit-sharing percentages (e.g., 5% of subscriber profits)"
          />
          <FeatureCard 
            icon={<Users className="w-6 h-6" />}
            title="Track Revenue"
            description="Monitor earnings from subscribers and view detailed analytics"
          />
        </FeatureGrid>
      </Section>

      <Section title="Minting a Vault NFT">
        <p className="mb-4">
          Transform your vault into an NFT in just a few steps:
        </p>
        <ol className="space-y-3 text-white/70">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-[#dce85d]/20 border border-[#dce85d] rounded-full flex items-center justify-center text-[#dce85d] font-bold text-sm">
              1
            </span>
            <div>
              <strong className="text-white">Select Your Vault:</strong> Choose an existing vault from your dashboard
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-[#dce85d]/20 border border-[#dce85d] rounded-full flex items-center justify-center text-[#dce85d] font-bold text-sm">
              2
            </span>
            <div>
              <strong className="text-white">Generate Artwork:</strong> Describe your vision or let AI create unique artwork automatically
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-[#dce85d]/20 border border-[#dce85d] rounded-full flex items-center justify-center text-[#dce85d] font-bold text-sm">
              3
            </span>
            <div>
              <strong className="text-white">Set Pricing:</strong> Define subscription fees and profit-sharing terms
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-[#dce85d]/20 border border-[#dce85d] rounded-full flex items-center justify-center text-[#dce85d] font-bold text-sm">
              4
            </span>
            <div>
              <strong className="text-white">Mint & List:</strong> Deploy the NFT to Stellar and list it on the marketplace
            </div>
          </li>
        </ol>
      </Section>

      <Section title="For Vault Subscribers">
        <p className="mb-4">
          Discover and invest in the best strategies:
        </p>
        <div className="space-y-4">
          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-3">Browse Listings</h4>
            <p className="text-white/70 text-sm">
              Explore vaults by performance, APY, risk level, or category. Filter by asset type,
              strategy complexity, or creator reputation.
            </p>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-3">View Analytics</h4>
            <p className="text-white/70 text-sm">
              Access detailed performance history, risk metrics, subscriber count, and creator track record
              before making investment decisions.
            </p>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-3">Purchase NFTs</h4>
            <p className="text-white/70 text-sm">
              Buy vault NFTs to gain access to exclusive strategies. Own the NFT and benefit from
              the vault's performance.
            </p>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-3">Subscribe & Earn</h4>
            <p className="text-white/70 text-sm">
              Deposit funds into vaults and start earning automated yields. Track your positions
              from the dashboard.
            </p>
          </div>
        </div>
      </Section>

      <Section title="NFT Features">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <span className="text-[#dce85d] text-xl">✓</span>
            <div>
              <h4 className="text-white font-medium">AI-Generated Artwork</h4>
              <p className="text-white/60 text-sm">
                Unique visual representations powered by Runware AI, customizable by prompt
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <span className="text-[#dce85d] text-xl">✓</span>
            <div>
              <h4 className="text-white font-medium">On-Chain Metadata</h4>
              <p className="text-white/60 text-sm">
                All vault information stored on Stellar blockchain for transparency
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <span className="text-[#dce85d] text-xl">✓</span>
            <div>
              <h4 className="text-white font-medium">Transfer & Resale</h4>
              <p className="text-white/60 text-sm">
                Full ownership rights—transfer or sell your vault NFTs on secondary markets
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <span className="text-[#dce85d] text-xl">✓</span>
            <div>
              <h4 className="text-white font-medium">Provenance Tracking</h4>
              <p className="text-white/60 text-sm">
                Complete history of ownership and performance since creation
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Revenue Model">
        <p className="mb-4">
          Creators can earn passive income from their vaults:
        </p>
        <div className="p-5 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/30 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-[#dce85d]" />
            <div>
              <h4 className="text-white font-semibold mb-1">Profit Sharing</h4>
              <p className="text-white/70 text-sm">
                Set a percentage (e.g., 5%) of subscriber profits that automatically flows to you
              </p>
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-white/60 text-sm mb-2">Example Calculation:</p>
            <ul className="space-y-1 text-white/70 text-sm font-mono">
              <li>Subscriber deposits: <span className="text-[#dce85d]">$10,000</span></li>
              <li>Vault performance: <span className="text-[#dce85d]">+20% APY</span></li>
              <li>Subscriber profit: <span className="text-[#dce85d]">$2,000</span></li>
              <li>Your share (5%): <span className="text-[#dce85d]">$100</span></li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <Alert type="info">
          <strong>Coming Soon:</strong> Secondary marketplace for trading vault NFTs, 
          governance features for NFT holders, and reputation scores for creators.
        </Alert>
      </Section>
    </>
  );
}
