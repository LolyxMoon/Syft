// T096: Backtest simulation engine that replays vault rules
// Purpose: Simulate vault performance over historical periods
// ARCHITECTURE: Uses real mainnet price data for accurate backtesting,
// regardless of user's execution network (testnet/futurenet/mainnet)

import { fetchHistoricalPrices } from './historicalDataService.js';
import { getTokenSymbol } from './tokenService.js';

// Import types from shared - using relative path to avoid rootDir issues
interface AssetAllocation {
  assetId: string;
  assetCode: string;
  assetIssuer?: string;
  percentage: number;
}

interface RebalanceCondition {
  type: 'time' | 'price' | 'apy' | 'allocation';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  assetId?: string;
}

interface RebalanceAction {
  type: 'rebalance' | 'stake' | 'unstake' | 'provide_liquidity' | 'remove_liquidity';
  targetAllocations: AssetAllocation[];
  params?: Record<string, any>;
}

interface RebalanceRule {
  id: string;
  name: string;
  description?: string;
  conditions: RebalanceCondition[];
  actions: RebalanceAction[];
  enabled: boolean;
  priority: number;
}

interface VaultConfig {
  name: string;
  description?: string;
  owner: string;
  assets: AssetAllocation[];
  rules: RebalanceRule[];
  minDeposit?: number;
  maxDeposit?: number;
  managementFee?: number;
  performanceFee?: number;
  isPublic: boolean;
}

export interface BacktestRequest {
  vaultConfig: VaultConfig;
  startTime: string;
  endTime: string;
  initialCapital: number;
  resolution?: number; // milliseconds, default 1 day
}

export interface BacktestTransaction {
  timestamp: string;
  type: 'deposit' | 'withdraw' | 'rebalance' | 'fee';
  description: string;
  portfolioValue: number;
  allocations: AssetAllocation[];
  triggeredRule?: string;
}

export interface BacktestMetrics {
  totalReturn: number; // percentage
  totalReturnAmount: number;
  annualizedReturn: number; // percentage
  volatility: number; // standard deviation of returns
  sharpeRatio: number;
  maxDrawdown: number; // percentage
  maxDrawdownAmount: number;
  winRate: number; // percentage of profitable periods
  numRebalances: number;
  totalFees: number;
  finalValue: number;
  buyAndHoldReturn: number; // comparison baseline
  usingMockData?: boolean; // indicates if synthetic data was used (only when mainnet has no data)
  dataSourceWarning?: string; // explanation of data source (always mainnet unless no data exists)
}

export interface BacktestResult {
  request: BacktestRequest;
  metrics: BacktestMetrics;
  timeline: BacktestTransaction[];
  portfolioValueHistory: { timestamp: string; value: number }[];
  allocationHistory: { timestamp: string; allocations: AssetAllocation[] }[];
}

interface AssetPrice {
  [assetCode: string]: number;
}

interface PortfolioState {
  holdings: Map<string, number>; // assetCode -> amount
  totalValue: number;
  allocations: AssetAllocation[];
}

/**
 * Run backtest simulation for a vault configuration
 */
