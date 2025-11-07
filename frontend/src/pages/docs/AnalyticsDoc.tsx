import { BarChart3 } from 'lucide-react';
import { PageHeader, Section } from '../../components/docs/DocsComponents';

export default function AnalyticsDoc() {
  return (
    <>
      <PageHeader icon={<BarChart3 className="w-8 h-8" />} title="Analytics" />
      
      <Section>
        <p>
          Comprehensive multi-view analytics dashboard for deep insights into portfolio performance,
          risk metrics, liquidity, and timing patterns. Make data-driven decisions with real-time
          analytics powered by Stellar Horizon API and custom calculations.
        </p>
      </Section>

      <Section title="Four Analysis Views">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <h3 className="text-white font-semibold mb-3 text-lg">🛡️ Risk Analysis</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Portfolio Volatility</li>
              <li>• Sharpe & Sortino Ratios</li>
              <li>• Maximum Drawdown</li>
              <li>• Value at Risk (VaR)</li>
              <li>• Beta & Alpha metrics</li>
              <li>• Asset Correlation Matrix</li>
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <h3 className="text-white font-semibold mb-3 text-lg">📊 Performance Analysis</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Asset Contribution Charts</li>
              <li>• Return Contribution %</li>
              <li>• Risk Contribution %</li>
              <li>• Performance Attribution</li>
              <li>• Vault Comparison</li>
              <li>• Decomposition Analysis</li>
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <h3 className="text-white font-semibold mb-3 text-lg">💧 Liquidity Analysis</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Real Pool Depth from Horizon</li>
              <li>• Average Slippage Estimates</li>
              <li>• 24h Trading Volume</li>
              <li>• Liquidity Score (0-100)</li>
              <li>• Top Liquidity Pools</li>
              <li>• Score Distribution</li>
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl">
            <h3 className="text-white font-semibold mb-3 text-lg">⏰ Time Analysis</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Day of Week Performance</li>
              <li>• Volume Distribution</li>
              <li>• Rebalancing History</li>
              <li>• Transaction Costs</li>
              <li>• TVL Before/After Events</li>
              <li>• Impact Analysis</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Multi-Period Support">
        <p>
          Analyze your portfolio across different time periods:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl text-center">
            <p className="text-[#dce85d] font-bold text-lg">7D</p>
            <p className="text-white/60 text-sm">Last Week</p>
          </div>
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl text-center">
            <p className="text-[#dce85d] font-bold text-lg">30D</p>
            <p className="text-white/60 text-sm">Last Month</p>
          </div>
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl text-center">
            <p className="text-[#dce85d] font-bold text-lg">90D</p>
            <p className="text-white/60 text-sm">Last Quarter</p>
          </div>
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl text-center">
            <p className="text-[#dce85d] font-bold text-lg">1Y</p>
            <p className="text-white/60 text-sm">Last Year</p>
          </div>
        </div>
      </Section>

      <Section title="Interactive Charts">
        <p>
          All charts are built with Recharts for interactive data exploration:
        </p>
        <ul className="space-y-2 text-white/70 mt-4">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Zoom and pan capabilities</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Hover tooltips with detailed data</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Drill-down for granular insights</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Export charts as images</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span>Responsive design for all screen sizes</span>
          </li>
        </ul>
      </Section>

      <Section title="Data Sources">
        <div className="space-y-3 mt-4">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Backend API</h4>
            <p className="text-white/70 text-sm">
              Portfolio metrics, vault performance, and historical data from Supabase database
            </p>
          </div>
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Stellar Horizon API</h4>
            <p className="text-white/70 text-sm">
              Real liquidity pool data, trading volumes, and on-chain metrics
            </p>
          </div>
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Real-time Calculations</h4>
            <p className="text-white/70 text-sm">
              Correlations, risk metrics, and performance attribution computed on-demand
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
