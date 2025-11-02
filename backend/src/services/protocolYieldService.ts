/**
 * Protocol Yield Service
 * Fetches and compares APYs across multiple Stellar DeFi protocols
 * Supports: Soroswap, Aquarius, Blend, and others
 * PRODUCTION VERSION - Uses real contract data
 */

import type { ProtocolYield, YieldOpportunity, ProtocolComparison } from '../../../shared/types/protocol.js';
import {
  getPoolInfo,
  calculatePoolAPY,
  getPool24hVolume,
  getStakingPoolAPY as queryStakingAPY,
  getContractTVL,
  validateProtocolContract,
} from './protocolDataFetcher.js';

// Protocol registry with contract addresses
interface ProtocolConfig {
  id: string;
  name: string;
  type: 'dex' | 'staking' | 'lending';
  contracts: {
    testnet?: string;
    futurenet?: string;
    mainnet?: string;
  };
}

const PROTOCOLS: ProtocolConfig[] = [
  {
    id: 'soroswap',
    name: 'Soroswap',
    type: 'dex',
    contracts: {
      testnet: 'CDJTMBYKNUGINFQALHDMPLZYNGUV42GPN4B7QOYTWHRC4EE5IYJM6AES', // Factory
    },
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    type: 'dex',
    contracts: {
      testnet: '', // Add when available
    },
  },
  {
    id: 'blend',
    name: 'Blend',
    type: 'lending',
    contracts: {
      testnet: '', // Add when available
    },
  },
  {
    id: 'mock-staking',
    name: 'Mock Staking Pool',
    type: 'staking',
    contracts: {
      testnet: 'CDLZVYS4GWBUKQAJYX5DFXUH4N2NVPW6QQZNSG6GJUMU4LQYPVCQLKFK',
    },
  },
];

/**
 * Get APY for a Soroswap liquidity pool
 * PRODUCTION VERSION - Queries real contract data
 */
async function getSoroswapPoolAPY(
  poolAddress: string,
  assetA: string,
  assetB: string,
  network: string = 'testnet'
): Promise<ProtocolYield | null> {
  try {
    console.log(`[Soroswap APY] Querying pool ${poolAddress} for ${assetA}/${assetB}`);

    // Get pool info from contract
    const poolInfo = await getPoolInfo(poolAddress, network);
    if (!poolInfo) {
      console.warn(`[Soroswap APY] Could not fetch pool info for: ${poolAddress}`);
      return null;
    }

    // Get 24h trading volume
    const volume24h = await getPool24hVolume(poolAddress, network);

    // Calculate APY from reserves and volume
    const apy = calculatePoolAPY(poolInfo.reserves, volume24h, poolInfo.fee);

    // Get TVL from reserves
    const tvl = Number(poolInfo.reserves.reserve0 + poolInfo.reserves.reserve1) / 1e7;

    console.log(`[Soroswap APY] Pool ${poolAddress}: Volume=${volume24h}, TVL=${tvl}, Fee=${poolInfo.fee}, APY=${apy}%`);

    // Determine asset symbol
    const assetSymbol = `${getAssetSymbol(assetA)}-${getAssetSymbol(assetB)} LP`;

    return {
      protocolId: 'soroswap',
      protocolName: 'Soroswap',
      apy,
      tvl,
      assetAddress: assetA,
      assetSymbol,
      timestamp: new Date().toISOString(),
      source: apy > 0 ? 'on-chain' : 'estimated',
      poolAddress,
    };
  } catch (error) {
    console.error('[Soroswap APY] Error fetching:', error);
    return null;
  }
}

/**
 * Get asset symbol from address
 */
function getAssetSymbol(assetAddress: string): string {
  const knownAssets: { [key: string]: string } = {
    'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC': 'XLM',
    'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT': 'XLM',
    'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA': 'XLM',
    'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA': 'USDC',
  };
  return knownAssets[assetAddress] || 'TOKEN';
}

/**
 * Get APY for staking pools (stXLM, etc.)
 * PRODUCTION VERSION - Queries real staking contract
 */
