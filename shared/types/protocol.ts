/**
 * Protocol yield and aggregation types
 */

export interface ProtocolYield {
  protocolId: string;
  protocolName: string;
  apy: number;
  tvl: number;
  assetAddress: string;
  assetSymbol: string;
  timestamp: string;
  source: 'on-chain' | 'api' | 'estimated';
  poolAddress?: string;
  stakingPoolAddress?: string;
}

export interface YieldOpportunity {
  protocolId: string;
  protocolName: string;
  type: 'liquidity' | 'staking' | 'lending';
  apy: number;
  tvl: number;
  asset: string;
  minDeposit: number;
  maxDeposit: number;
  lockPeriod?: number; // in seconds
  risk: 'low' | 'medium' | 'high';
  contractAddress: string;
}

export interface YieldAllocation {
  protocolId: string;
  protocolName: string;
  amount: number;
  percentage: number;
  expectedApy: number;
}

export interface YieldRoutingStrategy {
  totalAmount: number;
  asset: string;
  allocations: YieldAllocation[];
  expectedBlendedApy: number;
  rationale: string;
}

export interface ProtocolComparison {
  asset: string;
  protocols: ProtocolYield[];
  bestYield: ProtocolYield;
  averageApy: number;
  timestamp: string;
}
