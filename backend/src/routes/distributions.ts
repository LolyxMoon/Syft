/**
 * Profit Distribution API Routes
 * Handles profit distribution endpoints for NFT holders and vault subscribers
 */

import { Router, Request, Response } from 'express';
import {
  calculateVaultProfit,
  distributeToNFTHolders,
  distributeToVaultSubscribers,
  getDistributionHistory,
  getNFTDistributionStats,
} from '../services/profitDistributionService.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * GET /api/distributions/vault/:vaultId/profit
 * Calculate pending profit for a vault since last distribution
 */
router.get('/vault/:vaultId/profit', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;

    const profitInfo = await calculateVaultProfit(vaultId);

    res.json({
      success: true,
      data: profitInfo,
    });
  } catch (error: any) {
    console.error('[Get Vault Profit] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate vault profit',
    });
  }
});

/**
 * POST /api/distributions/vault/:vaultId/distribute-nft
 * Trigger profit distribution to NFT holders for a specific vault
 */
router.post('/vault/:vaultId/distribute-nft', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const { profitAmount, network } = req.body;

    // Get vault details from database
    const { data: vault, error: vaultError } = await supabase
      .from('vaults')
      .select('*')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      return res.status(404).json({
        success: false,
        error: 'Vault not found',
      });
    }

    if (!vault.nft_contract_address) {
      return res.status(400).json({
        success: false,
        error: 'Vault does not have an NFT contract',
      });
    }

    // Use provided profit amount or calculate it
    let distributionAmount = profitAmount;
    if (!distributionAmount) {
      const { totalProfit } = await calculateVaultProfit(vaultId);
      distributionAmount = totalProfit;
    }

    if (distributionAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No profit to distribute',
      });
    }

    // Distribute profits
    const result = await distributeToNFTHolders(
      {
        vaultId: vault.id,
        vaultAddress: vault.contract_address,
        nftContractAddress: vault.nft_contract_address,
        tokenAddress: vault.base_token_address,
        tokenSymbol: vault.base_token_symbol,
        network: network || vault.network,
      },
      distributionAmount
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Distribution failed',
      });
    }

    return res.json({
      success: true,
      data: {
        distributionId: result.distributionId,
        transactionHash: result.transactionHash,
        totalDistributed: result.totalDistributed,
        recipientCount: result.recipientCount,
      },
    });
  } catch (error: any) {
    console.error('[Distribute to NFT Holders] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to distribute profits',
    });
  }
});

/**
 * POST /api/distributions/vault/:vaultId/distribute-subscribers
 * Trigger profit distribution to vault subscribers (original vault creators)
 */
router.post('/vault/:vaultId/distribute-subscribers', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const { profitAmount } = req.body;

    // Get vault details
    const { data: vault, error: vaultError } = await supabase
      .from('vaults')
      .select('*')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      return res.status(404).json({
        success: false,
        error: 'Vault not found',
      });
    }

    // Use provided profit amount or calculate it
    let distributionAmount = profitAmount;
    if (!distributionAmount) {
      const { totalProfit } = await calculateVaultProfit(vaultId);
      distributionAmount = totalProfit;
    }

    if (distributionAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No profit to distribute',
      });
    }

    // Distribute to subscribers
    const result = await distributeToVaultSubscribers(
      vaultId,
      distributionAmount,
      vault.base_token_address,
      vault.base_token_symbol
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Distribution failed',
      });
    }

    return res.json({
      success: true,
      data: {
        totalDistributed: result.totalDistributed,
        recipientCount: result.recipientCount,
      },
    });
  } catch (error: any) {
    console.error('[Distribute to Subscribers] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to distribute profits',
    });
  }
});

/**
 * POST /api/distributions/vault/:vaultId/distribute-all
 * Distribute profits to both NFT holders and subscribers
 */
router.post('/vault/:vaultId/distribute-all', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const { network } = req.body;

    // Get vault details
    const { data: vault, error: vaultError } = await supabase
      .from('vaults')
      .select('*')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      return res.status(404).json({
        success: false,
        error: 'Vault not found',
      });
    }

    // Calculate profit
    const { totalProfit } = await calculateVaultProfit(vaultId);

    if (totalProfit <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No profit to distribute',
      });
    }

    const results: any = {
      totalProfit,
      distributions: [],
    };

    // Distribute to NFT holders if applicable
    if (vault.nft_contract_address) {
      const nftResult = await distributeToNFTHolders(
        {
          vaultId: vault.id,
          vaultAddress: vault.contract_address,
          nftContractAddress: vault.nft_contract_address,
          tokenAddress: vault.base_token_address,
          tokenSymbol: vault.base_token_symbol,
          network: network || vault.network,
        },
        totalProfit
      );

      results.distributions.push({
        type: 'nft_holders',
        ...nftResult,
      });
    }

    // Distribute to subscribers
    const subscriberResult = await distributeToVaultSubscribers(
      vaultId,
      totalProfit,
      vault.base_token_address,
      vault.base_token_symbol
    );

    results.distributions.push({
      type: 'subscribers',
      ...subscriberResult,
    });

    return res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('[Distribute All] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to distribute profits',
    });
  }
});

/**
 * GET /api/distributions/wallet/:walletAddress/history
 * Get distribution history for a wallet address
 */
router.get('/wallet/:walletAddress/history', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await getDistributionHistory(walletAddress, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('[Get Distribution History] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch distribution history',
    });
  }
});

/**
 * GET /api/distributions/nft/:nftId/stats
 * Get profit statistics for a specific NFT
 */
router.get('/nft/:nftId/stats', async (req: Request, res: Response) => {
  try {
    const { nftId } = req.params;

    const stats = await getNFTDistributionStats(nftId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('[Get NFT Stats] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch NFT stats',
    });
  }
});

/**
 * GET /api/distributions/vault/:vaultId/history
 * Get all distributions for a specific vault
 */
router.get('/vault/:vaultId/history', async (req: Request, res: Response) => {
  try {
    const { vaultId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const { data, error } = await supabase
      .from('profit_distributions')
      .select('*')
      .eq('vault_id', vaultId)
      .order('initiated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('[Get Vault Distribution History] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch vault distribution history',
    });
  }
});

/**
 * GET /api/distributions/stats/summary
 * Get overall distribution statistics
 */
router.get('/stats/summary', async (_req: Request, res: Response) => {
  try {
    // Total distributions
    const { count: totalDistributions } = await supabase
      .from('profit_distributions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Total amount distributed
    const { data: amountData } = await supabase
      .from('profit_distributions')
      .select('amount')
      .eq('status', 'completed');

    const totalAmountDistributed = amountData?.reduce((sum, row) => 
      sum + parseFloat(row.amount), 0
    ) || 0;

    // Unique recipients
    const { data: recipientData } = await supabase
      .from('profit_distributions')
      .select('recipient_wallet_address')
      .eq('status', 'completed');

    const uniqueRecipients = new Set(
      recipientData?.map(r => r.recipient_wallet_address) || []
    ).size;

    // Active vaults with distributions
    const { data: vaultData } = await supabase
      .from('profit_distributions')
      .select('vault_id')
      .eq('status', 'completed');

    const activeVaults = new Set(
      vaultData?.map(v => v.vault_id) || []
    ).size;

    res.json({
      success: true,
      data: {
        totalDistributions: totalDistributions || 0,
        totalAmountDistributed,
        uniqueRecipients,
        activeVaults,
      },
    });
  } catch (error: any) {
    console.error('[Get Distribution Summary] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch distribution summary',
    });
  }
});

export default router;
