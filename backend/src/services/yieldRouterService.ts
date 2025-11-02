/**
 * Yield Router Service
 * Smart routing logic to optimize yield by splitting funds across multiple protocols
 */

import type { YieldAllocation, YieldRoutingStrategy, YieldOpportunity } from '../../../shared/types/protocol.js';
import { getYieldOpportunities, calculateBlendedAPY } from './protocolYieldService.js';

/**
 * Configuration for yield routing strategies
 */
interface RouterConfig {
  maxProtocols: number; // Maximum number of protocols to split across
  minAllocationPerProtocol: number; // Minimum amount per protocol (in USD)
  riskTolerance: 'low' | 'medium' | 'high';
  preferLiquidity: boolean; // Prefer protocols with higher TVL
  gasOptimization: boolean; // Consider gas costs in routing decisions
}

const DEFAULT_CONFIG: RouterConfig = {
  maxProtocols: 3,
  minAllocationPerProtocol: 10, // $10 minimum
  riskTolerance: 'high', // Accept all risk levels to maximize yield opportunities
  preferLiquidity: true,
  gasOptimization: true,
};

/**
 * Map asset symbol to contract address
 */
function getAssetAddress(asset: string, network: string): string {
  const assetMap: { [key: string]: { [network: string]: string } } = {
    'XLM': {
      'testnet': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      'mainnet': 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
    },
    'USDC': {
      'testnet': 'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5', // Official Stellar testnet USDC
      'mainnet': 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
    },
  };

  // If it's already an address (starts with C), return as is
  if (asset.startsWith('C')) {
    return asset;
  }

  // Otherwise look up by symbol
  return assetMap[asset]?.[network] || asset;
}

/**
 * Calculate optimal yield routing strategy
 */
export async function calculateOptimalRouting(
  asset: string,
  totalAmount: number,
  network: string = 'testnet',
  config: Partial<RouterConfig> = {}
): Promise<YieldRoutingStrategy> {
  const routerConfig = { ...DEFAULT_CONFIG, ...config };

  // Map asset symbol to address (if needed)
  const assetAddress = getAssetAddress(asset, network);
  
  // For USDC, query both variants and combine results (like the comparison endpoint does)
  let opportunities: YieldOpportunity[] = [];
  
  if (asset.toUpperCase() === 'USDC') {
    const officialUSDC = 'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5';
    const customUSDC = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';
    
    const [officialOpps, customOpps] = await Promise.all([
      getYieldOpportunities([officialUSDC], network),
      getYieldOpportunities([customUSDC], network)
    ]);
    
    // Combine and deduplicate by protocolId (keep highest APY)
    const allOpps = [...officialOpps, ...customOpps];
    const uniqueOpps = allOpps.reduce((acc, opp) => {
      const existing = acc.find(o => o.protocolId === opp.protocolId);
      if (!existing) {
        acc.push(opp);
      } else if (opp.apy > existing.apy) {
        // If duplicate found, keep the one with higher APY
        const index = acc.indexOf(existing);
        acc[index] = opp;
      }
      return acc;
    }, [] as YieldOpportunity[]);
    
    opportunities = uniqueOpps;
  } else {
    // Get all available yield opportunities
    opportunities = await getYieldOpportunities([assetAddress], network);
  }

  console.log(`[calculateOptimalRouting] Asset: ${asset}, Address: ${assetAddress}, Opportunities: ${opportunities.length}`);
  console.log('[calculateOptimalRouting] Raw opportunities:', opportunities.map(o => ({ protocol: o.protocolName, apy: o.apy, risk: o.risk })));

  // Filter by risk tolerance
  const filteredOpportunities = filterByRisk(opportunities, routerConfig.riskTolerance);
  console.log('[calculateOptimalRouting] Filtered opportunities:', filteredOpportunities.map(o => ({ protocol: o.protocolName, apy: o.apy, risk: o.risk })));

  // Sort opportunities
  const sortedOpportunities = sortOpportunities(
    filteredOpportunities,
    routerConfig.preferLiquidity
  );
  console.log('[calculateOptimalRouting] Sorted opportunities:', sortedOpportunities.map(o => ({ protocol: o.protocolName, apy: o.apy, risk: o.risk })));

  // Calculate allocations
  const allocations = calculateAllocations(
    sortedOpportunities,
    totalAmount,
    routerConfig
  );

  console.log(`[calculateOptimalRouting] Allocations:`, allocations.map(a => ({
    protocol: a.protocolId,
    protocolName: a.protocolName,
    amount: a.amount,
    percentage: a.percentage,
    apy: a.expectedApy,
  })));

  // Calculate blended APY
  const expectedBlendedApy = calculateBlendedAPY(
    allocations.map(a => ({
      protocol: a.protocolId,
      amount: a.amount,
      apy: a.expectedApy,
    }))
  );

  // Generate rationale
  const rationale = generateRationale(allocations, sortedOpportunities);

  return {
    totalAmount,
    asset,
    allocations,
    expectedBlendedApy,
    rationale,
  };
}

