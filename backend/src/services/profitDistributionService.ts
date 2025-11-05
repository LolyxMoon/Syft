/**
 * Profit Distribution Service
 * Handles automatic and manual profit distributions to NFT holders and vault subscribers
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { supabase } from '../lib/supabase.js';
import { getNetworkServers } from '../lib/horizonClient.js';

interface DistributionConfig {
  vaultId: string;
  vaultAddress: string;
  nftContractAddress: string;
  tokenAddress: string;
  tokenSymbol?: string;
  network?: string;
}

interface NFTHolder {
  nftId: string;
  holderAddress: string;
  ownershipPercentage: number;
}

interface DistributionResult {
  success: boolean;
  distributionId?: string;
  transactionHash?: string;
  totalDistributed?: number;
  recipientCount?: number;
  error?: string;
}

/**
 * Calculate profit for a vault since last distribution
 */
export async function calculateVaultProfit(vaultId: string): Promise<{
  totalProfit: number;
  profitableAssets: string[];
  lastDistributionDate?: Date;
}> {
  try {
    // Get vault's last profit distribution
    const { data: lastDistribution } = await supabase
      .from('profit_distributions')
      .select('completed_at, amount')
      .eq('vault_id', vaultId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const lastDistributionDate = lastDistribution?.completed_at 
      ? new Date(lastDistribution.completed_at) 
      : null;

    // Get vault performance data since last distribution
    const { data: performanceData } = await supabase
      .from('vault_performance')
      .select('total_value, timestamp')
      .eq('vault_id', vaultId)
      .order('timestamp', { ascending: false })
      .limit(2);

    if (!performanceData || performanceData.length < 2) {
      return {
        totalProfit: 0,
        profitableAssets: [],
        lastDistributionDate: lastDistributionDate || undefined,
      };
    }

    // Calculate profit as difference between current and previous total value
    const currentValue = parseFloat(performanceData[0].total_value);
    const previousValue = parseFloat(performanceData[1].total_value);
    const totalProfit = Math.max(0, currentValue - previousValue);

    return {
      totalProfit,
      profitableAssets: ['base_token'], // Simplified - in production would track per asset
      lastDistributionDate: lastDistributionDate || undefined,
    };
  } catch (error) {
    console.error('[Profit Calc] Error calculating vault profit:', error);
    return {
      totalProfit: 0,
      profitableAssets: [],
    };
  }
}

/**
 * Get all NFT holders for a vault from the smart contract
 */
async function getNFTHoldersFromContract(
  nftContractAddress: string,
  vaultAddress: string,
  network: string
): Promise<NFTHolder[]> {
  try {
    const { sorobanServer } = getNetworkServers(network);
    const contractClient = new StellarSdk.Contract(nftContractAddress);

    // Call get_vault_nfts to get all NFT IDs
    const account = await sorobanServer.getAccount(
      StellarSdk.Keypair.random().publicKey()
    );

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase:
        network === 'mainnet'
          ? StellarSdk.Networks.PUBLIC
          : StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        contractClient.call(
          'get_vault_nfts',
          StellarSdk.nativeToScVal(vaultAddress, { type: 'address' })
        )
      )
      .setTimeout(30)
      .build();

    const simulation = await sorobanServer.simulateTransaction(transaction);

    if (StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
      const nftIds = StellarSdk.scValToNative(simulation.result!.retval);

      // Fetch details for each NFT
      const holders: NFTHolder[] = [];
      for (const nftId of nftIds) {
        const nftTx = new StellarSdk.TransactionBuilder(account, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase:
            network === 'mainnet'
              ? StellarSdk.Networks.PUBLIC
              : StellarSdk.Networks.TESTNET,
        })
          .addOperation(
            contractClient.call(
              'get_nft',
              StellarSdk.nativeToScVal(nftId, { type: 'u64' })
            )
          )
          .setTimeout(30)
          .build();

        const nftSim = await sorobanServer.simulateTransaction(nftTx);
        if (StellarSdk.rpc.Api.isSimulationSuccess(nftSim)) {
          const nftData = StellarSdk.scValToNative(nftSim.result!.retval);
          holders.push({
            nftId: nftId.toString(),
            holderAddress: nftData.holder,
            ownershipPercentage: nftData.ownership_percentage / 100, // Convert basis points to percentage
          });
        }
      }

      return holders;
    }

    return [];
  } catch (error) {
    console.error('[NFT Holders] Error fetching NFT holders:', error);
    return [];
  }
}

/**
 * Distribute profits to NFT holders via smart contract
 */
