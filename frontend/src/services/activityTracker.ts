// Activity Tracking Service - Track user actions for quest completion

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Track a page visit for quest validation
 */
export async function trackPageVisit(walletAddress: string, pagePath: string): Promise<void> {
  try {
    console.log('[ActivityTracker] Sending page visit:', { walletAddress, pagePath, url: `${API_BASE_URL}/api/activity/page-visit` });
    const response = await fetch(`${API_BASE_URL}/api/activity/page-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, pagePath }),
    });
    const data = await response.json();
    console.log('[ActivityTracker] Page visit response:', data);
  } catch (error) {
    // Silently fail - don't block user experience if tracking fails
    console.error('[ActivityTracker] Failed to track page visit:', error);
  }
}

/**
 * Track vault creation
 */
export async function trackVaultCreated(walletAddress: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/activity/vault-created`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });
  } catch (error) {
    console.error('Failed to track vault creation:', error);
  }
}

/**
 * Track deposit transaction
 */
export async function trackDepositMade(walletAddress: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/activity/deposit-made`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });
  } catch (error) {
    console.error('Failed to track deposit:', error);
  }
}

/**
 * Track rebalancing rule addition
 */
export async function trackRebalancingRuleAdded(walletAddress: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/activity/rebalancing-rule-added`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });
  } catch (error) {
    console.error('Failed to track rebalancing rule:', error);
  }
}

/**
 * Track backtest run
 */
export async function trackBacktestRun(walletAddress: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/activity/backtest-run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });
  } catch (error) {
    console.error('Failed to track backtest:', error);
  }
}

/**
 * Check all quests for completion (useful on login or periodically)
 */
export async function checkAllQuests(walletAddress: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/activity/check-quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });
  } catch (error) {
    console.error('Failed to check quests:', error);
  }
}
