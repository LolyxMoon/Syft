// Profit Distribution Component
// Shows profit distribution history and stats for NFT holders

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Distribution {
  id: string;
  vault_id: string;
  distribution_type: 'nft_holder' | 'vault_subscriber';
  transaction_hash: string;
  recipient_wallet_address: string;
  recipient_nft_id?: string;
  token_symbol: string;
  amount: number;
  profit_share_percentage?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  initiated_at: string;
  completed_at?: string;
}

interface NFTStats {
  total_distributions_count: number;
  total_profit_received: number;
  last_distribution_amount?: number;
  last_distribution_at?: string;
}

interface ProfitDistributionProps {
  walletAddress: string;
  nftId?: string;
}

export function ProfitDistribution({ walletAddress, nftId }: ProfitDistributionProps) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [nftStats, setNftStats] = useState<NFTStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const backendUrl = import.meta.env.VITE_VITE_PUBLIC_BACKEND_URL || 
                     'https://syft-f6ad696f49ee.herokuapp.com';

  useEffect(() => {
    loadDistributionData();
  }, [walletAddress, nftId]);

  const loadDistributionData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load distribution history for wallet
      const historyResponse = await fetch(
        `${backendUrl}/api/distributions/wallet/${walletAddress}/history`
      );
      const historyData = await historyResponse.json();

      if (historyData.success) {
        setDistributions(historyData.data);
      }

      // Load NFT-specific stats if nftId provided
      if (nftId) {
        const statsResponse = await fetch(
          `${backendUrl}/api/distributions/nft/${nftId}/stats`
        );
        const statsData = await statsResponse.json();

        if (statsData.success) {
          setNftStats(statsData.data);
        }
      }
    } catch (err: any) {
      console.error('[Profit Distribution] Error loading data:', err);
      setError(err.message || 'Failed to load distribution data');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 7,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'processing':
        return 'text-blue-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-neutral-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'processing':
        return '⟳';
      case 'failed':
        return '✗';
      default:
        return '○';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* NFT Stats Card */}
      {nftStats && (
        <Card className="p-6 bg-gradient-to-br from-primary-900/20 to-secondary-900/20 border-primary-500/30">
          <h3 className="text-xl font-semibold text-neutral-50 mb-4 flex items-center gap-2">
            💰 Your NFT Profit Earnings
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-neutral-400 mb-1">Total Distributions</div>
              <div className="text-2xl font-bold text-primary-400">
                {nftStats.total_distributions_count}
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-400 mb-1">Total Earned</div>
              <div className="text-2xl font-bold text-green-400">
                {formatAmount(nftStats.total_profit_received)}
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-400 mb-1">Last Distribution</div>
              <div className="text-2xl font-bold text-neutral-50">
                {nftStats.last_distribution_amount 
                  ? formatAmount(nftStats.last_distribution_amount)
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-400 mb-1">Last Received</div>
              <div className="text-sm font-medium text-neutral-300">
                {nftStats.last_distribution_at
                  ? formatDate(nftStats.last_distribution_at)
                  : 'Never'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Distribution History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-neutral-50">Distribution History</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDistributionData}
            className="text-sm"
          >
            ↻ Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {distributions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-neutral-400 mb-2">No profit distributions yet</p>
            <p className="text-sm text-neutral-500">
              You'll see your profit distributions here once vaults start generating profits
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {distributions.map((distribution) => (
              <div
                key={distribution.id}
                className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50 hover:border-primary-500/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-lg ${getStatusColor(distribution.status)}`}>
                        {getStatusIcon(distribution.status)}
                      </span>
                      <div>
                        <div className="font-semibold text-neutral-50">
                          {formatAmount(distribution.amount)} {distribution.token_symbol}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {distribution.distribution_type === 'nft_holder' 
                            ? 'NFT Holder Profit' 
                            : 'Vault Creator Commission'}
                          {distribution.profit_share_percentage && 
                            ` · ${distribution.profit_share_percentage}% share`
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
                      <span>
                        {formatDate(distribution.initiated_at)}
                      </span>
                      {distribution.transaction_hash && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${distribution.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300 hover:underline"
                        >
                          View Transaction →
                        </a>
                      )}
                    </div>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    distribution.status === 'completed' 
                      ? 'bg-green-500/10 text-green-400'
                      : distribution.status === 'failed'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {distribution.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
