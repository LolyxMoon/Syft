import "./App.module.css";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { LandingHeader, Footer } from "./components/layout";
import Home from "./pages/Home";
import VaultBuilder from "./pages/VaultBuilder";
import Dashboard from "./pages/Dashboard";
import VaultDetail from "./pages/VaultDetail";
import Vaults from "./pages/Vaults";
import Marketplace from "./pages/Marketplace";
import Analytics from "./pages/Analytics";
import Backtests from "./pages/Backtests";
import Suggestions from "./pages/Suggestions";
import Quests from "./pages/Quests";
import Terminal from "./pages/Terminal";
import { Toaster } from "./components/ui";

import AppLayout from "./layouts/AppLayout";
import DocsLayout from "./layouts/DocsLayout";

// Documentation Pages
import DocsOverview from "./pages/docs/Overview";
import WhatIsSyft from "./pages/docs/WhatIsSyft";
import KeyFeatures from "./pages/docs/KeyFeatures";
import Architecture from "./pages/docs/Architecture";
import GettingStarted from "./pages/docs/GettingStarted";
import Prerequisites from "./pages/docs/Prerequisites";
import Installation from "./pages/docs/Installation";
import QuickStart from "./pages/docs/QuickStart";
import PlatformFeatures from "./pages/docs/PlatformFeatures";
import VaultBuilderDoc from "./pages/docs/VaultBuilderDoc";
import TerminalAIDoc from "./pages/docs/TerminalAIDoc";
import DashboardDoc from "./pages/docs/DashboardDoc";
import MarketplaceDoc from "./pages/docs/MarketplaceDoc";
import AnalyticsDoc from "./pages/docs/AnalyticsDoc";
import BacktestingDoc from "./pages/docs/BacktestingDoc";
import SmartContracts from "./pages/docs/SmartContracts";
import ContractArchitecture from "./pages/docs/ContractArchitecture";
import VaultFactoryDoc from "./pages/docs/VaultFactoryDoc";
import NFTContractDoc from "./pages/docs/NFTContractDoc";
import DeploymentDoc from "./pages/docs/DeploymentDoc";
import AIFeatures from "./pages/docs/AIFeatures";
import GPT5Nano from "./pages/docs/GPT5Nano";
import RunwareAI from "./pages/docs/RunwareAI";
import TavilySearch from "./pages/docs/TavilySearch";
import Security from "./pages/docs/Security";
import SecurityOverview from "./pages/docs/SecurityOverview";
import BestPractices from "./pages/docs/BestPractices";

// Redirect component for vault details
const VaultRedirect = () => {
  const { vaultId } = useParams();
  return <Navigate to={`/app/vaults/${vaultId}`} replace />;
};

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        {/* Landing Page Route */}
        <Route
          path="/"
          element={
            <div className="flex flex-col min-h-screen bg-app">
              <LandingHeader />
              <main className="flex-1">
                <Home />
              </main>
              <Footer />
            </div>
          }
        />

        {/* Docs Page Route */}
        <Route path="/docs" element={<DocsLayout />}>
          {/* Overview */}
          <Route index element={<DocsOverview />} />
          <Route path="what-is-syft" element={<WhatIsSyft />} />
          <Route path="key-features" element={<KeyFeatures />} />
          <Route path="architecture" element={<Architecture />} />
          
          {/* Getting Started */}
          <Route path="getting-started" element={<GettingStarted />} />
          <Route path="getting-started/prerequisites" element={<Prerequisites />} />
          <Route path="getting-started/installation" element={<Installation />} />
          <Route path="getting-started/quick-start" element={<QuickStart />} />
          
          {/* Platform Features */}
          <Route path="platform" element={<PlatformFeatures />} />
          <Route path="platform/vault-builder" element={<VaultBuilderDoc />} />
          <Route path="platform/terminal-ai" element={<TerminalAIDoc />} />
          <Route path="platform/dashboard" element={<DashboardDoc />} />
          <Route path="platform/marketplace" element={<MarketplaceDoc />} />
          <Route path="platform/analytics" element={<AnalyticsDoc />} />
          <Route path="platform/backtesting" element={<BacktestingDoc />} />
          
          {/* Smart Contracts */}
          <Route path="smart-contracts" element={<SmartContracts />} />
          <Route path="smart-contracts/architecture" element={<ContractArchitecture />} />
          <Route path="smart-contracts/vault-factory" element={<VaultFactoryDoc />} />
          <Route path="smart-contracts/nft-contract" element={<NFTContractDoc />} />
          <Route path="smart-contracts/deployment" element={<DeploymentDoc />} />
          
          {/* AI Features */}
          <Route path="ai-features" element={<AIFeatures />} />
          <Route path="ai-features/gpt-5-nano" element={<GPT5Nano />} />
          <Route path="ai-features/runware-ai" element={<RunwareAI />} />
          <Route path="ai-features/tavily-search" element={<TavilySearch />} />
          
          {/* Security */}
          <Route path="security" element={<Security />} />
          <Route path="security/overview" element={<SecurityOverview />} />
          <Route path="security/best-practices" element={<BestPractices />} />
        </Route>

        {/* Redirects for old routes */}
        <Route path="/builder" element={<Navigate to="/app/builder" replace />} />
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/vaults/:vaultId" element={<VaultRedirect />} />

        {/* App Routes with Sidebar Layout */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="vaults" element={<Vaults />} />
          <Route path="builder" element={<VaultBuilder />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="backtests" element={<Backtests />} />
          <Route path="suggestions" element={<Suggestions />} />
          <Route path="quests" element={<Quests />} />
          <Route path="terminal" element={<Terminal />} />

          <Route path="vaults/:vaultId" element={<VaultDetail />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