export async function runBacktest(request: BacktestRequest): Promise<BacktestResult> {
  const {
    vaultConfig,
    startTime,
    endTime,
    initialCapital,
    resolution = 24 * 60 * 60 * 1000, // 1 day default
  } = request;

  console.log('[Backtest] Starting backtest with config:', {
    vaultName: vaultConfig.name,
    assets: vaultConfig.assets,
    rules: vaultConfig.rules,
    startTime,
    endTime,
    resolution,
  });

  // Initialize tracking
  const timeline: BacktestTransaction[] = [];
  const portfolioValueHistory: { timestamp: string; value: number }[] = [];
  const allocationHistory: { timestamp: string; allocations: AssetAllocation[] }[] = [];
  const dailyReturns: number[] = [];

  // Fetch historical price data for all assets
  const { priceData, usedMockData } = await fetchAllAssetPrices(vaultConfig.assets, startTime, endTime, resolution);

  // Get starting prices
  const startTime_ms = new Date(startTime).getTime();
  const startingPrices = getCurrentPrices(priceData, startTime_ms);
  
  // Initialize portfolio with target allocations using real starting prices
  let portfolio = initializePortfolio(initialCapital, vaultConfig.assets, startingPrices);
  let previousValue = initialCapital;
  let maxValue = initialCapital;
  let maxDrawdown = 0;
  let numRebalances = 0;
  let totalFees = 0;

  // Initial deposit transaction
  timeline.push({
    timestamp: startTime,
    type: 'deposit',
    description: `Initial deposit of ${initialCapital} USDC`,
    portfolioValue: initialCapital,
    allocations: [...vaultConfig.assets],
  });

  // Simulate each time period
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  let currentTime = start;
  
  // Track last rebalance time for each rule (for time-based conditions)
  const lastRebalanceTime = new Map<string, number>();
  
  // Minimum cooldown between rebalances (24 hours) to prevent over-trading
  const MIN_REBALANCE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
  let lastGlobalRebalance = 0;

  while (currentTime <= end) {
    const timestamp = new Date(currentTime).toISOString();

    // Get current prices
    const currentPrices = getCurrentPrices(priceData, currentTime);

    // Update portfolio value based on current prices
    portfolio = updatePortfolioValue(portfolio, currentPrices);
    
    // Apply daily management fee (amortized from annual rate)
    // Management fee is deducted continuously, not on rebalance
    if (vaultConfig.managementFee && vaultConfig.managementFee > 0) {
      const daysInPeriod = resolution / (24 * 60 * 60 * 1000);
      const dailyFeeRate = (vaultConfig.managementFee / 100) / 365; // Convert annual to daily
      const periodFee = portfolio.totalValue * dailyFeeRate * daysInPeriod;
      
      if (periodFee > 0) {
        portfolio.totalValue -= periodFee;
        totalFees += periodFee;
      }
    }

    // Check if any rules trigger (only if cooldown has passed)
    const timeSinceLastRebalance = currentTime - lastGlobalRebalance;
    const canRebalance = timeSinceLastRebalance >= MIN_REBALANCE_COOLDOWN;
    
    if (canRebalance) {
      const triggeredRules = checkRuleTriggers(
        vaultConfig.rules,
        portfolio,
        currentPrices,
        timestamp,
        lastRebalanceTime
      );

      // Execute triggered rules
      for (const rule of triggeredRules) {
        const rebalanceFee = executeRebalance(
          portfolio,
          rule,
          currentPrices
        );

        totalFees += rebalanceFee;
        numRebalances++;

        // Update last rebalance time for this rule
        lastRebalanceTime.set(rule.id, currentTime);
        lastGlobalRebalance = currentTime;

        timeline.push({
          timestamp,
          type: 'rebalance',
          description: `Rebalanced: ${rule.name}`,
          portfolioValue: portfolio.totalValue,
          allocations: [...portfolio.allocations],
          triggeredRule: rule.id,
        });
      }
    }

    // Track metrics
    portfolioValueHistory.push({
      timestamp,
      value: portfolio.totalValue,
    });

    allocationHistory.push({
      timestamp,
      allocations: [...portfolio.allocations],
    });

    // Calculate daily return
    if (previousValue > 0) {
      const dailyReturn = (portfolio.totalValue - previousValue) / previousValue;
      dailyReturns.push(dailyReturn);
    }

    // Track max drawdown
    if (portfolio.totalValue > maxValue) {
      maxValue = portfolio.totalValue;
    }
    const drawdown = (maxValue - portfolio.totalValue) / maxValue;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    previousValue = portfolio.totalValue;
    currentTime += resolution;
  }

  // Calculate final metrics
  const totalReturn = ((portfolio.totalValue - initialCapital) / initialCapital) * 100;
  const totalReturnAmount = portfolio.totalValue - initialCapital;
  
  // Annualized return
  const daysElapsed = (end - start) / (24 * 60 * 60 * 1000);
  const yearsElapsed = daysElapsed / 365;
  const annualizedReturn = (Math.pow(portfolio.totalValue / initialCapital, 1 / yearsElapsed) - 1) * 100;

  // Volatility (standard deviation of daily returns)
  const volatility = calculateStandardDeviation(dailyReturns) * Math.sqrt(252) * 100; // Annualized

  // Sharpe ratio (assuming 0% risk-free rate for simplicity)
  const sharpeRatio = volatility > 0 ? annualizedReturn / volatility : 0;

  // Win rate
  const profitablePeriods = dailyReturns.filter((r) => r > 0).length;
  const winRate = dailyReturns.length > 0 ? (profitablePeriods / dailyReturns.length) * 100 : 0;

  // Calculate buy-and-hold baseline
  const buyAndHoldReturn = await calculateBuyAndHoldReturn(
    vaultConfig.assets,
    priceData,
    start,
    end
  );

  const metrics: BacktestMetrics = {
    totalReturn,
    totalReturnAmount,
    annualizedReturn,
    volatility,
    sharpeRatio,
    maxDrawdown: maxDrawdown * 100,
    maxDrawdownAmount: maxValue - (maxValue * (1 - maxDrawdown)),
    winRate,
    numRebalances,
    totalFees,
    finalValue: portfolio.totalValue,
    buyAndHoldReturn,
    usingMockData: usedMockData,
    dataSourceWarning: usedMockData 
      ? 'Using synthetic price data as last resort (no data available on mainnet for these assets). Results are simulated and not suitable for production decisions.'
      : 'Using real mainnet price data - results reflect actual market conditions.',
  };

  return {
    request,
    metrics,
    timeline,
    portfolioValueHistory,
    allocationHistory,
  };
}

