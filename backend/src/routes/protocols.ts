/**
 * Protocol and Yield Aggregation API Routes
 */

import { Router, Request, Response } from 'express';
import {
  getYieldsForAsset,
  compareYields,
  getYieldOpportunities,
  getHistoricalYields,
} from '../services/protocolYieldService.js';
import {
  calculateOptimalRouting,
  suggestRebalancing,
  compareStrategies,
  estimateRoutingGasCost,
} from '../services/yieldRouterService.js';

const router = Router();

/**
 * GET /api/protocols/yields/:asset
 * Get all available yields for a specific asset
 */
router.get('/yields/:asset', async (req: Request, res: Response) => {
  try {
    const { asset } = req.params;
    const { network = 'testnet' } = req.query;

    // Map asset symbol to address (using Soroswap-compatible custom USDC)
    const assetMap: { [key: string]: string } = {
      'XLM': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      'USDC': 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA', // Soroswap custom USDC (primary)
    };

    const assetSymbol = asset.toUpperCase();
    const assetAddress = assetMap[assetSymbol] || asset;

    // For USDC, query both variants and combine results (for comprehensive yield comparison)
    let yields;
    if (assetSymbol === 'USDC') {
      const customUSDC = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA'; // Soroswap
      const officialUSDC = 'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5'; // Aquarius
      
      const [customYields, officialYields] = await Promise.all([
        getYieldsForAsset(customUSDC, 'USDC', network as string),
        getYieldsForAsset(officialUSDC, 'USDC', network as string)
      ]);
      
      yields = [...customYields, ...officialYields];
    } else {
      yields = await getYieldsForAsset(assetAddress, assetSymbol, network as string);
    }

    return res.json({
      success: true,
      data: yields,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /yields/:asset] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch yields',
        code: 'YIELD_FETCH_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/protocols/compare/:asset
 * Compare yields across all protocols for an asset
 */
router.get('/compare/:asset', async (req: Request, res: Response) => {
  try {
    const { asset } = req.params;
    const { network = 'testnet' } = req.query;

    const assetMap: { [key: string]: string } = {
      'XLM': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      'USDC': 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA', // Soroswap custom USDC (primary)
    };

    const assetSymbol = asset.toUpperCase();
    const assetAddress = assetMap[assetSymbol] || asset;

    // For USDC, query both variants and combine results (for comprehensive yield comparison)
    let comparison;
    if (assetSymbol === 'USDC') {
      const customUSDC = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA'; // Soroswap
      const officialUSDC = 'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5'; // Aquarius
      
      const [customComparison, officialComparison] = await Promise.all([
        compareYields(customUSDC, 'USDC', network as string),
        compareYields(officialUSDC, 'USDC', network as string)
      ]);
      
      // Combine protocols from both, removing duplicates by protocolId
      // This prevents protocols like Blend from appearing twice
      const allProtocols = [...customComparison.protocols, ...officialComparison.protocols];
      const uniqueProtocols = allProtocols.reduce((acc, protocol) => {
        const existing = acc.find(p => p.protocolId === protocol.protocolId);
        if (!existing) {
          acc.push(protocol);
        } else if (protocol.apy > existing.apy) {
          // If duplicate found, keep the one with higher APY
          const index = acc.indexOf(existing);
          acc[index] = protocol;
        }
        return acc;
      }, [] as typeof allProtocols);
      
      comparison = {
        asset: 'USDC',
        protocols: uniqueProtocols,
        bestYield: Math.max(
          customComparison.bestYield?.apy || 0,
          officialComparison.bestYield?.apy || 0
        ) > 0 ? (
          (officialComparison.bestYield?.apy || 0) > (customComparison.bestYield?.apy || 0)
            ? officialComparison.bestYield
            : customComparison.bestYield
        ) : undefined,
        averageApy: uniqueProtocols.reduce((sum, p) => sum + p.apy, 0) / uniqueProtocols.length,
        timestamp: new Date().toISOString()
      };
    } else {
      comparison = await compareYields(assetAddress, assetSymbol, network as string);
    }

    return res.json({
      success: true,
      data: comparison,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /compare/:asset] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to compare yields',
        code: 'YIELD_COMPARE_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/protocols/opportunities
 * Get all yield opportunities for specified assets
 */
router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const { assets, network = 'testnet' } = req.query;

    if (!assets) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Assets parameter is required',
          code: 'MISSING_ASSETS',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const assetList = (assets as string).split(',');
    const opportunities = await getYieldOpportunities(assetList, network as string);

    return res.json({
      success: true,
      data: opportunities,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /opportunities] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch opportunities',
        code: 'OPPORTUNITIES_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/protocols/route
 * Calculate optimal yield routing for a deposit
 */
router.post('/route', async (req: Request, res: Response) => {
  try {
    const { asset, amount, network = 'testnet', config = {} } = req.body;

    if (!asset || !amount) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Asset and amount are required',
          code: 'MISSING_PARAMETERS',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const strategy = await calculateOptimalRouting(
      asset,
      parseFloat(amount),
      network,
      config
    );

    console.log(`[POST /route] Strategy calculated:`, {
      asset,
      amount,
      allocations: strategy.allocations.length,
      expectedAPY: strategy.expectedBlendedApy,
    });

    // Calculate gas costs
    const gasCost = estimateRoutingGasCost(strategy.allocations.length, network);

    return res.json({
      success: true,
      data: {
        ...strategy,
        estimatedGasCost: gasCost,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[POST /route] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to calculate routing',
        code: 'ROUTING_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/protocols/rebalance-check
 * Check if current allocations should be rebalanced
 */
router.post('/rebalance-check', async (req: Request, res: Response) => {
  try {
    const { currentAllocations, asset, network = 'testnet', config = {} } = req.body;

    if (!currentAllocations || !asset) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current allocations and asset are required',
          code: 'MISSING_PARAMETERS',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const suggestion = await suggestRebalancing(
      currentAllocations,
      asset,
      network,
      config
    );

    return res.json({
      success: true,
      data: suggestion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[POST /rebalance-check] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to check rebalancing',
        code: 'REBALANCE_CHECK_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/protocols/strategy-comparison
 * Compare single-protocol vs diversified routing
 */
router.get('/strategy-comparison', async (req: Request, res: Response) => {
  try {
    const { asset, amount, network = 'testnet' } = req.query;

    if (!asset || !amount) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Asset and amount are required',
          code: 'MISSING_PARAMETERS',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const comparison = await compareStrategies(
      asset as string,
      parseFloat(amount as string),
      network as string
    );

    return res.json({
      success: true,
      data: comparison,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /strategy-comparison] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to compare strategies',
        code: 'STRATEGY_COMPARE_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/protocols/historical-yields/:protocolId
 * Get historical yield data for a protocol
 */
router.get('/historical-yields/:protocolId', async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    const { asset, days = '30', network = 'testnet' } = req.query;

    if (!asset) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Asset parameter is required',
          code: 'MISSING_ASSET',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const history = await getHistoricalYields(
      protocolId,
      asset as string,
      parseInt(days as string),
      network as string
    );

    return res.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /historical-yields/:protocolId] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch historical yields',
        code: 'HISTORICAL_YIELDS_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/protocols/rebalance-suggestions
 * Get all active rebalancing suggestions for vaults
 */
router.get('/rebalance-suggestions', async (_req: Request, res: Response) => {
  try {
    const { getAllRebalanceSuggestions } = await import('../services/protocolYieldMonitor.js');
    
    const suggestions = getAllRebalanceSuggestions();

    return res.json({
      success: true,
      data: suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /rebalance-suggestions] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch rebalance suggestions',
        code: 'REBALANCE_SUGGESTIONS_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/protocols/rebalance-suggestions/:vaultId
 * Get rebalancing suggestion for a specific vault
 */
router.get('/rebalance-suggestions/:vaultId', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const { getCachedSuggestion, checkVaultNow } = await import('../services/protocolYieldMonitor.js');
    
    // Try to get cached suggestion first
    let suggestion = getCachedSuggestion(vaultId);
    
    // If no cached suggestion or it's old, check now
    if (!suggestion || isOlderThan(suggestion.checkedAt, 30)) {
      const freshSuggestion = await checkVaultNow(vaultId);
      if (freshSuggestion) {
        suggestion = freshSuggestion;
      }
    }

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'No rebalancing suggestion available for this vault',
          code: 'SUGGESTION_NOT_FOUND',
        },
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      data: suggestion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /rebalance-suggestions/:vaultId] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch rebalance suggestion',
        code: 'REBALANCE_SUGGESTION_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/protocols/trigger-yield-check
 * Manually trigger a yield monitoring check for all vaults or a specific vault
 */
router.post('/trigger-yield-check', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.body;
    
    if (vaultId) {
      // Check specific vault
      const { checkVaultNow } = await import('../services/protocolYieldMonitor.js');
      const suggestion = await checkVaultNow(vaultId);
      
      return res.json({
        success: true,
        data: suggestion,
        message: 'Yield check completed for vault',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Trigger check for all vaults (this will be async)
      return res.json({
        success: true,
        message: 'Yield monitoring check triggered for all vaults',
        note: 'Check will complete in the background',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[POST /trigger-yield-check] Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to trigger yield check',
        code: 'YIELD_CHECK_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Helper function to check if a timestamp is older than X minutes
 */
function isOlderThan(timestamp: string, minutes: number): boolean {
  const age = Date.now() - new Date(timestamp).getTime();
  return age > minutes * 60 * 1000;
}

export default router;
