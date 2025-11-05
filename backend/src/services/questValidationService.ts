// Quest Validation Service - Automatic quest completion checking
import { supabase } from '../lib/supabase.js';

export interface QuestValidationResult {
  isCompleted: boolean;
  reason?: string;
  progress?: any;
}

/**
 * Check if a quest should be automatically marked as completed
 * This is called when users perform actions that might complete quests
 */
export async function validateQuestCompletion(
  userId: string,
  questKey: string
): Promise<QuestValidationResult> {
  try {
    // Get quest details
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('*')
      .eq('quest_key', questKey)
      .single();

    if (questError || !quest) {
      return { isCompleted: false, reason: 'Quest not found' };
    }

    // Check validation type
    if (quest.validation_type !== 'automatic') {
      return { isCompleted: false, reason: 'Quest requires manual validation' };
    }

    const validationConfig = quest.validation_config || {};
    const checkType = validationConfig.check;

    // Check based on quest type
    switch (checkType) {
      case 'wallet_connected':
        // This is validated client-side when wallet is connected
        return { isCompleted: true, reason: 'Wallet connected' };

      case 'created_vault':
        return await checkCreatedVault(userId);

      case 'viewed_vault_detail':
        return await checkViewedVaultDetail(userId, validationConfig.minTime);

      case 'made_deposit':
        return await checkMadeDeposit(userId, validationConfig.minAmount);

      case 'visited_vaults_page':
        return await checkVisitedVaultsPage(userId, validationConfig.minTime);

      case 'added_rebalancing_rule':
        return await checkAddedRebalancingRule(userId);

      case 'visited_analytics':
        return await checkVisitedAnalytics(userId, validationConfig.minTime);

      case 'ran_backtest':
        return await checkRanBacktest(userId);

      default:
        return { isCompleted: false, reason: 'Unknown validation type' };
    }
  } catch (error) {
    console.error('Error validating quest:', error);
    return { isCompleted: false, reason: 'Validation error' };
  }
}

/**
 * Check if user has created at least one vault
 */
async function checkCreatedVault(userId: string): Promise<QuestValidationResult> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('wallet_address')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return { isCompleted: false, reason: 'User not found' };
  }

  const { data: vaults, error } = await supabase
    .from('vaults')
    .select('id')
    .eq('owner_wallet_address', user.wallet_address)
    .limit(1);

  if (error) {
    return { isCompleted: false, reason: 'Error checking vaults' };
  }

  const hasVault = vaults && vaults.length > 0;
  return {
    isCompleted: hasVault,
    reason: hasVault ? 'User has created a vault' : 'No vaults found',
    progress: { vaultCount: vaults?.length || 0 },
  };
}

/**
 * Check if user has viewed a vault detail page
 */
async function checkViewedVaultDetail(
  userId: string,
  minTime?: number
): Promise<QuestValidationResult> {
  const { data: visits, error } = await supabase
    .from('user_page_visits')
    .select('*')
    .eq('user_id', userId)
    .eq('page_path', '/vault-detail')
    .single();

  if (error || !visits) {
    return { isCompleted: false, reason: 'Vault detail page not visited' };
  }

  // Check if user spent minimum time (if required)
  if (minTime && visits.visit_count < 1) {
    return { isCompleted: false, reason: 'Not enough time spent on vault detail' };
  }

  return {
    isCompleted: true,
    reason: 'Viewed vault details',
    progress: { visitCount: visits.visit_count },
  };
}

/**
 * Check if user has made a deposit to any vault
 */
async function checkMadeDeposit(
  userId: string,
  minAmount?: number
): Promise<QuestValidationResult> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('wallet_address')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return { isCompleted: false, reason: 'User not found' };
  }

  const { data: transactions, error } = await supabase
    .from('vault_transactions')
    .select('amount_xlm')
    .eq('user_address', user.wallet_address)
    .eq('type', 'deposit')
    .limit(1);

  if (error) {
    return { isCompleted: false, reason: 'Error checking deposits' };
  }

  const hasDeposit = transactions && transactions.length > 0;
  
  // Check minimum amount if specified
  if (hasDeposit && minAmount && transactions[0].amount_xlm < minAmount) {
    return {
      isCompleted: false,
      reason: `Deposit amount (${transactions[0].amount_xlm}) is less than required (${minAmount})`,
    };
  }

  return {
    isCompleted: hasDeposit,
    reason: hasDeposit ? 'User has made a deposit' : 'No deposits found',
    progress: { depositCount: transactions?.length || 0 },
  };
}

/**
 * Check if user has visited the vaults page
 */
async function checkVisitedVaultsPage(
  userId: string,
  minTime?: number
): Promise<QuestValidationResult> {
  const { data: visits, error } = await supabase
    .from('user_page_visits')
    .select('*')
    .eq('user_id', userId)
    .eq('page_path', '/vaults')
    .single();

  if (error || !visits) {
    return { isCompleted: false, reason: 'Vaults page not visited' };
  }

  // Optional: check if spent minimum time
  if (minTime && visits.visit_count < 1) {
    return { isCompleted: false, reason: 'Not enough time spent on vaults page' };
  }

  return {
    isCompleted: true,
    reason: 'Visited vaults page',
    progress: { visitCount: visits.visit_count },
  };
}

/**
 * Check if user has added a rebalancing rule to any vault
 */