/**
 * Fetch price data for all assets in the vault
 * Returns both price data and a flag indicating if mock data was used
 */
async function fetchAllAssetPrices(
  assets: AssetAllocation[],
  startTime: string,
  endTime: string,
  resolution: number
): Promise<{ priceData: Map<string, { timestamp: string; price: number }[]>; usedMockData: boolean }> {
  const priceData = new Map<string, { timestamp: string; price: number }[]>();
  let usedMockData = false;

  // USDC issuer for Stellar (Circle's official issuer - works on both mainnet and testnet)
  // This is the classic Stellar account address, not the Soroban contract address
  const USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

  for (const asset of assets) {
    // Handle stablecoins - they're always $1.00 USD
    if (asset.assetCode === 'USDC' || asset.assetCode === 'USDT' || asset.assetCode === 'DAI') {
      console.log(`[Backtest] ${asset.assetCode} is a stablecoin, using fixed $1.00 price`);
      const stablecoinPrices = generateStablecoinPrices(startTime, endTime, resolution);
      priceData.set(asset.assetCode, stablecoinPrices);
      continue; // Skip fetching - we have the data
    }

    // Check if assetCode is actually a Soroban contract address (starts with 'C')
    if (asset.assetCode.startsWith('C') && asset.assetCode.length > 50) {
      console.log(`[Backtest] Asset ${asset.assetCode} appears to be a Soroban contract address.`);
      
      // Strategy: Try multiple approaches in priority order
      // 1. Try CoinGecko with common token symbols first (fast, no contract calls)
      // 2. Resolve contract symbol and try CoinGecko with that
      // 3. Fallback to mock data
      
      const { getHistoricalPricesFromCoinGecko } = await import('./priceService.js');
      let foundData = false;
      
      // First, try common Soroban tokens that might match this contract
      const commonTokens = ['USDC', 'EURC', 'AQUA', 'BLND', 'yXLM', 'yUSDC'];
      
      for (const symbol of commonTokens) {
        console.log(`[Backtest] Trying CoinGecko with known symbol: ${symbol}...`);
        const coinGeckoPrices = await getHistoricalPricesFromCoinGecko(
          symbol,
          startTime,
          endTime,
          resolution
        );
        
        if (coinGeckoPrices && coinGeckoPrices.length > 0) {
          console.log(`[Backtest] ✓ Using CoinGecko historical data for ${symbol} (${asset.assetCode.slice(0, 12)}...)`);
          priceData.set(asset.assetCode, coinGeckoPrices);
          foundData = true;
          break;
        }
      }
      
      // If common tokens didn't work, try to resolve the actual token symbol
      if (!foundData) {
        console.log(`[Backtest] No match with common tokens, attempting to resolve contract symbol...`);
        const tokenSymbol = await getTokenSymbol(asset.assetCode, 'mainnet');
        
        if (tokenSymbol) {
          console.log(`[Backtest] ✓ Resolved to token symbol: ${tokenSymbol}`);
          
          const coinGeckoPrices = await getHistoricalPricesFromCoinGecko(
            tokenSymbol,
            startTime,
            endTime,
            resolution
          );

          if (coinGeckoPrices && coinGeckoPrices.length > 0) {
            console.log(`[Backtest] ✓ Using CoinGecko historical data for ${tokenSymbol}`);
            priceData.set(asset.assetCode, coinGeckoPrices);
            foundData = true;
          }
        }
      }
      
      // Last resort: use mock data
      if (!foundData) {
        console.warn(`[Backtest] No price data available from CoinGecko, using mock data for ${asset.assetCode.slice(0, 12)}...`);
        const mockPrices = generateMockPriceData(asset.assetCode, new Date(startTime).getTime(), new Date(endTime).getTime(), resolution);
        priceData.set(asset.assetCode, mockPrices);
        usedMockData = true;
      }
      
      continue;
    }

    if (asset.assetCode === 'XLM' || asset.assetCode === 'native') {
      // Try CoinGecko first for more reliable data
      const { getHistoricalPricesFromCoinGecko } = await import('./priceService.js');
      const coinGeckoPrices = await getHistoricalPricesFromCoinGecko(
        'XLM',
        startTime,
        endTime,
        resolution
      );

      if (coinGeckoPrices && coinGeckoPrices.length > 0) {
        console.log('[Backtest] ✓ Using CoinGecko historical data for XLM');
        priceData.set('XLM', coinGeckoPrices);
      } else {
        // Fallback to Horizon data
        console.log('[Backtest] Falling back to Horizon API for XLM data');
        const data = await fetchHistoricalPrices({
          assetCode: 'XLM',
          counterAssetCode: 'USDC',
          counterAssetIssuer: USDC_ISSUER,
          startTime,
          endTime,
          resolution,
        });
        priceData.set('XLM', data.dataPoints.map((p) => ({ timestamp: p.timestamp, price: p.close })));
        if (data.usingMockData) usedMockData = true;
      }
    } else {
      // Try CoinGecko first for known assets
      const { getHistoricalPricesFromCoinGecko } = await import('./priceService.js');
      const coinGeckoPrices = await getHistoricalPricesFromCoinGecko(
        asset.assetCode,
        startTime,
        endTime,
        resolution
      );

      if (coinGeckoPrices && coinGeckoPrices.length > 0) {
        console.log(`[Backtest] ✓ Using CoinGecko historical data for ${asset.assetCode}`);
        priceData.set(asset.assetCode, coinGeckoPrices);
      } else {
        // Fallback to Horizon API for classic Stellar assets
        console.log(`[Backtest] No CoinGecko data, trying Horizon API for ${asset.assetCode}`);
        const data = await fetchHistoricalPrices({
          assetCode: asset.assetCode,
          assetIssuer: asset.assetIssuer,
          counterAssetCode: 'USDC',
          counterAssetIssuer: USDC_ISSUER,
          startTime,
          endTime,
          resolution,
        });
        priceData.set(asset.assetCode, data.dataPoints.map((p) => ({ timestamp: p.timestamp, price: p.close })));
        if (data.usingMockData) usedMockData = true;
      }
    }
  }

  return { priceData, usedMockData };
}

