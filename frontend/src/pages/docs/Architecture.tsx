import { Network } from 'lucide-react';
import { PageHeader, Section, InfoCard } from '../../components/docs/DocsComponents';

export default function Architecture() {
  return (
    <>
      <PageHeader icon={<Network className="w-8 h-8" />} title="Architecture" />
      
      <Section>
        <p>
          Syft is built with a modern, scalable architecture that separates concerns and ensures optimal
          performance across all components.
        </p>
      </Section>

      <Section title="System Overview">
        <InfoCard>
          <pre className="text-white/70 text-sm font-mono overflow-x-auto">
{`┌─────────────────────────────────────────────────┐
│              Frontend (React)                   │
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │ Vault Builder │  Dashboard   │  Marketplace│ │
│  │ Analytics     │  Backtesting │  Terminal AI│ │
│  │ NFT Viewer    │  Suggestions │  Voice UI   │ │
│  └──────────────┴──────────────┴──────────────┘ │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│           Backend (Node.js/Express)             │
│  ┌──────────────────────────────────────────┐   │
│  │  API Routes │ WebSocket │ AI Services   │   │
│  │  • Vaults   │ • Prices  │ • OpenAI      │   │
│  │  • Terminal │ • Events  │ • Runware     │   │
│  │  • NFTs     │ • Updates │ • Tavily      │   │
│  │  Monitoring │ Sync      │ Database      │   │
│  └──────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌────────┐  ┌─────────┐  ┌─────────┐
   │Supabase│  │ Stellar │  │External │
   │  (DB)  │  │ Network │  │  APIs   │
   │        │  │         │  │         │
   │ Users  │  │ Soroban │  │ Runware │
   │ Vaults │  │ Testnet │  │ Tavily  │
   │ NFTs   │  │Futurenet│  │Protocols│
   │Analytics│ │ Mainnet │  │ Oracles │
   └────────┘  └─────────┘  └─────────┘`}
          </pre>
        </InfoCard>
      </Section>

      <Section title="Frontend Architecture">
        <p>
          Built with React 19 and TypeScript, the frontend uses a component-based architecture with:
        </p>
        <ul className="space-y-2 text-white/70 mt-4">
          <li>• <strong className="text-white">Vite</strong> for fast development and optimized builds</li>
          <li>• <strong className="text-white">Zustand</strong> for state management</li>
          <li>• <strong className="text-white">TanStack Query</strong> for data fetching and caching</li>
          <li>• <strong className="text-white">React Router</strong> for client-side routing</li>
          <li>• <strong className="text-white">Tailwind CSS</strong> for styling</li>
          <li>• <strong className="text-white">Framer Motion</strong> for animations</li>
        </ul>
      </Section>

      <Section title="Backend Architecture">
        <p>
          The Node.js backend provides RESTful APIs and WebSocket connections for real-time updates:
        </p>
        <ul className="space-y-2 text-white/70 mt-4">
          <li>• <strong className="text-white">Express.js</strong> for HTTP API routes</li>
          <li>• <strong className="text-white">WebSocket (ws)</strong> for real-time price feeds and events</li>
          <li>• <strong className="text-white">Supabase</strong> for PostgreSQL database with real-time subscriptions</li>
          <li>• <strong className="text-white">Stellar SDK</strong> for blockchain interactions</li>
          <li>• <strong className="text-white">OpenAI API</strong> for AI-powered features</li>
        </ul>
      </Section>

      <Section title="Smart Contract Layer">
        <p>
          Rust-based Soroban smart contracts compiled to WebAssembly:
        </p>
        <ul className="space-y-2 text-white/70 mt-4">
          <li>• <strong className="text-white">Vault Factory:</strong> Deploys new vault instances dynamically</li>
          <li>• <strong className="text-white">Vault Contract:</strong> Handles deposits, withdrawals, and rebalancing</li>
          <li>• <strong className="text-white">NFT Contract:</strong> ERC-721 compatible tokens for vaults</li>
          <li>• <strong className="text-white">Mock Pools:</strong> Testing infrastructure for development</li>
        </ul>
      </Section>

      <Section title="Data Flow">
        <div className="bg-[#0a0b0c] border border-white/10 rounded-xl p-6">
          <ol className="space-y-3 text-white/70">
            <li>
              <strong className="text-white">1. User Interaction:</strong> User interacts with React frontend (e.g., creates a vault)
            </li>
            <li>
              <strong className="text-white">2. API Request:</strong> Frontend sends request to Express backend
            </li>
            <li>
              <strong className="text-white">3. Business Logic:</strong> Backend processes request, may call AI services or blockchain
            </li>
            <li>
              <strong className="text-white">4. Blockchain Transaction:</strong> If needed, transaction is built and sent to Stellar network
            </li>
            <li>
              <strong className="text-white">5. Database Update:</strong> State is persisted to Supabase
            </li>
            <li>
              <strong className="text-white">6. Real-time Sync:</strong> WebSocket pushes updates to connected clients
            </li>
            <li>
              <strong className="text-white">7. UI Update:</strong> Frontend receives update and re-renders components
            </li>
          </ol>
        </div>
      </Section>
    </>
  );
}
