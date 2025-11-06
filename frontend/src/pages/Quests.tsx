import { useState, useEffect } from 'react';
import { useWallet } from '../providers/WalletProvider';
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Lightbulb,
  Gift,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { QuestWithProgress, QuestStatsResponse } from '../../../shared/types';
import { questHints } from '../services/questHints';
import { showToast } from '../components/ui/Toast';

const API_URL = `${import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com'}/api`;

const categoryIcons: Record<string, any> = {
  basics: Sparkles,
  defi: TrendingUp,
  vaults: Trophy,
  advanced: Award,
};

const categoryColors: Record<string, string> = {
  basics: 'text-blue-500',
  defi: 'text-green-500',
  vaults: 'text-purple-500',
  advanced: 'text-orange-500',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500',
  intermediate: 'bg-yellow-500/10 text-yellow-500',
  advanced: 'bg-red-500/10 text-red-500',
};

interface UserNFT {
  nft_id: string;
  name: string;
  description: string;
  image_url: string;
  ownership_percentage: number;
  claimed_at: string;
  transaction_hash: string;
}

export default function Quests() {
  const { address: publicKey } = useWallet();
  const [quests, setQuests] = useState<QuestWithProgress[]>([]);
  const [stats, setStats] = useState<QuestStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [claimingQuest, setClaimingQuest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quests' | 'nfts'>('quests');
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [nftsLoading, setNftsLoading] = useState(false);

  useEffect(() => {
    if (publicKey) {
      fetchQuests();
      fetchStats();
      if (activeTab === 'nfts') {
        fetchUserNFTs();
      }
    }
  }, [publicKey, activeTab]);

  // Refetch quests when page becomes visible (user comes back from another page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && publicKey) {
        console.log('Page visible again, refetching quests...');
        fetchQuests();
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [publicKey]);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/quests?walletAddress=${publicKey}`);
      const data = await response.json();
      
      if (data.success) {
        setQuests(data.data);
      }
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/quests/stats?walletAddress=${publicKey}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching quest stats:', error);
    }
  };

  const fetchUserNFTs = async () => {
    try {
      setNftsLoading(true);
      const response = await fetch(`${API_URL}/quests/nfts?walletAddress=${publicKey}`);
      const data = await response.json();
      
      if (data.success) {
        setUserNFTs(data.data);
      }
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
    } finally {
      setNftsLoading(false);
    }
  };

  const handleClaimReward = async (questId: string) => {
    try {
      setClaimingQuest(questId);
      
      // Step 1: Get unsigned transaction from backend
      const response = await fetch(`${API_URL}/quests/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey,
          questId,
        }),
      });

      const data = await response.json();
      
      if (!data.success || !data.data?.xdr) {
        showToast.error(`Failed to build claim transaction: ${data.error?.message || 'Unknown error'}`);
        setClaimingQuest(null);
        return;
      }

      // Step 2: Sign transaction with user's wallet
      try {
        // Import wallet utility
        const { wallet } = await import('../util/wallet');
        
        console.log('[Quest Claim] Requesting wallet signature...');
        const signedXdr = await wallet.signTransaction(data.data.xdr);
        
        if (!signedXdr) {
          showToast.warning('Transaction signing was cancelled');
          setClaimingQuest(null);
          return;
        }

        console.log('[Quest Claim] Transaction signed, submitting to network...');

        // Step 3: Submit signed transaction to blockchain
        const submitResponse = await fetch(`${API_URL}/quests/claim/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedXdr,
            network: 'testnet',
          }),
        });

        const submitData = await submitResponse.json();
        
        if (!submitData.success) {
          showToast.error(`Failed to submit transaction: ${submitData.error?.message || 'Unknown error'}`);
          setClaimingQuest(null);
          return;
        }

        console.log('[Quest Claim] Transaction submitted:', submitData.data?.transactionHash);
        
        // Step 4: Confirm with backend database
        const confirmResponse = await fetch(`${API_URL}/quests/claim/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: publicKey,
            questId,
            transactionHash: submitData.data?.transactionHash || 'unknown',
            nftTokenId: submitData.data?.nftTokenId || `QUEST_${questId}_${Date.now()}`,
          }),
        });

        const confirmData = await confirmResponse.json();
        
        if (confirmData.success) {
          // Refresh quests and stats
          await fetchQuests();
          await fetchStats();
          
          // Show success message
          showToast.success('🎉 NFT minted successfully! Check your wallet for your new quest NFT.');
        } else {
          showToast.error(`Failed to confirm NFT claim: ${confirmData.error?.message}`);
        }
      } catch (signError: any) {
        console.error('Error signing transaction:', signError);
        if (signError.message?.includes('User rejected')) {
          showToast.warning('You rejected the transaction. NFT was not minted.');
        } else {
          showToast.error(`Failed to sign transaction: ${signError.message || 'Please check your wallet and try again.'}`);
        }
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      showToast.error('Failed to claim reward. Please try again.');
    } finally {
      setClaimingQuest(null);
    }
  };

  const handleStartHints = (quest: QuestWithProgress) => {
    // Start the hint tour with driver.js
    questHints.startHintTour(quest.hintSteps, quest.title);
  };

  const filteredQuests = selectedCategory === 'all'
    ? quests
    : quests.filter(q => q.category === selectedCategory);

  const categories = [
    { key: 'all', label: 'All Quests' },
    { key: 'basics', label: 'Basics' },
    { key: 'defi', label: 'DeFi' },
    { key: 'vaults', label: 'Vaults' },
    { key: 'advanced', label: 'Advanced' },
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-neutral-800 rounded-lg animate-pulse"></div>
            <div className="h-8 w-32 bg-neutral-800 rounded animate-pulse"></div>
          </div>
          <div className="h-4 w-96 bg-neutral-800 rounded animate-pulse"></div>
        </div>

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-secondary border border-default rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neutral-800 rounded-lg animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-neutral-800 rounded animate-pulse"></div>
                  <div className="h-7 w-12 bg-neutral-800 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Filter Skeleton */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 bg-neutral-800 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>

        {/* Quests Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-secondary border border-default rounded-lg p-6"
            >
              {/* Quest Header Skeleton */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-neutral-800 rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-neutral-800 rounded animate-pulse"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-20 bg-neutral-800 rounded animate-pulse"></div>
                      <div className="h-4 w-8 bg-neutral-800 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quest Description Skeleton */}
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-neutral-800 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-neutral-800 rounded animate-pulse"></div>
              </div>

              {/* Reward NFT Preview Skeleton */}
              <div className="bg-app border border-default rounded-lg p-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-800 rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 bg-neutral-800 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-neutral-800 rounded-lg animate-pulse"></div>
                <div className="flex-1 h-10 bg-neutral-800 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-neutral-50">Quests</h1>
        </div>
        <p className="text-neutral-400">
          Complete quests to learn about DeFi and earn exclusive NFT rewards!
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-secondary border border-default rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Trophy className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400">Total Quests</p>
                <p className="text-2xl font-bold text-neutral-50">{stats.totalQuests}</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary border border-default rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400">Completed</p>
                <p className="text-2xl font-bold text-neutral-50">{stats.completedQuests}</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary border border-default rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Gift className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400">NFTs Earned</p>
                <p className="text-2xl font-bold text-neutral-50">{stats.nftsEarned}</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary border border-default rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400">Progress</p>
                <p className="text-2xl font-bold text-neutral-50">
                  {stats.completionRate.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-default">
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-4 py-3 font-medium transition-all relative ${
            activeTab === 'quests'
              ? 'text-primary-500'
              : 'text-neutral-400 hover:text-neutral-50'
          }`}
        >
          Quests
          {activeTab === 'quests' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('nfts')}
          className={`px-4 py-3 font-medium transition-all relative ${
            activeTab === 'nfts'
              ? 'text-primary-500'
              : 'text-neutral-400 hover:text-neutral-50'
          }`}
        >
          My NFTs
          {activeTab === 'nfts' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
            />
          )}
        </button>
      </div>

      {/* Quests Tab Content */}
      {activeTab === 'quests' && (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category.key
                    ? 'bg-primary-500 text-black'
                    : 'bg-secondary border border-default text-neutral-400 hover:text-neutral-50'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Quests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuests.map((quest, index) => {
          const CategoryIcon = categoryIcons[quest.category];
          const status = quest.userQuest?.status || 'not_started';
          const isCompleted = status === 'completed';
          const isClaimed = status === 'claimed';
          const isInProgress = status === 'in_progress';

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-secondary border border-default rounded-lg p-6 hover:border-primary-500/50 transition-all"
            >
              {/* Quest Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 bg-opacity-10 rounded-lg ${categoryColors[quest.category]}`}>
                    <CategoryIcon className={`w-6 h-6 ${categoryColors[quest.category]}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-50 mb-1">{quest.title}</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${difficultyColors[quest.difficulty]}`}
                      >
                        {quest.difficulty}
                      </span>
                      <span className="text-xs text-neutral-500">#{quest.orderIndex}</span>
                    </div>
                  </div>
                </div>

                {isClaimed && (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                )}
                {isInProgress && (
                  <Clock className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                )}
              </div>

              {/* Quest Description */}
              <p className="text-neutral-400 text-sm mb-4">{quest.description}</p>

              {/* Reward NFT Preview */}
              <div className="bg-app border border-default rounded-lg p-3 mb-4">
                <div className="flex items-center gap-3">
                  {quest.rewardNftImage ? (
                    <img
                      src={quest.rewardNftImage}
                      alt={quest.rewardNftName}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        // Fallback to gradient if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center ${quest.rewardNftImage ? 'hidden' : ''}`}>
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Reward</p>
                    <p className="text-sm font-medium text-neutral-50">{quest.rewardNftName}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isClaimed && (
                  <button
                    onClick={() => handleStartHints(quest)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary border border-default rounded-lg text-neutral-300 hover:text-neutral-50 hover:border-primary-500/50 transition-all"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Hints</span>
                  </button>
                )}

                {isCompleted && (
                  <button
                    onClick={() => handleClaimReward(quest.id)}
                    disabled={claimingQuest === quest.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-black rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{claimingQuest === quest.id ? 'Claiming...' : 'Claim NFT'}</span>
                  </button>
                )}

                {isClaimed && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Claimed</span>
                  </div>
                )}

                {!isCompleted && !isClaimed && !isInProgress && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary border border-default text-neutral-400 rounded-lg">
                    <span>Not Started</span>
                  </div>
                )}

                {isInProgress && !isCompleted && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg font-medium">
                    <Clock className="w-4 h-4" />
                    <span>In Progress</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredQuests.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400">No quests found in this category.</p>
        </div>
      )}
        </>
      )}

      {/* NFT Gallery Tab Content */}
      {activeTab === 'nfts' && (
        <div className="space-y-6">
          {nftsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-secondary border border-default rounded-lg p-6 animate-pulse">
                  <div className="aspect-square bg-neutral-800 rounded-lg mb-4"></div>
                  <div className="h-6 bg-neutral-800 rounded mb-2"></div>
                  <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : userNFTs.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-neutral-50">Your Quest NFTs</h2>
                <span className="text-sm text-neutral-400">{userNFTs.length} NFT{userNFTs.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userNFTs.map((nft, index) => (
                  <motion.div
                    key={nft.nft_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-secondary border border-default rounded-lg overflow-hidden hover:border-primary-500/50 transition-all group"
                  >
                    {/* NFT Image */}
                    <div className="aspect-square bg-gradient-to-br from-primary-500/20 to-purple-500/20 relative overflow-hidden">
                      <img
                        src={nft.image_url}
                        alt={nft.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-4xl">🏆</div>';
                        }}
                      />
                    </div>

                    {/* NFT Details */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-50 mb-1">{nft.name}</h3>
                        <p className="text-sm text-neutral-400 line-clamp-2">{nft.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-neutral-500">Ownership</p>
                          <p className="text-primary-500 font-medium">{(nft.ownership_percentage / 100).toFixed(2)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-neutral-500">Claimed</p>
                          <p className="text-neutral-400 font-medium">
                            {new Date(nft.claimed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* View on Explorer */}
                      {nft.transaction_hash && nft.transaction_hash !== 'pending' && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${nft.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center px-3 py-2 bg-app border border-default hover:border-primary-500/50 text-primary-500 rounded-lg text-sm font-medium transition-all"
                        >
                          View on Explorer →
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="bg-secondary border border-default rounded-lg p-12 max-w-md mx-auto">
                <Gift className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-50 mb-2">No NFTs Yet</h3>
                <p className="text-neutral-400 mb-6">
                  Complete quests and claim NFT rewards to build your collection!
                </p>
                <button
                  onClick={() => setActiveTab('quests')}
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all"
                >
                  Browse Quests
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