/**
 * Filter opportunities by risk tolerance
 */
function filterByRisk(
  opportunities: YieldOpportunity[],
  riskTolerance: 'low' | 'medium' | 'high'
): YieldOpportunity[] {
  const riskLevels = {
    low: ['low'],
    medium: ['low', 'medium'],
    high: ['low', 'medium', 'high'],
  };

  const allowedRisks = riskLevels[riskTolerance];
  return opportunities.filter(o => allowedRisks.includes(o.risk));
}

/**
 * Sort opportunities by priority
 */
function sortOpportunities(
  opportunities: YieldOpportunity[],
  preferLiquidity: boolean
): YieldOpportunity[] {
  return [...opportunities].sort((a, b) => {
    // Primary: APY (descending)
    const apyDiff = b.apy - a.apy;
    if (Math.abs(apyDiff) > 1) return apyDiff; // Significant APY difference

    // Secondary: TVL if preferLiquidity (descending)
    if (preferLiquidity) {
      return b.tvl - a.tvl;
    }

    // Otherwise, prefer lower risk
    const riskWeight = { low: 3, medium: 2, high: 1 };
    return riskWeight[b.risk] - riskWeight[a.risk];
  });
}

/**
 * Calculate allocation amounts across protocols
 */
function calculateAllocations(
  opportunities: YieldOpportunity[],
  totalAmount: number,
  config: RouterConfig
): YieldAllocation[] {
  const allocations: YieldAllocation[] = [];

  if (opportunities.length === 0) {
    return allocations;
  }

  // If amount is too small, put it all in the best protocol
  if (totalAmount < config.minAllocationPerProtocol * 2) {
    const best = opportunities[0];
    return [{
      protocolId: best.protocolId,
      protocolName: best.protocolName,
      amount: totalAmount,
      percentage: 100,
      expectedApy: best.apy,
    }];
  }

  // Strategy: Allocate to top protocols based on APY and risk
  const topProtocols = opportunities.slice(0, config.maxProtocols);
  
  // Calculate weights based on APY (quadratic weighting for significant APY differences)
  const weights = topProtocols.map(p => {
    const apyWeight = Math.pow(p.apy, 1.5); // Favor higher APYs exponentially
    const riskPenalty = p.risk === 'high' ? 0.8 : p.risk === 'medium' ? 0.9 : 1.0;
    return apyWeight * riskPenalty;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Allocate amounts
  let remaining = totalAmount;
  
  topProtocols.forEach((protocol, index) => {
    const isLast = index === topProtocols.length - 1;
    
    if (isLast) {
      // Last protocol gets remaining amount
      if (remaining >= config.minAllocationPerProtocol) {
        allocations.push({
          protocolId: protocol.protocolId,
          protocolName: protocol.protocolName,
          amount: remaining,
          percentage: (remaining / totalAmount) * 100,
          expectedApy: protocol.apy,
        });
        remaining = 0; // Mark as fully allocated
      }
    } else {
      // Calculate weighted allocation
      const weight = weights[index];
      let amount = Math.floor((weight / totalWeight) * totalAmount);
      
      // Respect minimum allocation
      if (amount < config.minAllocationPerProtocol) {
        return; // Skip this protocol
      }

      // Respect protocol max deposit
      if (amount > protocol.maxDeposit) {
        amount = protocol.maxDeposit;
      }

      allocations.push({
        protocolId: protocol.protocolId,
        protocolName: protocol.protocolName,
        amount,
        percentage: (amount / totalAmount) * 100,
        expectedApy: protocol.apy,
      });

      remaining -= amount;
    }
  });

  // Ensure we used all funds
  if (allocations.length > 0 && remaining > 0) {
    allocations[0].amount += remaining;
    allocations[0].percentage = (allocations[0].amount / totalAmount) * 100;
  }

  return allocations;
}

/**
 * Generate human-readable rationale for routing decision
 */
function generateRationale(
  allocations: YieldAllocation[],
  opportunities: YieldOpportunity[]
): string {
  if (allocations.length === 0) {
    return 'No suitable yield opportunities found for this asset.';
  }

  if (allocations.length === 1) {
    const protocol = opportunities.find(o => o.protocolId === allocations[0].protocolId);
    return `Allocated 100% to ${protocol?.protocolName || 'best protocol'} (${allocations[0].expectedApy.toFixed(2)}% APY) for optimal single-protocol yield.`;
  }

  const parts = allocations.map(a => {
    const protocol = opportunities.find(o => o.protocolId === a.protocolId);
    return `${a.percentage.toFixed(0)}% to ${protocol?.protocolName || a.protocolId} (${a.expectedApy.toFixed(2)}% APY)`;
  });

  return `Diversified across ${allocations.length} protocols for optimal risk-adjusted returns: ${parts.join(', ')}.`;
}

/**
 * Re-route existing positions for better yields
 */
export async function suggestRebalancing(
  currentAllocations: Array<{ protocolId: string; amount: number; apy: number }>,
  asset: string,
  network: string = 'testnet',
  config: Partial<RouterConfig> = {}
): Promise<{
  shouldRebalance: boolean;
  currentBlendedApy: number;
  proposedBlendedApy: number;
  improvement: number;
  newStrategy: YieldRoutingStrategy | null;
}> {
  // Calculate current blended APY
  const currentBlendedApy = calculateBlendedAPY(
    currentAllocations.map(a => ({ protocol: a.protocolId, amount: a.amount, apy: a.apy }))
  );

  // Calculate total amount
  const totalAmount = currentAllocations.reduce((sum, a) => sum + a.amount, 0);

  // Get optimal routing
  const newStrategy = await calculateOptimalRouting(asset, totalAmount, network, config);

  // Calculate improvement
  const improvement = newStrategy.expectedBlendedApy - currentBlendedApy;

  // Recommend rebalancing if improvement is significant (> 0.5% APY)
  const shouldRebalance = improvement > 0.5;

  return {
    shouldRebalance,
    currentBlendedApy,
    proposedBlendedApy: newStrategy.expectedBlendedApy,
    improvement,
    newStrategy: shouldRebalance ? newStrategy : null,
  };
}

/**
 * Get yield comparison between single best protocol vs diversified routing
 */
export async function compareStrategies(
  asset: string,
  amount: number,
  network: string = 'testnet'
): Promise<{
  singleBest: { protocol: string; apy: number; amount: number };
  diversified: YieldRoutingStrategy;
  difference: number;
}> {
  const opportunities = await getYieldOpportunities([asset], network);
  
  if (opportunities.length === 0) {
    throw new Error('No yield opportunities available');
  }

  const best = opportunities[0];
  const diversified = await calculateOptimalRouting(asset, amount, network);

  return {
    singleBest: {
      protocol: best.protocolName,
      apy: best.apy,
      amount,
    },
    diversified,
    difference: diversified.expectedBlendedApy - best.apy,
  };
}

/**
 * Calculate gas costs for multi-protocol routing
 */
export function estimateRoutingGasCost(
  numProtocols: number,
  _network: string = 'testnet'
): number {
  // Base transaction cost on Stellar
  const baseFeeStellar = 0.00001; // XLM per operation
  
  // Multi-protocol routing requires:
  // 1. Multiple transfers (one per protocol)
  // 2. Contract invocations (one per protocol)
  const operationsPerProtocol = 2;
  const totalOperations = numProtocols * operationsPerProtocol;
  
  // Total cost in XLM
  const totalCostXLM = baseFeeStellar * totalOperations;
  
  // Convert to USD (simplified - use real price feed in production)
  const xlmPriceUSD = 0.10; // Mock price
  const totalCostUSD = totalCostXLM * xlmPriceUSD;

  return totalCostUSD;
}

/**
 * Validate routing strategy before execution
 */
export function validateRoutingStrategy(
  strategy: YieldRoutingStrategy
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check total allocations sum to total amount
  const allocatedSum = strategy.allocations.reduce((sum, a) => sum + a.amount, 0);
  if (Math.abs(allocatedSum - strategy.totalAmount) > 0.01) {
    errors.push(`Allocation mismatch: ${allocatedSum} !== ${strategy.totalAmount}`);
  }

  // Check percentages sum to 100%
  const percentageSum = strategy.allocations.reduce((sum, a) => sum + a.percentage, 0);
  if (Math.abs(percentageSum - 100) > 0.1) {
    errors.push(`Percentage sum is ${percentageSum}%, should be 100%`);
  }

  // Check no negative amounts
  const hasNegative = strategy.allocations.some(a => a.amount < 0);
  if (hasNegative) {
    errors.push('Found negative allocation amounts');
  }

  // Check APYs are reasonable
  const hasUnreasonableAPY = strategy.allocations.some(
    a => a.expectedApy < 0 || a.expectedApy > 1000
  );
  if (hasUnreasonableAPY) {
    errors.push('Found unreasonable APY values');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
