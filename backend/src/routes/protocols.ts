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

    // Map asset symbol to address (simplified)
    const assetMap: { [key: string]: string } = {
      'XLM': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      'USDC': 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
    };

    const assetAddress = assetMap[asset.toUpperCase()] || asset;
    const yields = await getYieldsForAsset(
      assetAddress,
      asset.toUpperCase(),
      network as string
    );

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
      'USDC': 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
    };

    const assetAddress = assetMap[asset.toUpperCase()] || asset;
    const comparison = await compareYields(
      assetAddress,
      asset.toUpperCase(),
      network as string
    );

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

export default router;
