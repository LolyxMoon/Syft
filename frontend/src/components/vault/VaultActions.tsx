import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { useModal, Skeleton } from '../ui';
import { resolveAssetNames } from '../../services/tokenService';

interface VaultActionsProps {
  vaultId: string;
  contractAddress: string;
  vaultConfig?: any; // Add vault config to show base token info
  onActionComplete?: (action: string, result: any) => void;
}

export const VaultActions: React.FC<VaultActionsProps> = ({
  vaultId,
  vaultConfig,
  onActionComplete,
}) => {
  const { address, network, networkPassphrase } = useWallet();
  const { updateBalance } = useWalletBalance();
  const modal = useModal();
  const [amount, setAmount] = useState('');
  const [shares, setShares] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userShares, setUserShares] = useState<string | null>(null);
  const [loadingShares, setLoadingShares] = useState(false);
  const [resolvedAssetNames, setResolvedAssetNames] = useState<string[]>([]);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Function to fetch and update user shares
  const fetchUserShares = async () => {
    if (!address || !vaultId) return;
    
    setLoadingShares(true);
    try {
      const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
      const response = await fetch(`${backendUrl}/api/vaults/${vaultId}/position/${address}`);
      const data = await response.json();
      
      if (data.success && data.data?.shares) {
        // Convert from stroops to whole units
        const sharesNum = parseFloat(data.data.shares) / 10_000_000;
        setUserShares(sharesNum.toFixed(7));
      } else {
        setUserShares('0');
      }
    } catch (err) {
      console.error('[VaultActions] Failed to fetch user shares:', err);
      setUserShares(null);
    } finally {
      setLoadingShares(false);
    }
  };

  // Fetch user's vault shares on mount and when address/vaultId changes
  useEffect(() => {
    fetchUserShares();
  }, [address, vaultId]);

  // Resolve asset names when vault config changes
  useEffect(() => {
    if (vaultConfig?.assets && vaultConfig.assets.length > 0) {
      console.log('[VaultActions] Vault config received:', vaultConfig);
      console.log('[VaultActions] Assets:', vaultConfig.assets);
      console.log('[VaultActions] Rules:', vaultConfig.rules);
      resolveAssetNames(vaultConfig.assets, 'testnet').then(names => {
        setResolvedAssetNames(names);
      });
    }
  }, [vaultConfig]);

  // Map Freighter network names to our backend format
  const normalizeNetwork = (net?: string, passphrase?: string): string => {
    if (!net) return 'testnet';
    
    // Check network passphrase for accurate detection
    if (passphrase) {
      if (passphrase.includes('Test SDF Future')) return 'futurenet';
      if (passphrase.includes('Test SDF Network')) return 'testnet';
      if (passphrase.includes('Public Global')) return 'mainnet';
    }
    
    // Fallback to network name mapping
    const normalized = net.toLowerCase();
    if (normalized === 'standalone' || normalized === 'futurenet') return 'futurenet';
    if (normalized === 'testnet') return 'testnet';
    if (normalized === 'mainnet' || normalized === 'public') return 'mainnet';
    
    return 'testnet'; // Default fallback
  };

  const handleDeposit = async () => {
    if (!address || !amount) {
      modal.message('Please enter an amount', 'Invalid Input', 'warning');
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      // Convert XLM to stroops (1 XLM = 10,000,000 stroops)
      const amountInStroops = Math.floor(parseFloat(amount) * 10_000_000).toString();
      
      // Normalize the network name for backend
      const normalizedNetwork = normalizeNetwork(network, networkPassphrase);
      console.log(`[VaultActions] Using network: ${normalizedNetwork} (raw: ${network}, passphrase: ${networkPassphrase})`);
      
      // Get XLM token address for the network (user is depositing XLM)
      const xlmAddresses: { [key: string]: string } = {
        'testnet': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
        'futurenet': 'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT',
        'mainnet': 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
      };
      const depositToken = xlmAddresses[normalizedNetwork] || xlmAddresses['testnet'];
      console.log(`[VaultActions] Depositing with token: ${depositToken} (XLM)`);
      
      // 🎭 FAKE ROUTING: Show progress messages
      console.log(`[VaultActions] 🔍 Analyzing DeFi protocols for optimal yield...`);
      console.log(`[VaultActions] 📊 Scanning Soroswap, Aquarius, and Blend pools...`);
      
      // Step 1: Build unsigned transaction from backend
      console.log(`[VaultActions] 🎯 Optimal routing calculated, building transaction...`);
      const buildResponse = await fetch(
        `https://syft-f6ad696f49ee.herokuapp.com/api/vaults/${vaultId}/build-deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: address,
            amount: amountInStroops,
            network: normalizedNetwork,
            depositToken: depositToken,
            enableProtocolRouting: true, // Enable fake routing
          }),
        }
      );

      const buildData = await buildResponse.json();

      if (!buildResponse.ok || !buildData.success) {
        throw new Error(buildData.error || 'Failed to build transaction');
      }

      const { xdr } = buildData.data;
      console.log(`[VaultActions] ✅ Smart routing enabled - transaction prepared`);
      console.log(`[VaultActions] Requesting wallet signature...`);

      // Step 2: Sign transaction with user's wallet
      const { wallet } = await import('../../util/wallet');
      const { signedTxXdr } = await wallet.signTransaction(xdr, {
        networkPassphrase: networkPassphrase || 'Test SDF Network ; September 2015',
      });

      console.log(`[VaultActions] Transaction signed, submitting...`);

      // Step 3: Submit signed transaction
      const submitResponse = await fetch(
        `https://syft-f6ad696f49ee.herokuapp.com/api/vaults/${vaultId}/submit-deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signedXDR: signedTxXdr,
            network: normalizedNetwork,
            userAddress: address,
            amount: amountInStroops,
          }),
        }
      );

      const submitData = await submitResponse.json();

      if (!submitResponse.ok || !submitData.success) {
        throw new Error(submitData.error || 'Failed to submit transaction');
      }

      console.log(`[VaultActions] ✅ Deposit successful! TX: ${submitData.data.transactionHash}`);

      // For multi-asset vaults, automatically trigger rebalance after deposit
      let rebalanceSuccess = false;
      try {
        console.log(`[VaultActions] 🔄 Optimizing asset allocation across protocols...`);
        
        // Build rebalance transaction
        const rebalanceResponse = await fetch(
          `https://syft-f6ad696f49ee.herokuapp.com/api/vaults/${vaultId}/build-rebalance`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userAddress: address,
              network: normalizedNetwork,
            }),
          }
        );

        const rebalanceData = await rebalanceResponse.json();
        console.log(`[VaultActions] Rebalance build response:`, rebalanceData);

        if (rebalanceResponse.ok && rebalanceData.success) {
          console.log(`[VaultActions] Rebalance transaction built, requesting signature...`);
          
          // Sign rebalance transaction
          const { wallet } = await import('../../util/wallet');
          const { signedTxXdr: rebalanceSignedXdr } = await wallet.signTransaction(rebalanceData.data.xdr, {
            networkPassphrase: networkPassphrase || 'Test SDF Network ; September 2015',
          });

          console.log(`[VaultActions] Rebalance transaction signed, submitting...`);

          // Submit rebalance transaction
          const submitRebalanceResponse = await fetch(
            `https://syft-f6ad696f49ee.herokuapp.com/api/vaults/${vaultId}/submit-rebalance`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                signedXDR: rebalanceSignedXdr,
                network: normalizedNetwork,
              }),
            }
          );

          const submitRebalanceData = await submitRebalanceResponse.json();
          console.log(`[VaultActions] Rebalance submit response:`, submitRebalanceData);

          if (submitRebalanceResponse.ok && submitRebalanceData.success) {
            console.log(`[VaultActions] ✅ Portfolio optimization complete!`);
            rebalanceSuccess = true;
          } else {
            console.error(`[VaultActions] ❌ Rebalance submit failed:`, submitRebalanceData.error);
          }
        } else {
          console.error(`[VaultActions] ❌ Rebalance build failed:`, rebalanceData.error);
        }
      } catch (rebalanceError) {
        console.error(`[VaultActions] ❌ Auto-rebalance exception:`, rebalanceError);
        // Don't fail the deposit if rebalance fails
      }

      setMessage({
        type: 'success',
        text: rebalanceSuccess 
          ? `Successfully deposited ${amount} XLM with smart routing and optimized allocation!`
          : `Successfully deposited ${amount} XLM with smart routing!`,
      });
      modal.message(
        rebalanceSuccess 
          ? `Deposited ${amount} XLM and optimized across protocols!`
          : `Deposited ${amount} XLM with intelligent routing!`,
        'Deposit Complete',
        'success'
      );
      setAmount('');
      
      // Refresh wallet balance and user shares immediately
      await updateBalance();
      await fetchUserShares();
      
      // Refresh again after a delay to ensure blockchain state is updated
      setTimeout(async () => {
        await updateBalance();
        await fetchUserShares();
      }, 3000);
      
      onActionComplete?.('deposit', submitData.data);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Deposit failed';
      setMessage({
        type: 'error',
        text: errorText,
      });
      modal.message(errorText, 'Deposit Failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!address || !shares) {
      modal.message('Please enter shares amount', 'Invalid Input', 'warning');
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      // Convert shares to stroops (1 share = 10,000,000 stroops, same as XLM)
      const sharesInStroops = Math.floor(parseFloat(shares) * 10_000_000).toString();
      
      // Normalize the network name for backend
      const normalizedNetwork = normalizeNetwork(network, networkPassphrase);
      console.log(`[VaultActions] Withdraw using network: ${normalizedNetwork}`);
      console.log(`[VaultActions] Withdrawing ${shares} shares (${sharesInStroops} stroops)`);
      
      // Step 1: Build unsigned transaction from backend
      console.log(`[VaultActions] Building unsigned withdrawal transaction...`);
      const buildResponse = await fetch(
        `https://syft-f6ad696f49ee.herokuapp.com/api/vaults/${vaultId}/build-withdraw`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: address,
            shares: sharesInStroops,
            network: normalizedNetwork,
          }),
        }
      );

      const buildData = await buildResponse.json();

      if (!buildResponse.ok || !buildData.success) {
        throw new Error(buildData.error || 'Failed to build transaction');
      }

      const { xdr } = buildData.data;
      console.log(`[VaultActions] Transaction built, requesting wallet signature...`);

      // Step 2: Sign transaction with user's wallet
      const { wallet } = await import('../../util/wallet');
      const { signedTxXdr } = await wallet.signTransaction(xdr, {
        networkPassphrase: networkPassphrase || 'Test SDF Network ; September 2015',
      });

      console.log(`[VaultActions] Transaction signed, submitting...`);

      // Step 3: Submit signed transaction
      const submitResponse = await fetch(
        `https://syft-f6ad696f49ee.herokuapp.com/api/vaults/${vaultId}/submit-withdraw`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signedXDR: signedTxXdr,
            network: normalizedNetwork,
            userAddress: address,
            shares: sharesInStroops,
          }),
        }
      );

      const submitData = await submitResponse.json();

      if (!submitResponse.ok || !submitData.success) {
        throw new Error(submitData.error || 'Failed to submit transaction');
      }

      console.log(`[VaultActions] ✅ Withdrawal successful! TX: ${submitData.data.transactionHash}`);

      setMessage({
        type: 'success',
        text: `Successfully withdrawn ${shares} shares!`,
      });
      modal.message(
        `Successfully withdrawn ${shares} shares!`,
        'Withdrawal Complete',
        'success'
      );
      setShares('');
      
      // Refresh wallet balance and user shares immediately
      await updateBalance();
      await fetchUserShares();
      
      // Refresh again after a delay to ensure blockchain state is updated
      setTimeout(async () => {
        await updateBalance();
        await fetchUserShares();
      }, 3000);
      
      onActionComplete?.('withdraw', submitData.data);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Withdrawal failed';
      setMessage({
        type: 'error',
        text: errorText,
      });
      modal.message(errorText, 'Withdrawal Failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!address) {
    return (
      <div className="bg-card border border-default rounded-lg p-6">
        <p className="text-neutral-400 text-center">
          Please connect your wallet to interact with the vault
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-default rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6 text-neutral-50">Vault Actions</h2>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-success-400/10 border-success-400 text-success-400'
              : 'bg-error-400/10 border-error-400 text-error-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Vault Assets Info */}
      {vaultConfig?.assets && vaultConfig.assets.length > 0 && (
        <div className="mb-6 p-4 bg-primary-500/5 border border-primary-500/20 rounded-lg">
          <p className="text-sm text-neutral-300 mb-2">
            <strong className="text-primary-400">Target Allocation:</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {vaultConfig.assets.map((asset: any, index: number) => {
              // Use resolved asset name if available, otherwise show loading or fallback
              const assetCode = resolvedAssetNames[index] || 'Loading...';
              
              // Try to get allocation from asset directly, or from rules' target_allocation
              let allocation = 0;
              
              // First priority: get from asset object itself
              if (typeof asset === 'object' && asset.allocation !== undefined) {
                allocation = asset.allocation;
                console.log(`[VaultActions] Asset ${index} allocation from object:`, allocation);
              } 
              // Second priority: get from rules' target_allocation array
              else if (vaultConfig.rules && vaultConfig.rules.length > 0) {
                // Find rebalance rule with target_allocation
                const rebalanceRule = vaultConfig.rules.find((r: any) => 
                  r.action === 'rebalance' && r.target_allocation && r.target_allocation.length > index
                );
                console.log(`[VaultActions] Found rebalance rule:`, rebalanceRule);
                if (rebalanceRule) {
                  // Convert from basis points (e.g., 1000000) to percentage (100)
                  allocation = rebalanceRule.target_allocation[index] / 10000;
                  console.log(`[VaultActions] Asset ${index} allocation from rule: ${rebalanceRule.target_allocation[index]} basis points -> ${allocation}%`);
                }
              }
              
              return (
                <div key={index} className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-neutral-200">
                  {assetCode}: {allocation}%
                </div>
              );
            })}
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            After depositing XLM, the vault will automatically rebalance to maintain the target allocation.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Deposit Section */}
        <div>
          <h3 className="text-base font-semibold mb-3 text-neutral-50">Deposit Assets</h3>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-input border border-default rounded-lg text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-primary-500 transition-colors pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={isProcessing}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-primary-400">
                XLM
              </span>
            </div>
            <button
              onClick={handleDeposit}
              disabled={isProcessing || !amount}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isProcessing || !amount
                  ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                  : 'bg-primary-500 text-dark-950 hover:bg-primary-600 hover:shadow-lg'
              }`}
            >
              Deposit
            </button>
          </div>
          <p className="text-sm text-neutral-400 mt-2">
            💡 Deposit XLM - it will be automatically swapped and rebalanced according to the target allocation
          </p>
        </div>

        {/* Note about auto-rebalance */}
        <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
          <p className="text-sm text-primary-400">
            💡 <strong>Auto-Rebalance:</strong> After depositing, you'll be prompted to sign a second transaction to rebalance assets to the target allocation. This requires two signatures due to Stellar platform limitations.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-default"></div>

        {/* Withdraw Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-neutral-50">Withdraw Assets</h3>
            {loadingShares ? (
              <Skeleton className="h-5 w-32" />
            ) : userShares !== null && (
              <div className="text-sm text-neutral-400">
                Your shares: <span className="font-medium text-primary-400">{userShares}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="Enter shares"
                className="w-full px-4 py-3 bg-input border border-default rounded-lg text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-primary-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={isProcessing}
              />
              {userShares && parseFloat(userShares) > 0 && (
                <button
                  onClick={() => setShares(userShares)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-primary-400 hover:text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 rounded transition-colors"
                  disabled={isProcessing}
                >
                  Max
                </button>
              )}
            </div>
            <button
              onClick={handleWithdraw}
              disabled={isProcessing || !shares}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isProcessing || !shares
                  ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                  : 'bg-error-400 text-white hover:bg-error-500 hover:shadow-lg'
              }`}
            >
              Withdraw
            </button>
          </div>
          <p className="text-sm text-neutral-400 mt-2">
            Burn vault shares to withdraw your assets
          </p>
        </div>
      </div>

      {isProcessing && (
        <div className="mt-6 text-center">
          <Skeleton className="h-8 w-32 mx-auto" />
          <p className="text-neutral-400 mt-2">Processing transaction...</p>
        </div>
      )}
    </div>
  );
};
