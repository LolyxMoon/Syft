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
      testnet: 'CCSXYUVLYALKJGIIYMGYLZI447VS6TDWFTVDL43B4IKK2WERHLWUVCRC', // Router contract
      mainnet: '', // Would be populated with mainnet address
    },
  },
  {
    id: 'blend',
    name: 'Blend Protocol',
    type: 'lending',
    contracts: {
      testnet: 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65', // TestnetV2 pool (found at testnet.blend.capital)
      mainnet: 'CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU', // Mainnet pool factory
    },
  },
  {
    id: 'liquid-staking',
    name: 'Liquid Staking',
    type: 'staking',
    contracts: {
      testnet: 'LIQUID_STAKING_DEMO', // Demo address for hackathon
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
    'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5': 'USDC', // Official Stellar testnet USDC (Aquarius)
    'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA': 'USDC', // Custom USDC (Soroswap)
  };
  return knownAssets[assetAddress] || 'TOKEN';
}

/**
 * Get APY for staking pools (stXLM, etc.)
 * Returns estimated APY for liquid staking
 * 
 * NOTE: Using estimated data for hackathon demo
 * In production, would query real staking pool contracts
 */
async function getStakingPoolAPY(
  poolAddress: string,
  asset: string,
  network: string = 'testnet'
): Promise<ProtocolYield | null> {
  try {
    console.log(`[Staking APY] Providing estimated data for ${getAssetSymbol(asset)} on ${network}`);

    // Liquid staking typically offers 4-7% APY for XLM
    // Based on Stellar inflation + staking rewards
    const estimatedAPY = 6.2;
    const estimatedTVL = 95000;

    console.log(`[Staking APY] Estimated data: APY=${estimatedAPY}%, TVL=$${estimatedTVL}`);

    return {
      protocolId: 'staking-pool',
      protocolName: 'Liquid Staking',
      apy: estimatedAPY,
      tvl: estimatedTVL,
      assetAddress: asset,
      assetSymbol: getAssetSymbol(asset),
      timestamp: new Date().toISOString(),
      source: 'estimated',
      stakingPoolAddress: poolAddress,
    };
  } catch (error) {
    console.error('[Staking APY] Error:', error);
    return null;
  }
}

/**
 * Get APY for Aquarius liquidity pool
 * Aquarius is a Stellar-native AMM with constant product pools
 * Uses real on-chain data from contract queries
 */
async function getAquariusPoolAPY(
  routerAddress: string,
  assetA: string,
  assetB: string,
  network: string = 'testnet'
): Promise<ProtocolYield | null> {
  try {
    console.log(`[Aquarius APY] Querying router ${routerAddress} on ${network} for ${assetA}/${assetB}`);

    // Import the data fetcher functions
    const { findAquariusPools, getAquariusPoolAPY: getPoolAPY, getPoolInfo } = await import('./protocolDataFetcher.js');
    
    // Find Aquarius pools for this token pair
    const pools = await findAquariusPools(assetA, assetB, network);
    
    if (pools.length === 0) {
      console.log(`[Aquarius APY] No pools found for ${assetA}/${assetB}`);
      return null;
    }

    const poolAddress = pools[0];
    
    // Get real APY from on-chain data
    const apy = await getPoolAPY(poolAddress, network);
    
    // Get pool info for TVL
    const poolInfo = await getPoolInfo(poolAddress, network);
    const tvl = poolInfo ? Number(poolInfo.reserves.reserve0 + poolInfo.reserves.reserve1) / 1e7 : 85000;

    const assetSymbol = `${getAssetSymbol(assetA)}-${getAssetSymbol(assetB)} LP`;

    console.log(`[Aquarius APY] Pool ${poolAddress}: APY=${apy}%, TVL=$${tvl}`);

    return {
      protocolId: 'aquarius',
      protocolName: 'Aquarius',
      apy,
      tvl,
      assetAddress: assetA,
      assetSymbol,
      timestamp: new Date().toISOString(),
      source: apy > 0 ? 'on-chain' : 'estimated',
      poolAddress,
    };
  } catch (error) {
    console.error('[Aquarius APY] Error fetching:', error);
    return null;
  }
}

/**
 * Get APY for Blend lending protocol
 * Blend is an overcollateralized lending protocol on Stellar
 * Returns supply APY for lenders using real on-chain data
 * PRODUCTION VERSION - Uses actual deployed testnet pool
 */
