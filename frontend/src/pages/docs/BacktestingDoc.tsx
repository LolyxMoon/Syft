import { TestTube } from 'lucide-react';
import { PageHeader, Section, CodeBlock } from '../../components/docs/DocsComponents';

export default function BacktestingDoc() {
  return (
    <>
      <PageHeader icon={<TestTube className="w-8 h-8" />} title="Backtesting" />
      
      <Section>
        <p>
          Test your vault strategies against historical market data before risking real capital.
          Syft's backtesting engine simulates how your strategy would have performed in the past,
          helping you validate assumptions and optimize parameters.
        </p>
      </Section>

      <Section title="Key Features">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-[#dce85d] font-semibold mb-3">Historical Simulation</h4>
            <p className="text-white/70 text-sm">
              Run your strategy on past market data with customizable date ranges and resolution
            </p>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-[#dce85d] font-semibold mb-3">Performance Metrics</h4>
            <p className="text-white/70 text-sm">
              Comprehensive metrics including returns, volatility, Sharpe ratio, and drawdown
            </p>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-[#dce85d] font-semibold mb-3">Visual Results</h4>
            <p className="text-white/70 text-sm">
              Interactive charts showing equity curves, drawdowns, and trade history
            </p>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-[#dce85d] font-semibold mb-3">Save & Compare</h4>
            <p className="text-white/70 text-sm">
              Store backtest results and compare different strategies side-by-side
            </p>
          </div>
        </div>
      </Section>

      <Section title="Customizable Parameters">
        <ul className="space-y-2 text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Date Range:</strong> Select start and end dates for simulation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Initial Capital:</strong> Set the starting amount for the backtest</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Resolution:</strong> Choose hourly, daily, or weekly data granularity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Fees:</strong> Include transaction costs and rebalancing fees</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#dce85d]">•</span>
            <span><strong className="text-white">Slippage:</strong> Account for market impact and slippage</span>
          </li>
        </ul>
      </Section>

      <Section title="Performance Metrics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Returns</h4>
            <ul className="space-y-1 text-white/70 text-sm">
              <li>• Total Return</li>
              <li>• Annualized Return</li>
              <li>• Monthly Returns</li>
              <li>• CAGR</li>
            </ul>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Risk</h4>
            <ul className="space-y-1 text-white/70 text-sm">
              <li>• Volatility</li>
              <li>• Sharpe Ratio</li>
              <li>• Sortino Ratio</li>
              <li>• Max Drawdown</li>
            </ul>
          </div>

          <div className="p-4 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Trading</h4>
            <ul className="space-y-1 text-white/70 text-sm">
              <li>• Win Rate</li>
              <li>• Profit Factor</li>
              <li>• Avg Trade Size</li>
              <li>• Number of Trades</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Use Cases">
        <div className="space-y-4">
          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Strategy Validation</h4>
            <p className="text-white/70 text-sm">
              Verify that your vault logic works as expected before deploying to mainnet
            </p>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Parameter Optimization</h4>
            <p className="text-white/70 text-sm">
              Test different rebalancing thresholds and allocation percentages to find optimal settings
            </p>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Comparison</h4>
            <p className="text-white/70 text-sm">
              Compare multiple strategies or allocation models to choose the best performer
            </p>
          </div>

          <div className="p-5 bg-[#0a0b0c] border border-white/10 rounded-xl">
            <h4 className="text-white font-medium mb-2">Risk Assessment</h4>
            <p className="text-white/70 text-sm">
              Understand how your strategy performs under different market conditions
            </p>
          </div>
        </div>
      </Section>

      <Section title="Example Workflow">
        <CodeBlock 
          code={`1. Create or select a vault strategy
2. Navigate to Backtests page
3. Set date range (e.g., Jan 2023 - Dec 2023)
4. Configure initial capital ($10,000)
5. Choose resolution (Daily)
6. Run simulation
7. Review equity curve and metrics
8. Save results for future comparison
9. Adjust strategy parameters
10. Re-run backtest to compare`}
        />
      </Section>
    </>
  );
}
