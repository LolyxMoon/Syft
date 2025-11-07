import { Download } from 'lucide-react';
import { PageHeader, Section, CodeBlock, Alert } from '../../components/docs/DocsComponents';

export default function Installation() {
  return (
    <>
      <PageHeader icon={<Download className="w-8 h-8" />} title="Installation" />
      
      <Section>
        <p>
          Follow these steps to install Syft on your local machine and get it ready for development.
        </p>
      </Section>

      <Section title="Step 1: Clone the Repository">
        <p>
          First, clone the Syft repository from GitHub:
        </p>
        <CodeBlock 
          code={`git clone https://github.com/zaikaman/Syft.git
cd Syft`} 
        />
      </Section>

      <Section title="Step 2: Install Dependencies">
        <p className="mb-4">
          Install dependencies for the root project, backend, and frontend:
        </p>
        <CodeBlock 
          code={`# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install`} 
        />
      </Section>

      <Section title="Step 3: Set Up Environment Variables">
        <p className="mb-4">
          Create <code className="px-2 py-1 bg-black/50 rounded text-[#dce85d]">.env</code> files 
          in both the backend and frontend directories.
        </p>
        
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">Backend (.env)</h4>
          <CodeBlock 
            language="bash"
            code={`# Server Configuration
PORT=3001
NODE_ENV=development

# Stellar Network
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_api_key
RUNWARE_API_KEY=your_runware_api_key
TAVILY_API_KEY=your_tavily_api_key

# Optional: Set to true for simulation mode
MVP_MODE=false`} 
          />
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Frontend (.env)</h4>
          <CodeBlock 
            language="bash"
            code={`# Backend URL
VITE_PUBLIC_BACKEND_URL=http://localhost:3001

# Stellar Network
VITE_STELLAR_NETWORK=testnet`} 
          />
        </div>
      </Section>

      <Section title="Step 4: Set Up Database">
        <p className="mb-4">
          If you're using Supabase, you'll need to run the database migrations:
        </p>
        <ol className="space-y-3 text-white/70">
          <li className="flex gap-3">
            <span className="text-[#dce85d]">1.</span>
            <span>Create a new project on <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#dce85d] hover:underline">Supabase</a></span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#dce85d]">2.</span>
            <span>Copy the project URL and service role key to your backend .env file</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#dce85d]">3.</span>
            <span>Navigate to the SQL editor in Supabase dashboard</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#dce85d]">4.</span>
            <span>Execute the migration files from <code className="px-2 py-1 bg-black/50 rounded text-[#dce85d]">backend/migrations/</code></span>
          </li>
        </ol>
      </Section>

      <Section title="Step 5: Build Smart Contracts (Optional)">
        <p className="mb-4">
          If you want to deploy your own contracts instead of using the deployed ones:
        </p>
        <CodeBlock 
          code={`# Build all contracts
stellar contract build

# Deploy to testnet (requires funded account)
./deploy-contracts.ps1`} 
        />
        <Alert type="warning">
          <strong>Note:</strong> Contract deployment requires a funded Stellar account. 
          You can use the deployed contracts on testnet or deploy your own for development.
        </Alert>
      </Section>

      <Section title="Step 6: Start Development Servers">
        <p className="mb-4">
          Start both the backend and frontend development servers:
        </p>
        
        <div className="mb-4">
          <h4 className="text-white font-medium mb-3">Terminal 1 - Backend</h4>
          <CodeBlock 
            code={`cd backend
npm run dev`} 
          />
          <p className="text-white/60 text-sm mt-2">
            Backend will run on <code className="px-2 py-1 bg-black/50 rounded text-[#dce85d]">http://localhost:3001</code>
          </p>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Terminal 2 - Frontend</h4>
          <CodeBlock 
            code={`cd frontend
npm run dev`} 
          />
          <p className="text-white/60 text-sm mt-2">
            Frontend will run on <code className="px-2 py-1 bg-black/50 rounded text-[#dce85d]">http://localhost:5173</code>
          </p>
        </div>
      </Section>

      <Section title="Step 7: Verify Installation">
        <p className="mb-4">
          Open your browser and navigate to <code className="px-2 py-1 bg-black/50 rounded text-[#dce85d]">http://localhost:5173</code>. 
          You should see the Syft landing page.
        </p>
        <Alert type="success">
          <strong>Success!</strong> If you see the Syft interface, your installation is complete. 
          You can now connect your Freighter wallet and start using the platform.
        </Alert>
      </Section>

      <Section title="Troubleshooting">
        <div className="space-y-3">
          <details className="bg-[#0a0b0c] border border-white/10 rounded-xl p-4">
            <summary className="text-white font-medium cursor-pointer">
              Port already in use
            </summary>
            <p className="text-white/70 text-sm mt-2">
              If ports 3001 or 5173 are already in use, you can change them in the respective configuration files:
              <br />• Backend: Change <code className="px-2 py-1 bg-black/50 rounded text-[#dce85d]">PORT</code> in backend/.env
              <br />• Frontend: Change port in frontend/vite.config.ts
            </p>
          </details>

          <details className="bg-[#0a0b0c] border border-white/10 rounded-xl p-4">
            <summary className="text-white font-medium cursor-pointer">
              Database connection errors
            </summary>
            <p className="text-white/70 text-sm mt-2">
              Verify your Supabase URL and service role key are correct in backend/.env. 
              Make sure you've run all migration files in the correct order.
            </p>
          </details>

          <details className="bg-[#0a0b0c] border border-white/10 rounded-xl p-4">
            <summary className="text-white font-medium cursor-pointer">
              Contract build failures
            </summary>
            <p className="text-white/70 text-sm mt-2">
              Ensure you have Rust and the Stellar CLI installed. Run <code className="px-2 py-1 bg-black/50 rounded text-[#dce85d]">rustc --version</code> and <code className="px-2 py-1 bg-black/50 rounded text-[#dce85d]">stellar --version</code> to verify.
            </p>
          </details>
        </div>
      </Section>
    </>
  );
}
