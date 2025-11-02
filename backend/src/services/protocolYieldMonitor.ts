/**
 * Protocol Yield Monitor Service
 * Continuously monitors protocol yields and suggests rebalancing when better opportunities arise
 */

import { supabase } from '../lib/supabase.js';
import { suggestRebalancing } from './yieldRouterService.js';
import type { YieldRoutingStrategy } from '../types/protocol.js';

interface RebalanceSuggestion {
  vaultId: string;
  shouldRebalance: boolean;
  currentAPY: number;
  potentialAPY: number;
  improvement: number;
  strategy: YieldRoutingStrategy | null;
  checkedAt: string;
  network: string;
}

// In-memory cache of recent suggestions to avoid duplicate notifications
const suggestionCache = new Map<string, RebalanceSuggestion>();

/**
 * Start monitoring protocol yields for all active vaults
 */
export function startYieldMonitoring(intervalMinutes: number = 60) {
  console.log(`[Yield Monitor] Starting continuous yield monitoring (checking every ${intervalMinutes} minutes)`);

  // Run immediately on startup
  monitorAllVaults();

  // Then run periodically
  const interval = setInterval(() => {
    monitorAllVaults();
  }, intervalMinutes * 60 * 1000);

  return () => clearInterval(interval);
}

/**
 * Monitor all active vaults for rebalancing opportunities
 */
async function monitorAllVaults() {
  try {
    console.log('[Yield Monitor] Checking all active vaults for rebalancing opportunities...');

    // Get all active vaults
    const { data: vaults, error } = await supabase
      .from('vaults')
      .select('vault_id, name, config, network, contract_address')
      .eq('status', 'active');

    if (error) {
      console.error('[Yield Monitor] Error fetching vaults:', error);
      return;
    }

    if (!vaults || vaults.length === 0) {
      console.log('[Yield Monitor] No active vaults to monitor');
      return;
    }

    console.log(`[Yield Monitor] Monitoring ${vaults.length} active vaults...`);

    // Check each vault in parallel
    const checks = vaults.map((vault: any) => checkVaultRebalancing(vault));
    const results = await Promise.allSettled(checks);

    // Count suggestions
    let suggestionsCount = 0;
    results.forEach((result: any, index: number) => {
      if (result.status === 'fulfilled' && result.value?.shouldRebalance) {
        suggestionsCount++;
      } else if (result.status === 'rejected') {
        console.error(`[Yield Monitor] Error checking vault ${vaults[index].vault_id}:`, result.reason);
      }
    });

    console.log(`[Yield Monitor] ✅ Completed monitoring. Found ${suggestionsCount} rebalancing opportunities.`);
  } catch (error) {
    console.error('[Yield Monitor] Error in monitorAllVaults:', error);
  }
}

/**
 * Check if a specific vault should rebalance
 */
async function checkVaultRebalancing(vault: any): Promise<RebalanceSuggestion | null> {
  try {
    const vaultId = vault.vault_id;
    const network = vault.network || 'testnet';

    // Get vault config
    const vaultConfig = vault.config;
    if (!vaultConfig || !vaultConfig.assets || vaultConfig.assets.length === 0) {
      console.log(`[Yield Monitor] Vault ${vaultId} has no assets configured, skipping`);
      return null;
    }

    const firstAsset = vaultConfig.assets[0];
    const assetCode = typeof firstAsset === 'string' ? firstAsset : firstAsset?.code || 'XLM';

    // Get current vault positions (simplified - in production would query from blockchain)
    const currentAllocations = await getCurrentVaultAllocations(vaultId, network);

    if (!currentAllocations || currentAllocations.length === 0) {
      console.log(`[Yield Monitor] Vault ${vaultId} has no allocations, skipping`);
      return null;
    }

    // Check if rebalancing would improve yields
    const suggestion = await suggestRebalancing(
      currentAllocations,
      assetCode,
      network
    );

    const result: RebalanceSuggestion = {
      vaultId,
      shouldRebalance: suggestion.shouldRebalance,
      currentAPY: suggestion.currentBlendedApy,
      potentialAPY: suggestion.proposedBlendedApy,
      improvement: suggestion.improvement,
      strategy: suggestion.newStrategy,
      checkedAt: new Date().toISOString(),
      network,
    };

    // Cache the suggestion
    suggestionCache.set(vaultId, result);

    // If should rebalance, store in database for user notifications
    if (suggestion.shouldRebalance) {
      console.log(`[Yield Monitor] 🎯 Vault ${vault.name || vaultId}: Rebalancing would improve APY by ${suggestion.improvement.toFixed(2)}%`);
      await storeRebalanceSuggestion(result);
    }

    return result;
  } catch (error) {
    console.error(`[Yield Monitor] Error checking vault ${vault.vault_id}:`, error);
    return null;
  }
}