async function getStakingPoolAPY(
  poolAddress: string,
  asset: string,
  network: string = 'testnet'
): Promise<ProtocolYield | null> {
  try {
    console.log(`[Staking APY] Querying staking pool ${poolAddress}`);

    // Get APY from staking contract
    const apy = await queryStakingAPY(poolAddress, network);

    // Get TVL from contract
    const tvl = await getContractTVL(poolAddress, network);

    return {
      protocolId: 'staking-pool',
      protocolName: 'Liquid Staking',
      apy,
      tvl,
      assetAddress: asset,
      assetSymbol: getAssetSymbol(asset),
      timestamp: new Date().toISOString(),
      source: apy > 0 ? 'on-chain' : 'estimated',
      stakingPoolAddress: poolAddress,
    };
  } catch (error) {
    console.error('[Staking APY] Error fetching:', error);
    return null;
  }
}

/**
 * Get APY for lending protocols (Blend, etc.)
 * PRODUCTION VERSION - Would query Blend/lending contracts
 * Note: Blend protocol integration requires their specific SDK
 */
async function getLendingPoolAPY(
  poolAddress: string,
  _asset: string,
  network: string = 'testnet'
): Promise<ProtocolYield | null> {
  try {
    // Validate contract exists
    const isValid = await validateProtocolContract(poolAddress, network);
    if (!isValid) {
      console.warn(`[Lending APY] Invalid lending contract: ${poolAddress}`);
      return null;
    }

    // Get TVL from contract
    await getContractTVL(poolAddress, network);

    // For Blend, we would use their SDK to query supply APY
    // This is a placeholder - integrate Blend SDK when available
    // const blendPool = new BlendPool(poolAddress);
    // const apy = await blendPool.getSupplyAPY();
    
    // Fallback: Return null if we can't get real data
    // Better to return nothing than fake data
    console.warn(`[Lending APY] Blend integration pending for: ${poolAddress}`);
    return null;

  } catch (error) {
    console.error('[Lending APY] Error fetching:', error);
    return null;
  }
}

/**
 * Fetch all available yields for a specific asset
 */
export async function getYieldsForAsset(
  assetAddress: string,
  assetSymbol: string,
  network: string = 'testnet'
): Promise<ProtocolYield[]> {
  const yields: ProtocolYield[] = [];

  // Fetch from all protocols in parallel
  const promises: Promise<ProtocolYield | null>[] = [];

  // Soroswap liquidity pools
  if (assetSymbol === 'XLM' || assetSymbol === 'USDC') {
    const soroswapFactory = PROTOCOLS.find(p => p.id === 'soroswap')?.contracts[network as 'testnet'];
    if (soroswapFactory) {
      // Discover actual pools from factory
      console.log(`[getYieldsForAsset] Finding Soroswap pools for ${assetSymbol}...`);
      
      // For Soroswap, we need a trading pair. Try common pairs:
      // XLM/USDC, USDC/XLM
      const tokenAddresses: Record<string, string> = {
        'XLM': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
        'USDC': 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
      };
      
      if (assetSymbol === 'XLM') {
        // Try XLM/USDC pool
        const usdcAddress = tokenAddresses['USDC'];
        if (usdcAddress) {
          promises.push(
            (async () => {
              const {findSoroswapPools} = await import('./protocolDataFetcher.js');
              const pools = await findSoroswapPools(assetAddress, usdcAddress, network);
              if (pools.length > 0) {
                return getSoroswapPoolAPY(pools[0], assetAddress, usdcAddress, network);
              }
              return null;
            })()
          );
        }
      } else if (assetSymbol === 'USDC') {
        // Try USDC/XLM pool
        const xlmAddress = tokenAddresses['XLM'];
        if (xlmAddress) {
          promises.push(
            (async () => {
              const {findSoroswapPools} = await import('./protocolDataFetcher.js');
              const pools = await findSoroswapPools(assetAddress, xlmAddress, network);
              if (pools.length > 0) {
                return getSoroswapPoolAPY(pools[0], assetAddress, xlmAddress, network);
              }
              return null;
            })()
          );
        }
      }
    }
  }

  // Staking pools (XLM only)
  if (assetSymbol === 'XLM') {
    const stakingPool = PROTOCOLS.find(p => p.id === 'mock-staking')?.contracts[network as 'testnet'];
    if (stakingPool) {
      promises.push(getStakingPoolAPY(stakingPool, assetAddress, network));
    }
  }

  // Lending pools (USDC, XLM)
  if (assetSymbol === 'USDC' || assetSymbol === 'XLM') {
    const blendPool = PROTOCOLS.find(p => p.id === 'blend')?.contracts[network as 'testnet'];
    if (blendPool) {
      promises.push(getLendingPoolAPY(blendPool, assetAddress, network));
    }
  }

  const results = await Promise.all(promises);
  
  // Filter out null results and add to yields
  results.forEach(result => {
    if (result) yields.push(result);
  });

  return yields;
}

