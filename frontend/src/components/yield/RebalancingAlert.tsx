/**
 * Rebalancing Alert Component
 * Displays when a vault should rebalance for better yields
 */

import { useState, useEffect, useContext } from 'react';
import { TrendingUp, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useWallet } from '../../providers/WalletProvider';
import { NotificationContext } from '../../providers/NotificationProvider';

interface RebalanceSuggestion {
  vaultId: string;
  shouldRebalance: boolean;
  currentAPY: number;
  potentialAPY: number;
  improvement: number;
  strategy: any;
  checkedAt: string;
  network: string;
}

interface RebalancingAlertProps {
  vaultId: string;
  network?: string;
  onRebalance?: () => void;
}

export function RebalancingAlert({ vaultId, network = 'testnet', onRebalance }: RebalancingAlertProps) {
  const [suggestion, setSuggestion] = useState<RebalanceSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [rebalancing, setRebalancing] = useState(false);

  const { address, signTransaction } = useWallet();
  const notification = useContext(NotificationContext);

  const backendUrl = import.meta.env.VITE_VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';

  useEffect(() => {
    fetchSuggestion();
    
    // Check for updates every 5 minutes
    const interval = setInterval(fetchSuggestion, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [vaultId, network]);

  async function fetchSuggestion() {
    try {
      const response = await fetch(
        `${backendUrl}/api/protocols/rebalance-suggestions/${vaultId}?network=${network}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.shouldRebalance) {
          setSuggestion(data.data);
        } else {
          setSuggestion(null);
        }
      }
    } catch (error) {
      console.error('[RebalancingAlert] Error fetching suggestion:', error);
    } finally {
      setLoading(false);
    }
  }

  async function triggerManualCheck() {
    setChecking(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/protocols/trigger-yield-check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vaultId }),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.shouldRebalance) {
          setSuggestion(data.data);
        } else {
          setSuggestion(null);
        }
      }
    } catch (error) {
      console.error('[RebalancingAlert] Error triggering check:', error);
    } finally {
      setChecking(false);
    }
  }

  function handleDismiss() {
    setDismissed(true);
  }

  async function handleRebalance() {
    if (!address) {
      notification?.addNotification('Please connect your wallet first', 'error');
      return;
    }

    if (!signTransaction) {
      notification?.addNotification('Wallet does not support signing', 'error');
      return;
    }

    setRebalancing(true);
    
    try {
      notification?.addNotification('Building rebalance transaction...', 'warning');

      // Build rebalance transaction
      const buildResponse = await fetch(
        `${backendUrl}/api/vaults/${vaultId}/build-rebalance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: address,
            network,
          }),
        }
      );

      if (!buildResponse.ok) {
        const errorData = await buildResponse.json().catch(() => null);
        
        // Handle specific error cases
        if (errorData?.error?.includes('Error(Contract, #4)') || errorData?.error?.includes('InsufficientBalance')) {
          throw new Error('Vault has insufficient balance to rebalance. Please deposit funds first.');
        } else if (errorData?.error?.includes('Error(Contract, #17)') || errorData?.error?.includes('RouterNotSet')) {
          throw new Error('Vault router not configured. This vault cannot perform cross-protocol rebalancing yet.');
        } else if (errorData?.error) {
          throw new Error(errorData.error);
        } else {
          throw new Error('Failed to build rebalance transaction');
        }
      }

      const buildData = await buildResponse.json();
      
      if (!buildData.success) {
        throw new Error(buildData.error || 'Failed to build transaction');
      }

      notification?.addNotification('Please sign the rebalance transaction', 'warning');

      // Sign transaction
      const { signedTxXdr } = await signTransaction(buildData.data.xdr, { networkPassphrase: buildData.data.networkPassphrase });

      // Submit signed transaction
      const submitResponse = await fetch(
        `${backendUrl}/api/vaults/${vaultId}/submit-rebalance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedXDR: signedTxXdr,
            network,
          }),
        }
      );

      if (!submitResponse.ok) {
        throw new Error('Failed to submit rebalance transaction');
      }

      const submitData = await submitResponse.json();

      if (!submitData.success) {
        throw new Error(submitData.error || 'Transaction failed');
      }

      notification?.addNotification('Vault rebalanced successfully! 🎉', 'success');
      
      // Dismiss the alert after successful rebalance
      setDismissed(true);
      
      // Call the callback if provided
      if (onRebalance) {
        onRebalance();
      }

      // Refresh suggestion after a delay
      setTimeout(() => {
        fetchSuggestion();
      }, 2000);

    } catch (error) {
      console.error('[RebalancingAlert] Error rebalancing:', error);
      notification?.addNotification(
        error instanceof Error ? error.message : 'Failed to rebalance vault',
        'error'
      );
    } finally {
      setRebalancing(false);
    }
  }

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!suggestion || !suggestion.shouldRebalance || dismissed) {
    return null; // No suggestion or user dismissed
  }

  // Calculate time since last check
  const timeSinceCheck = Date.now() - new Date(suggestion.checkedAt).getTime();
  const minutesSinceCheck = Math.floor(timeSinceCheck / (60 * 1000));
  const isRecent = minutesSinceCheck < 10;

  return (
    <div className="bg-neutral-800 border border-warning-500/30 rounded-lg p-5 mb-4 hover:border-warning-500/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-warning-500/20 to-warning-600/20 flex items-center justify-center border border-warning-500/30">
            <TrendingUp className="w-6 h-6 text-warning-400" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h4 className="text-base font-semibold text-neutral-50 flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-warning-400" />
                Better Yield Opportunity Available
              </h4>
              <p className="text-sm text-neutral-400">
                Rebalancing across protocols could improve your returns
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-neutral-500 hover:text-neutral-300 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-700">
              <p className="text-xs text-neutral-500 mb-1.5">Current APY</p>
              <p className="text-xl font-bold text-neutral-100">
                {suggestion.currentAPY.toFixed(2)}%
              </p>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-3 border border-success-500/20">
              <p className="text-xs text-neutral-500 mb-1.5">Potential APY</p>
              <p className="text-xl font-bold text-success-400">
                {suggestion.potentialAPY.toFixed(2)}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-success-500/10 to-success-600/10 rounded-lg p-3 border border-success-500/30">
              <p className="text-xs text-success-400 mb-1.5">Improvement</p>
              <p className="text-xl font-bold text-success-400">
                +{suggestion.improvement.toFixed(2)}%
              </p>
            </div>
          </div>

          {suggestion.strategy && (
            <div className="bg-neutral-900/30 rounded-lg p-3 mb-4 border border-neutral-700/50">
              <p className="text-xs font-medium text-neutral-400 mb-1.5">Suggested Strategy:</p>
              <p className="text-sm text-neutral-300 leading-relaxed">{suggestion.strategy.rationale}</p>
            </div>
          )}

          <div className="bg-warning-900/20 border border-warning-500/20 rounded-lg p-3 mb-4">
            <p className="text-xs text-warning-400 font-medium mb-1">💡 Note:</p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This rebalancing suggestion is based on current protocol yields. The actual vault rebalancing happens between configured assets, not protocols. 
              For cross-protocol routing, use the optimized deposit feature when adding new funds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRebalance}
              disabled={rebalancing || !address}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-black text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className={`w-4 h-4 ${rebalancing ? 'animate-pulse' : ''}`} />
              {rebalancing ? 'Rebalancing...' : 'Rebalance Now'}
            </button>
            
            <button
              onClick={triggerManualCheck}
              disabled={checking || rebalancing}
              className="px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Recheck'}
            </button>

            <div className="flex-1" />

            {isRecent && (
              <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></div>
                Checked {minutesSinceCheck}m ago
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component to display all rebalancing suggestions across vaults
 */
export function RebalancingSuggestionsList() {
  const [suggestions, setSuggestions] = useState<RebalanceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';

  useEffect(() => {
    fetchAllSuggestions();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAllSuggestions, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  async function fetchAllSuggestions() {
    try {
      const response = await fetch(
        `${backendUrl}/api/protocols/rebalance-suggestions`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.data || []);
        }
      }
    } catch (error) {
      console.error('[RebalancingSuggestionsList] Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-700 rounded w-1/4"></div>
          <div className="h-20 bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show empty state on dashboard
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-neutral-50 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-warning-400" />
          Yield Optimization Suggestions
        </h3>
        <span className="px-3 py-1.5 bg-warning-500/10 border border-warning-500/20 text-warning-400 text-xs font-semibold rounded-full">
          {suggestions.length} {suggestions.length === 1 ? 'opportunity' : 'opportunities'}
        </span>
      </div>
      
      {suggestions.map((suggestion) => (
        <RebalancingAlert
          key={suggestion.vaultId}
          vaultId={suggestion.vaultId}
          network={suggestion.network}
        />
      ))}
    </div>
  );
}