/**
 * Get current protocol allocations for a vault
 * In production, this would query the blockchain
 * For now, we'll use mock data based on vault positions
 */
async function getCurrentVaultAllocations(vaultId: string, _network: string): Promise<Array<{ protocolId: string; amount: number; apy: number }>> {
  try {
    // Query vault positions from database
    const { data: positions } = await supabase
      .from('vault_positions')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!positions || positions.length === 0) {
      // No positions recorded, return default allocation
      // Assume funds are in a single protocol (e.g., Soroswap)
      return [{
        protocolId: 'soroswap',
        amount: 1000, // Mock amount
        apy: 8.5, // Will be recalculated with current data
      }];
    }

    // Group positions by protocol
    const protocolMap = new Map<string, number>();
    
    positions.forEach((position: any) => {
      const protocol = position.protocol || 'soroswap';
      const amount = parseFloat(position.amount || '0');
      protocolMap.set(protocol, (protocolMap.get(protocol) || 0) + amount);
    });

    // Convert to array with current APYs
    const allocations = Array.from(protocolMap.entries()).map(([protocolId, amount]) => ({
      protocolId,
      amount,
      apy: 8.5, // Placeholder - would fetch current APY from protocol
    }));

    return allocations;
  } catch (error) {
    console.error('[Yield Monitor] Error getting vault allocations:', error);
    return [];
  }
}

/**
 * Store rebalancing suggestion in database
 */
async function storeRebalanceSuggestion(suggestion: RebalanceSuggestion) {
  try {
    // Get the vault's UUID from the vault_id string
    const { data: vault } = await supabase
      .from('vaults')
      .select('id')
      .eq('vault_id', suggestion.vaultId)
      .single();

    if (!vault) {
      console.error(`[Yield Monitor] Vault not found: ${suggestion.vaultId}`);
      return;
    }

    // Check if we already have a recent suggestion for this vault
    const { data: existing } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('vault_id', vault.id)
      .eq('suggestion_type', 'rebalance_rule')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If we already suggested rebalancing recently and it's still pending, don't create duplicate
    if (existing && existing.status === 'pending') {
      console.log(`[Yield Monitor] Skipping duplicate suggestion for vault ${suggestion.vaultId}`);
      return;
    }

    // Generate unique suggestion ID
    const suggestionId = `rebalance_${suggestion.vaultId}_${Date.now()}`;

    // Store new suggestion
    const { error } = await supabase
      .from('ai_suggestions')
      .insert({
        suggestion_id: suggestionId,
        vault_id: vault.id, // Use the UUID from the vaults table
        suggestion_type: 'rebalance_rule',
        title: 'Better Yield Opportunity Available',
        description: `Rebalancing across protocols could improve your APY from ${suggestion.currentAPY.toFixed(2)}% to ${suggestion.potentialAPY.toFixed(2)}% (+${suggestion.improvement.toFixed(2)}%)`,
        reasoning: suggestion.strategy?.rationale || 'Yield optimization across multiple protocols',
        confidence_score: Math.min(0.95, 0.5 + (suggestion.improvement / 20)), // Higher confidence for bigger improvements
        projected_apy_improvement: suggestion.improvement,
        suggestion_data: {
          currentAPY: suggestion.currentAPY,
          potentialAPY: suggestion.potentialAPY,
          improvement: suggestion.improvement,
          strategy: suggestion.strategy,
          network: suggestion.network,
          vault_id_string: suggestion.vaultId, // Store the string ID for reference
        },
        status: 'pending',
      });

    if (error) {
      console.error('[Yield Monitor] Error storing suggestion:', error);
    } else {
      console.log(`[Yield Monitor] ✅ Stored rebalancing suggestion for vault ${suggestion.vaultId}`);
    }
  } catch (error) {
    console.error('[Yield Monitor] Error in storeRebalanceSuggestion:', error);
  }
}

/**
 * Get cached rebalancing suggestion for a vault
 */
export function getCachedSuggestion(vaultId: string): RebalanceSuggestion | undefined {
  return suggestionCache.get(vaultId);
}

/**
 * Manually trigger a rebalancing check for a specific vault
 */
export async function checkVaultNow(vaultId: string): Promise<RebalanceSuggestion | null> {
  try {
    const { data: vault } = await supabase
      .from('vaults')
      .select('*')
      .eq('vault_id', vaultId)
      .single();

    if (!vault) {
      throw new Error('Vault not found');
    }

    return await checkVaultRebalancing(vault);
  } catch (error) {
    console.error('[Yield Monitor] Error in checkVaultNow:', error);
    return null;
  }
}

/**
 * Get all vaults that should rebalance
 */
export function getAllRebalanceSuggestions(): RebalanceSuggestion[] {
  return Array.from(suggestionCache.values()).filter(s => s.shouldRebalance);
}

/**
 * Clear suggestion cache (useful for testing)
 */
export function clearSuggestionCache() {
  suggestionCache.clear();
}
