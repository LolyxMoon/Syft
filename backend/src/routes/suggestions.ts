/**
 * Suggestions API Routes (T115)
 * Endpoints for AI-powered vault strategy suggestions
 */

import { Router, Request, Response } from 'express';
import { suggestionGenerator, SuggestionRequest } from '../services/suggestionGenerator.js';
import { suggestionCacheService } from '../services/suggestionCacheService.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * Map suggestion types from generator to database enum
 */
function mapSuggestionTypeToDb(type: string): string {
  const typeMap: Record<string, string> = {
    'rebalance': 'allocation',
    'add_asset': 'diversification',
    'remove_asset': 'allocation',
    'adjust_rule': 'rebalance_rule',
    'risk_adjustment': 'risk_management',
    'allocation': 'allocation',
    'rebalance_rule': 'rebalance_rule',
    'risk_management': 'risk_management',
    'market_timing': 'market_timing',
    'diversification': 'diversification',
  };
  
  return typeMap[type] || 'allocation'; // Default to 'allocation' if unknown
}

/**
 * Helper function to generate and cache suggestions
 */
async function generateAndCacheSuggestions(vaultId: string, userPreferences?: any) {
  // Fetch vault configuration from database
  const { data: vault, error: vaultError } = await supabase
    .from('vaults')
    .select('*')
    .eq('vault_id', vaultId)
    .single();

  if (vaultError || !vault) {
    throw new Error('Vault not found');
  }

  // First get the vault UUID from vault_id
  const { data: vaultData, error: vaultUuidError } = await supabase
    .from('vaults')
    .select('id')
    .eq('vault_id', vaultId)
    .single();

  if (vaultUuidError || !vaultData) {
    throw new Error('Vault UUID not found');
  }

  // Fetch performance data (optional)
  const { data: performance } = await supabase
    .from('vault_performance')
    .select('*')
    .eq('vault_id', vaultData.id)
    .order('timestamp', { ascending: false })
    .limit(100);

  // DEBUG: Log the vault config structure
  console.log(`[Suggestions API] Raw vault config:`, JSON.stringify(vault.config, null, 2));
  console.log(`[Suggestions API] Config keys:`, Object.keys(vault.config || {}));
  console.log(`[Suggestions API] Current state exists:`, !!vault.config?.current_state);
  if (vault.config?.current_state) {
    console.log(`[Suggestions API] Current state keys:`, Object.keys(vault.config.current_state));
    console.log(`[Suggestions API] Asset balances:`, vault.config.current_state.assetBalances);
  }

  // Helper to convert contract address to asset code
  const getAssetCodeFromAddress = (address: string, _network: string): string => {
    // Token address to code mapping (testnet)
    const tokenRegistry: { [address: string]: string } = {
      // Native XLM
      'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC': 'XLM',
      'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT': 'XLM',
      'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA': 'XLM',
      
      // USDC (testnet)
      'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA': 'USDC',
      
      // 10 Custom Tokens (from CUSTOM_TOKENS.env)
      'CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3': 'AQX',
      'CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME': 'VLTK',
      'CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5': 'SLX',
      'CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE': 'WRX',
      'CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O': 'SIXN',
      'CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP': 'MBIUS',
      'CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL': 'TRIO',
      'CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H': 'RELIO',
      'CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW': 'TRI',
      'CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR': 'NUMER',
    };
    
    // Return the token code if found in registry, otherwise return the address
    return tokenRegistry[address] || address;
  };

  // Enrich config with real allocation data from blockchain state
  const enrichedConfig = { ...vault.config };
  
  // If we have current_state with assetBalances, calculate real allocations
  if (enrichedConfig.current_state?.assetBalances && Array.isArray(enrichedConfig.current_state.assetBalances)) {
    const assetBalances = enrichedConfig.current_state.assetBalances;
    const totalValue = parseFloat(enrichedConfig.current_state.totalValue || '0');
    
    if (totalValue > 0 && assetBalances.length > 0) {
      const network = vault.network || 'testnet';
      
      // Build assets array with real allocations
      enrichedConfig.assets = assetBalances.map((balance: any) => {
        const assetValue = parseFloat(balance.value || '0');
        const percentage = (assetValue / totalValue) * 100;
        const assetCode = getAssetCodeFromAddress(balance.asset, network);
        
        return {
          assetCode,
          assetId: balance.asset, // Keep contract address as ID
          percentage: percentage,
        };
      });
      
      console.log(`[Suggestions API] Using real allocations from blockchain:`, 
        enrichedConfig.assets.map((a: any) => `${a.assetCode}: ${a.percentage.toFixed(2)}%`).join(', ')
      );
    }
  }
  
  // If still no proper allocations, use the original assets array
  if (!enrichedConfig.assets || enrichedConfig.assets.length === 0 || typeof enrichedConfig.assets[0] === 'string') {
    console.warn(`[Suggestions API] No real allocation data found, using config assets as-is`);
  }

  // Generate suggestions
  const request: SuggestionRequest = {
    vaultId,
    config: enrichedConfig,
    performanceData: performance || [],
    userPreferences,
  };

  console.log(`[Suggestions API] Generating suggestions for vault ${vaultId}`);
  const suggestions = await suggestionGenerator.generateSuggestions(request);
  console.log(`[Suggestions API] Generated ${suggestions.length} suggestions`);

  // Warn if no suggestions were generated
  if (suggestions.length === 0) {
    console.warn(`[Suggestions API] No suggestions generated for vault ${vaultId}. Check logs for AI errors.`);
  }

  // Cache the results
  suggestionCacheService.set(vaultId, suggestions);

  // Store suggestions in database (only if we have suggestions)
  if (suggestions.length > 0) {
    // First, delete old suggestions for this vault (keep history clean)
    await supabase
      .from('ai_suggestions')
      .delete()
      .eq('vault_id', vaultData.id)
      .eq('status', 'pending'); // Only delete pending suggestions, keep applied/dismissed ones
    
    const suggestionRecords = suggestions.map(s => ({
      suggestion_id: s.id,
      vault_id: vaultData.id, // Use UUID instead of text vault_id
      suggestion_type: mapSuggestionTypeToDb(s.type), // Map to DB enum
      title: s.title,
      description: s.description,
      reasoning: s.rationale,
      confidence_score: s.expectedImpact?.returnIncrease ? Math.min(s.expectedImpact.returnIncrease / 100, 1) : null,
      projected_apy_improvement: s.expectedImpact?.returnIncrease || null,
      projected_risk_change: s.expectedImpact?.riskReduction ? -s.expectedImpact.riskReduction : null,
      suggestion_data: s,
      sentiment_data: s.dataSupport?.sentiment || null,
      market_data: s.dataSupport?.forecast || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    }));

    console.log(`[Suggestions API] Preparing to insert ${suggestionRecords.length} suggestions into database`);
    console.log(`[Suggestions API] Sample record:`, JSON.stringify(suggestionRecords[0], null, 2));
    
    const { error: insertError } = await supabase.from('ai_suggestions').insert(suggestionRecords);
    if (insertError) {
      console.error('[Suggestions API] Error storing suggestions in database:', insertError);
      console.error('[Suggestions API] Failed records:', JSON.stringify(suggestionRecords, null, 2));
    } else {
      console.log(`[Suggestions API] Successfully stored ${suggestionRecords.length} suggestions in database`);
    }
  }

  return suggestions;
}

