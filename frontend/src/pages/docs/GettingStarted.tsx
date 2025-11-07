import { Rocket } from 'lucide-react';
import { PageHeader, Section, OrderedList, OrderedListItem, Alert } from '../../components/docs/DocsComponents';
import { Link } from 'react-router-dom';

export default function GettingStarted() {
  return (
    <>
      <PageHeader icon={<Rocket className="w-8 h-8" />} title="Getting Started" />
      
      <Section>
        <p>
          Get up and running with Syft in just a few minutes. This guide will walk you through
          setting up your development environment and creating your first vault.
        </p>
      </Section>

      <Section title="Quick Navigation">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/docs/getting-started/prerequisites"
            className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <div className="w-8 h-8 bg-[#dce85d]/20 border border-[#dce85d] rounded-lg flex items-center justify-center text-[#dce85d] font-bold mb-3">
              1
            </div>
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Prerequisites
            </h3>
            <p className="text-white/60 text-sm">
              Required software and tools
            </p>
          </Link>

          <Link 
            to="/docs/getting-started/installation"
            className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <div className="w-8 h-8 bg-[#dce85d]/20 border border-[#dce85d] rounded-lg flex items-center justify-center text-[#dce85d] font-bold mb-3">
              2
            </div>
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Installation
            </h3>
            <p className="text-white/60 text-sm">
              Install and configure Syft
            </p>
          </Link>

          <Link 
            to="/docs/getting-started/quick-start"
            className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
          >
            <div className="w-8 h-8 bg-[#dce85d]/20 border border-[#dce85d] rounded-lg flex items-center justify-center text-[#dce85d] font-bold mb-3">
              3
            </div>
            <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
              Quick Start
            </h3>
            <p className="text-white/60 text-sm">
              Create your first vault
            </p>
          </Link>
        </div>
      </Section>

      <Section title="Overview">
        <p>
          Follow these steps to get Syft running on your local machine:
        </p>
        <OrderedList>
          <OrderedListItem 
            number={1}
            title="Check Prerequisites"
            description="Ensure you have Node.js, npm, Rust, and Freighter wallet installed"
          />
          <OrderedListItem 
            number={2}
            title="Clone & Install"
            description="Clone the repository and install dependencies for both frontend and backend"
          />
          <OrderedListItem 
            number={3}
            title="Configure Environment"
            description="Set up environment variables for database, AI services, and Stellar network"
          />
          <OrderedListItem 
            number={4}
            title="Start Development Servers"
            description="Run the backend and frontend development servers"
          />
          <OrderedListItem 
            number={5}
            title="Create Your First Vault"
            description="Connect your wallet and build your first yield strategy"
          />
        </OrderedList>
      </Section>

      <Section>
        <Alert type="info">
          <strong>Need help?</strong> If you encounter any issues during setup, check our{' '}
          <a href="https://github.com/zaikaman/Syft/issues" target="_blank" rel="noopener noreferrer" className="text-[#dce85d] hover:underline">
            GitHub Issues
          </a>{' '}
          or reach out to the community.
        </Alert>
      </Section>

      <Section title="What's Next?">
        <p>
          Once you have Syft running, explore these features:
        </p>
        <ul className="space-y-2 text-white/70 mt-4">
          <li>• <Link to="/docs/platform/vault-builder" className="text-[#dce85d] hover:underline">Vault Builder</Link> - Create your first automated yield strategy</li>
          <li>• <Link to="/docs/platform/terminal-ai" className="text-[#dce85d] hover:underline">Terminal AI</Link> - Execute blockchain operations with natural language</li>
          <li>• <Link to="/docs/platform/marketplace" className="text-[#dce85d] hover:underline">NFT Marketplace</Link> - Browse and subscribe to top-performing vaults</li>
          <li>• <Link to="/docs/platform/analytics" className="text-[#dce85d] hover:underline">Analytics</Link> - Deep dive into performance metrics</li>
        </ul>
      </Section>
    </>
  );
}