/**
 * Generate fixed $1.00 prices for stablecoins
 */
function generateStablecoinPrices(
  startTime: string,
  endTime: string,
  resolution: number
): { timestamp: string; price: number }[] {
  const prices: { timestamp: string; price: number }[] = [];
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  let currentTime = start;

  while (currentTime <= end) {
    prices.push({
      timestamp: new Date(currentTime).toISOString(),
      price: 1.0, // Stablecoins are always $1.00
    });
    currentTime += resolution;
  }

  return prices;
}

/**
 * Generate mock price data for testing when real data is unavailable
 * This is useful for Soroban tokens that don't have Horizon trade history yet
 */
function generateMockPriceData(
  assetCode: string,
  startTime: number,
  endTime: number,
  resolution: number
): { timestamp: string; price: number }[] {
  const dataPoints: { timestamp: string; price: number }[] = [];
  
  // Base prices for common assets (simulated)
  const basePrices: { [key: string]: number } = {
    'XLM': 0.12,    // XLM around $0.12
    'USDC': 1.00,   // USDC is $1
    'BTC': 45000,   // BTC around $45k
    'ETH': 2500,    // ETH around $2.5k
  };
  
  let basePrice = basePrices[assetCode] || 1.0;
  let currentPrice = basePrice;
  let currentTime = startTime;
  
  // Generate realistic price movement with random walk
  while (currentTime <= endTime) {
    // Add some volatility (±2% per period)
    const change = (Math.random() - 0.5) * 0.04; // -2% to +2%
    currentPrice = currentPrice * (1 + change);
    
    // Keep price within reasonable bounds (±30% from base)
    const minPrice = basePrice * 0.7;
    const maxPrice = basePrice * 1.3;
    currentPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice));
    
    dataPoints.push({
      timestamp: new Date(currentTime).toISOString(),
      price: currentPrice,
    });
    
    currentTime += resolution;
  }
  
  return dataPoints;
}