export async function distributeToNFTHolders(
  config: DistributionConfig,
  totalProfit: number,
  deployerKeypair?: StellarSdk.Keypair
): Promise<DistributionResult> {
  try {
    console.log(`[Distribute NFT] Starting distribution for vault ${config.vaultId}`);
    console.log(`[Distribute NFT] Total profit to distribute: ${totalProfit}`);

    // Get deployer keypair from env if not provided
    const keypair = deployerKeypair || 
      StellarSdk.Keypair.fromSecret(process.env.DEPLOYER_SECRET_KEY!);

    const network = config.network || 'testnet';
    const { sorobanServer, horizonServer } = getNetworkServers(network);

    // Convert profit to stroops (7 decimal places for Stellar tokens)
    const profitAmount = Math.floor(totalProfit * 10000000);

    if (profitAmount <= 0) {
      return {
        success: false,
        error: 'No profit to distribute',
      };
    }

    // Get NFT holders
    const holders = await getNFTHoldersFromContract(
      config.nftContractAddress,
      config.vaultAddress,
      network
    );

    if (holders.length === 0) {
      return {
        success: false,
        error: 'No NFT holders found',
      };
    }

    console.log(`[Distribute NFT] Found ${holders.length} NFT holders`);

    // Build transaction to call distribute_profits on NFT contract
    const sourceAccount = await horizonServer.loadAccount(keypair.publicKey());
    const nftContract = new StellarSdk.Contract(config.nftContractAddress);

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: (parseInt(StellarSdk.BASE_FEE) * 1000).toString(),
      networkPassphrase:
        network === 'mainnet'
          ? StellarSdk.Networks.PUBLIC
          : StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        nftContract.call(
          'distribute_profits',
          StellarSdk.nativeToScVal(config.vaultAddress, { type: 'address' }),
          StellarSdk.nativeToScVal(profitAmount, { type: 'i128' }),
          StellarSdk.nativeToScVal(config.tokenAddress, { type: 'address' })
        )
      )
      .setTimeout(300)
      .build();

    // Simulate first
    console.log('[Distribute NFT] Simulating transaction...');
    const simulation = await sorobanServer.simulateTransaction(transaction);

    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation failed: ${JSON.stringify(simulation.error)}`);
    }

    // Assemble and sign
    const assembledTx = StellarSdk.rpc.assembleTransaction(
      transaction,
      simulation
    ).build();
    
    assembledTx.sign(keypair);

    // Submit transaction
    console.log('[Distribute NFT] Submitting transaction...');
    const response = await sorobanServer.sendTransaction(assembledTx);

    // Wait for confirmation
    let attempts = 0;
    const maxAttempts = 30;
    let txStatus: StellarSdk.rpc.Api.GetTransactionStatus = StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND;

    while (txStatus !== StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await sorobanServer.getTransaction(response.hash);
      txStatus = statusResponse.status;
      attempts++;
      
      if (txStatus === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction failed`);
      }
    }

    if (txStatus !== StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      throw new Error(`Transaction timed out or failed`);
    }

    console.log('[Distribute NFT] Transaction successful:', response.hash);

    // Record distributions in database
    const distributionRecords = holders.map((holder) => ({
      vault_id: config.vaultId,
      distribution_type: 'nft_holder',
      transaction_hash: response.hash,
      contract_address: config.nftContractAddress,
      recipient_wallet_address: holder.holderAddress,
      recipient_nft_id: holder.nftId,
      token_address: config.tokenAddress,
      token_symbol: config.tokenSymbol || 'UNKNOWN',
      amount: (totalProfit * holder.ownershipPercentage) / 100,
      profit_share_percentage: holder.ownershipPercentage,
      status: 'completed',
      completed_at: new Date().toISOString(),
    }));

    const { data: insertedDistributions, error: dbError } = await supabase
      .from('profit_distributions')
      .insert(distributionRecords)
      .select();

    if (dbError) {
      console.error('[Distribute NFT] Database error:', dbError);
    }

    return {
      success: true,
      distributionId: insertedDistributions?.[0]?.id,
      transactionHash: response.hash,
      totalDistributed: totalProfit,
      recipientCount: holders.length,
    };
  } catch (error: any) {
    console.error('[Distribute NFT] Error:', error);
    return {
      success: false,
      error: error.message || 'Distribution failed',
    };
  }
}

/**
 * Distribute profits to vault subscribers (creators who share strategy)
 */