/**
 * POST /api/vaults/:vaultId/suggestions
 * Generate AI suggestions for a vault
 */
router.post('/:vaultId/suggestions', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const { userPreferences, forceRefresh } = req.body;

    // Check cache first (unless force refresh requested)
    const cached = suggestionCacheService.get(vaultId);
    if (!forceRefresh && cached) {
      return res.json({
        success: true,
        cached: true,
        suggestions: cached,
      });
    }

    // Use job queue for async processing (like AI Chat and Voice)
    console.log('[Suggestions API] Using async job processing to avoid timeout');
    
    // Import job queue
    const { jobQueue } = await import('../services/jobQueue.js');
    
    // Create job ID
    const jobId = `suggestions-${vaultId}-${Date.now()}`;
    jobQueue.createJob(jobId);
    
    // Start processing in background (don't await)
    (async () => {
      try {
        jobQueue.markProcessing(jobId);
        console.log(`[Suggestions API] Background job started: ${jobId}`);
        
        const suggestions = await generateAndCacheSuggestions(vaultId, userPreferences);
        
        jobQueue.completeJob(jobId, {
          suggestions,
          count: suggestions.length,
          generatedAt: new Date().toISOString(),
        });
        console.log(`[Suggestions API] Background job completed: ${jobId}`);
      } catch (error: any) {
        jobQueue.failJob(jobId, error.message || 'Unknown error');
        console.error(`[Suggestions API] Background job failed: ${jobId}`, error);
      }
    })();
    
    // Return immediately with jobId and cached data
    return res.json({
      success: true,
      jobId,
      status: 'processing',
      cached: !!cached,
      suggestions: cached || [],
      message: 'Suggestion generation started. Poll /api/vaults/:vaultId/suggestions/status/:jobId for results.',
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate suggestions',
    });
  }
});

/**
 * GET /api/vaults/:vaultId/suggestions
 * Get cached/stored suggestions for a vault
 */
router.get('/:vaultId/suggestions', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const maxAgeHours = parseInt(req.query.maxAgeHours as string) || 24; // Default: 24 hours

    // Try cache first
    const cached = suggestionCacheService.get(vaultId);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        source: 'memory_cache',
        suggestions: cached,
      });
    }

    // Get the vault UUID from vault_id
    const { data: vaultData, error: vaultError } = await supabase
      .from('vaults')
      .select('id')
      .eq('vault_id', vaultId)
      .single();

    if (vaultError || !vaultData) {
      return res.status(404).json({
        success: false,
        error: 'Vault not found',
      });
    }

    // Fetch from database only suggestions created within maxAgeHours
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
    const { data: suggestions, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('vault_id', vaultData.id)
      .gte('created_at', cutoffTime)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    const suggestionData = suggestions?.map(s => s.suggestion_data) || [];

    // If we have recent suggestions, populate cache for next time
    if (suggestionData.length > 0) {
      suggestionCacheService.set(vaultId, suggestionData);
    }

    return res.json({
      success: true,
      cached: false,
      source: suggestionData.length > 0 ? 'database' : 'none',
      suggestions: suggestionData,
      age: suggestions?.[0]?.created_at ? 
        Math.floor((Date.now() - new Date(suggestions[0].created_at).getTime()) / 1000 / 60) : 
        null, // age in minutes
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch suggestions',
    });
  }
});