/**
 * Initialize portfolio with target allocations
 */
function initializePortfolio(
  capital: number,
  targetAllocations: AssetAllocation[],
  startingPrices: AssetPrice
): PortfolioState {
  const holdings = new Map<string, number>();
  let actualTotalValue = 0;

  for (const allocation of targetAllocations) {
    const allocationAmount = (capital * allocation.percentage) / 100;
    // Use real starting prices to calculate initial holdings
    const price = startingPrices[allocation.assetCode] || 1;
    const quantity = allocationAmount / price;
    holdings.set(allocation.assetCode, quantity);
    actualTotalValue += quantity * price;
  }

  console.log(`[Backtest] Initialized portfolio: target=$${capital}, actual=$${actualTotalValue.toFixed(2)}`);

  return {
    holdings,
    totalValue: actualTotalValue, // Use actual calculated value, not target
    allocations: targetAllocations.map((a) => ({ ...a })),
  };
}

/**
 * Get current prices at a specific timestamp
 */
function getCurrentPrices(
  priceData: Map<string, { timestamp: string; price: number }[]>,
  timestamp: number
): AssetPrice {
  const prices: AssetPrice = {};

  for (const [assetCode, data] of priceData.entries()) {
    // Find closest price point
    const closestPoint = data.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.timestamp).getTime() - timestamp);
      const currDiff = Math.abs(new Date(curr.timestamp).getTime() - timestamp);
      return currDiff < prevDiff ? curr : prev;
    });

    prices[assetCode] = closestPoint.price;
  }

  return prices;
}

/**
 * Update portfolio value based on current prices
 */
function updatePortfolioValue(portfolio: PortfolioState, prices: AssetPrice): PortfolioState {
  let totalValue = 0;
  const allocations: AssetAllocation[] = [];

  for (const [assetCode, amount] of portfolio.holdings.entries()) {
    const price = prices[assetCode] || 1;
    const value = amount * price;
    totalValue += value;
  }

  // Recalculate allocations based on current values
  for (const [assetCode, amount] of portfolio.holdings.entries()) {
    const price = prices[assetCode] || 1;
    const value = amount * price;
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

    allocations.push({
      assetId: assetCode,
      assetCode,
      percentage,
    });
  }

  return {
    ...portfolio,
    totalValue,
    allocations,
  };
}

/**
 * Check which rules trigger at current state
 */
