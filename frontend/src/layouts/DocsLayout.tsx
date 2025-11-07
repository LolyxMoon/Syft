import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Rocket, 
  Code, 
  Shield,
  Layout,
  Bot,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  path: string;
  subsections?: { id: string; title: string; path: string }[];
}

const sections: Section[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: <BookOpen className="w-5 h-5" />,
    path: '/docs',
    subsections: [
      { id: 'what-is-syft', title: 'What is Syft?', path: '/docs/what-is-syft' },
      { id: 'key-features', title: 'Key Features', path: '/docs/key-features' },
      { id: 'architecture', title: 'Architecture', path: '/docs/architecture' }
    ]
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Rocket className="w-5 h-5" />,
    path: '/docs/getting-started',
    subsections: [
      { id: 'prerequisites', title: 'Prerequisites', path: '/docs/getting-started/prerequisites' },
      { id: 'installation', title: 'Installation', path: '/docs/getting-started/installation' },
      { id: 'quick-start', title: 'Quick Start', path: '/docs/getting-started/quick-start' }
    ]
  },
  {
    id: 'platform',
    title: 'Platform Features',
    icon: <Layout className="w-5 h-5" />,
    path: '/docs/platform',
    subsections: [
      { id: 'vault-builder', title: 'Vault Builder', path: '/docs/platform/vault-builder' },
      { id: 'terminal-ai', title: 'Terminal AI', path: '/docs/platform/terminal-ai' },
      { id: 'dashboard', title: 'Dashboard', path: '/docs/platform/dashboard' },
      { id: 'marketplace', title: 'NFT Marketplace', path: '/docs/platform/marketplace' },
      { id: 'analytics', title: 'Analytics', path: '/docs/platform/analytics' },
      { id: 'backtesting', title: 'Backtesting', path: '/docs/platform/backtesting' }
    ]
  },
  {
    id: 'smart-contracts',
    title: 'Smart Contracts',
    icon: <Code className="w-5 h-5" />,
    path: '/docs/smart-contracts',
    subsections: [
      { id: 'contract-architecture', title: 'Contract Architecture', path: '/docs/smart-contracts/architecture' },
      { id: 'vault-factory', title: 'Vault Factory', path: '/docs/smart-contracts/vault-factory' },
      { id: 'nft-contract', title: 'NFT Contract', path: '/docs/smart-contracts/nft-contract' },
      { id: 'deployment', title: 'Deployment', path: '/docs/smart-contracts/deployment' }
    ]
  },
  {
    id: 'ai-features',
    title: 'AI-Powered Features',
    icon: <Bot className="w-5 h-5" />,
    path: '/docs/ai-features',
    subsections: [
      { id: 'gpt-5-nano', title: 'GPT-5 Nano', path: '/docs/ai-features/gpt-5-nano' },
      { id: 'runware-ai', title: 'Runware AI', path: '/docs/ai-features/runware-ai' },
      { id: 'tavily-search', title: 'Tavily Search', path: '/docs/ai-features/tavily-search' }
    ]
  },
  {
    id: 'security',
    title: 'Security',
    icon: <Shield className="w-5 h-5" />,
    path: '/docs/security',
    subsections: [
      { id: 'security-overview', title: 'Security Overview', path: '/docs/security/overview' },
      { id: 'best-practices', title: 'Best Practices', path: '/docs/security/best-practices' }
    ]
  }
];

export default function DocsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);
  const location = useLocation();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isSectionActive = (section: Section) => {
    if (isActive(section.path)) return true;
    return section.subsections?.some(sub => isActive(sub.path)) ?? false;
  };

  return (
    <div className="min-h-screen bg-[#090a0a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#090a0a]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/docs" className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#dce85d]" />
              <h1 className="text-xl font-semibold text-white">Syft Documentation</h1>
            </Link>
            
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <nav className="hidden lg:flex items-center gap-6 text-sm">
              <Link to="/" className="text-white/60 hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/app/builder" className="text-white/60 hover:text-white transition-colors">
                Vault Builder
              </Link>
              <Link to="/app/terminal" className="text-white/60 hover:text-white transition-colors">
                Terminal AI
              </Link>
              <a 
                href="https://github.com/zaikaman/Syft" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-white/60 hover:text-white transition-colors"
              >
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto pt-20 flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-[#090a0a] lg:bg-transparent
          border-r border-white/10 lg:border-0 overflow-y-auto z-30
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="p-6 space-y-1">
            {sections.map((section) => {
              const isExpanded = expandedSections.includes(section.id);
              const isSecActive = isSectionActive(section);

              return (
                <div key={section.id}>
                  <div className="flex items-center gap-1">
                    <Link
                      to={section.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${isActive(section.path)
                          ? 'bg-[#dce85d]/10 text-[#dce85d] border border-[#dce85d]/20' 
                          : isSecActive
                          ? 'text-white bg-white/5'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      {section.icon}
                      <span>{section.title}</span>
                    </Link>
                    
                    {section.subsections && (
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                  
                  {section.subsections && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {section.subsections.map((sub) => (
                        <Link
                          key={sub.id}
                          to={sub.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                            transition-all duration-200
                            ${isActive(sub.path)
                              ? 'text-[#dce85d] bg-[#dce85d]/5' 
                              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                            }
                          `}
                        >
                          <ChevronRight className="w-3 h-3" />
                          <span>{sub.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 lg:px-12 py-8 pb-20">
          <div className="max-w-4xl">
            <Outlet />
            
            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-white/50 text-sm">
                  Built with ❤️ on Stellar
                </p>
                <div className="flex items-center gap-6">
                  <a 
                    href="https://github.com/zaikaman/Syft" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    GitHub
                  </a>
                  <a 
                    href="https://syft-defi.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    Live Demo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