async function getBlendLendingAPY(
  poolAddress: string,
  asset: string,
  assetSymbol: string, // Pass the original asset symbol
  network: string = 'testnet'
): Promise<ProtocolYield | null> {
  try {
    console.log(`[Blend APY] Querying pool ${poolAddress} for ${assetSymbol} on ${network}`);

    // Import the data fetcher functions
    const { getBlendPoolSupplyAPY } = await import('./protocolDataFetcher.js');
    
    // Query the pool directly - poolAddress is now the actual pool contract, not factory
    // Pool address from: https://testnet.blend.capital/dashboard/?poolId=CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65

    // Get real supply APY from the lending pool
    const { apy, tvl } = await getBlendPoolSupplyAPY(poolAddress, asset, network);
    
    console.log(`[Blend APY] Real data: APY=${apy}%, TVL=$${tvl}`);

    return {
      protocolId: 'blend',
      protocolName: 'Blend Protocol',
      apy: apy || 5.8, // Fallback to estimate if query fails
      tvl: tvl || 120000,
      assetAddress: asset,
      assetSymbol: assetSymbol, // Use the passed symbol instead of deriving from address
      timestamp: new Date().toISOString(),
      source: apy > 0 ? 'on-chain' : 'estimated',
      poolAddress,
    };
  } catch (error) {
    console.error('[Blend APY] Error:', error);
    // Return null on error - no fallback estimate
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

  // Token address mapping for pair discovery
  const tokenAddresses: Record<string, string> = {
    'XLM': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    'USDC_OFFICIAL': 'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5', // Official Stellar testnet USDC (Aquarius)
    'USDC_CUSTOM': 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA', // Custom USDC (Soroswap)
  };
  // Soroswap liquidity pools
  if (assetSymbol === 'XLM' || assetSymbol === 'USDC') {
    const soroswapFactory = PROTOCOLS.find(p => p.id === 'soroswap')?.contracts[network as 'testnet'];
    if (soroswapFactory) {
      // Discover actual pools from factory
      console.log(`[getYieldsForAsset] Finding Soroswap pools for ${assetSymbol}...`);
      
      if (assetSymbol === 'XLM') {
        // Try XLM with BOTH USDC tokens
        const usdcAddresses = [tokenAddresses['USDC_OFFICIAL'], tokenAddresses['USDC_CUSTOM']];
        for (const usdcAddress of usdcAddresses) {
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
        }
      } else if (assetSymbol === 'USDC') {
        // Try USDC/XLM pool with the specific USDC address passed in
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
  }  // Aquarius liquidity pools - NOW WORKING with API discovery!
  if (assetSymbol === 'XLM' || assetSymbol === 'USDC') {
    const aquariusRouter = PROTOCOLS.find(p => p.id === 'aquarius')?.contracts[network as 'testnet'];
    if (aquariusRouter && typeof aquariusRouter === 'string') {
      console.log(`[getYieldsForAsset] Checking Aquarius pools for ${assetSymbol}...`);
      
      if (assetSymbol === 'XLM') {
        // Try XLM with BOTH USDC tokens for Aquarius
        const usdcAddresses = [tokenAddresses['USDC_OFFICIAL'], tokenAddresses['USDC_CUSTOM']];
        for (const usdcAddress of usdcAddresses) {
          if (usdcAddress) {
            promises.push(getAquariusPoolAPY(aquariusRouter, assetAddress, usdcAddress, network));
          }
        }
      } else if (assetSymbol === 'USDC') {
        // Try USDC/XLM pool with the specific USDC address passed in
        const xlmAddress = tokenAddresses['XLM'];
        if (xlmAddress) {
          promises.push(getAquariusPoolAPY(aquariusRouter, assetAddress, xlmAddress, network));
        }
      }
    }
  }

  // Blend lending protocol - ENABLED with testnet pool
  // Pool discovered from: https://testnet.blend.capital/dashboard/?poolId=CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65
  // NOTE: Blend uses different token addresses than other protocols!
  // Blend testnet token addresses from: https://github.com/blend-capital/blend-utils/blob/main/testnet.contracts.json
  const blendTokenAddresses: Record<string, string> = {
    'USDC': 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU', // Blend testnet USDC
    'XLM': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',   // Blend testnet XLM
  };
  
  const blendPool = PROTOCOLS.find(p => p.id === 'blend')?.contracts[network as 'testnet'];
  const blendAssetAddress = blendTokenAddresses[assetSymbol];
  
  if (blendPool && blendAssetAddress) {
    console.log(`[getYieldsForAsset] Checking Blend lending for ${assetSymbol} (using Blend token: ${blendAssetAddress})...`);
    promises.push(getBlendLendingAPY(blendPool, blendAssetAddress, assetSymbol, network));
  }

  // Staking pools (XLM only)
  if (assetSymbol === 'XLM') {
    const stakingPool = PROTOCOLS.find(p => p.id === 'liquid-staking')?.contracts[network as 'testnet'];
    if (stakingPool) {
      console.log(`[getYieldsForAsset] Checking liquid staking for ${assetSymbol}...`);
      promises.push(getStakingPoolAPY(stakingPool, assetAddress, network));
    }
  }

  const results = await Promise.all(promises);
  
  // Filter out null results and add to yields
  results.forEach(result => {
    if (result) yields.push(result);
  });

  console.log(`[getYieldsForAsset] Found ${yields.length} opportunities for ${assetSymbol}:`, 
    yields.map(y => `${y.protocolName}: ${y.apy}%`));

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
    'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5': 'USDC', // Official Stellar testnet USDC (Aquarius)
    'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA': 'USDC', // Custom USDC (Soroswap)
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
        // Adjusted risk assessment: Lending protocols naturally have higher APY
        // Low: < 10%, Medium: 10-25%, High: > 25%
        risk: y.apy > 25 ? 'high' : y.apy > 10 ? 'medium' : 'low',
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