async function checkAddedRebalancingRule(userId: string): Promise<QuestValidationResult> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('wallet_address')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return { isCompleted: false, reason: 'User not found' };
  }

  // Get all vaults for this user
  const { data: vaults, error } = await supabase
    .from('vaults')
    .select('config')
    .eq('owner_wallet_address', user.wallet_address);

  if (error) {
    return { isCompleted: false, reason: 'Error checking vaults' };
  }

  // Check if any vault has rebalancing rules
  const hasRebalanceRule = vaults?.some((vault) => {
    const config = vault.config as any;
    return (
      config &&
      config.rebalancing_rules &&
      Array.isArray(config.rebalancing_rules) &&
      config.rebalancing_rules.length > 0
    );
  });

  return {
    isCompleted: hasRebalanceRule || false,
    reason: hasRebalanceRule ? 'User has rebalancing rules' : 'No rebalancing rules found',
    progress: { vaultsWithRules: hasRebalanceRule ? 1 : 0 },
  };
}

/**
 * Check if user has visited the analytics page
 */
async function checkVisitedAnalytics(
  userId: string,
  minTime?: number
): Promise<QuestValidationResult> {
  const { data: visits, error } = await supabase
    .from('user_page_visits')
    .select('*')
    .eq('user_id', userId)
    .eq('page_path', '/analytics')
    .single();

  if (error || !visits) {
    return { isCompleted: false, reason: 'Analytics page not visited' };
  }

  // Optional: check if spent minimum time
  if (minTime && visits.visit_count < 1) {
    return { isCompleted: false, reason: 'Not enough time spent on analytics page' };
  }

  return {
    isCompleted: true,
    reason: 'Visited analytics page',
    progress: { visitCount: visits.visit_count },
  };
}

/**
 * Check if user has run a backtest
 */
async function checkRanBacktest(userId: string): Promise<QuestValidationResult> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('wallet_address')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return { isCompleted: false, reason: 'User not found' };
  }

  // Get user's vaults
  const { data: vaults, error: vaultsError } = await supabase
    .from('vaults')
    .select('id')
    .eq('owner_wallet_address', user.wallet_address);

  if (vaultsError || !vaults || vaults.length === 0) {
    return { isCompleted: false, reason: 'No vaults found' };
  }

  const vaultIds = vaults.map((v) => v.id);

  // Check if user has any backtest results
  const { data: backtests, error } = await supabase
    .from('backtest_results')
    .select('id')
    .in('vault_id', vaultIds)
    .limit(1);

  if (error) {
    return { isCompleted: false, reason: 'Error checking backtests' };
  }

  const hasBacktest = backtests && backtests.length > 0;
  return {
    isCompleted: hasBacktest,
    reason: hasBacktest ? 'User has run a backtest' : 'No backtests found',
    progress: { backtestCount: backtests?.length || 0 },
  };
}

/**
 * Auto-complete quest if validation passes
 * This should be called whenever an action that might complete a quest is performed
 */
export async function autoCompleteQuest(userId: string, questKey: string): Promise<boolean> {
  try {
    console.log(`[QuestValidation] Checking quest ${questKey} for user ${userId}`);
    
    // Check if quest is already completed or claimed
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id')
      .eq('quest_key', questKey)
      .single();

    if (questError || !quest) {
      console.log(`[QuestValidation] Quest ${questKey} not found`);
      return false;
    }

    const { data: userQuest } = await supabase
      .from('user_quests')
      .select('status, started_at')
      .eq('user_id', userId)
      .eq('quest_id', quest.id)
      .single();

    // Don't auto-complete if already completed or claimed
    if (userQuest && (userQuest.status === 'completed' || userQuest.status === 'claimed')) {
      console.log(`[QuestValidation] Quest ${questKey} already ${userQuest.status}`);
      return false;
    }

    // Validate quest completion
    console.log(`[QuestValidation] Validating quest ${questKey}...`);
    const validation = await validateQuestCompletion(userId, questKey);
    console.log(`[QuestValidation] Validation result:`, validation);

    if (validation.isCompleted) {
      // Mark quest as completed
      const now = new Date().toISOString();
      const { error: upsertError } = await supabase
        .from('user_quests')
        .upsert(
          {
            user_id: userId,
            quest_id: quest.id,
            status: 'completed',
            progress: validation.progress || {},
            started_at: userQuest?.started_at || now,
            completed_at: now,
            updated_at: now,
          },
          {
            onConflict: 'user_id,quest_id',
            ignoreDuplicates: false,
          }
        );

      if (upsertError) {
        console.error('[QuestValidation] Error auto-completing quest:', upsertError);
        return false;
      }

      console.log(`[QuestValidation] ✅ Quest ${questKey} auto-completed for user ${userId}`);
      return true;
    }

    console.log(`[QuestValidation] Quest ${questKey} not yet completed`);
    return false;
  } catch (error) {
    console.error('[QuestValidation] Error in autoCompleteQuest:', error);
    return false;
  }
}

/**
 * Check all quests for a user and auto-complete if conditions are met
 * This can be called periodically or when user logs in
 */
export async function checkAllQuestsForUser(userId: string): Promise<void> {
  try {
    const { data: quests, error } = await supabase
      .from('quests')
      .select('quest_key')
      .eq('is_active', true)
      .eq('validation_type', 'automatic');

    if (error || !quests) {
      return;
    }

    // Check each quest
    for (const quest of quests) {
      await autoCompleteQuest(userId, quest.quest_key);
    }
  } catch (error) {
    console.error('Error checking all quests:', error);
  }
}
