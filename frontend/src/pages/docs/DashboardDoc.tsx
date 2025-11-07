import { LayoutDashboard } from 'lucide-react';
import { PageHeader, Section } from '../../components/docs/DocsComponents';
import { TrendingUp, PieChart, BarChart3, Activity } from 'lucide-react';

export default function DashboardDoc() {
  return (
    <>
      <PageHeader icon={<LayoutDashboard className="w-8 h-8" />} title="Dashboard" />
      
      <Section>
        <p>
          Your command center for managing all vault operations. The Dashboard provides a comprehensive
          overview of your portfolio performance, positions, and opportunities.
        </p>
      </Section>

      <Section title="Key Metrics">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <TrendingUp className="w-8 h-8 text-[#dce85d] mb-3" />
            <h4 className="text-white font-semibold mb-1">Total Value Locked</h4>
            <p className="text-white/60 text-sm">Aggregate value across all your vaults</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <Activity className="w-8 h-8 text-[#dce85d] mb-3" />
            <h4 className="text-white font-semibold mb-1">Current APY</h4>
            <p className="text-white/60 text-sm">Real-time yield calculations</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <BarChart3 className="w-8 h-8 text-[#dce85d] mb-3" />
            <h4 className="text-white font-semibold mb-1">Active Vaults</h4>
            <p className="text-white/60 text-sm">Number of deployed strategies</p>
          </div>

          <div className="p-5 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <PieChart className="w-8 h-8 text-[#dce85d] mb-3" />
            <h4 className="text-white font-semibold mb-1">Total Earnings</h4>
            <p className="text-white/60 text-sm">Cumulative returns across positions</p>
          </div>
        </div>
      </Section>

      <Section title="Portfolio Performance">
        <p>
          Track your portfolio's performance over time with interactive charts:
        </p>
        <ul className="space-y-2 text-white/70 mt-4">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">24h Performance:</strong> Short-term price movements and gains</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">7-Day Trend:</strong> Weekly performance analysis</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">30-Day View:</strong> Monthly returns and volatility</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">All-Time:</strong> Complete historical performance</span>
          </li>
        </ul>
      </Section>

      <Section title="Asset Allocation">
        <p>
          Visualize your portfolio distribution with an interactive pie chart showing:
        </p>
        <div className="mt-4 p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
          <ul className="space-y-2 text-white/70 text-sm">
            <li>• Percentage allocation per asset</li>
            <li>• Current USD value of each position</li>
            <li>• Color-coded segments for easy identification</li>
            <li>• Hover interactions for detailed breakdowns</li>
          </ul>
        </div>
      </Section>

      <Section title="Vault Performance Cards">
        <p>
          Each vault is displayed as an individual card with key information:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-3">Vault Information</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Vault name and strategy type</li>
              <li>• Total Value Locked (TVL)</li>
              <li>• Current APY</li>
              <li>• Number of subscribers</li>
              <li>• Your position size</li>
            </ul>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-3">Quick Actions</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Deposit additional funds</li>
              <li>• Withdraw from vault</li>
              <li>• View detailed analytics</li>
              <li>• Claim rewards</li>
              <li>• Edit vault configuration</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="User Positions">
        <p>
          Track all your active positions across subscribed vaults:
        </p>
        <div className="mt-4 p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-[#dce85d]">•</span>
              <span><strong className="text-white">Deposit Amount:</strong> Your initial investment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#dce85d]">•</span>
              <span><strong className="text-white">Current Value:</strong> Real-time position value</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#dce85d]">•</span>
              <span><strong className="text-white">Shares Owned:</strong> Your vault share tokens</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#dce85d]">•</span>
              <span><strong className="text-white">Profit/Loss:</strong> Total returns since deposit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#dce85d]">•</span>
              <span><strong className="text-white">Rewards Earned:</strong> Accrued yield over time</span>
            </li>
          </ul>
        </div>
      </Section>

      <Section title="Best Yield Opportunities">
        <p>
          Discover high-yield opportunities across the Stellar ecosystem:
        </p>
        <ul className="space-y-2 text-white/70 mt-4">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Curated list of top-performing vaults</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Real-time APY comparisons across protocols</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Smart routing suggestions for optimal yields</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>One-click subscription to new opportunities</span>
          </li>
        </ul>
      </Section>

      <Section title="Real-Time Updates">
        <p>
          The Dashboard uses WebSocket connections for live data:
        </p>
        <div className="mt-4 p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
          <ul className="space-y-2 text-white/70 text-sm">
            <li>• Price feed updates every few seconds</li>
            <li>• Instant notifications for rebalancing events</li>
            <li>• Live TVL and APY calculations</li>
            <li>• Real-time subscriber count updates</li>
            <li>• Push notifications for important events</li>
          </ul>
        </div>
      </Section>
    </>
  );
}