/**
 * Compare yields across all protocols for an asset
 */
export async function compareYields(
  assetAddress: string,
  assetSymbol: string,
  network: string = 'testnet'
): Promise<ProtocolComparison> {
  const protocols = await getYieldsForAsset(assetAddress, assetSymbol, network);

  // Find best yield
  const bestYield = protocols.reduce((best, current) => 
    current.apy > best.apy ? current : best
  , protocols[0] || { apy: 0 } as ProtocolYield);

  // Calculate average
  const averageApy = protocols.length > 0
    ? protocols.reduce((sum, p) => sum + p.apy, 0) / protocols.length
    : 0;

  return {
    asset: assetSymbol,
    protocols,
    bestYield,
    averageApy,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get all yield opportunities for vault strategy
 */
export async function getYieldOpportunities(
  assets: string[],
  network: string = 'testnet'
): Promise<YieldOpportunity[]> {
  const opportunities: YieldOpportunity[] = [];

  // Map asset addresses to symbols (simplified - use proper mapping in production)
  const assetMap: { [key: string]: string } = {
    'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC': 'XLM',
    'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA': 'USDC',
  };

  for (const assetAddress of assets) {
    const assetSymbol = assetMap[assetAddress] || 'UNKNOWN';
    const yields = await getYieldsForAsset(assetAddress, assetSymbol, network);

    yields.forEach(y => {
      opportunities.push({
        protocolId: y.protocolId,
        protocolName: y.protocolName,
        type: y.stakingPoolAddress ? 'staking' : y.poolAddress ? 'liquidity' : 'lending',
        apy: y.apy,
        tvl: y.tvl,
        asset: y.assetSymbol,
        minDeposit: 1, // 1 XLM or USDC minimum
        maxDeposit: y.tvl * 0.1, // Max 10% of protocol TVL
        lockPeriod: y.stakingPoolAddress ? 86400 : 0, // 1 day for staking, 0 for others
        risk: y.apy > 15 ? 'high' : y.apy > 8 ? 'medium' : 'low',
        contractAddress: y.poolAddress || y.stakingPoolAddress || assetAddress,
      });
    });
  }

  // Sort by APY descending
  return opportunities.sort((a, b) => b.apy - a.apy);
}

/**
 * Get historical yield trends for a protocol
 */
export async function getHistoricalYields(
  _protocolId: string,
  _assetAddress: string,
  days: number = 30,
  _network: string = 'testnet'
): Promise<{ timestamp: string; apy: number }[]> {
  // In production, query historical data from database or protocol API
  // For now, return mock historical data
  
  const history: { timestamp: string; apy: number }[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  let baseAPY = 8.5;
  
  for (let i = days; i >= 0; i--) {
    const timestamp = new Date(now - (i * dayMs)).toISOString();
    const variance = (Math.random() - 0.5) * 2; // +/- 1%
    const apy = Math.max(5, Math.min(15, baseAPY + variance));
    
    history.push({ timestamp, apy });
  }

  return history;
}

/**
 * Calculate blended APY for multiple protocol allocations
 */
export function calculateBlendedAPY(
  allocations: Array<{ protocol: string; amount: number; apy: number }>
): number {
  const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);
  
  if (totalAmount === 0) return 0;

  const weightedSum = allocations.reduce(
    (sum, a) => sum + (a.amount / totalAmount) * a.apy,
    0
  );

  return weightedSum;
}
