import { CheckCircle2 } from 'lucide-react';
import { PageHeader, Section, UnorderedList, ListItem, Alert } from '../../components/docs/DocsComponents';

export default function Prerequisites() {
  return (
    <>
      <PageHeader icon={<CheckCircle2 className="w-8 h-8" />} title="Prerequisites" />
      
      <Section>
        <p>
          Before installing Syft, make sure you have the following software and tools installed on your system.
        </p>
      </Section>

      <Section title="Required Software">
        <div className="space-y-6">
          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#dce85d]/20 border border-[#dce85d] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#dce85d]" />
              </div>
              <h3 className="text-white font-semibold">Node.js {'>'}= 20.x</h3>
            </div>
            <p className="text-white/70 text-sm mb-3">
              JavaScript runtime required for both frontend and backend development.
            </p>
            <a 
              href="https://nodejs.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#dce85d] hover:text-[#e8f06d] text-sm inline-flex items-center gap-1"
            >
              Download Node.js →
            </a>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#dce85d]/20 border border-[#dce85d] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#dce85d]" />
              </div>
              <h3 className="text-white font-semibold">npm {'>'}= 10.x</h3>
            </div>
            <p className="text-white/70 text-sm mb-3">
              Package manager for installing dependencies (comes with Node.js).
            </p>
            <p className="text-white/50 text-sm font-mono">npm --version</p>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#dce85d]/20 border border-[#dce85d] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#dce85d]" />
              </div>
              <h3 className="text-white font-semibold">Rust (Edition 2021)</h3>
            </div>
            <p className="text-white/70 text-sm mb-3">
              Required for building and deploying Soroban smart contracts.
            </p>
            <a 
              href="https://www.rust-lang.org/tools/install" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#dce85d] hover:text-[#e8f06d] text-sm inline-flex items-center gap-1"
            >
              Install Rust →
            </a>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#dce85d]/20 border border-[#dce85d] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#dce85d]" />
              </div>
              <h3 className="text-white font-semibold">Stellar CLI</h3>
            </div>
            <p className="text-white/70 text-sm mb-3">
              Command-line tool for deploying and managing Soroban contracts.
            </p>
            <a 
              href="https://developers.stellar.org/docs/tools/developer-tools" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#dce85d] hover:text-[#e8f06d] text-sm inline-flex items-center gap-1"
            >
              Install Stellar CLI →
            </a>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#dce85d]/20 border border-[#dce85d] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#dce85d]" />
              </div>
              <h3 className="text-white font-semibold">Freighter Wallet</h3>
            </div>
            <p className="text-white/70 text-sm mb-3">
              Browser extension wallet for Stellar network (required for using the application).
            </p>
            <a 
              href="https://www.freighter.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#dce85d] hover:text-[#e8f06d] text-sm inline-flex items-center gap-1"
            >
              Install Freighter →
            </a>
          </div>
        </div>
      </Section>

      <Section title="Optional but Recommended">
        <UnorderedList>
          <ListItem>
            <strong>Git</strong> - For version control and cloning the repository
          </ListItem>
          <ListItem>
            <strong>VS Code</strong> - Recommended IDE with excellent TypeScript and Rust support
          </ListItem>
          <ListItem>
            <strong>PostgreSQL</strong> - If running Supabase locally (optional, can use hosted version)
          </ListItem>
        </UnorderedList>
      </Section>

      <Section title="API Keys (for full functionality)">
        <p className="mb-4">
          To use all features of Syft, you'll need API keys for the following services:
        </p>
        <UnorderedList>
          <ListItem>
            <strong>Supabase</strong> - Database and real-time subscriptions (free tier available)
          </ListItem>
          <ListItem>
            <strong>OpenAI</strong> - For AI-powered features including GPT-5 Nano
          </ListItem>
          <ListItem>
            <strong>Runware</strong> - For AI-generated NFT artwork
          </ListItem>
          <ListItem>
            <strong>Tavily</strong> - For real-time web search in Terminal AI
          </ListItem>
        </UnorderedList>
      </Section>

      <Section>
        <Alert type="info">
          <strong>MVP Mode:</strong> You can run Syft in MVP mode without all API keys. 
          Set <code className="px-2 py-1 bg-black/50 rounded text-[#dce85d]">MVP_MODE=true</code> in 
          your backend .env file to use simulation mode for testing.
        </Alert>
      </Section>

      <Section title="System Requirements">
        <div className="bg-[#0a0b0c] border border-white/10 rounded-xl p-6">
          <UnorderedList>
            <ListItem><strong>OS:</strong> Windows 10+, macOS 10.15+, or Linux</ListItem>
            <ListItem><strong>RAM:</strong> 8GB minimum, 16GB recommended</ListItem>
            <ListItem><strong>Storage:</strong> 2GB free space</ListItem>
            <ListItem><strong>Browser:</strong> Chrome, Firefox, or Edge (for Freighter wallet)</ListItem>
          </UnorderedList>
        </div>
      </Section>
    </>
  );
}
