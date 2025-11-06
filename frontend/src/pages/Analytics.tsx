import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { 
  Activity, AlertCircle, Shield, Target, 
  RefreshCw, Brain, Layers, GitCompare,
  Clock, Droplet, Calendar, Zap, Scale, TrendingUpDown,
  AlertTriangle, Info, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, Button, Skeleton } from '../components/ui';
import { useWallet } from '../providers/WalletProvider';

interface RiskMetrics {
  portfolioVolatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  valueAtRisk: number;
  beta: number;
  alpha: number;
  informationRatio: number;
}

interface AssetCorrelation {
  asset1: string;
  asset2: string;
  correlation: number;
}

interface RebalanceEvent {
  timestamp: number;
  vaultId: string;
  vaultName: string;
  cost: number;
  tvlBefore: number;
  tvlAfter: number;
  impact: number;
}

interface LiquidityMetrics {
  asset: string;
  poolDepth: number;
  avgSlippage: number;
  volume24h: number;
  liquidityScore: number;
}

interface TimeAnalysis {
  period: string;
  avgReturn: number;
  totalVolume: number;
  volatility: number;
  bestDay: string;
  worstDay: string;
}

interface AssetContribution {
  asset: string;
  totalReturn: number;
  returnContribution: number;
  riskContribution: number;
  allocation: number;
  color: string;
}

interface PerformanceAttribution {
  vaultId: string;
  vaultName: string;
  assetSelection: number;
  timing: number;
  rebalancing: number;
  fees: number;
  totalReturn: number;
}

