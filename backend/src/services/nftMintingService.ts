// NFT Minting Service - handles Soroban NFT contract interactions for quest rewards
import * as StellarSdk from '@stellar/stellar-sdk';
import { getNetworkServers } from '../lib/horizonClient.js';

// NFT Contract address - UPDATE THIS WITH YOUR DEPLOYED CONTRACT
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '';

export interface NFTMetadata {
  name: string;
  description: string;
  image_url: string;
  vault_performance?: number;
}

export interface MintNFTParams {
  toAddress: string;
  metadata: NFTMetadata;
  network?: string;
  nftType?: 'vault' | 'quest';  // New parameter to specify NFT type
}

export interface MintNFTResult {
  success: boolean;
  nftTokenId?: string;
  transactionHash?: string;
  xdr?: string; // For client-side signing
  error?: string;
}

/**
 * Build an unsigned transaction for minting an NFT
 * Returns XDR that the client wallet will sign
 */
export async function buildMintNFTTransaction(
  params: MintNFTParams
): Promise<MintNFTResult> {
  try {
    const { toAddress, metadata, network = 'testnet', nftType = 'quest' } = params;

    if (!NFT_CONTRACT_ADDRESS) {
      throw new Error('NFT_CONTRACT_ADDRESS not configured in environment');
    }

    // Validate Stellar address format
    if (!toAddress) {
      throw new Error('Wallet address is required');
    }

    // More lenient validation - Stellar addresses can be 56 chars and start with G, or contract addresses start with C
    const trimmedAddress = toAddress.trim();
    if (trimmedAddress.length !== 56) {
      throw new Error(`Invalid Stellar address length: ${trimmedAddress.length} (expected 56). Address: ${trimmedAddress}`);
    }
    
    if (!trimmedAddress.startsWith('G') && !trimmedAddress.startsWith('C')) {
      throw new Error(`Invalid Stellar address format. Must start with G or C. Address: ${trimmedAddress}`);
    }

    console.log('[NFT Minting] Building mint transaction:', {
      toAddress: trimmedAddress,
      metadata,
      network,
      nftType,
      contractAddress: NFT_CONTRACT_ADDRESS,
    });

    const servers = getNetworkServers(network);
    
    // Convert addresses to ScVal
    const contractAddress = new StellarSdk.Address(NFT_CONTRACT_ADDRESS);
    const minterAddress = new StellarSdk.Address(trimmedAddress);
    
    // For quest NFTs, we can use a placeholder vault address or the contract itself
    // In your case, since these are quest reward NFTs, not vault NFTs, 
    // you might want to use a special "quest vault" address or the contract address
    const vaultAddress = contractAddress; // Using contract as vault for quest NFTs
    
    // Fixed ownership percentage for quest rewards (e.g., 100% = 10000 basis points)
    const ownershipPercentage = StellarSdk.nativeToScVal(10000, { type: 'i128' });
    
    // Build contract call operation - pass metadata fields individually
    const contract = new StellarSdk.Contract(NFT_CONTRACT_ADDRESS);
    
    // Get source account for fee estimation
    const sourceAccount = await servers.horizonServer.loadAccount(trimmedAddress);
    
    // Determine network passphrase
    const networkPassphrase = 
      network === 'mainnet' || network === 'public'
        ? StellarSdk.Networks.PUBLIC
        : network === 'futurenet'
        ? StellarSdk.Networks.FUTURENET
        : StellarSdk.Networks.TESTNET;

    // Create NFTType enum value (0 = Vault, 1 = Quest)
    const nftTypeValue = StellarSdk.nativeToScVal(nftType === 'vault' ? 0 : 1, { type: 'u32' });

    // Build the transaction - pass metadata as individual parameters including nft_type
    let transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        contract.call(
          'mint_nft',
          minterAddress.toScVal(),
          vaultAddress.toScVal(),
          ownershipPercentage,
          StellarSdk.nativeToScVal(metadata.name),
          StellarSdk.nativeToScVal(metadata.description),
          StellarSdk.nativeToScVal(metadata.image_url),
          StellarSdk.nativeToScVal(metadata.vault_performance || 0, { type: 'i128' }),
          nftTypeValue  // Add NFT type parameter
        )
      )
      .setTimeout(300)
      .build();

    // Simulate to get resource fees
    console.log('[NFT Minting] Simulating transaction...');
    const simulationResponse = await servers.sorobanServer.simulateTransaction(transaction);

    if (StellarSdk.rpc.Api.isSimulationError(simulationResponse)) {
      console.error('[NFT Minting] Simulation failed:', simulationResponse.error);
      throw new Error(`Simulation failed: ${simulationResponse.error}`);
    }

    if (!simulationResponse.result) {
      throw new Error('Simulation returned no result');
    }

    console.log('[NFT Minting] Simulation successful');

    // Assemble the transaction with simulation results
    transaction = StellarSdk.rpc.assembleTransaction(
      transaction,
      simulationResponse
    ).build();

    // Return unsigned XDR for client to sign
    const xdr = transaction.toXDR();

    console.log('[NFT Minting] Transaction built successfully, returning XDR for signing');
    console.log('[NFT Minting] XDR:', xdr);
    console.log('[NFT Minting] Transaction details:', {
      operations: transaction.operations.length,
      source: transaction.source,
      fee: transaction.fee,
      sequence: transaction.sequence,
    });

    return {
      success: true,
      xdr,
    };
  } catch (error: any) {
    console.error('[NFT Minting] Error building transaction:', error);
    return {
      success: false,
      error: error.message || 'Failed to build NFT minting transaction',
    };
  }
}