function checkRuleTriggers(
  rules: RebalanceRule[],
  portfolio: PortfolioState,
  prices: AssetPrice,
  timestamp: string,
  lastRebalanceTime?: Map<string, number>
): RebalanceRule[] {
  const triggered: RebalanceRule[] = [];
  const currentTime = new Date(timestamp).getTime();

  for (const rule of rules) {
    if (!rule.enabled) {
      console.log(`[Backtest] Rule ${rule.name} is disabled, skipping`);
      continue;
    }

    let allConditionsMet = true;

    for (const condition of rule.conditions) {
      if (condition.type === 'time') {
        // Time-based condition: check if enough time has passed since last rebalance
        const lastRebalance = lastRebalanceTime?.get(rule.id) || 0;
        const timeSinceLastRebalance = currentTime - lastRebalance;
        const requiredInterval = condition.value; // in milliseconds

        const met = timeSinceLastRebalance >= requiredInterval;
        if (!met) {
          allConditionsMet = false;
          break;
        }
      } else if (condition.type === 'allocation' && condition.assetId) {
        // Check if allocation has deviated from target by more than threshold
        const currentAllocation = portfolio.allocations.find(
          (a) => a.assetCode === condition.assetId
        );
        const currentPct = currentAllocation?.percentage || 0;
        
        // Find target allocation for this asset
        // Look in the first action's targetAllocations
        const targetAllocation = rule.actions[0]?.targetAllocations?.find(
          (a) => a.assetCode === condition.assetId
        );
        const targetPct = targetAllocation?.percentage || 0;
        
        // Calculate absolute deviation
        const deviation = Math.abs(currentPct - targetPct);
        
        // condition.value is the threshold (e.g., 5 means 5% deviation)
        const met = deviation >= condition.value;
        
        console.log(`[Backtest] Allocation check for ${condition.assetId}: current=${currentPct.toFixed(2)}%, target=${targetPct.toFixed(2)}%, deviation=${deviation.toFixed(2)}%, threshold=${condition.value}%, met=${met}`);
        
        if (!met) {
          allConditionsMet = false;
          break;
        }
      } else if (condition.type === 'price' && condition.assetId) {
        // Price-based condition
        const currentPrice = prices[condition.assetId] || 0;
        const met = evaluateCondition(currentPrice, condition.operator, condition.value);
        if (!met) {
          allConditionsMet = false;
          break;
        }
      }
      // Add more condition types as needed (apy, etc.)
    }

    if (allConditionsMet) {
      triggered.push(rule);
    }
  }

  return triggered.sort((a, b) => b.priority - a.priority);
}

/**
 * Evaluate a condition
 */
function evaluateCondition(actual: number, operator: string, expected: number): boolean {
  switch (operator) {
    case 'gt':
      return actual > expected;
    case 'lt':
      return actual < expected;
    case 'eq':
      return Math.abs(actual - expected) < 0.01;
    case 'gte':
      return actual >= expected;
    case 'lte':
      return actual <= expected;
    default:
      return false;
  }
}

/**
 * Execute rebalance action
 */
function executeRebalance(
  portfolio: PortfolioState,
  rule: RebalanceRule,
  prices: AssetPrice
): number {
  // Get target allocations from rule
  const action = rule.actions[0];
  if (!action || action.type !== 'rebalance') return 0;

  const targetAllocations = action.targetAllocations;

  // Calculate rebalancing fee (per-rebalance, not annual)
  // Typical rebalancing fee is ~0.1-0.3% per rebalance, not the full annual management fee
  // Management fee should be amortized over time, not charged per rebalance
  const rebalanceFeeRate = 0.001; // 0.1% per rebalance (reasonable for DEX swaps + gas)
  const fee = portfolio.totalValue * rebalanceFeeRate;
  
  // Deduct fee FIRST, then rebalance remaining value
  const valueAfterFee = portfolio.totalValue - fee;

  // Calculate new holdings based on target allocations using value after fee
  const newHoldings = new Map<string, number>();

  for (const target of targetAllocations) {
    const targetValue = (valueAfterFee * target.percentage) / 100;
    const price = prices[target.assetCode] || 1;
    const amount = targetValue / price;
    newHoldings.set(target.assetCode, amount);
  }

  portfolio.holdings = newHoldings;
  portfolio.allocations = targetAllocations.map((a) => ({ ...a }));
  portfolio.totalValue = valueAfterFee;

  console.log(`[Backtest] Rebalanced: fee=$${fee.toFixed(2)}, new value=$${valueAfterFee.toFixed(2)}`);

  return fee;
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Calculate buy-and-hold return for comparison
 */
async function calculateBuyAndHoldReturn(
  assets: AssetAllocation[],
  priceData: Map<string, { timestamp: string; price: number }[]>,
  _startTime: number,
  _endTime: number
): Promise<number> {
  let totalReturn = 0;

  for (const asset of assets) {
    const prices = priceData.get(asset.assetCode);
    if (!prices || prices.length === 0) continue;

    const startPrice = prices[0].price;
    const endPrice = prices[prices.length - 1].price;
    const assetReturn = ((endPrice - startPrice) / startPrice) * (asset.percentage / 100);

    totalReturn += assetReturn;
  }

  return totalReturn * 100; // Convert to percentage
}

export default {
  runBacktest,
};
