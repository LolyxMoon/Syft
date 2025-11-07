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
import * as DocPages from "./pages/docs";

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
          <Route index element={<DocPages.DocsOverview />} />
          <Route path="what-is-syft" element={<DocPages.WhatIsSyft />} />
          <Route path="key-features" element={<DocPages.KeyFeatures />} />
          <Route path="architecture" element={<DocPages.Architecture />} />
          
          {/* Getting Started */}
          <Route path="getting-started" element={<DocPages.GettingStarted />} />
          <Route path="getting-started/prerequisites" element={<DocPages.Prerequisites />} />
          <Route path="getting-started/installation" element={<DocPages.Installation />} />
          <Route path="getting-started/quick-start" element={<DocPages.QuickStart />} />
          
          {/* Platform Features */}
          <Route path="platform" element={<DocPages.PlatformFeatures />} />
          <Route path="platform/vault-builder" element={<DocPages.VaultBuilderDoc />} />
          <Route path="platform/terminal-ai" element={<DocPages.TerminalAIDoc />} />
          <Route path="platform/dashboard" element={<DocPages.DashboardDoc />} />
          <Route path="platform/marketplace" element={<DocPages.MarketplaceDoc />} />
          <Route path="platform/analytics" element={<DocPages.AnalyticsDoc />} />
          <Route path="platform/backtesting" element={<DocPages.BacktestingDoc />} />
          
          {/* Smart Contracts */}
          <Route path="smart-contracts" element={<DocPages.SmartContracts />} />
          <Route path="smart-contracts/architecture" element={<DocPages.ContractArchitecture />} />
          <Route path="smart-contracts/vault-factory" element={<DocPages.VaultFactoryDoc />} />
          <Route path="smart-contracts/nft-contract" element={<DocPages.NFTContractDoc />} />
          <Route path="smart-contracts/deployment" element={<DocPages.DeploymentDoc />} />
          
          {/* AI Features */}
          <Route path="ai-features" element={<DocPages.AIFeatures />} />
          <Route path="ai-features/gpt-5-nano" element={<DocPages.GPT5Nano />} />
          <Route path="ai-features/runware-ai" element={<DocPages.RunwareAI />} />
          <Route path="ai-features/tavily-search" element={<DocPages.TavilySearch />} />
          
          {/* Security */}
          <Route path="security" element={<DocPages.Security />} />
          <Route path="security/overview" element={<DocPages.SecurityOverview />} />
          <Route path="security/best-practices" element={<DocPages.BestPractices />} />
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