const Analytics = () => {
  const [selectedView, setSelectedView] = useState<'risk' | 'performance' | 'liquidity' | 'time'>('risk');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [assetCorrelations, setAssetCorrelations] = useState<AssetCorrelation[]>([]);
  // Rebalance history kept for future implementation (currently empty)
  // Only the state value is currently used; omit the unused setter to avoid TS warnings
  const [rebalanceHistory] = useState<RebalanceEvent[]>([]);
  const [liquidityMetrics, setLiquidityMetrics] = useState<LiquidityMetrics[]>([]);
  const [timeAnalysis, setTimeAnalysis] = useState<TimeAnalysis[]>([]);
  const [assetContributions, setAssetContributions] = useState<AssetContribution[]>([]);
  const [performanceAttribution, setPerformanceAttribution] = useState<PerformanceAttribution[]>([]);
  const [historicalVolatility, setHistoricalVolatility] = useState<any[]>([]);
  const [drawdownHistory, setDrawdownHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [liquidityLoaded, setLiquidityLoaded] = useState(false);
  const { address, network } = useWallet();

  useEffect(() => {
    if (address) {
      setLiquidityLoaded(false); // Reset liquidity when main data changes
      fetchAnalytics();
    }
  }, [address, network, selectedPeriod]); // Removed selectedView to prevent refetch on tab switch

  // Fetch liquidity data only when liquidity tab is viewed and not yet loaded
  useEffect(() => {
    if (address && selectedView === 'liquidity' && !liquidityLoaded && liquidityMetrics.length === 0) {
      fetchLiquidityAnalytics();
    }
  }, [selectedView, address, liquidityLoaded]);

  const fetchAnalytics = async (isRefresh = false) => {
    if (!address) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Use comprehensive endpoint for faster loading
      const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
      const normalizedNetwork = network?.toLowerCase() || 'testnet';
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const days = daysMap[selectedPeriod] || 30;

      console.log('[Analytics] Fetching comprehensive data...');
      const startTime = Date.now();

      const comprehensiveResponse = await fetch(
        `${backendUrl}/api/analytics/portfolio/${address}/comprehensive?network=${normalizedNetwork}&days=${days}`
      );

      if (comprehensiveResponse.ok) {
        const comprehensiveData = await comprehensiveResponse.json();
        console.log(`[Analytics] Data fetched in ${Date.now() - startTime}ms`);

        if (comprehensiveData.success && comprehensiveData.data) {
          const { analytics, allocation, breakdown, history } = comprehensiveData.data;

          // Process analytics data
          if (analytics) {
            setRiskMetrics({
              portfolioVolatility: analytics.volatility || 0,
              sharpeRatio: analytics.sharpeRatio || 0,
              sortinoRatio: analytics.sortinoRatio || 0,
              maxDrawdown: analytics.maxDrawdown || 0,
              valueAtRisk: analytics.valueAtRisk || 0,
              beta: analytics.beta || 1,
              alpha: analytics.alpha || 0,
              informationRatio: analytics.informationRatio || 0
            });

            if (analytics.assetCorrelations && Array.isArray(analytics.assetCorrelations)) {
              setAssetCorrelations(analytics.assetCorrelations);
            }
          }

          // Process allocation data
          if (allocation && Array.isArray(allocation)) {
            const colors = ['#3b82f6', '#a8c93a', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981'];
            const contributions = allocation.map((asset: any, index: number) => ({
              asset: asset.asset || 'Unknown',
              totalReturn: asset.totalReturn || 0,
              returnContribution: asset.returnContribution || 0,
              riskContribution: asset.riskContribution || 0,
              allocation: asset.percentage || 0,
              color: colors[index % colors.length]
            }));
            setAssetContributions(contributions);
          }

          // Process breakdown data
          if (breakdown && Array.isArray(breakdown)) {
            const attributions = breakdown.map((vault: any) => ({
              vaultId: vault.vaultId || vault.vault_id,
              vaultName: vault.name || 'Unnamed Vault',
              assetSelection: vault.attribution?.assetSelection || 0,
              timing: vault.attribution?.timing || 0,
              rebalancing: vault.attribution?.rebalancing || 0,
              fees: vault.attribution?.fees || 0,
              totalReturn: vault.totalReturn || 0
            }));
            setPerformanceAttribution(attributions);
          }

          // Process history data
          if (history && history.length > 0) {
            // For volatility chart
            const volatilityData = history.map((point: any) => ({
              date: new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              volatility: point.volatility || 0,
              benchmark: 0 // Could add benchmark data later
            }));
            setHistoricalVolatility(volatilityData);

            // For drawdown chart
            const drawdownData = history.map((point: any) => ({
              date: new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              drawdown: point.drawdown || 0,
              maxDrawdown: analytics?.maxDrawdown || 0
            }));
            setDrawdownHistory(drawdownData);

            // For time analysis
            const dayMap = new Map<string, { returns: number[], volumes: number[], volatilities: number[] }>();
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            history.forEach((point: any) => {
              const date = new Date(point.timestamp);
              const dayName = days[date.getDay()];

              if (!dayMap.has(dayName)) {
                dayMap.set(dayName, { returns: [], volumes: [], volatilities: [] });
              }

              const dayData = dayMap.get(dayName)!;
              if (point.dailyReturn != null) dayData.returns.push(point.dailyReturn);
              if (point.volume != null) dayData.volumes.push(point.volume);
              if (point.volatility != null) dayData.volatilities.push(point.volatility);
            });

            const timeAnalysisData = days.slice(1).concat(days[0]).map(dayName => {
              const data = dayMap.get(dayName) || { returns: [0], volumes: [0], volatilities: [0] };
              const avgReturn = data.returns.length > 0
                ? data.returns.reduce((a, b) => a + b, 0) / data.returns.length
                : 0;
              const totalVolume = data.volumes.length > 0
                ? data.volumes.reduce((a, b) => a + b, 0) / data.volumes.length
                : 0;
              const volatility = data.volatilities.length > 0
                ? data.volatilities.reduce((a, b) => a + b, 0) / data.volatilities.length
                : 0;

              return {
                period: dayName,
                avgReturn,
                totalVolume,
                volatility,
                bestDay: '',
                worstDay: ''
              };
            });

            setTimeAnalysis(timeAnalysisData);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLiquidityAnalytics = async () => {
    const normalizedNetwork = network?.toLowerCase() || 'testnet';
    
    try {
      // Fetch real liquidity pools directly from Stellar Horizon
      // This gives us actual pool data instead of generic protocol data
      const horizonUrl = normalizedNetwork === 'mainnet' 
        ? 'https://horizon.stellar.org'
        : 'https://horizon-testnet.stellar.org';
      
      // Fetch liquidity pools from Horizon
      const poolsResponse = await fetch(`${horizonUrl}/liquidity_pools?limit=200`);
      const poolsData = await poolsResponse.json();
      
      if (!poolsData._embedded?.records) {
        throw new Error('No liquidity pools found');
      }
      
      const pools = poolsData._embedded.records;
      console.log(`[Liquidity Analytics] Found ${pools.length} total pools`);
      
      // Map pools to metrics with real data
      const metricsMap = new Map<string, any>();
      
      pools.forEach((pool: any) => {
        try {
          const reserves = pool.reserves || [];
          if (reserves.length !== 2) return;
          
          // Extract asset codes from reserves
          const asset1 = reserves[0].asset.split(':')[0] || 'NATIVE';
          const asset2 = reserves[1].asset.split(':')[0] || 'NATIVE';
          
          // Convert XLM to native
          const asset1Name = asset1 === 'native' ? 'XLM' : asset1;
          const asset2Name = asset2 === 'native' ? 'XLM' : asset2;
          const pairKey = `${asset1Name}/${asset2Name}`;
          
          // Calculate TVL from reserves (in dollars - approximate using XLM price of $0.10)
          const reserve1Amount = parseFloat(reserves[0].amount);
          const reserve2Amount = parseFloat(reserves[1].amount);
          const tvl = (reserve1Amount + reserve2Amount) * 0.10; // Rough USD conversion
          
          // Get total shares for liquidity score
          const totalShares = parseFloat(pool.total_shares || '0');
          const totalTrustlines = parseInt(pool.total_trustlines || '0');
          
          // Calculate slippage (lower for more balanced pools with higher liquidity)
          const imbalance = Math.abs(reserve1Amount - reserve2Amount) / Math.max(reserve1Amount, reserve2Amount);
          const baseSlippage = 0.3; // 0.3% base (Stellar AMM default fee)
          const imbalanceSlippage = imbalance * 2; // Add slippage for imbalanced pools
          const avgSlippage = baseSlippage + imbalanceSlippage;
          
          // Estimate 24h volume based on pool activity (total_shares is a proxy)
          const volume24h = Math.round(tvl * 0.15 * (totalTrustlines / 100)); // Scale by trustlines
          
          // Calculate liquidity score
          const liquidityScore = Math.min(100, Math.round(
            (Math.min(tvl / 5000, 1) * 40) + // TVL component (max 40 points)
            (Math.min(totalTrustlines / 50, 1) * 30) + // Usage component (max 30 points)
            (Math.min(totalShares / 1000000, 1) * 30) // Liquidity depth (max 30 points)
          ));
          
          // Only include pools with meaningful liquidity
          if (tvl >= 100 && liquidityScore >= 30) {
            // If we already have this pair, keep the one with higher TVL
            if (metricsMap.has(pairKey)) {
              const existing = metricsMap.get(pairKey);
              if (tvl > existing.poolDepth) {
                metricsMap.set(pairKey, {
                  asset: pairKey,
                  poolDepth: Math.round(tvl),
                  avgSlippage: Number(avgSlippage.toFixed(2)),
                  volume24h: volume24h,
                  liquidityScore: liquidityScore,
                  poolId: pool.id
                });
              }
            } else {
              metricsMap.set(pairKey, {
                asset: pairKey,
                poolDepth: Math.round(tvl),
                avgSlippage: Number(avgSlippage.toFixed(2)),
                volume24h: volume24h,
                liquidityScore: liquidityScore,
                poolId: pool.id
              });
            }
          }
        } catch (err) {
          console.error('[Liquidity Analytics] Error processing pool:', err);
        }
      });
      
      // Convert map to array and sort by liquidity score
      const metrics = Array.from(metricsMap.values())
        .sort((a, b) => b.liquidityScore - a.liquidityScore)
        .slice(0, 10); // Show top 10 pools
      
      console.log(`[Liquidity Analytics] Processed ${metrics.length} unique pools with real data`);
      
      if (metrics.length > 0) {
        setLiquidityMetrics(metrics);
      } else {
        // Fallback: Show common pairs with zeros if no real data
        setLiquidityMetrics([
          { asset: 'USDC/XLM', poolDepth: 0, avgSlippage: 0, volume24h: 0, liquidityScore: 0 },
          { asset: 'XLM/BTC', poolDepth: 0, avgSlippage: 0, volume24h: 0, liquidityScore: 0 },
          { asset: 'USDC/ETH', poolDepth: 0, avgSlippage: 0, volume24h: 0, liquidityScore: 0 },
          { asset: 'XLM/ETH', poolDepth: 0, avgSlippage: 0, volume24h: 0, liquidityScore: 0 }
        ]);
      }
      setLiquidityLoaded(true);
    } catch (err) {
      console.error('Failed to fetch liquidity analytics:', err);
      setLiquidityLoaded(true); // Mark as loaded even on error to prevent infinite retries
      throw err;
    }
  };

  const handleRefresh = () => {
    setLiquidityLoaded(false); // Reset liquidity loaded flag on refresh
    fetchAnalytics(true);
  };

  const periods = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '1y', label: '1Y' },
  ];

  const views = [
    { value: 'risk', label: 'Risk Analysis', icon: Shield },
    { value: 'performance', label: 'Performance', icon: Target },
    { value: 'liquidity', label: 'Liquidity', icon: Droplet },
    { value: 'time', label: 'Time Analysis', icon: Clock },
  ];

  if (!address) {
    return (
      <div className="h-full bg-app flex items-center justify-center p-4">
        <Card className="p-8 text-center bg-card max-w-md">
          <Activity className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-neutral-50">Connect Your Wallet</h2>
          <p className="text-neutral-400">
            Connect your wallet to view detailed analytics and insights about your portfolio performance
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-app overflow-auto">
        <div className="container mx-auto px-4 py-8 pb-16 max-w-7xl">
          <div className="space-y-6 pb-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>

            {/* Key Metrics Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-5 bg-card border border-default">
                  <div className="flex items-start justify-between mb-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </Card>
              ))}
            </div>

            {/* Performance Chart and Allocation Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Skeleton */}
              <Card className="lg:col-span-2 p-6 bg-card border border-default">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <Skeleton className="h-64 w-full rounded-lg" />
              </Card>

              {/* Allocation Skeleton */}
              <Card className="p-6 bg-card border border-default">
                <Skeleton className="h-6 w-40 mb-6" />
                <Skeleton className="h-48 w-48 mx-auto mb-4 rounded-full" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Vault Breakdown Skeleton */}
            <Card className="p-6 bg-card border border-default">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[...Array(4)].map((_, j) => (
                        <div key={j}>
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-app flex items-center justify-center p-4">
        <Card className="p-8 text-center bg-card max-w-md">
          <AlertCircle className="w-12 h-12 text-error-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-neutral-50">Error Loading Analytics</h2>
          <p className="text-neutral-400 mb-4">{error}</p>
          <Button onClick={() => fetchAnalytics()} variant="primary">Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-app overflow-auto">
      <div className="container mx-auto px-4 py-8 pb-16 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 pb-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-50 mb-2 flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary-500" />
                Advanced Analytics
              </h1>
              <p className="text-neutral-400">
                Deep-dive analysis into risk, performance, and market dynamics
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <div className="flex items-center gap-2 bg-secondary p-1 rounded-lg">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === period.value
                        ? 'bg-primary-500 text-dark-950'
                        : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-900'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="md"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* View Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {views.map((view) => {
              const Icon = view.icon;
              const isActive = selectedView === view.value;
              return (
                <button
                  key={view.value}
                  onClick={() => setSelectedView(view.value as any)}
                  className={`p-4 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-primary-500/10 border-primary-500 shadow-lg shadow-primary-500/20'
                      : 'bg-card border-default hover:border-primary-500/50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-primary-500' : 'text-neutral-400'}`} />
                  <div className={`text-sm font-medium ${isActive ? 'text-primary-400' : 'text-neutral-300'}`}>
                    {view.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Risk Analysis View */}
          {selectedView === 'risk' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Risk Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-card border border-default">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-neutral-400">Sharpe Ratio</div>
                    <Shield className="w-4 h-4 text-success-400" />
                  </div>
                  <div className="text-2xl font-bold text-neutral-50">{riskMetrics?.sharpeRatio.toFixed(2)}</div>
                  <div className="text-xs text-neutral-500 mt-1">Risk-adjusted return</div>
                </Card>

                <Card className="p-4 bg-card border border-default">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-neutral-400">Max Drawdown</div>
                    <TrendingUpDown className="w-4 h-4 text-error-400" />
                  </div>
                  <div className="text-2xl font-bold text-error-400">{riskMetrics?.maxDrawdown.toFixed(1)}%</div>
                  <div className="text-xs text-neutral-500 mt-1">Peak to trough</div>
                </Card>

                <Card className="p-4 bg-card border border-default">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-neutral-400">Volatility</div>
                    <Activity className="w-4 h-4 text-warning-400" />
                  </div>
                  <div className="text-2xl font-bold text-neutral-50">{riskMetrics?.portfolioVolatility.toFixed(1)}%</div>
                  <div className="text-xs text-neutral-500 mt-1">30-day annualized</div>
                </Card>

                <Card className="p-4 bg-card border border-default">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-neutral-400">Value at Risk</div>
                    <AlertTriangle className="w-4 h-4 text-error-400" />
                  </div>
                  <div className="text-2xl font-bold text-error-400">{riskMetrics?.valueAtRisk.toFixed(1)}%</div>
                  <div className="text-xs text-neutral-500 mt-1">95% confidence</div>
                </Card>
              </div>

              {/* Volatility Chart */}
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                  <TrendingUpDown className="w-5 h-5 text-warning-400" />
                  Historical Volatility
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalVolatility}>
                    <defs>
                      <linearGradient id="volatilityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="volatility"
                      stroke="#f59e0b"
                      fill="url(#volatilityGradient)"
                      name="Portfolio Volatility"
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      stroke="#6366f1"
                      strokeDasharray="5 5"
                      name="Market Benchmark"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Drawdown Chart */}
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                  <ArrowDownRight className="w-5 h-5 text-error-400" />
                  Drawdown Analysis
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={drawdownHistory}>
                    <defs>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke="#ef4444"
                      fill="url(#drawdownGradient)"
                      name="Current Drawdown"
                    />
                    <Line
                      type="monotone"
                      dataKey="maxDrawdown"
                      stroke="#dc2626"
                      strokeDasharray="5 5"
                      name="Max Drawdown"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Asset Correlation Matrix */}
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-primary-500" />
                  Asset Correlation Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-700">
                        <th className="text-left p-3 text-sm text-neutral-400">Asset Pair</th>
                        <th className="text-center p-3 text-sm text-neutral-400">Correlation</th>
                        <th className="text-center p-3 text-sm text-neutral-400">Relationship</th>
                        <th className="text-center p-3 text-sm text-neutral-400">Visual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetCorrelations.map((corr, idx) => {
                        const absCorr = Math.abs(corr.correlation);
                        const isPositive = corr.correlation > 0;
                        let relationship = 'Weak';
                        if (absCorr > 0.7) relationship = 'Strong';
                        else if (absCorr > 0.4) relationship = 'Moderate';
                        
                        return (
                          <tr key={idx} className="border-b border-neutral-800 hover:bg-neutral-900">
                            <td className="p-3 text-sm text-neutral-300">{corr.asset1} / {corr.asset2}</td>
                            <td className="p-3 text-center">
                              <span className={`text-sm font-medium ${isPositive ? 'text-success-400' : 'text-error-400'}`}>
                                {corr.correlation.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-3 text-center text-sm text-neutral-400">{relationship}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center">
                                <div className="w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${isPositive ? 'bg-success-400' : 'bg-error-400'}`}
                                    style={{ width: `${absCorr * 100}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Additional Risk Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-card border border-default">
                  <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary-500" />
                    Risk-Adjusted Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
                      <div>
                        <div className="text-sm text-neutral-400">Sortino Ratio</div>
                        <div className="text-xs text-neutral-500 mt-1">Downside deviation</div>
                      </div>
                      <div className="text-xl font-bold text-success-400">{riskMetrics?.sortinoRatio.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
                      <div>
                        <div className="text-sm text-neutral-400">Information Ratio</div>
                        <div className="text-xs text-neutral-500 mt-1">vs benchmark</div>
                      </div>
                      <div className="text-xl font-bold text-primary-400">{riskMetrics?.informationRatio.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
                      <div>
                        <div className="text-sm text-neutral-400">Alpha</div>
                        <div className="text-xs text-neutral-500 mt-1">Excess return</div>
                      </div>
                      <div className="text-xl font-bold text-success-400">+{riskMetrics?.alpha.toFixed(1)}%</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
                      <div>
                        <div className="text-sm text-neutral-400">Beta</div>
                        <div className="text-xs text-neutral-500 mt-1">Market sensitivity</div>
                      </div>
                      <div className="text-xl font-bold text-neutral-50">{riskMetrics?.beta.toFixed(2)}</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card border border-default">
                  <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary-500" />
                    Risk Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-success-400/10 border border-success-400/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <ArrowUpRight className="w-5 h-5 text-success-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-success-400 mb-1">Strong Risk-Adjusted Returns</div>
                          <div className="text-xs text-neutral-400">
                            Your Sharpe ratio of {riskMetrics?.sharpeRatio.toFixed(2)} indicates excellent risk-adjusted performance.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-warning-400/10 border border-warning-400/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-warning-400 mb-1">Moderate Volatility</div>
                          <div className="text-xs text-neutral-400">
                            Portfolio volatility at {riskMetrics?.portfolioVolatility.toFixed(1)}% is within acceptable range.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-primary-400 mb-1">Low Market Correlation</div>
                          <div className="text-xs text-neutral-400">
                            Your beta of {riskMetrics?.beta.toFixed(2)} shows lower correlation with market movements.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Performance Analysis View */}
          {selectedView === 'performance' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Asset Contribution Chart */}
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-500" />
                  Asset Contribution Analysis
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={assetContributions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="asset" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="returnContribution" name="Return Contribution (%)" fill="#a8c93a" />
                    <Bar dataKey="riskContribution" name="Risk Contribution (%)" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Asset Details Table */}
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4">Asset Performance Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-700">
                        <th className="text-left p-3 text-sm text-neutral-400">Asset</th>
                        <th className="text-right p-3 text-sm text-neutral-400">Total Return</th>
                        <th className="text-right p-3 text-sm text-neutral-400">Return Contribution</th>
                        <th className="text-right p-3 text-sm text-neutral-400">Risk Contribution</th>
                        <th className="text-right p-3 text-sm text-neutral-400">Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetContributions.map((asset, idx) => (
                        <tr key={idx} className="border-b border-neutral-800 hover:bg-neutral-900">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                              <span className="text-sm font-medium text-neutral-50">{asset.asset}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right text-sm font-medium text-success-400">
                            ${asset.totalReturn.toFixed(2)}
                          </td>
                          <td className="p-3 text-right text-sm text-neutral-300">
                            {asset.returnContribution}%
                          </td>
                          <td className="p-3 text-right text-sm text-neutral-300">
                            {asset.riskContribution}%
                          </td>
                          <td className="p-3 text-right text-sm text-neutral-300">
                            {asset.allocation}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Performance Attribution */}
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-500" />
                  Performance Attribution by Vault
                </h3>
                <div className="space-y-4">
                  {performanceAttribution.map((vault, idx) => (
                    <div key={idx} className="p-4 bg-neutral-900 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-neutral-50">{vault.vaultName}</h4>
                        <div className="text-lg font-bold text-success-400">
                          +{vault.totalReturn.toFixed(1)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="text-center p-2 bg-card rounded">
                          <div className="text-xs text-neutral-400 mb-1">Asset Selection</div>
                          <div className="text-sm font-medium text-primary-400">+{vault.assetSelection.toFixed(1)}%</div>
                        </div>
                        <div className="text-center p-2 bg-card rounded">
                          <div className="text-xs text-neutral-400 mb-1">Timing</div>
                          <div className="text-sm font-medium text-success-400">+{vault.timing.toFixed(1)}%</div>
                        </div>
                        <div className="text-center p-2 bg-card rounded">
                          <div className="text-xs text-neutral-400 mb-1">Rebalancing</div>
                          <div className="text-sm font-medium text-success-400">+{vault.rebalancing.toFixed(1)}%</div>
                        </div>
                        <div className="text-center p-2 bg-card rounded">
                          <div className="text-xs text-neutral-400 mb-1">Fees</div>
                          <div className="text-sm font-medium text-error-400">{vault.fees.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Liquidity Analysis View */}
          {selectedView === 'liquidity' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-primary-500" />
                  Liquidity Metrics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-700">
                        <th className="text-left p-3 text-sm text-neutral-400">Pool</th>
                        <th className="text-right p-3 text-sm text-neutral-400">Pool Depth</th>
                        <th className="text-right p-3 text-sm text-neutral-400">Avg Slippage</th>
                        <th className="text-right p-3 text-sm text-neutral-400">24h Volume</th>
                        <th className="text-right p-3 text-sm text-neutral-400">Liquidity Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liquidityMetrics.map((metric, idx) => {
                        let scoreColor = 'text-success-400';
                        if (metric.liquidityScore < 70) scoreColor = 'text-error-400';
                        else if (metric.liquidityScore < 85) scoreColor = 'text-warning-400';
                        
                        return (
                          <tr key={idx} className="border-b border-neutral-800 hover:bg-neutral-900">
                            <td className="p-3 text-sm font-medium text-neutral-50">{metric.asset}</td>
                            <td className="p-3 text-right text-sm text-neutral-300">
                              ${metric.poolDepth.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-sm text-neutral-300">
                              {metric.avgSlippage.toFixed(2)}%
                            </td>
                            <td className="p-3 text-right text-sm text-neutral-300">
                              ${metric.volume24h.toLocaleString()}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`text-sm font-bold ${scoreColor}`}>
                                {metric.liquidityScore}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Liquidity Score Distribution */}
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4">Liquidity Score Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={liquidityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="asset" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Bar dataKey="liquidityScore" name="Liquidity Score">
                      {liquidityMetrics.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.liquidityScore >= 85 ? '#10b981' : entry.liquidityScore >= 70 ? '#f59e0b' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          )}

          {/* Time Analysis View */}
          {selectedView === 'time' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Day of Week Analysis */}
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  Performance by Day of Week
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="period" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="avgReturn" name="Avg Return (%)">
                      {timeAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avgReturn >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Volume Analysis */}
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-500" />
                  Volume Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="period" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalVolume"
                      stroke="#a8c93a"
                      strokeWidth={2}
                      name="Total Volume"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Rebalancing History */}
              <Card className="p-6 bg-card border border-default">
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-500" />
                  Recent Rebalancing Events
                </h3>
                <div className="space-y-3">
                  {rebalanceHistory.map((event, idx) => (
                    <div key={idx} className="p-4 bg-neutral-900 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-neutral-50">{event.vaultName}</div>
                          <div className="text-xs text-neutral-400">
                            {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-success-400">
                            +{event.impact.toFixed(2)}% impact
                          </div>
                          <div className="text-xs text-neutral-400">
                            Cost: ${event.cost.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-neutral-400">
                          Before: <span className="text-neutral-300">${event.tvlBefore.toLocaleString()}</span>
                        </div>
                        <div className="text-neutral-500">→</div>
                        <div className="text-neutral-400">
                          After: <span className="text-neutral-300">${event.tvlAfter.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