/**
 * DELETE /api/vaults/:vaultId/suggestions
 * Clear cached suggestions for a vault
 */
router.delete('/:vaultId/suggestions', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;

    // Clear cache
    suggestionCacheService.invalidate(vaultId);

    res.json({
      success: true,
      message: 'Suggestions cache cleared',
    });
  } catch (error) {
    console.error('Error clearing suggestions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear suggestions',
    });
  }
});

/**
 * GET /api/vaults/:vaultId/suggestions/exists
 * Check if suggestions exist for a vault (lightweight check)
 */
router.get('/:vaultId/suggestions/exists', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const maxAgeHours = parseInt(req.query.maxAgeHours as string) || 24;

    // Check cache first
    const cached = suggestionCacheService.get(vaultId);
    if (cached && cached.length > 0) {
      return res.json({
        success: true,
        exists: true,
        source: 'cache',
        count: cached.length,
      });
    }

    // Get the vault UUID
    const { data: vaultData, error: vaultError } = await supabase
      .from('vaults')
      .select('id')
      .eq('vault_id', vaultId)
      .single();

    if (vaultError || !vaultData) {
      return res.status(404).json({
        success: false,
        error: 'Vault not found',
      });
    }

    // Check database for recent suggestions
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('ai_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('vault_id', vaultData.id)
      .gte('created_at', cutoffTime);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      exists: (count || 0) > 0,
      source: 'database',
      count: count || 0,
    });
  } catch (error) {
    console.error('Error checking suggestions existence:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check suggestions',
    });
  }
});

/**
 * GET /api/suggestions/cache/stats
 * Get cache statistics (admin endpoint)
 */
router.get('/cache/stats', async (_req: Request, res: Response) => {
  try {
    const stats = suggestionCacheService.getStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch cache stats',
    });
  }
});

/**
 * GET /api/vaults/:vaultId/suggestions/status/:jobId
 * Poll for suggestion generation job status and results
 */
router.get('/:vaultId/suggestions/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const { jobQueue } = await import('../services/jobQueue.js');
    const job = jobQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or expired',
      });
    }
    
    if (job.status === 'completed') {
      return res.json({
        success: true,
        status: 'completed',
        data: job.result,
      });
    }
    
    if (job.status === 'failed') {
      return res.json({
        success: false,
        status: 'failed',
        error: job.error,
      });
    }
    
    // Still processing
    return res.json({
      success: true,
      status: job.status,
      message: 'Job is still processing...',
    });
  } catch (error) {
    console.error('Error checking job status:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check job status',
    });
  }
});

/**
 * GET /api/suggestions/debug/:vaultId
 * Debug endpoint to check database state for a vault
 */
router.get('/debug/:vaultId', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;

    // Get the vault UUID
    const { data: vaultData, error: vaultError } = await supabase
      .from('vaults')
      .select('id, vault_id, name')
      .eq('vault_id', vaultId)
      .single();

    if (vaultError || !vaultData) {
      return res.status(404).json({
        success: false,
        error: 'Vault not found',
        details: vaultError,
      });
    }

    // Get all suggestions for this vault
    const { data: allSuggestions, error: suggestionsError, count } = await supabase
      .from('ai_suggestions')
      .select('*', { count: 'exact' })
      .eq('vault_id', vaultData.id)
      .order('created_at', { ascending: false });

    if (suggestionsError) {
      return res.status(500).json({
        success: false,
        error: 'Error fetching suggestions',
        details: suggestionsError,
      });
    }

    // Check cache
    const cached = suggestionCacheService.get(vaultId);

    return res.json({
      success: true,
      vault: vaultData,
      database: {
        count: count || 0,
        suggestions: allSuggestions || [],
      },
      cache: {
        exists: !!cached,
        count: cached?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/suggestions/sentiment/:assetCode
 * Get sentiment analysis for a specific asset
 */
router.get('/sentiment/:assetCode', async (req: Request, res: Response) => {
  try {
    const { assetCode } = req.params;
    const hoursBack = parseInt(req.query.hoursBack as string) || 24;

    // Import sentiment services
    const { sentimentAnalysisService } = await import('../services/sentimentAnalysisService.js');
    
    // Get sentiment data
    const sentiment = await sentimentAnalysisService.analyzeAssetSentiment(assetCode, hoursBack);

    res.json({
      success: true,
      data: sentiment,
    });
  } catch (error) {
    console.error('Error fetching sentiment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sentiment data',
    });
  }
});

export default router;
