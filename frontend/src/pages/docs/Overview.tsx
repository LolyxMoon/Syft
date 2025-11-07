import { BookOpen } from 'lucide-react';
import { PageHeader, Section } from '../../components/docs/DocsComponents';
import { Link } from 'react-router-dom';

export default function DocsOverview() {
  return (
    <>
      <PageHeader icon={<BookOpen className="w-8 h-8" />} title="Overview" />
      
      <Section>
        <p>
          Welcome to the Syft documentation. Syft is a next-generation DeFi platform built on Stellar 
          that revolutionizes yield vault creation and management.
        </p>
        <p>
          Choose a topic from the sidebar to learn more about Syft's features, or get started with these popular sections:
        </p>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link 
          to="/docs/what-is-syft"
          className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
        >
          <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
            What is Syft? →
          </h3>
          <p className="text-white/60 text-sm">
            Learn about Syft's core functionality and how it works
          </p>
        </Link>

        <Link 
          to="/docs/getting-started"
          className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
        >
          <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
            Getting Started →
          </h3>
          <p className="text-white/60 text-sm">
            Set up Syft and create your first vault
          </p>
        </Link>

        <Link 
          to="/docs/platform/vault-builder"
          className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
        >
          <h3 className="text-white font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
            Vault Builder →
          </h3>
          <p className="text-white/60 text-sm">
            Create strategies with visual, AI, or voice interfaces
          </p>
        </Link>

        <Link 
          to="/docs/platform/terminal-ai"
          className="p-6 bg-[#0a0b0c] border border-white/10 rounded-xl hover:border-[#dce85d]/30 transition-all group"
        >
          <h3 className="text-white/60 font-semibold mb-2 group-hover:text-[#dce85d] transition-colors">
            Terminal AI →
          </h3>
          <p className="text-white/60 text-sm">
            Execute blockchain operations with natural language
          </p>
        </Link>
      </div>
    </>
  );
}
