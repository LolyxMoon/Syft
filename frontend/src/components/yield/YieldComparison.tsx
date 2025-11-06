/**
 * Yield Comparison Component
 * Displays yield opportunities across multiple protocols
 */

import { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight, Sparkles, BarChart3 } from 'lucide-react';
import type { ProtocolComparison, YieldRoutingStrategy } from '../../../../shared/types/protocol';

interface YieldComparisonProps {
  asset: string;
  amount?: number;
  network?: string;
  onSelectProtocol?: (protocolId: string) => void;
}

export function YieldComparison({ 
  asset, 
  amount = 100, 
  network = 'testnet',
  onSelectProtocol 
}: YieldComparisonProps) {
  const [comparison, setComparison] = useState<ProtocolComparison | null>(null);
  const [routing, setRouting] = useState<YieldRoutingStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'comparison' | 'routing'>('comparison');

  const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';

  useEffect(() => {
    fetchYieldData();
  }, [asset, amount, network]);

  async function fetchYieldData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch comparison data
      const comparisonRes = await fetch(
        `${backendUrl}/api/protocols/compare/${asset}?network=${network}`
      );
      const comparisonData = await comparisonRes.json();

      if (comparisonData.success) {
        setComparison(comparisonData.data);
      }

      // Fetch optimal routing
      const routingRes = await fetch(
        `${backendUrl}/api/protocols/route`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset, amount, network }),
        }
      );
      const routingData = await routingRes.json();

      if (routingData.success && routingData.data) {
        // Validate routing data has allocations
        if (routingData.data.allocations && Array.isArray(routingData.data.allocations)) {
          setRouting(routingData.data);
        } else {
          console.warn('[YieldComparison] Routing data missing allocations:', routingData.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load yield data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-700 rounded w-1/4"></div>
          <div className="h-32 bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-900/20 border border-error-500/30 rounded-lg p-4 text-error-400">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!comparison || !routing) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6 text-neutral-400">
        <p className="text-sm">No yield data available for {asset}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2 border-b border-neutral-700">
        <button
          onClick={() => setView('comparison')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'comparison'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Protocol Comparison
        </button>
        <button
          onClick={() => setView('routing')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'routing'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Smart Routing
        </button>
      </div>

      {view === 'comparison' ? (
        <ProtocolComparisonView 
          comparison={comparison} 
          onSelect={onSelectProtocol} 
        />
      ) : (
        <SmartRoutingView routing={routing} amount={amount} />
      )}
    </div>
  );
}

interface ProtocolComparisonViewProps {
  comparison: ProtocolComparison;
  onSelect?: (protocolId: string) => void;
}

function ProtocolComparisonView({ comparison, onSelect }: ProtocolComparisonViewProps) {
  const getRiskColor = (apy: number, isBest: boolean = false) => {
    // For best yield display, always show as positive
    if (isBest) return 'text-success-400';
    
    // For protocol list, indicate risk level
    if (apy > 15) return 'text-warning-400'; // High yield = higher risk (but not red)
    if (apy > 10) return 'text-success-400';
    return 'text-success-500';
  };

  // Safety check: ensure protocols array exists
  if (!comparison.protocols || !Array.isArray(comparison.protocols) || comparison.protocols.length === 0) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6 text-center">
        <p className="text-neutral-400 text-sm mb-2">No protocols available</p>
        <p className="text-neutral-500 text-xs">Unable to fetch yield data for {comparison.asset}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-neutral-800 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-neutral-400 mb-1">Best APY</p>
            <p className={`text-xl font-bold ${getRiskColor(comparison.bestYield.apy, true)}`}>
              {comparison.bestYield.apy.toFixed(2)}%
            </p>
            <p className="text-xs text-neutral-500 mt-1">{comparison.bestYield.protocolName}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-1">Average APY</p>
            <p className="text-xl font-bold text-neutral-200">
              {comparison.averageApy.toFixed(2)}%
            </p>
            <p className="text-xs text-neutral-500 mt-1">Across {comparison.protocols.length} protocols</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-1">Asset</p>
            <p className="text-xl font-bold text-primary-400">{comparison.asset}</p>
            <p className="text-xs text-neutral-500 mt-1">{comparison.protocols.length} opportunities</p>
          </div>
        </div>
      </div>

      {/* Protocol List - Sorted by APY (highest first) */}
      <div className="space-y-2">
        {[...comparison.protocols]
          .sort((a, b) => b.apy - a.apy)
          .map((protocol, index) => (
          <div
            key={protocol.protocolId}
            className={`bg-neutral-800 rounded-lg p-4 border ${
              protocol.protocolId === comparison.bestYield.protocolId
                ? 'border-primary-500/50 bg-primary-900/10'
                : 'border-neutral-700'
            } hover:border-neutral-600 transition-colors ${
              onSelect ? 'cursor-pointer' : ''
            }`}
            onClick={() => onSelect?.(protocol.protocolId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-700 text-sm font-medium">
                  #{index + 1}
                </div>
                <div>
                  <p className="font-medium text-neutral-100">{protocol.protocolName}</p>
                  <p className="text-xs text-neutral-500">
                    TVL: ${(protocol.tvl / 1000).toFixed(0)}k
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getRiskColor(protocol.apy, protocol.protocolId === comparison.bestYield.protocolId)}`}>
                  {protocol.apy.toFixed(2)}%
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {protocol.source === 'on-chain' ? 'Live' : 'Estimated'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SmartRoutingViewProps {
  routing: YieldRoutingStrategy;
  amount: number;
}

function SmartRoutingView({ routing, amount: _amount }: SmartRoutingViewProps) {
  // Safety check: ensure allocations exists and is an array
  if (!routing.allocations || !Array.isArray(routing.allocations) || routing.allocations.length === 0) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6 text-center">
        <p className="text-neutral-400 text-sm mb-2">No routing data available</p>
        <p className="text-neutral-500 text-xs">Unable to calculate optimal allocation</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Routing Summary */}
      <div className="bg-gradient-to-br from-primary-900/20 to-secondary-900/20 border border-primary-500/30 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-100 mb-1">
              Smart Yield Routing
            </h3>
            <p className="text-sm text-neutral-400">
              Optimized allocation across {routing.allocations.length} protocols
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary-400">
              {routing.expectedBlendedApy.toFixed(2)}%
            </p>
            <p className="text-xs text-neutral-400 mt-1">Blended APY</p>
          </div>
        </div>

        <div className="bg-neutral-900/50 rounded-lg p-4 text-sm text-neutral-300">
          <TrendingUp className="w-4 h-4 inline text-primary-400 mr-2" />
          {routing.rationale}
        </div>
      </div>

      {/* Allocation Breakdown */}
      <div className="space-y-3">
        {routing.allocations.map((allocation, _index) => (
          <div
            key={allocation.protocolId}
            className="bg-neutral-800 rounded-lg p-4 border border-neutral-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-12 rounded-full bg-primary-400"></div>
                <div>
                  <p className="font-medium text-neutral-100">{allocation.protocolName}</p>
                  <p className="text-xs text-neutral-500">
                    APY: {allocation.expectedApy.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-neutral-100">
                  ${allocation.amount.toFixed(2)}
                </p>
                <p className="text-xs text-primary-400">{allocation.percentage.toFixed(1)}%</p>
              </div>
            </div>

            {/* Visual percentage bar */}
            <div className="w-full bg-neutral-700 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(allocation.percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison with Single Protocol */}
      {routing.allocations && routing.allocations.length > 0 && (
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-neutral-400 mb-1">vs. Single Best Protocol</p>
              <p className="text-neutral-200">
                Diversified routing reduces risk
                {routing.allocations.length > 1 && routing.allocations[0]?.expectedApy && (
                  <>
                    {' and '}
                    <span className={`font-medium ${
                      routing.expectedBlendedApy >= routing.allocations[0].expectedApy 
                        ? 'text-success-400' 
                        : 'text-warning-400'
                    }`}>
                      {routing.expectedBlendedApy >= routing.allocations[0].expectedApy ? '+' : ''}
                      {(routing.expectedBlendedApy - routing.allocations[0].expectedApy).toFixed(2)}%
                    </span>
                    {' '}APY vs single protocol
                  </>
                )}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-600" />
          </div>
        </div>
      )}
    </div>
  );
}