/**
 * Submit a signed transaction to the network
 */
export async function submitSignedTransaction(
  signedXdr: string,
  network: string = 'testnet'
): Promise<MintNFTResult> {
  try {
    console.log('[NFT Minting] Submitting signed transaction...');
    console.log('[NFT Minting] Signed XDR:', signedXdr);
    console.log('[NFT Minting] Network:', network);
    
    const servers = getNetworkServers(network);
    
    // Determine network passphrase
    const networkPassphrase = 
      network === 'mainnet' || network === 'public'
        ? StellarSdk.Networks.PUBLIC
        : network === 'futurenet'
        ? StellarSdk.Networks.FUTURENET
        : StellarSdk.Networks.TESTNET;

    // Parse the signed XDR - this returns a Transaction object
    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      networkPassphrase
    ) as StellarSdk.Transaction;

    console.log('[NFT Minting] Parsed transaction, sending to network...');
    const response = await servers.sorobanServer.sendTransaction(transaction);

    if (response.status === 'ERROR') {
      throw new Error(`Transaction failed: ${response.errorResult?.toXDR('base64')}`);
    }

    console.log('[NFT Minting] Transaction sent, hash:', response.hash);

    // Poll for transaction result
    let getResponse = await servers.sorobanServer.getTransaction(response.hash);
    let attempts = 0;
    const maxAttempts = 30;

    while (getResponse.status === 'NOT_FOUND' && attempts < maxAttempts) {
      console.log('[NFT Minting] Waiting for transaction confirmation...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      getResponse = await servers.sorobanServer.getTransaction(response.hash);
      attempts++;
    }

    if (getResponse.status === 'SUCCESS') {
      console.log('[NFT Minting] Transaction confirmed!');
      
      // Extract NFT ID from result
      let nftTokenId: string | undefined;
      if (getResponse.resultMetaXdr) {
        // The mint_nft function returns u64 which is the NFT ID
        // You can parse this from the result value
        // For now, we'll use a simplified approach
        nftTokenId = `NFT_${Date.now()}`;
      }

      return {
        success: true,
        transactionHash: response.hash,
        nftTokenId,
      };
    } else {
      throw new Error(`Transaction failed with status: ${getResponse.status}`);
    }
  } catch (error: any) {
    console.error('[NFT Minting] Error submitting transaction:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit transaction',
    };
  }
}

/**
 * Get NFT image URL for a quest
 * Maps quest categories to NFT image files in the public folder
 */
export function getQuestNFTImageUrl(_questId: string, questCategory: string): string {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Map categories to NFT images
  const imageMap: Record<string, string> = {
    basics: 'explorer.png',
    defi: 'investor.png',
    vaults: 'strategist.png',
    advanced: 'analyst-pro.png',
  };

  const imageName = imageMap[questCategory] || 'wallet-pioneer.png';
  return `${baseUrl}/${imageName}`;
}