export async function distributeToVaultSubscribers(
  vaultId: string,
  totalProfit: number,
  tokenAddress: string,
  tokenSymbol: string,
  deployerKeypair?: StellarSdk.Keypair
): Promise<DistributionResult> {
  try {
    console.log(`[Distribute Subscribers] Vault ${vaultId}, profit: ${totalProfit}`);

    // Get all subscriptions for this vault where it's the subscribed vault
    const { data: subscriptions, error: subError } = await supabase
      .from('vault_subscriptions')
      .select(`
        id,
        original_vault_id,
        profit_share_percentage,
        vaults!vault_subscriptions_original_vault_id_fkey (
          owner_address,
          contract_address
        )
      `)
      .eq('subscribed_vault_id', vaultId);

    if (subError || !subscriptions || subscriptions.length === 0) {
      return {
        success: false,
        error: 'No subscriptions found for this vault',
      };
    }

    const keypair = deployerKeypair || 
      StellarSdk.Keypair.fromSecret(process.env.DEPLOYER_SECRET_KEY!);

    const network = process.env.STELLAR_NETWORK || 'testnet';
    const { horizonServer } = getNetworkServers(network);

    const tokenClient = new StellarSdk.Contract(tokenAddress);
    const sourceAccount = await horizonServer.loadAccount(keypair.publicKey());

    const distributionRecords = [];
    let totalDistributed = 0;

    // Process each subscription
    for (const subscription of subscriptions) {
      const profitShareAmount = (totalProfit * parseFloat(subscription.profit_share_percentage)) / 100;
      
      if (profitShareAmount <= 0) continue;

      const vault = subscription.vaults as any;
      const creatorAddress = vault.owner_address;

      // Build transfer transaction
      const amountInStroops = Math.floor(profitShareAmount * 10000000);
      
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase:
          network === 'mainnet'
            ? StellarSdk.Networks.PUBLIC
            : StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          tokenClient.call(
            'transfer',
            StellarSdk.nativeToScVal(keypair.publicKey(), { type: 'address' }),
            StellarSdk.nativeToScVal(creatorAddress, { type: 'address' }),
            StellarSdk.nativeToScVal(amountInStroops, { type: 'i128' })
          )
        )
        .setTimeout(300)
        .build();

      transaction.sign(keypair);

      try {
        const response = await horizonServer.submitTransaction(transaction);
        
        distributionRecords.push({
          vault_id: vaultId,
          distribution_type: 'vault_subscriber',
          transaction_hash: response.hash,
          contract_address: vault.contract_address,
          recipient_wallet_address: creatorAddress,
          recipient_subscription_id: subscription.id,
          token_address: tokenAddress,
          token_symbol: tokenSymbol,
          amount: profitShareAmount,
          profit_share_percentage: parseFloat(subscription.profit_share_percentage),
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

        totalDistributed += profitShareAmount;
      } catch (txError) {
        console.error(`[Distribute Subscribers] Transfer failed for subscription ${subscription.id}:`, txError);
      }
    }

    // Save to database
    if (distributionRecords.length > 0) {
      await supabase
        .from('profit_distributions')
        .insert(distributionRecords);
    }

    return {
      success: true,
      totalDistributed,
      recipientCount: distributionRecords.length,
    };
  } catch (error: any) {
    console.error('[Distribute Subscribers] Error:', error);
    return {
      success: false,
      error: error.message || 'Subscriber distribution failed',
    };
  }
}

/**
 * Automated profit distribution check (run periodically via cron)
 */
export async function checkAndDistributeProfits(): Promise<void> {
  console.log('[Auto Distribute] Starting profit distribution check...');

  try {
    // Get all active vaults with NFTs or subscriptions
    const { data: vaults } = await supabase
      .from('vaults')
      .select(`
        id,
        contract_address,
        nft_contract_address,
        base_token_address,
        base_token_symbol,
        network
      `)
      .not('nft_contract_address', 'is', null);

    if (!vaults || vaults.length === 0) {
      console.log('[Auto Distribute] No vaults with NFTs found');
      return;
    }

    for (const vault of vaults) {
      try {
        // Calculate profit since last distribution
        const { totalProfit } = await calculateVaultProfit(vault.id);

        // Only distribute if profit exceeds threshold (e.g., $10 USD equivalent)
        const DISTRIBUTION_THRESHOLD = 10;
        
        if (totalProfit < DISTRIBUTION_THRESHOLD) {
          console.log(`[Auto Distribute] Vault ${vault.id}: Profit ${totalProfit} below threshold`);
          continue;
        }

        console.log(`[Auto Distribute] Vault ${vault.id}: Distributing ${totalProfit}`);

        // Distribute to NFT holders
        if (vault.nft_contract_address) {
          const nftResult = await distributeToNFTHolders({
            vaultId: vault.id,
            vaultAddress: vault.contract_address,
            nftContractAddress: vault.nft_contract_address,
            tokenAddress: vault.base_token_address,
            tokenSymbol: vault.base_token_symbol,
            network: vault.network,
          }, totalProfit);

          if (nftResult.success) {
            console.log(`[Auto Distribute] NFT distribution successful: ${nftResult.transactionHash}`);
          }
        }

        // Distribute to vault subscribers
        const subscriberResult = await distributeToVaultSubscribers(
          vault.id,
          totalProfit,
          vault.base_token_address,
          vault.base_token_symbol
        );

        if (subscriberResult.success) {
          console.log(`[Auto Distribute] Subscriber distribution successful`);
        }

      } catch (vaultError) {
        console.error(`[Auto Distribute] Error processing vault ${vault.id}:`, vaultError);
      }
    }

    console.log('[Auto Distribute] Profit distribution check completed');
  } catch (error) {
    console.error('[Auto Distribute] Error in automated distribution:', error);
  }
}

/**
 * Get distribution history for a wallet
 */
export async function getDistributionHistory(
  walletAddress: string,
  limit: number = 50
) {
  const { data, error } = await supabase
    .from('profit_distributions')
    .select('*')
    .eq('recipient_wallet_address', walletAddress)
    .order('initiated_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get distribution stats for an NFT
 */
export async function getNFTDistributionStats(nftId: string) {
  const { data, error } = await supabase
    .from('nft_profit_stats')
    .select('*')
    .eq('nft_id', nftId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || {
    total_distributions_count: 0,
    total_profit_received: 0,
    last_distribution_amount: null,
    last_distribution_at: null,
  };
}
