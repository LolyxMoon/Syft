// Activity tracking routes - for tracking user actions and page visits
import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { autoCompleteQuest, checkAllQuestsForUser } from '../services/questValidationService.js';
import type { ApiResponse } from '../shared/types/index.js';

const router = Router();

// Track page visit
router.post('/page-visit', async (req: Request, res: Response) => {
  try {
    const { walletAddress, pagePath } = req.body;
    console.log('[Activity] Page visit request:', { walletAddress, pagePath });

    if (!walletAddress || !pagePath) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address and page path are required', code: 'MISSING_FIELDS' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      // Don't fail if user not found, just skip tracking
      console.log('[Activity] User not found, skipping tracking');
      return res.json({
        success: true,
        data: { tracked: false, reason: 'User not found' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const userId = user.id;
    const now = new Date().toISOString();

    // Normalize page path (remove dynamic segments and /app prefix)
    let normalizedPath = pagePath;
    
    // Remove /app prefix if present
    if (normalizedPath.startsWith('/app/')) {
      normalizedPath = normalizedPath.substring(4); // Remove '/app'
    }
    
    // Normalize vault detail pages
    if (normalizedPath.includes('/vault/') || normalizedPath.includes('/vaults/')) {
      normalizedPath = '/vault-detail';
    }
    
    console.log('[Activity] Normalized path:', normalizedPath, '(from', pagePath + ')');

    // Upsert page visit
    const { data: visit, error: visitError } = await supabase
      .from('user_page_visits')
      .select('*')
      .eq('user_id', userId)
      .eq('page_path', normalizedPath)
      .single();

    if (visitError && visitError.code === 'PGRST116') {
      // Record doesn't exist, create it
      console.log('[Activity] Creating new page visit record');
      await supabase.from('user_page_visits').insert({
        user_id: userId,
        page_path: normalizedPath,
        visit_count: 1,
        first_visited_at: now,
        last_visited_at: now,
      });
    } else if (!visitError && visit) {
      // Update existing record
      console.log('[Activity] Updating page visit count:', visit.visit_count + 1);
      await supabase
        .from('user_page_visits')
        .update({
          visit_count: visit.visit_count + 1,
          last_visited_at: now,
        })
        .eq('id', visit.id);
    } else if (visitError) {
      console.error('[Activity] Error checking page visits:', visitError);
    }

    // Auto-complete relevant quests based on page visit
    const questMapping: Record<string, string> = {
      '/vault-detail': 'view_vault_details',
      '/vaults': 'explore_vaults',
      '/analytics': 'view_analytics',
    };

    const questKey = questMapping[normalizedPath];
    if (questKey) {
      console.log('[Activity] Auto-completing quest:', questKey);
      const completed = await autoCompleteQuest(userId, questKey);
      console.log('[Activity] Quest auto-complete result:', completed);
    }

    return res.json({
      success: true,
      data: { tracked: true, pagePath: normalizedPath, questChecked: !!questKey },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    console.error('[Activity] Error tracking page visit:', error);
    // Don't fail the request if tracking fails
    return res.json({
      success: true,
      data: { tracked: false, error: String(error) },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Track vault creation (called after vault is created)
router.post('/vault-created', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required', code: 'MISSING_WALLET' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.json({
        success: true,
        data: { tracked: false },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Auto-complete the create vault quest
    await autoCompleteQuest(user.id, 'create_first_vault');

    return res.json({
      success: true,
      data: { tracked: true },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    console.error('Error tracking vault creation:', error);
    return res.json({
      success: true,
      data: { tracked: false },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Track deposit (called after deposit transaction)
router.post('/deposit-made', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required', code: 'MISSING_WALLET' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.json({
        success: true,
        data: { tracked: false },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Auto-complete the deposit quest
    await autoCompleteQuest(user.id, 'deposit_to_vault');

    return res.json({
      success: true,
      data: { tracked: true },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    console.error('Error tracking deposit:', error);
    return res.json({
      success: true,
      data: { tracked: false },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Track rebalancing rule addition
router.post('/rebalancing-rule-added', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required', code: 'MISSING_WALLET' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.json({
        success: true,
        data: { tracked: false },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Auto-complete the rebalancing rule quest
    await autoCompleteQuest(user.id, 'add_rebalancing_rule');

    return res.json({
      success: true,
      data: { tracked: true },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    console.error('Error tracking rebalancing rule:', error);
    return res.json({
      success: true,
      data: { tracked: false },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Track backtest run
router.post('/backtest-run', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required', code: 'MISSING_WALLET' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.json({
        success: true,
        data: { tracked: false },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Auto-complete the backtest quest
    await autoCompleteQuest(user.id, 'run_backtest');

    return res.json({
      success: true,
      data: { tracked: true },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    console.error('Error tracking backtest:', error);
    return res.json({
      success: true,
      data: { tracked: false },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

// Check all quests for completion (useful for periodic checks or on login)
router.post('/check-quests', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required', code: 'MISSING_WALLET' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Check all quests for this user
    await checkAllQuestsForUser(user.id);

    return res.json({
      success: true,
      data: { checked: true },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    console.error('Error checking quests:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to check quests', code: 'CHECK_ERROR' },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

export default router;
