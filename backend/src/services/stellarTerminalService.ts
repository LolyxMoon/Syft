import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Asset,
  Operation,
  Memo,
  BASE_FEE,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import * as StellarSdk from '@stellar/stellar-sdk';
import axios from 'axios';
import { withRetry, pollUntil } from '../utils/retryLogic.js';

// Stellar Testnet Configuration
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';

const horizonServer = new Horizon.Server(HORIZON_URL);
const sorobanServer = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);

/**
 * Stellar Terminal Service
 * Provides all blockchain operations for the AI Terminal
 */
export class StellarTerminalService {
  // Session storage for wallet connections
  private sessions: Map<string, { publicKey: string; secretKey?: string }> = new Map();

  /**
   * WALLET OPERATIONS
   */

  async connectWallet(sessionId: string, publicKey?: string): Promise<any> {
    try {
      // PRODUCTION MODE: Only accept wallet connections via Freighter (public key only)
      // This ensures ALL transactions require user signature - no auto-signing
      
      if (!publicKey) {
        return {
          success: false,
          error: 'No wallet address provided. Please connect via Freighter wallet extension.',
          message: '⚠️ For security, please connect your wallet using the Freighter browser extension. This ensures you review and approve every transaction.',
        };
      }

      // Validate public key format
      if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith('G')) {
        return {
          success: false,
          error: 'Invalid Stellar address format',
        };
      }

      // Store ONLY the public key - NO secret key stored
      this.sessions.set(sessionId, { 
        publicKey,
        secretKey: undefined, // Explicitly no secret key - all transactions must be signed by user
      });

      console.log(`[Connect Wallet] 🔐 Wallet connected (Freighter mode): ${publicKey}`);

      // Load account details
      try {
        const account = await horizonServer.loadAccount(publicKey);
        const balances = account.balances;

        return {
          success: true,
          publicKey,
          balances,
          accountExists: true,
          message: `Wallet connected successfully! Address: ${publicKey}`,
          mode: 'freighter',
          note: '🔐 Secure mode: All transactions will require your signature via Freighter.',
        };
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return {
            success: true,
            publicKey,
            accountExists: false,
            message: `Wallet address detected but not yet funded on the network. Address: ${publicKey}`,
            note: 'Fund this account from the faucet to activate it.',
          };
        }
        throw error;
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async fundFromFaucet(publicKey: string, amount: string = '10000'): Promise<any> {
    try {
      // Use retry logic for Friendbot requests
      const response = await withRetry(
        () => axios.get(`${FRIENDBOT_URL}?addr=${publicKey}`),
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
        }
      );
      
      // Wait a bit for ledger to update, then fetch balance
      await new Promise(resolve => setTimeout(resolve, 2000));
      const account = await withRetry(
        () => horizonServer.loadAccount(publicKey),
        {
          maxAttempts: 5,
          initialDelayMs: 500,
        }
      );
      
      return {
        success: true,
        message: `Successfully funded ${publicKey} with ${amount} XLM from Friendbot!`,
        transaction: response.data,
        balances: account.balances,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fund account from faucet',
      };
    }
  }

  async getBalance(publicKey: string): Promise<any> {
    try {
      const account = await horizonServer.loadAccount(publicKey);
      const balances = account.balances.map((balance: any) => {
        if (balance.asset_type === 'native') {
          return {
            asset: 'XLM (Native)',
            asset_code: 'XLM',
            asset_issuer: '',
            balance: balance.balance,
            limit: 'N/A',
          };
        }
        
        // Handle liquidity pool shares
        if (balance.asset_type === 'liquidity_pool_shares') {
          const poolId = balance.liquidity_pool_id || 'Unknown';
          return {
            asset: `LP Token (Pool ${poolId.substring(0, 8)}...)`,
            asset_code: 'LP',
            liquidity_pool_id: poolId,
            balance: balance.balance,
            limit: balance.limit || 'N/A',
          };
        }
        
        // Handle regular assets
        const assetCode = balance.asset_code || 'Unknown';
        const assetIssuer = balance.asset_issuer || '';
        const issuerDisplay = assetIssuer 
          ? `${assetIssuer.substring(0, 8)}...` 
          : 'Unknown';
        return {
          asset: `${assetCode}:${issuerDisplay}`,
          asset_code: assetCode,
          asset_issuer: assetIssuer,
          balance: balance.balance,
          limit: balance.limit,
        };
      });

      return {
        success: true,
        publicKey,
        balances,
        sequenceNumber: account.sequence,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createAccount(seedAmount: string = '100'): Promise<any> {
    try {
      const newKeypair = Keypair.random();
      const publicKey = newKeypair.publicKey();
      const secretKey = newKeypair.secret();

      // Fund the account
      await axios.get(`${FRIENDBOT_URL}?addr=${publicKey}`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        message: `New account created and funded with ${seedAmount} XLM!`,
        publicKey,
        secretKey,
        warning: '⚠️ SAVE YOUR SECRET KEY SECURELY! Never share it with anyone.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async exportSecretKey(sessionId: string): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { 
          success: false, 
          error: 'Session not found. Please connect your wallet first.' 
        };
      }

      // Security warning - in production, this should require additional authentication
      // and should NEVER be done through a web interface
      return {
        success: true,
        message: '⚠️ **Secret Key Export - SECURITY WARNING**',
        warning: [
          '🔴 CRITICAL: Never share your secret key with anyone!',
          '🔴 Never send it via email, chat, or any messaging app',
          '🔴 Store it in a secure password manager only',
          '🔴 Anyone with this key has FULL control of your account',
        ],
        publicKey: session.publicKey,
        secretKey: session.secretKey || 'Secret key not available (wallet connection only)',
        recommendations: [
          '✅ Use a hardware wallet for maximum security',
          '✅ Use Freighter browser extension for daily transactions',
          '✅ Use BIP39 mnemonics instead of raw secret keys',
          '✅ Never store secret keys in code or config files',
        ],
        note: 'If you connected via Freighter, the secret key is not accessible here (which is good for security!).',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * ASSET OPERATIONS
   */

  async createAsset(
    sessionId: string,
    assetCode: string,
    supply: string,
    description?: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found. Please connect your wallet first.' };
      }

      // Validate asset code (1-12 alphanumeric characters)
      if (!assetCode || assetCode.length > 12 || !/^[a-zA-Z0-9]+$/.test(assetCode)) {
        return {
          success: false,
          error: 'Invalid asset code. Must be 1-12 alphanumeric characters.',
        };
      }

      // Validate supply
      const supplyAmount = parseFloat(supply);
      if (isNaN(supplyAmount) || supplyAmount <= 0) {
        return {
          success: false,
          error: 'Invalid supply amount. Must be a positive number.',
        };
      }

      console.log(`[Create Asset] 🪙 Creating asset ${assetCode} with supply ${supply}`);

      const issuer = session.publicKey;

      // Verify account exists
      await horizonServer.loadAccount(issuer);

      // In Stellar, issuers have UNLIMITED supply of their own assets automatically
      // No transaction needed - they can distribute tokens directly to holders
      // The asset will exist on-chain the moment it's first transferred
      
      return {
        success: true,
        message: `✅ Asset ${assetCode} created successfully!`,
        assetCode,
        issuer,
        supply,
        assetString: `${assetCode}:${issuer}`,
        description,
        explanation: `💡 As the issuer, you have unlimited ${assetCode} to distribute! The asset will appear on-chain after the first transfer.`,
        viewInFreighter: {
          note: '📱 To see your token in Freighter:',
          steps: [
            '1. Open Freighter → Click "..." → "Manage Assets"',
            '2. Add custom asset with:',
            `   • Code: ${assetCode}`,
            `   • Issuer: ${issuer.substring(0, 8)}...${issuer.substring(issuer.length - 8)}`,
            '⚠️ Note: As issuer, Freighter may not show a balance (you have unlimited supply)'
          ]
        },
        nextSteps: [
          '📤 Transfer tokens to recipients who have trustlines',
          `� After first transfer, view on: https://stellar.expert/explorer/testnet/asset/${assetCode}-${issuer}`,
          '💰 You have unlimited supply as the issuer'
        ],
        tip: `💡 Try: "transfer 1000 ${assetCode} to [recipient_address]"`,
      };
    } catch (error: any) {
      console.error('[Create Asset] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create asset',
      };
    }
  }

  async transferAsset(
    sessionId: string,
    destination: string,
    asset: string,
    amount: string,
    memo?: string
  ): Promise<any> {
    try {
      console.log(`[transferAsset] Looking for session: ${sessionId}`);
      console.log(`[transferAsset] Sessions map has ${this.sessions.size} entries`);
      
      const session = this.sessions.get(sessionId);
      console.log(`[transferAsset] Session found:`, session ? `publicKey=${session.publicKey}` : 'NOT FOUND');
      
      if (!session || !session.publicKey) {
        console.error(`[transferAsset] No session found for ${sessionId}`);
        return { success: false, error: 'Wallet not connected' };
      }

      const sourceAccount = await horizonServer.loadAccount(session.publicKey);

      let stellarAsset: Asset;
      if (asset === 'XLM' || asset.toLowerCase() === 'native') {
        stellarAsset = Asset.native();
      } else {
        const [code, issuer] = asset.split(':');
        stellarAsset = new Asset(code, issuer);
      }

      const transactionBuilder = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination,
            asset: stellarAsset,
            amount,
          })
        )
        .setTimeout(300); // 5 minutes to give user time to review and sign

      if (memo) {
        transactionBuilder.addMemo(Memo.text(memo));
      }

      const transaction = transactionBuilder.build();

      // Check if user has secret key (auto-sign mode)
      if (session.secretKey) {
        const sourceKeypair = Keypair.fromSecret(session.secretKey);
        transaction.sign(sourceKeypair);

        const result = await horizonServer.submitTransaction(transaction);

        return {
          success: true,
          message: `Successfully transferred ${amount} ${asset} to ${destination}`,
          transactionHash: result.hash,
          ledger: result.ledger,
          link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
        };
      }

      // No secret key - return unsigned transaction for wallet signing
      return {
        success: true,
        requiresSigning: true,
        action: {
          type: 'transfer_asset',
          title: 'Transfer Asset',
          description: `Transfer ${amount} ${asset} to ${destination}`,
          xdr: transaction.toXDR(),
          details: {
            from: session.publicKey,
            to: destination,
            asset,
            amount,
            memo: memo || 'None',
            fee: BASE_FEE,
            network: 'testnet',
          },
        },
        message: `Please review and sign the transaction to transfer ${amount} ${asset}.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async batchTransfer(
    sessionId: string,
    transfers: Array<{ destination: string; asset: string; amount: string }>
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      console.log('[batchTransfer] Session lookup:', { sessionId, found: !!session, hasSecretKey: !!session?.secretKey });
      if (!session) {
        return { success: false, error: 'Wallet not connected. Please connect your wallet first.' };
      }

      const sourceAccount = await horizonServer.loadAccount(session.publicKey);
      
      // Calculate total XLM needed
      const totalXLM = transfers.reduce((sum, t) => {
        if (t.asset === 'XLM' || t.asset.toLowerCase() === 'native') {
          return sum + parseFloat(t.amount);
        }
        return sum;
      }, 0);
      
      const estimatedFee = (parseInt(BASE_FEE) * transfers.length) / 10000000; // Convert stroops to XLM
      const totalNeeded = totalXLM + estimatedFee;
      
      // Get current XLM balance
      const xlmBalance = sourceAccount.balances.find((b: any) => b.asset_type === 'native');
      const currentBalance = xlmBalance ? parseFloat(xlmBalance.balance) : 0;
      
      console.log('[batchTransfer] Balance check:', {
        currentBalance,
        totalNeeded,
        totalXLM,
        estimatedFee,
        willSucceed: currentBalance >= totalNeeded
      });
      
      // Check if user has enough balance
      if (currentBalance < totalNeeded) {
        return {
          success: false,
          error: `Insufficient balance. You have ${currentBalance.toFixed(7)} XLM but need ${totalNeeded.toFixed(7)} XLM (${totalXLM} for transfers + ${estimatedFee.toFixed(7)} fee). Please add ${(totalNeeded - currentBalance).toFixed(7)} XLM to your account.`
        };
      }

      let txBuilder = new TransactionBuilder(sourceAccount, {
        fee: (parseInt(BASE_FEE) * transfers.length).toString(),
        networkPassphrase: Networks.TESTNET,
      });

      for (const transfer of transfers) {
        let stellarAsset: Asset;
        if (transfer.asset === 'XLM' || transfer.asset.toLowerCase() === 'native') {
          stellarAsset = Asset.native();
        } else {
          const [code, issuer] = transfer.asset.split(':');
          stellarAsset = new Asset(code, issuer);
        }

        txBuilder = txBuilder.addOperation(
          Operation.payment({
            destination: transfer.destination,
            asset: stellarAsset,
            amount: transfer.amount,
          })
        );
      }

      const transaction = txBuilder.setTimeout(300).build();

      // If no secret key, return unsigned XDR for Freighter signing
      if (!session.secretKey) {
        return {
          success: true,
          requiresSigning: true,
          action: {
            type: 'batch_transfer',
            title: '💸 Batch Transfer',
            description: `Transfer 100 XLM each to ${transfers.length} address${transfers.length > 1 ? 'es' : ''}`,
            xdr: transaction.toXDR(),
            details: {
              transfers: transfers.map(t => ({
                to: t.destination.slice(0, 8) + '...' + t.destination.slice(-8),
                asset: t.asset,
                amount: t.amount
              })),
              from: session.publicKey,
              network: 'testnet',
              fee: `${parseInt(BASE_FEE) * transfers.length} stroops`,
              totalOperations: transfers.length
            }
          },
          message: `✅ Ready to transfer 100 XLM to ${transfers.length} address${transfers.length > 1 ? 'es' : ''} via Freighter. This is a single batch transaction. Sign & Send to approve.`
        };
      }

      // Legacy mode: auto-sign if secret key available
      const sourceKeypair = Keypair.fromSecret(session.secretKey);
      transaction.sign(sourceKeypair);

      const result = await horizonServer.submitTransaction(transaction);

      return {
        success: true,
        message: `Successfully executed ${transfers.length} transfers in a single transaction!`,
        transactionHash: result.hash,
        operations: transfers.length,
        link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };
    } catch (error: any) {
      console.error('[batchTransfer] Error:', error);
      
      // Extract detailed error information
      let errorMessage = error.message || 'Unknown error occurred';
      
      // Handle Horizon API errors with detailed codes
      if (error.response?.data) {
        const errorData = error.response.data;
        const txCode = errorData.extras?.result_codes?.transaction;
        const opCodes = errorData.extras?.result_codes?.operations;
        
        console.error('[batchTransfer] Transaction error codes:', { txCode, opCodes });
        
        if (txCode === 'tx_failed' && opCodes) {
          const opErrors = opCodes
            .map((code: string, idx: number) => 
              code !== 'op_success' ? `Operation ${idx + 1}: ${code}` : null
            )
            .filter(Boolean)
            .join(', ');
          
          if (opErrors) {
            errorMessage = `Transaction failed - ${opErrors}`;
          }
        } else if (txCode) {
          errorMessage = `Transaction error: ${txCode}`;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * TRUSTLINE OPERATIONS
   */

  async setupTrustline(
    sessionId: string,
    assetCode: string,
    issuer: string,
    limit?: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { 
          success: false, 
          error: 'Session not found. Please connect your wallet first.',
          message: '⚠️ Please ensure your wallet is connected via the Connect Wallet button in the top-right corner.',
        };
      }

      console.log(`[Setup Trustline] 🔗 Setting up trustline for ${assetCode}:${issuer}`);
      console.log(`[Setup Trustline] Session found for: ${session.publicKey}`);

      const sourceAccount = await horizonServer.loadAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      const asset = new Asset(assetCode, issuer);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.changeTrust({
            asset,
            limit: limit || undefined,
          })
        )
        .setTimeout(300)
        .build();

      // If no secret key, return unsigned transaction for Freighter signing
      if (!sourceKeypair) {
        console.log(`[Setup Trustline] 🔐 Returning unsigned transaction for Freighter signing`);
        
        return {
          success: true,
          requiresSigning: true,
          action: {
            type: 'setup_trustline',
            title: `🔗 Setup Trustline for ${assetCode}`,
            description: `Establish a trustline to receive ${assetCode} tokens from issuer ${issuer.substring(0, 8)}...`,
            xdr: transaction.toXDR(),
            details: {
              asset_code: assetCode,
              issuer: issuer,
              limit: limit || 'unlimited',
              wallet: session.publicKey,
              network: 'testnet',
              fee: BASE_FEE,
            },
          },
          message: `Ready to setup trustline for ${assetCode}. Sign the transaction in Freighter to proceed.`,
        };
      }

      // If we have secret key (demo/testing mode), auto-sign
      console.log(`[Setup Trustline] ⚠️ Auto-signing with secret key (demo mode)`);
      transaction.sign(sourceKeypair);
      const result = await horizonServer.submitTransaction(transaction);

      return {
        success: true,
        message: `Trustline established for ${assetCode} from issuer ${issuer}`,
        transactionHash: result.hash,
        limit: limit || 'unlimited',
        link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };
    } catch (error: any) {
      console.error('[Setup Trustline] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to setup trustline',
      };
    }
  }

  async revokeTrustline(
    sessionId: string,
    assetCode: string,
    issuer: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { 
          success: false, 
          error: 'Session not found. Please connect your wallet first.',
        };
      }

      console.log(`[Revoke Trustline] 🔓 Revoking trustline for ${assetCode}:${issuer}`);

      const sourceAccount = await horizonServer.loadAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      const asset = new Asset(assetCode, issuer);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.changeTrust({
            asset,
            limit: '0', // Setting limit to 0 removes the trustline
          })
        )
        .setTimeout(300)
        .build();

      // If no secret key, return unsigned transaction for Freighter signing
      if (!sourceKeypair) {
        return {
          success: true,
          requiresSigning: true,
          action: {
            type: 'revoke_trustline',
            title: `🔓 Revoke Trustline for ${assetCode}`,
            description: `Remove trustline for ${assetCode} from issuer ${issuer.substring(0, 8)}...`,
            xdr: transaction.toXDR(),
            details: {
              asset_code: assetCode,
              issuer: issuer,
              wallet: session.publicKey,
              network: 'testnet',
              fee: BASE_FEE,
              warning: '⚠️ You will no longer be able to receive this asset after revoking the trustline',
            },
          },
          message: `Ready to revoke trustline for ${assetCode}. Sign the transaction in Freighter to proceed.`,
        };
      }

      // Auto-sign if secret key available (demo mode)
      transaction.sign(sourceKeypair);
      const result = await horizonServer.submitTransaction(transaction);

      return {
        success: true,
        message: `Trustline revoked for ${assetCode} from issuer ${issuer}`,
        transactionHash: result.hash,
        link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };
    } catch (error: any) {
      console.error('[Revoke Trustline] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to revoke trustline',
      };
    }
  }

  /**
   * DEX & LIQUIDITY OPERATIONS
   */

  async swapAssets(
    sessionId: string,
    fromAsset: string,
    toAsset: string,
    amount: string,
    slippage: string = '0.5'
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found. Please connect your wallet first.' };
      }

      const sourceAccount = await horizonServer.loadAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      // Parse assets
      let sendAsset: Asset;
      let destAsset: Asset;

      if (fromAsset === 'XLM' || fromAsset.toLowerCase() === 'native') {
        sendAsset = Asset.native();
      } else {
        const [code, issuer] = fromAsset.split(':');
        sendAsset = new Asset(code, issuer);
      }

      if (toAsset === 'XLM' || toAsset.toLowerCase() === 'native') {
        destAsset = Asset.native();
      } else {
        const [code, issuer] = toAsset.split(':');
        destAsset = new Asset(code, issuer);
      }

      // Check if trustlines exist for non-native assets
      const balances = sourceAccount.balances;
      const needsTrustlines: Array<{code: string, issuer: string}> = [];

      // Check destination asset trustline (the one we're receiving)
      if (!destAsset.isNative()) {
        const hasTrustline = balances.some(
          (balance: any) =>
            balance.asset_code === destAsset.getCode() &&
            balance.asset_issuer === destAsset.getIssuer()
        );
        
        if (!hasTrustline) {
          needsTrustlines.push({
            code: destAsset.getCode(),
            issuer: destAsset.getIssuer(),
          });
        }
      }

      // If trustlines are needed and no secret key, return action to setup trustlines first
      if (needsTrustlines.length > 0 && !sourceKeypair) {
        const trustlineOps = needsTrustlines.map(asset =>
          Operation.changeTrust({
            asset: new Asset(asset.code, asset.issuer),
          })
        );

        const trustlineTransaction = new TransactionBuilder(sourceAccount, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        });

        trustlineOps.forEach(op => trustlineTransaction.addOperation(op));
        
        const trustlineTx = trustlineTransaction.setTimeout(300).build();

        return {
          success: true,
          message: `To receive ${toAsset}, you first need a trustline for ${needsTrustlines.map(a => a.code).join(', ')} on the Testnet.\n\nI've prepared the trustline transaction for ${needsTrustlines.map(a => `${a.code} (issuer: ${a.issuer})`).join(', ')}). Sign it in Freighter, then **I'll automatically proceed with your swap**.\n\n**What you'll do:**\n- Sign&Approve the trustline in Freighter.\n- The swap will proceed automatically after signing.\n\nIf you'd like, you can also retry manually after signing.`,
          action: {
            type: 'setup_trustline',
            title: 'Setup Trustline Required',
            description: `Establish trustline for ${needsTrustlines.map(a => a.code).join(', ')} before swapping`,
            xdr: trustlineTx.toXDR(),
            details: {
              assets: needsTrustlines,
              network: 'testnet',
              reason: 'Required to receive swapped assets',
            },
            // Store the original swap parameters for auto-continuation
            followUpAction: {
              type: 'swap_assets',
              params: {
                fromAsset,
                toAsset,
                amount,
                slippage,
              },
            },
          },
        };
      }

      // Find path for the swap
      const paths = await horizonServer
        .strictSendPaths(sendAsset, amount, [destAsset])
        .call();

      if (!paths.records || paths.records.length === 0) {
        throw new Error('No path found for this swap');
      }

      // Get the best path (first one is usually the best)
      const bestPath = paths.records[0];
      const expectedOutput = bestPath.destination_amount;

      // Calculate minimum amount with slippage
      const slippageMultiplier = 1 - parseFloat(slippage) / 100;
      const minAmount = (parseFloat(expectedOutput) * slippageMultiplier).toFixed(7);

      // Build path payment transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.pathPaymentStrictSend({
            sendAsset,
            sendAmount: amount,
            destination: session.publicKey, // Send to self for now
            destAsset,
            destMin: minAmount,
          })
        )
        .setTimeout(300)
        .build();

      // If no secret key, return unsigned transaction for wallet signing
      if (!sourceKeypair) {
        return {
          success: true,
          message: 'Please sign this transaction with your wallet to complete the swap.',
          action: {
            type: 'swap_assets',
            title: 'DEX Swap',
            description: `Swap ${amount} ${fromAsset} for ~${expectedOutput} ${toAsset}`,
            xdr: transaction.toXDR(),
            details: {
              from_asset: fromAsset,
              to_asset: toAsset,
              from_amount: amount,
              expected_output: expectedOutput,
              min_output: minAmount,
              slippage: `${slippage}%`,
              network: 'testnet',
            },
          },
        };
      }

      transaction.sign(sourceKeypair);

      const result = await horizonServer.submitTransaction(transaction);

      return {
        success: true,
        message: `Successfully swapped ${amount} ${fromAsset} for ~${expectedOutput} ${toAsset}`,
        expectedOutput,
        actualOutput: expectedOutput, // Would need to parse from result
        slippage: `${slippage}%`,
        transactionHash: result.hash,
        link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Swap failed',
      };
    }
  }

  async establishPoolTrustline(
    sessionId: string,
    asset1: string,
    asset2: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found. Please connect your wallet first.' };
      }

      const sourceAccount = await horizonServer.loadAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      // Parse assets
      let stellarAsset1: Asset;
      let stellarAsset2: Asset;

      if (asset1 === 'XLM' || asset1.toLowerCase() === 'native') {
        stellarAsset1 = Asset.native();
      } else {
        const [code, issuer] = asset1.split(':');
        stellarAsset1 = new Asset(code, issuer);
      }

      if (asset2 === 'XLM' || asset2.toLowerCase() === 'native') {
        stellarAsset2 = Asset.native();
      } else {
        const [code, issuer] = asset2.split(':');
        stellarAsset2 = new Asset(code, issuer);
      }

      // Create liquidity pool asset for trustline
      const liquidityPoolAsset = new StellarSdk.LiquidityPoolAsset(
        stellarAsset1,
        stellarAsset2,
        StellarSdk.LiquidityPoolFeeV18
      );

      const poolId = StellarSdk.getLiquidityPoolId(
        'constant_product',
        {
          assetA: stellarAsset1,
          assetB: stellarAsset2,
          fee: 30,
        }
      ).toString('hex');

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.changeTrust({
            asset: liquidityPoolAsset,
            limit: '100000',
          })
        )
        .setTimeout(300)
        .build();

      if (!sourceKeypair) {
        return {
          success: true,
          message: `Ready to establish trustline for liquidity pool ${poolId}. Sign & approve in Freighter.`,
          action: {
            type: 'establish_pool_trustline',
            title: 'Establish Pool Trustline',
            description: `Create trustline for ${asset1}/${asset2} pool shares`,
            xdr: transaction.toXDR(),
            details: {
              asset1,
              asset2,
              pool_id: poolId,
              network: 'testnet',
            },
          },
        };
      }

      transaction.sign(sourceKeypair);
      const result = await horizonServer.submitTransaction(transaction);

      return {
        success: true,
        message: `Successfully established trustline for ${asset1}/${asset2} liquidity pool`,
        transactionHash: result.hash,
        poolId,
        link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to establish pool trustline',
      };
    }
  }

  async addLiquidity(
    sessionId: string,
    asset1: string,
    asset2: string,
    amount1: string,
    amount2: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found. Please connect your wallet first.' };
      }

      const sourceAccount = await horizonServer.loadAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      // Parse assets
      let stellarAsset1: Asset;
      let stellarAsset2: Asset;

      if (asset1 === 'XLM' || asset1.toLowerCase() === 'native') {
        stellarAsset1 = Asset.native();
      } else {
        const [code, issuer] = asset1.split(':');
        stellarAsset1 = new Asset(code, issuer);
      }

      if (asset2 === 'XLM' || asset2.toLowerCase() === 'native') {
        stellarAsset2 = Asset.native();
      } else {
        const [code, issuer] = asset2.split(':');
        stellarAsset2 = new Asset(code, issuer);
      }

      // Create liquidity pool asset for trustline
      const liquidityPoolAsset = new StellarSdk.LiquidityPoolAsset(
        stellarAsset1,
        stellarAsset2,
        StellarSdk.LiquidityPoolFeeV18
      );

      // Build transaction to deposit to liquidity pool
      const poolId = StellarSdk.getLiquidityPoolId(
        'constant_product',
        {
          assetA: stellarAsset1,
          assetB: stellarAsset2,
          fee: 30, // 0.3% fee
        }
      ).toString('hex');

      // Check if trustline for pool shares exists
      const account = await horizonServer.loadAccount(session.publicKey);
      const balances = account.balances;
      
      const hasPoolTrustline = balances.some((balance: any) => 
        balance.asset_type === 'liquidity_pool_shares' && 
        balance.liquidity_pool_id === poolId
      );

      // If no pool trustline, return the trustline transaction first
      if (!hasPoolTrustline) {
        const trustlineTransaction = new TransactionBuilder(sourceAccount, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(
            Operation.changeTrust({
              asset: liquidityPoolAsset,
              limit: '100000',
            })
          )
          .setTimeout(300)
          .build();

        if (!sourceKeypair) {
          return {
            success: true,
            requiresTrustline: true,
            message: `⚠️ Step 1/2: You need to establish a trustline for the ${asset1}/${asset2} liquidity pool shares first.`,
            action: {
              type: 'establish_pool_trustline',
              title: 'Step 1: Establish Pool Trustline',
              description: `Create trustline for ${asset1}/${asset2} pool shares before adding liquidity`,
              xdr: trustlineTransaction.toXDR(),
              details: {
                asset1,
                asset2,
                pool_id: poolId,
                network: 'testnet',
                next_step: 'After signing this, you can add liquidity',
              },
              // Include the next action INSIDE the action object so frontend can access it
              nextAction: {
                type: 'add_liquidity',
                asset1,
                asset2,
                amount1,
                amount2,
                poolId,
              },
            },
          };
        }

        trustlineTransaction.sign(sourceKeypair);
        await horizonServer.submitTransaction(trustlineTransaction);
      }

      // Now create the deposit transaction (trustline already exists or was just created)
      const depositTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: poolId,
            maxAmountA: amount1,
            maxAmountB: amount2,
            minPrice: { n: 1, d: 10 }, // More flexible min price ratio (10% of spot)
            maxPrice: { n: 10, d: 1 }, // More flexible max price ratio (10x spot)
          })
        )
        .setTimeout(300)
        .build();

      // If no secret key, return unsigned transaction for wallet signing
      if (!sourceKeypair) {
        return {
          success: true,
          message: `✅ Step 2/2: Ready to add liquidity: ${amount1} ${asset1} + ${amount2} ${asset2} to pool. Sign & approve to receive LP tokens.`,
          action: {
            type: 'add_liquidity',
            title: 'Step 2: Add Liquidity',
            description: `Deposit ${amount1} ${asset1} + ${amount2} ${asset2} to pool ${poolId.substring(0, 8)}...`,
            xdr: depositTransaction.toXDR(),
            details: {
              asset1: asset1,
              asset2: asset2,
              amount1: amount1,
              amount2: amount2,
              pool_id: poolId,
              network: 'testnet',
            },
          },
        };
      }

      depositTransaction.sign(sourceKeypair);

      const result = await horizonServer.submitTransaction(depositTransaction);

      return {
        success: true,
        message: `Successfully added liquidity: ${amount1} ${asset1} + ${amount2} ${asset2}`,
        transactionHash: result.hash,
        link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Add liquidity failed',
      };
    }
  }

  async removeLiquidity(
    sessionId: string,
    poolId: string,
    lpTokens: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found. Please connect your wallet first.' };
      }

      const sourceAccount = await horizonServer.loadAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      // Build transaction to withdraw from liquidity pool
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.liquidityPoolWithdraw({
            liquidityPoolId: poolId,
            amount: lpTokens,
            minAmountA: '0', // Would calculate minimum based on slippage
            minAmountB: '0',
          })
        )
        .setTimeout(300)
        .build();

      // If no secret key, return unsigned transaction for wallet signing
      if (!sourceKeypair) {
        return {
          success: true,
          message: 'Please sign this transaction with your wallet to remove liquidity.',
          action: {
            type: 'remove_liquidity',
            title: 'Remove Liquidity',
            description: `Withdraw ${lpTokens} LP tokens from pool`,
            xdr: transaction.toXDR(),
            details: {
              pool_id: poolId,
              lp_tokens: lpTokens,
              network: 'testnet',
            },
          },
        };
      }

      transaction.sign(sourceKeypair);

      const result = await horizonServer.submitTransaction(transaction);

      return {
        success: true,
        message: `Successfully removed ${lpTokens} LP tokens from pool`,
        transactionHash: result.hash,
        link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Remove liquidity failed',
      };
    }
  }

  async getPoolAnalytics(poolId: string): Promise<any> {
    try {
      // Fetch pool info from Horizon
      const pool = await horizonServer.liquidityPools().liquidityPoolId(poolId).call();

      // Calculate TVL
      const reserves = pool.reserves.map((r: any) => ({
        asset: r.asset === 'native' ? 'XLM' : `${r.asset.split(':')[0]}`,
        amount: r.amount,
      }));

      return {
        success: true,
        poolId,
        reserves,
        totalShares: pool.total_shares,
        totalTrustlines: pool.total_trustlines,
        feeBp: pool.fee_bp, // Fee in basis points (30 = 0.3%)
        type: pool.type,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch pool analytics',
      };
    }
  }

  /**
   * NFT OPERATIONS
   */

  async mintNFT(
    sessionId: string,
    metadataUri: string,
    collectionId: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found. Please connect your wallet first.' };
      }

      console.log(`[Mint NFT] Request to mint NFT for session: ${sessionId}`);
      console.log(`[Mint NFT] Metadata URI: ${metadataUri}`);
      console.log(`[Mint NFT] Collection: ${collectionId}`);

      // Get NFT contract address from environment
      const nftContractId = process.env.NFT_CONTRACT_ADDRESS;
      if (!nftContractId) {
        return {
          success: false,
          error: 'NFT contract not configured. Please set NFT_CONTRACT_ADDRESS in environment variables.',
        };
      }

      // Parse the metadataUri as a creative prompt for image generation
      // The AI will pass things like "Goku NFT" or "a cyberpunk cat"
      const creativePrompt = metadataUri;

      // Import Runware service dynamically
      const { generateVaultNFTImage } = await import('./runwareService.js');

      // Generate AI image based on the creative prompt
      console.log(`[Mint NFT] 🎨 Generating AI image with prompt: "${creativePrompt}"`);
      let imageUrl: string;
      
      try {
        // Enhance the prompt for better NFT imagery
        const enhancedPrompt = `${creativePrompt}, detailed digital art, vibrant colors, NFT collection style, high quality, 8k resolution, professional artwork`;
        imageUrl = await generateVaultNFTImage(enhancedPrompt);
        console.log(`[Mint NFT] ✅ Image generated: ${imageUrl}`);
      } catch (imageError: any) {
        console.error(`[Mint NFT] ❌ Image generation failed:`, imageError.message);
        // Fallback to placeholder
        imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`;
      }

      // Generate NFT name from prompt (capitalize first letters)
      const nftName = creativePrompt
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const nftDescription = `${nftName} - Minted via Stellar Terminal AI`;

      // Determine NFT type based on collection
      // 0 = Vault, 1 = Quest, 2 = Custom
      let nftType: number;
      if (collectionId.toLowerCase().includes('quest')) {
        nftType = 1;
      } else if (collectionId.toLowerCase().includes('custom')) {
        nftType = 2;
      } else {
        nftType = 0; // Default to Vault
      }

      const sourceAccount = await sorobanServer.getAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      const contract = new Contract(nftContractId);

      // Build mint transaction
      // Contract signature: mint_nft(minter, vault_address, ownership_percentage, name, description, image_url, vault_performance, nft_type)
      const minterAddress = new Address(session.publicKey);
      const vaultAddress = minterAddress; // Use minter as vault address for custom NFTs
      const ownershipPercentage = nativeToScVal(10000, { type: 'i128' }); // 100% ownership
      const vaultPerformance = nativeToScVal(0, { type: 'i128' });
      const nftTypeValue = nativeToScVal(nftType, { type: 'u32' });

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: (parseInt(BASE_FEE) * 1000).toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'mint_nft',
            minterAddress.toScVal(),
            vaultAddress.toScVal(),
            ownershipPercentage,
            nativeToScVal(nftName, { type: 'string' }),
            nativeToScVal(nftDescription, { type: 'string' }),
            nativeToScVal(imageUrl, { type: 'string' }),
            vaultPerformance,
            nftTypeValue
          )
        )
        .setTimeout(300)
        .build();

      // Prepare transaction (simulate and add resource fees)
      const preparedTx = await sorobanServer.prepareTransaction(transaction);

      // If no secret key, return unsigned transaction for wallet signing
      if (!sourceKeypair) {
        return {
          success: true,
          requiresSigning: true,
          action: {
            type: 'mint_nft',
            title: `🎨 Mint ${nftName}`,
            description: `Create your custom NFT on Stellar blockchain`,
            xdr: preparedTx.toXDR(),
            details: {
              nft_name: nftName,
              description: nftDescription,
              image_preview: imageUrl,
              collection: collectionId,
              minter: session.publicKey,
              contract: nftContractId,
              network: 'testnet',
              fee: preparedTx.fee,
            },
          },
          message: `🎨 Your NFT image has been generated! Review the details and sign the transaction to mint "${nftName}" to your wallet.`,
          imageUrl,
        };
      }

      // If we have secret key, sign and submit (backend auto-sign mode)
      preparedTx.sign(sourceKeypair);

      // Submit transaction
      const result = await sorobanServer.sendTransaction(preparedTx);

      if (result.status === 'PENDING') {
        // Poll for transaction result with retry logic
        const getResponse = await pollUntil(
          () => sorobanServer.getTransaction(result.hash),
          (response) =>
            response !== null &&
            response.status !== StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND,
          {
            intervalMs: 1000,
            timeoutMs: 30000,
          }
        );

        if (getResponse.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
          // Extract NFT ID from return value
          let nftTokenId: string | undefined;
          
          if (getResponse.returnValue) {
            const nftId = scValToNative(getResponse.returnValue);
            nftTokenId = `NFT_${nftId}`;
          }

          return {
            success: true,
            message: `🎉 NFT "${nftName}" minted successfully!`,
            nftTokenId,
            nftName,
            imageUrl,
            collection: collectionId,
            owner: session.publicKey,
            transactionHash: result.hash,
            link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
          };
        } else {
          throw new Error('NFT minting transaction failed on blockchain');
        }
      } else {
        throw new Error(result.errorResult?.toXDR('base64') || 'Transaction submission failed');
      }
    } catch (error: any) {
      console.error('[Mint NFT] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to mint NFT',
      };
    }
  }

  async transferNFT(
    sessionId: string,
    tokenId: string,
    toAddress: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found. Please connect your wallet first.' };
      }

      // Get NFT contract address from environment
      const nftContractId = process.env.NFT_CONTRACT_ADDRESS;
      if (!nftContractId) {
        return {
          success: false,
          error: 'NFT contract not configured. Please set NFT_CONTRACT_ADDRESS in environment variables.',
        };
      }

      console.log(`[Transfer NFT] 📤 Transferring NFT ${tokenId} to ${toAddress}`);

      const sourceAccount = await sorobanServer.getAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      const contract = new Contract(nftContractId);

      // Parse NFT ID - handle both "NFT_123" and "123" formats
      let nftId: number;
      if (tokenId.startsWith('NFT_')) {
        nftId = parseInt(tokenId.replace('NFT_', ''));
      } else {
        nftId = parseInt(tokenId);
      }

      if (isNaN(nftId)) {
        return {
          success: false,
          error: `Invalid NFT ID format: ${tokenId}. Expected format: "NFT_123" or "123"`,
        };
      }

      // Validate recipient address
      if (!toAddress || toAddress.length !== 56) {
        return {
          success: false,
          error: 'Invalid recipient address. Must be a 56-character Stellar address.',
        };
      }

      // Build the transfer transaction
      // Contract function signature: transfer(env: Env, nft_id: u64, from: Address, to: Address)
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: (parseInt(BASE_FEE) * 1000).toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'transfer',
            nativeToScVal(nftId, { type: 'u64' }), // nft_id as u64
            new Address(session.publicKey).toScVal(), // from address
            new Address(toAddress).toScVal() // to address
          )
        )
        .setTimeout(300)
        .build();

      // Prepare transaction
      const preparedTx = await sorobanServer.prepareTransaction(transaction);

      // If no secret key, return unsigned transaction for wallet signing
      if (!sourceKeypair) {
        return {
          success: true,
          message: `Ready to transfer NFT #${nftId} to ${toAddress.substring(0, 8)}...`,
          action: {
            requiresSigning: true,
            type: 'transfer_nft',
            title: `📤 Transfer NFT #${nftId}`,
            description: `Transfer NFT #${nftId} to ${toAddress.substring(0, 8)}...${toAddress.substring(toAddress.length - 8)}`,
            xdr: preparedTx.toXDR(),
            details: {
              nft_id: nftId,
              token_id: tokenId,
              from: session.publicKey,
              to: toAddress,
              contract: nftContractId,
              network: 'testnet',
              fee: preparedTx.fee,
            },
          },
        };
      }

      // If we have the secret key, sign and submit
      preparedTx.sign(sourceKeypair);

      // Submit transaction
      const result = await sorobanServer.sendTransaction(preparedTx);

      if (result.status === 'PENDING') {
        // Poll for transaction result
        const getResponse = await pollUntil(
          () => sorobanServer.getTransaction(result.hash),
          (response) =>
            response !== null &&
            response.status !== StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND,
          {
            intervalMs: 1000,
            timeoutMs: 30000,
          }
        );

        if (getResponse.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
          console.log(`[Transfer NFT] ✅ NFT ${tokenId} transferred successfully`);
          
          return {
            success: true,
            message: `NFT #${nftId} has been transferred to ${toAddress}`,
            tokenId,
            nftId,
            from: session.publicKey,
            to: toAddress,
            transactionHash: result.hash,
            link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
          };
        } else {
          console.error(`[Transfer NFT] ❌ Transaction failed:`, getResponse);
          
          return {
            success: false,
            error: 'Transaction failed on the blockchain',
            details: getResponse,
          };
        }
      }

      return {
        success: false,
        error: 'Transaction submission failed',
        details: result,
      };
    } catch (error: any) {
      console.error('[Transfer NFT] Error:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('not found')) {
        return {
          success: false,
          error: `NFT #${tokenId} not found or doesn't exist`,
        };
      }
      
      if (error.message?.includes('Unauthorized')) {
        return {
          success: false,
          error: `You don't own this NFT or don't have permission to transfer it`,
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to transfer NFT',
      };
    }
  }

  async burnNFT(sessionId: string, tokenId: string): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found. Please connect your wallet first.' };
      }

      // Get NFT contract address from environment
      const nftContractId = process.env.NFT_CONTRACT_ADDRESS;
      if (!nftContractId) {
        return {
          success: false,
          error: 'NFT contract not configured. Please set NFT_CONTRACT_ADDRESS in environment variables.',
        };
      }

      console.log(`[Burn NFT] 🔥 Burning NFT ${tokenId} for wallet: ${session.publicKey}`);

      const sourceAccount = await sorobanServer.getAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      const contract = new Contract(nftContractId);

      // Parse NFT ID - handle both "NFT_123" and "123" formats
      let nftId: number;
      if (tokenId.startsWith('NFT_')) {
        nftId = parseInt(tokenId.replace('NFT_', ''));
      } else {
        nftId = parseInt(tokenId);
      }

      if (isNaN(nftId)) {
        return {
          success: false,
          error: `Invalid NFT ID format: ${tokenId}. Expected format: "NFT_123" or "123"`,
        };
      }

      // Build the burn transaction
      // Contract function signature: burn(env: Env, nft_id: u64, owner: Address)
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: (parseInt(BASE_FEE) * 1000).toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'burn',
            nativeToScVal(nftId, { type: 'u64' }), // nft_id as u64
            new Address(session.publicKey).toScVal() // owner address
          )
        )
        .setTimeout(300)
        .build();

      // Prepare transaction
      const preparedTx = await sorobanServer.prepareTransaction(transaction);

      // If no secret key, return unsigned transaction for wallet signing
      if (!sourceKeypair) {
        return {
          success: true,
          message: `Ready to burn NFT #${nftId}. This action is permanent and cannot be undone.`,
          action: {
            requiresSigning: true,
            type: 'burn_nft',
            title: `🔥 Burn NFT #${nftId}`,
            description: `Permanently destroy NFT #${nftId} from your wallet. This action cannot be undone.`,
            xdr: preparedTx.toXDR(),
            details: {
              nft_id: nftId,
              token_id: tokenId,
              contract: nftContractId,
              owner: session.publicKey,
              network: 'testnet',
              fee: preparedTx.fee,
              warning: '⚠️ This action is permanent and cannot be reversed',
            },
          },
        };
      }

      // If we have the secret key, sign and submit (for backend operations)
      preparedTx.sign(sourceKeypair);

      // Submit transaction
      const result = await sorobanServer.sendTransaction(preparedTx);

      if (result.status === 'PENDING') {
        // Poll for transaction result
        const getResponse = await pollUntil(
          () => sorobanServer.getTransaction(result.hash),
          (response) =>
            response !== null &&
            response.status !== StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND,
          {
            intervalMs: 1000,
            timeoutMs: 30000,
          }
        );

        if (getResponse.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
          console.log(`[Burn NFT] ✅ NFT ${tokenId} burned successfully`);
          
          return {
            success: true,
            message: `NFT #${nftId} has been permanently burned and removed from your wallet.`,
            tokenId,
            nftId,
            transactionHash: result.hash,
            explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
          };
        } else {
          console.error(`[Burn NFT] ❌ Transaction failed:`, getResponse);
          
          return {
            success: false,
            error: 'Transaction failed on the blockchain',
            details: getResponse,
          };
        }
      }

      return {
        success: false,
        error: 'Transaction submission failed',
        details: result,
      };
    } catch (error: any) {
      console.error('[Burn NFT] Error:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('not found')) {
        return {
          success: false,
          error: `NFT #${tokenId} not found or already burned`,
        };
      }
      
      if (error.message?.includes('Unauthorized')) {
        return {
          success: false,
          error: `You don't own this NFT or don't have permission to burn it`,
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to burn NFT',
      };
    }
  }

  async listNFTs(address: string, collectionId?: string): Promise<any> {
    try {
      const allNFTs: any[] = [];

      // Query on-chain NFTs from ALL known NFT contracts (BLOCKCHAIN ONLY - NO SUPABASE)
      // Support multiple contract addresses for different NFT types (Vault NFTs, Quest NFTs, etc.)
      const nftContractAddresses = [
        process.env.NFT_CONTRACT_ADDRESS, // Primary vault NFT contract
        process.env.QUEST_NFT_CONTRACT_ADDRESS, // Quest NFT contract (if different)
      ].filter(Boolean) as string[]; // Remove undefined values
      
      if (nftContractAddresses.length === 0) {
        console.log(`[List NFTs] ⚠️  No NFT contract addresses configured in .env`);
        return {
          success: false,
          error: 'No NFT contract addresses configured. Please set NFT_CONTRACT_ADDRESS in environment variables.',
        };
      }

      console.log(`[List NFTs] 🔍 Querying blockchain for wallet: ${address}`);
      console.log(`[List NFTs] 📜 Contracts to query: ${nftContractAddresses.length}`);

      // Load account once for all queries
      const sourceAccount = await horizonServer.loadAccount(address).catch((err) => {
        console.log(`[List NFTs] ❌ Failed to load account ${address}:`, err.message);
        return null;
      });

      if (!sourceAccount) {
        console.log(`[List NFTs] ⚠️  Account not found or unfunded: ${address}`);
        return {
          success: false,
          error: 'Wallet address not found or unfunded on the network.',
        };
      }

      console.log(`[List NFTs] ✅ Account loaded successfully`);

      // Query each NFT contract
      for (const contractAddress of nftContractAddresses) {
        try {
          console.log(`[List NFTs] 🔄 Querying contract: ${contractAddress}`);
          
          const contract = new Contract(contractAddress);
          
          // Try to query up to 100 NFT IDs to find ones owned by this address
          // This is not efficient but works for small collections
          const maxNFTsToCheck = 100;
          console.log(`[List NFTs] 🔄 Checking up to ${maxNFTsToCheck} NFT IDs...`);
          
          let checkedCount = 0;
          let foundCount = 0;
          let consecutiveFailures = 0;
          const MAX_CONSECUTIVE_FAILURES = 10; // Stop after 5 consecutive NFT IDs not found
          
          for (let nftId = 1; nftId <= maxNFTsToCheck; nftId++) {
            try {
              const nftTx = new TransactionBuilder(sourceAccount, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET,
              })
                .addOperation(contract.call('get_nft', nativeToScVal(nftId, { type: 'u64' })))
                .setTimeout(30)
                .build();
              
              const nftResult = await sorobanServer.simulateTransaction(nftTx);
              
              if (StellarSdk.rpc.Api.isSimulationSuccess(nftResult) && nftResult.result?.retval) {
                // Successfully found an NFT at this ID
                checkedCount++;
                consecutiveFailures = 0; // Reset failure counter
                
                const nftData = scValToNative(nftResult.result.retval);
                
                console.log(`[List NFTs] 📍 NFT #${nftId} exists. Holder: ${nftData.holder}`);
                
                // Check if this NFT is owned by the queried address
                if (nftData.holder === address) {
                  foundCount++;
                  console.log(`[List NFTs] ✅ Found NFT #${nftId} owned by user (contract: ${contractAddress.substring(0, 8)}...)`);
                  
                  // Parse metadata from the NFT
                  const ownershipPct = Number(nftData.ownership_percentage);
                  const vaultAddr = nftData.vault_address;
                  
                  // Determine NFT type from the nft_type field in contract data
                  // nft_type: 0 = Vault, 1 = Quest, 2 = Custom
                  const nftTypeValue = nftData.nft_type;
                  const isQuestNFT = nftTypeValue === 1;
                  const isCustomNFT = nftTypeValue === 2;
                  
                  // Determine source and type labels
                  let nftSource: string;
                  let nftTypeLabel: string;
                  let defaultName: string;
                  let defaultDescription: string;
                  let defaultImage: string;
                  
                  if (isCustomNFT) {
                    nftSource = 'custom';
                    nftTypeLabel = 'Custom NFT';
                    defaultName = `Custom NFT #${nftId}`;
                    defaultDescription = `Custom NFT created via Stellar Terminal AI`;
                    defaultImage = 'https://api.dicebear.com/7.x/shapes/svg?seed=custom-nft';
                  } else if (isQuestNFT) {
                    nftSource = 'quest';
                    nftTypeLabel = 'Quest NFT';
                    defaultName = `Quest NFT #${nftId}`;
                    defaultDescription = `Quest reward NFT representing ${(ownershipPct / 100).toFixed(2)}% ownership`;
                    defaultImage = 'https://syft-stellar.vercel.app/quest-nft.png';
                  } else {
                    nftSource = 'vault';
                    nftTypeLabel = 'Vault NFT';
                    defaultName = `Vault NFT #${nftId}`;
                    defaultDescription = `Vault ownership NFT representing ${(ownershipPct / 100).toFixed(2)}% ownership`;
                    defaultImage = 'https://syft-stellar.vercel.app/vault-nft.png';
                  }
                  
                  console.log(`[List NFTs] 📝 NFT #${nftId} type: ${nftTypeLabel} (raw value: ${nftTypeValue})`);
                  
                  // The contract now stores name, description, and image_url as direct fields
                  const nftName = nftData.name || defaultName;
                  const nftDescription = nftData.description || defaultDescription;
                  const nftImage = nftData.image_url || defaultImage;
                  
                  console.log(`[List NFTs] 📸 NFT #${nftId} details: "${nftName}" - ${nftDescription.substring(0, 50)}...`);
                  
                  allNFTs.push({
                    tokenId: `NFT_${nftId}`,
                    name: nftName,
                    description: nftDescription,
                    image: nftImage,
                    ownership_percentage: ownershipPct,
                    vault_address: vaultAddr,
                    contract_address: contractAddress,
                    source: nftSource,
                    type: nftTypeLabel,
                  });
                } else {
                  console.log(`[List NFTs] ⏭️  NFT #${nftId} exists but owned by someone else: ${nftData.holder.substring(0, 8)}...`);
                }
              } else {
                // NFT ID doesn't exist - increment consecutive failures
                consecutiveFailures++;
                console.log(`[List NFTs] ⚠️  NFT #${nftId} not found (consecutive failures: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`);
                
                // Only break after several consecutive failures (to handle gaps in NFT IDs)
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                  console.log(`[List NFTs] 🛑 Reached ${MAX_CONSECUTIVE_FAILURES} consecutive missing NFTs, assuming end of collection`);
                  break;
                }
              }
            } catch (nftError: any) {
              // Error reading NFT - could be missing or actual error
              consecutiveFailures++;
              console.log(`[List NFTs] ❌ Error at NFT #${nftId}: ${nftError.message} (consecutive failures: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`);
              
              // Only break after several consecutive failures
              if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                console.log(`[List NFTs] 🛑 Too many consecutive errors, stopping scan for this contract`);
                break;
              }
            }
          }
          
          console.log(`[List NFTs] 📊 Contract ${contractAddress.substring(0, 8)}... results: checked ${checkedCount} NFTs, found ${foundCount} owned by user`);
        } catch (contractError: any) {
          console.log(`[List NFTs] ❌ Error querying contract ${contractAddress}:`, contractError.message);
          // Continue to next contract
        }
      }

      // Filter by collection if specified
      const filteredNFTs = collectionId 
        ? allNFTs.filter(nft => nft.source === collectionId || nft.type === collectionId)
        : allNFTs;

      const vaultCount = allNFTs.filter(n => n.source === 'vault').length;
      const questCount = allNFTs.filter(n => n.source === 'quest').length;
      const customCount = allNFTs.filter(n => n.source === 'custom').length;
      
      return {
        success: true,
        owner: address,
        collection: collectionId || 'All Collections',
        nfts: filteredNFTs,
        breakdown: {
          vault: vaultCount,
          quest: questCount,
          custom: customCount,
          total: filteredNFTs.length,
        },
        message: filteredNFTs.length > 0 
          ? `You own ${filteredNFTs.length} on-chain NFT${filteredNFTs.length !== 1 ? 's' : ''} (${vaultCount} Vault, ${questCount} Quest, ${customCount} Custom)`
          : 'No on-chain NFTs found for this address.',
      };
    } catch (error: any) {
      console.error('[List NFTs] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * TRANSACTION & EXPLORER OPERATIONS
   */

  async simulateTransaction(transactionXdr: string): Promise<any> {
    try {
      // Parse the transaction from XDR
      const transaction = TransactionBuilder.fromXDR(
        transactionXdr,
        Networks.TESTNET
      );

      // Simulate the transaction using Soroban RPC
      const simulation = await sorobanServer.simulateTransaction(transaction);

      if (StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
        return {
          success: true,
          message: 'Transaction simulation completed successfully',
          minResourceFee: simulation.minResourceFee || '0',
          latestLedger: simulation.latestLedger,
          result: simulation.result
            ? scValToNative(simulation.result.retval)
            : null,
          warnings: [],
        };
      } else if (StellarSdk.rpc.Api.isSimulationRestore(simulation)) {
        return {
          success: false,
          error: 'Transaction requires state restoration',
          restorePreamble: {
            minResourceFee: simulation.restorePreamble.minResourceFee,
            transactionData: simulation.restorePreamble.transactionData,
          },
        };
      } else if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
        return {
          success: false,
          error: 'Simulation error',
          events: simulation.events || [],
        };
      }

      throw new Error('Unknown simulation result');
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Transaction simulation failed',
      };
    }
  }

  async getTransactionHistory(
    address: string,
    _days: number = 7
  ): Promise<any> {
    try {
      const transactions = await horizonServer
        .transactions()
        .forAccount(address)
        .order('desc')
        .limit(20)
        .call();

      return {
        success: true,
        address,
        count: transactions.records.length,
        transactions: transactions.records.map((tx: any) => ({
          hash: tx.hash,
          ledger: tx.ledger,
          createdAt: tx.created_at,
          operations: tx.operation_count,
          successful: tx.successful,
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async searchExplorer(query: string, type: 'tx' | 'account' | 'ledger'): Promise<any> {
    try {
      if (type === 'tx') {
        const tx = await horizonServer.transactions().transaction(query).call();
        return {
          success: true,
          type: 'transaction',
          data: tx,
          link: `https://stellar.expert/explorer/testnet/tx/${query}`,
        };
      } else if (type === 'account') {
        const account = await horizonServer.loadAccount(query);
        return {
          success: true,
          type: 'account',
          data: {
            id: account.accountId(),
            sequence: account.sequence,
            balances: account.balances,
          },
          link: `https://stellar.expert/explorer/testnet/account/${query}`,
        };
      }

      return { success: false, error: 'Unsupported query type' };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * NETWORK & ANALYTICS OPERATIONS
   */

  async getNetworkStats(): Promise<any> {
    try {
      const ledgers = await horizonServer.ledgers().order('desc').limit(1).call();
      const latestLedger = ledgers.records[0];

      return {
        success: true,
        network: 'Testnet',
        latestLedger: latestLedger.sequence,
        transactionCount: latestLedger.successful_transaction_count,
        operationCount: latestLedger.operation_count,
        baseFee: BASE_FEE,
        protocolVersion: latestLedger.protocol_version,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPriceOracle(assetPair: string): Promise<any> {
    try {
      // Parse asset pair (e.g., "XLM/USDC")
      const [baseAsset, quoteAsset] = assetPair.split('/');

      // Try to fetch from Stellar Expert API
      try {
        const response = await axios.get(
          `https://api.stellar.expert/explorer/testnet/asset/${baseAsset}-${quoteAsset}/price-history`,
          {
            params: {
              resolution: '1d',
              limit: 1,
            },
          }
        );

        if (response.data && response.data.length > 0) {
          const latestPrice = response.data[0];
          return {
            success: true,
            pair: assetPair,
            price: latestPrice.close?.toString() || '0.00',
            high: latestPrice.high?.toString(),
            low: latestPrice.low?.toString(),
            volume: latestPrice.volume?.toString(),
            timestamp: new Date().toISOString(),
            source: 'Stellar Expert API',
          };
        }
      } catch (apiError) {
        console.warn('Stellar Expert API error, falling back to Horizon');
      }

      // Fallback: Try to get from Horizon orderbook
      try {
        const baseAssetObj =
          baseAsset === 'XLM'
            ? Asset.native()
            : new Asset(baseAsset, 'ISSUER_PLACEHOLDER');
        const quoteAssetObj =
          quoteAsset === 'XLM'
            ? Asset.native()
            : new Asset(quoteAsset, 'ISSUER_PLACEHOLDER');

        const orderbook = await horizonServer
          .orderbook(baseAssetObj, quoteAssetObj)
          .call();

        if (orderbook.bids.length > 0 && orderbook.asks.length > 0) {
          const bidPrice = parseFloat(orderbook.bids[0].price);
          const askPrice = parseFloat(orderbook.asks[0].price);
          const midPrice = ((bidPrice + askPrice) / 2).toFixed(7);

          return {
            success: true,
            pair: assetPair,
            price: midPrice,
            bid: orderbook.bids[0].price,
            ask: orderbook.asks[0].price,
            timestamp: new Date().toISOString(),
            source: 'Horizon Orderbook',
          };
        }
      } catch (horizonError) {
        console.warn('Horizon orderbook error');
      }

      // Final fallback: Use CoinGecko for XLM price
      if (baseAsset === 'XLM' && (quoteAsset === 'USD' || quoteAsset === 'USDC')) {
        try {
          const cgResponse = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price',
            {
              params: {
                ids: 'stellar',
                vs_currencies: 'usd',
              },
            }
          );

          if (cgResponse.data?.stellar?.usd) {
            return {
              success: true,
              pair: assetPair,
              price: cgResponse.data.stellar.usd.toString(),
              timestamp: new Date().toISOString(),
              source: 'CoinGecko API',
            };
          }
        } catch (cgError) {
          console.warn('CoinGecko API error');
        }
      }

      throw new Error('Unable to fetch price from any source');
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Price oracle query failed',
      };
    }
  }

  /**
   * ADDITIONAL FEATURES
   */

  async resolveFederatedAddress(address: string): Promise<any> {
    try {
      // address format: alice*example.com
      if (!address.includes('*')) {
        throw new Error('Invalid federated address format. Expected: name*domain.com');
      }

      const [_name, domain] = address.split('*');

      // Fetch stellar.toml from the domain
      const tomlUrl = `https://${domain}/.well-known/stellar.toml`;
      
      let federationServer: string;
      try {
        const tomlResponse = await axios.get(tomlUrl);
        const tomlContent = tomlResponse.data;
        
        // Parse FEDERATION_SERVER from TOML
        const match = tomlContent.match(/FEDERATION_SERVER\s*=\s*"([^"]+)"/);
        if (!match) {
          throw new Error('No FEDERATION_SERVER found in stellar.toml');
        }
        federationServer = match[1];
      } catch (tomlError) {
        throw new Error(`Failed to fetch stellar.toml from ${domain}`);
      }

      // Query the federation server
      const fedResponse = await axios.get(federationServer, {
        params: {
          q: address,
          type: 'name',
        },
      });

      if (fedResponse.data && fedResponse.data.account_id) {
        return {
          success: true,
          federatedAddress: address,
          stellarAddress: fedResponse.data.account_id,
          memo: fedResponse.data.memo,
          memoType: fedResponse.data.memo_type,
          note: 'Federated address resolved via Stellar Federation Protocol',
        };
      }

      throw new Error('Federation server did not return account_id');
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Federated address resolution failed',
      };
    }
  }

  async streamEvents(contractId: string, _minutes: number = 10): Promise<any> {
    try {
      // Get recent events from the contract
      // Note: Real-time streaming would require WebSocket or long-polling
      const latestLedger = await sorobanServer.getLatestLedger();
      const startLedger = Math.max(1, latestLedger.sequence - 100); // Last 100 ledgers

      const events = await sorobanServer.getEvents({
        startLedger,
        endLedger: latestLedger.sequence,
        filters: [
          {
            type: 'contract',
            contractIds: [contractId],
          },
        ],
        limit: 100,
      });

      const formattedEvents = events.events.map((event: any) => ({
        type: event.type,
        ledger: event.ledger,
        contractId: event.contractId,
        topic: event.topic,
        value: event.value ? scValToNative(event.value.xdr()) : null,
        inSuccessfulContractCall: event.inSuccessfulContractCall,
      }));

      return {
        success: true,
        message: `Retrieved recent events from contract ${contractId}`,
        events: formattedEvents,
        note: 'For real-time streaming, use WebSocket connections or long-polling.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Event streaming failed',
      };
    }
  }

  /**
   * BLEND PROTOCOL - LENDING & BORROWING OPERATIONS
   */

  // Blend Protocol Testnet Contract Addresses
  private readonly BLEND_CONTRACTS = {
    testnet: {
      poolDefault: 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65',
      backstop: 'CBHWKF4RHIKOKSURAKXSJRIIA7RJAMJH4VHRVPYGUF4AJ5L544LYZ35X',
      emitter: 'CCS5ACKIDOIVW2QMWBF7H3ZM4ZIH2Q2NP7I3P3GH7YXXGN7I3WND3D6G',
      assets: {
        XLM: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
        USDC: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
        wETH: 'CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE',
        wBTC: 'CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI',
        BLND: 'CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF',
      },
    },
  };

  async lendToPool(
    sessionId: string,
    asset: string,
    amount: string,
    poolAddress: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session?.publicKey) {
        return {
          success: false,
          error: 'No wallet connected',
        };
      }

      // Replace 'default' with actual testnet pool address
      if (poolAddress === 'default') {
        poolAddress = this.BLEND_CONTRACTS.testnet.poolDefault;
      }

      // Resolve asset to contract address
      const assetAddress = this.resolveBlendAsset(asset);
      if (!assetAddress) {
        return {
          success: false,
          error: `Asset ${asset} not recognized. Supported: XLM, USDC, wETH, wBTC`,
        };
      }

      const account = await horizonServer.loadAccount(session.publicKey);
      
      // Build the supply operation
      // Note: Blend protocol handles bToken minting/burning internally via Soroban contracts
      // The pool contract will automatically mint bTokens to the user when they supply
      const contract = new Contract(poolAddress);
      const amountInStroops = BigInt(Math.floor(parseFloat(amount) * 10_000_000));

      // Construct the Request struct properly for Soroban
      // Request has fields: request_type (u32), address (Address), amount (i128)
      // IMPORTANT: Fields MUST be in alphabetical order for Soroban!
      const requestStruct = StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('address'),
          val: nativeToScVal(assetAddress, { type: 'address' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('amount'),
          val: nativeToScVal(amountInStroops, { type: 'i128' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('request_type'),
          val: nativeToScVal(0, { type: 'u32' }), // 0 = Supply
        }),
      ]);

      // Vec of Request structs
      const requestsVec = StellarSdk.xdr.ScVal.scvVec([requestStruct]);

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'submit',
            nativeToScVal(session.publicKey, { type: 'address' }),
            nativeToScVal(session.publicKey, { type: 'address' }),
            nativeToScVal(session.publicKey, { type: 'address' }),
            requestsVec
          )
        )
        .setTimeout(300)
        .build();

      const preparedTx = await sorobanServer.prepareTransaction(transaction);
      const xdr = preparedTx.toXDR();

      return {
        success: true,
        requiresSigning: true,
        action: {
          type: 'blend_lend',
          xdr,
          network: 'testnet',
          details: {
            operation: 'Supply to Blend Pool',
            asset,
            amount,
            pool: poolAddress,
            description: `Supply ${amount} ${asset} to earn interest`,
          },
        },
        message: `Ready to lend ${amount} ${asset} to Blend pool. You'll receive more b${asset} tokens and continue earning interest!`,
      };
    } catch (error: any) {
      console.error('[Blend Lend] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create lend transaction',
      };
    }
  }

  async borrowFromPool(
    sessionId: string,
    asset: string,
    amount: string,
    poolAddress: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session?.publicKey) {
        return {
          success: false,
          error: 'No wallet connected',
        };
      }

      // Replace 'default' with actual testnet pool address
      if (poolAddress === 'default') {
        poolAddress = this.BLEND_CONTRACTS.testnet.poolDefault;
      }

      // Resolve asset to contract address
      const assetAddress = this.resolveBlendAsset(asset);
      if (!assetAddress) {
        return {
          success: false,
          error: `Asset ${asset} not recognized. Supported: XLM, USDC, wETH, wBTC`,
        };
      }

      const account = await horizonServer.loadAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;
      
      // Note: For borrowing from Blend, the transaction will handle trustline requirements automatically
      // Freighter will prompt the user to add the asset if needed during the transaction signing
      console.log(`[Borrow] Building borrow transaction for ${amount} ${asset}`);
      
      const contract = new Contract(poolAddress);
      const amountInStroops = BigInt(Math.floor(parseFloat(amount) * 10_000_000));

      // Construct the Request struct properly for Soroban
      // IMPORTANT: Fields MUST be in alphabetical order for Soroban!
      const requestStruct = StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('address'),
          val: nativeToScVal(assetAddress, { type: 'address' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('amount'),
          val: nativeToScVal(amountInStroops, { type: 'i128' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('request_type'),
          val: nativeToScVal(2, { type: 'u32' }), // 2 = Borrow
        }),
      ]);

      const requestsVec = StellarSdk.xdr.ScVal.scvVec([requestStruct]);

      const borrowTransaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'submit',
            nativeToScVal(session.publicKey, { type: 'address' }),
            nativeToScVal(session.publicKey, { type: 'address' }),
            nativeToScVal(session.publicKey, { type: 'address' }),
            requestsVec
          )
        )
        .setTimeout(300)
        .build();

      if (!sourceKeypair) {
        // For Freighter signing, return UNPREPARED XDR - Freighter will handle simulation and preparation
        return {
          success: true,
          requiresSigning: true,
          action: {
            type: 'blend_borrow',
            title: `Borrow ${amount} ${asset}`,
            xdr: borrowTransaction.toXDR(),
            network: 'testnet',
            details: {
              operation: 'Borrow from Blend Pool',
              asset,
              amount,
              pool: poolAddress,
              description: `Borrow ${amount} ${asset} against your collateral`,
            },
          },
          message: `📝 Sign the transaction in Freighter to borrow ${amount} ${asset} from Blend pool. Make sure you have sufficient collateral!`,
        };
      }

      // If we have secret key, prepare, sign and submit
      const preparedBorrowTx = await sorobanServer.prepareTransaction(borrowTransaction);
      preparedBorrowTx.sign(sourceKeypair);
      const result = await sorobanServer.sendTransaction(preparedBorrowTx);

      return {
        success: true,
        message: `Successfully borrowed ${amount} ${asset} from Blend pool`,
        transactionHash: result.hash,
      };
    } catch (error: any) {
      console.error('[Blend Borrow] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create borrow transaction',
      };
    }
  }

  async repayLoan(
    sessionId: string,
    asset: string,
    amount: string,
    poolAddress: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session?.publicKey) {
        return {
          success: false,
          error: 'No wallet connected',
        };
      }

      // Replace 'default' with actual testnet pool address
      if (poolAddress === 'default') {
        poolAddress = this.BLEND_CONTRACTS.testnet.poolDefault;
      }

      // Resolve asset to contract address
      const assetAddress = this.resolveBlendAsset(asset);
      if (!assetAddress) {
        return {
          success: false,
          error: `Asset ${asset} not recognized. Supported: XLM, USDC, wETH, wBTC`,
        };
      }

      // Build the repay operation for Blend Pool
      // Request type 3 = Repay
      const contract = new Contract(poolAddress);
      const account = await horizonServer.loadAccount(session.publicKey);

      // Convert amount to stroops (7 decimals) or use max int for "max"
      const amountInStroops =
        amount.toLowerCase() === 'max'
          ? BigInt('9223372036854775807') // i128::MAX
          : BigInt(Math.floor(parseFloat(amount) * 10_000_000));

      // Construct the Request struct properly for Soroban
      // IMPORTANT: Fields MUST be in alphabetical order for Soroban!
      const requestStruct = StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('address'),
          val: nativeToScVal(assetAddress, { type: 'address' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('amount'),
          val: nativeToScVal(amountInStroops, { type: 'i128' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('request_type'),
          val: nativeToScVal(3, { type: 'u32' }), // 3 = Repay
        }),
      ]);

      const requestsVec = StellarSdk.xdr.ScVal.scvVec([requestStruct]);

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'submit',
            nativeToScVal(session.publicKey, { type: 'address' }),
            nativeToScVal(session.publicKey, { type: 'address' }),
            nativeToScVal(session.publicKey, { type: 'address' }),
            requestsVec
          )
        )
        .setTimeout(300)
        .build();

      const preparedTx = await sorobanServer.prepareTransaction(transaction);
      const xdr = preparedTx.toXDR();

      const displayAmount = amount.toLowerCase() === 'max' ? 'all' : amount;

      return {
        success: true,
        requiresSigning: true,
        action: {
          type: 'blend_repay',
          xdr,
          network: 'testnet',
          details: {
            operation: 'Repay Blend Loan',
            asset,
            amount: displayAmount,
            pool: poolAddress,
            description: `Repay ${displayAmount} ${asset} borrowed amount`,
          },
        },
        message: `Ready to repay ${displayAmount} ${asset} to Blend pool. This will reduce your debt!`,
      };
    } catch (error: any) {
      console.error('[Blend Repay] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create repay transaction',
      };
    }
  }

  async withdrawLended(
    sessionId: string,
    asset: string,
    amount: string,
    poolAddress: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session?.publicKey) {
        return {
          success: false,
          error: 'No wallet connected',
        };
      }

      // Replace 'default' with actual testnet pool address
      if (poolAddress === 'default') {
        poolAddress = this.BLEND_CONTRACTS.testnet.poolDefault;
      }

      // Resolve asset to contract address
      const assetAddress = this.resolveBlendAsset(asset);
      if (!assetAddress) {
        return {
          success: false,
          error: `Asset ${asset} not recognized. Supported: XLM, USDC, wETH, wBTC`,
        };
      }

      // Build the withdraw operation for Blend Pool
      // Request type 1 = Withdraw
      const contract = new Contract(poolAddress);
      const account = await horizonServer.loadAccount(session.publicKey);

      // Convert amount to stroops (7 decimals) or use max int for "max"
      const amountInStroops =
        amount.toLowerCase() === 'max'
          ? BigInt('9223372036854775807') // i128::MAX
          : BigInt(Math.floor(parseFloat(amount) * 10_000_000));

      // Construct the Request struct properly for Soroban
      // IMPORTANT: Fields MUST be in alphabetical order for Soroban!
      const requestStruct = StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('address'),
          val: nativeToScVal(assetAddress, { type: 'address' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('amount'),
          val: nativeToScVal(amountInStroops, { type: 'i128' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('request_type'),
          val: nativeToScVal(1, { type: 'u32' }), // 1 = Withdraw
        }),
      ]);

      const requestsVec = StellarSdk.xdr.ScVal.scvVec([requestStruct]);

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'submit',
            nativeToScVal(session.publicKey, { type: 'address' }),
            nativeToScVal(session.publicKey, { type: 'address' }),
            nativeToScVal(session.publicKey, { type: 'address' }),
            requestsVec
          )
        )
        .setTimeout(300)
        .build();

      const preparedTx = await sorobanServer.prepareTransaction(transaction);
      const xdr = preparedTx.toXDR();

      const displayAmount = amount.toLowerCase() === 'max' ? 'all available' : amount;

      return {
        success: true,
        requiresSigning: true,
        action: {
          type: 'blend_withdraw',
          xdr,
          network: 'testnet',
          details: {
            operation: 'Withdraw from Blend Pool',
            asset,
            amount: displayAmount,
            pool: poolAddress,
            description: `Withdraw ${displayAmount} ${asset} plus earned interest`,
          },
        },
        message: `Ready to withdraw ${displayAmount} ${asset} from Blend pool (including earned interest)!`,
      };
    } catch (error: any) {
      console.error('[Blend Withdraw] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create withdraw transaction',
      };
    }
  }

  async getBlendPosition(userAddress: string, poolAddress: string): Promise<any> {
    try {
      if (!userAddress) {
        return {
          success: false,
          error: 'No wallet address provided',
        };
      }

      // Replace 'default' with actual testnet pool address
      if (poolAddress === 'default') {
        poolAddress = this.BLEND_CONTRACTS.testnet.poolDefault;
      }

      // Query user's positions from Blend pool contract
      const contract = new Contract(poolAddress);

      try {
        // Call the pool contract to get user positions
        const result = await sorobanServer.simulateTransaction(
          new TransactionBuilder(
            new StellarSdk.Account(userAddress, '0'),
            {
              fee: BASE_FEE,
              networkPassphrase: Networks.TESTNET,
            }
          )
            .addOperation(
              contract.call('get_positions', nativeToScVal(userAddress, { type: 'address' }))
            )
            .setTimeout(30)
            .build()
        );

        if ('result' in result && result.result) {
          const positions = scValToNative(result.result.retval);

          return {
            success: true,
            address: userAddress,
            pool: poolAddress,
            positions,
            message: 'Retrieved Blend lending/borrowing position',
            note: 'Health factor should stay above 1.0 to avoid liquidation',
          };
        }

        return {
          success: true,
          address: userAddress,
          pool: poolAddress,
          positions: { supplied: [], borrowed: [] },
          message: 'No active positions in this pool',
        };
      } catch (error: any) {
        // If position query fails, try to get basic pool info
        return {
          success: true,
          address: userAddress,
          pool: poolAddress,
          positions: { supplied: [], borrowed: [] },
          message: 'No active positions found or pool not accessible',
          note: 'You may need to supply assets first before borrowing',
        };
      }
    } catch (error: any) {
      console.error('[Blend Position] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get Blend position',
      };
    }
  }

  async getPoolInfo(poolAddress: string): Promise<any> {
    try {
      // Replace 'default' with actual testnet pool address
      if (poolAddress === 'default') {
        poolAddress = this.BLEND_CONTRACTS.testnet.poolDefault;
      }

      // Query pool information from Blend pool contract
      const contract = new Contract(poolAddress);

      try {
        // Simulate reading pool configuration and reserves
        const dummyAccount = Keypair.random().publicKey();
        
        const result = await sorobanServer.simulateTransaction(
          new TransactionBuilder(
            new StellarSdk.Account(dummyAccount, '0'),
            {
              fee: BASE_FEE,
              networkPassphrase: Networks.TESTNET,
            }
          )
            .addOperation(contract.call('get_reserves'))
            .setTimeout(30)
            .build()
        );

        if ('result' in result && result.result) {
          const reserves = scValToNative(result.result.retval);

          return {
            success: true,
            pool: poolAddress,
            reserves,
            message: 'Retrieved Blend pool information',
            supportedAssets: ['XLM', 'USDC', 'wETH', 'wBTC'],
            note: 'Supply assets to earn interest or borrow against collateral',
          };
        }

        // Fallback response with known pool info
        return {
          success: true,
          pool: poolAddress,
          message: 'Blend Protocol Lending Pool (Testnet)',
          supportedAssets: ['XLM', 'USDC', 'wETH', 'wBTC'],
          features: [
            'Supply assets to earn interest',
            'Borrow against collateral',
            'Variable interest rates based on utilization',
            'Isolated lending pools for risk management',
          ],
          note: 'Connect your wallet and supply assets to start earning interest!',
        };
      } catch (error: any) {
        // Return basic pool information even if query fails
        return {
          success: true,
          pool: poolAddress,
          message: 'Blend Protocol Lending Pool (Testnet)',
          supportedAssets: ['XLM', 'USDC', 'wETH', 'wBTC'],
          features: [
            'Supply assets to earn interest',
            'Borrow against collateral',
            'Variable interest rates based on utilization',
            'Isolated lending pools for risk management',
          ],
          note: 'Connect your wallet and supply assets to start earning interest!',
        };
      }
    } catch (error: any) {
      console.error('[Pool Info] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get pool information',
      };
    }
  }

  /**
   * Helper function to resolve asset names to Blend contract addresses
   */
  private resolveBlendAsset(asset: string): string | null {
    const assetUpper = asset.toUpperCase();
    
    // Check if it's a known asset shorthand
    if (this.BLEND_CONTRACTS.testnet.assets[assetUpper as keyof typeof this.BLEND_CONTRACTS.testnet.assets]) {
      return this.BLEND_CONTRACTS.testnet.assets[assetUpper as keyof typeof this.BLEND_CONTRACTS.testnet.assets];
    }

    // Check if it's already a contract address (starts with C)
    if (asset.startsWith('C') && asset.length === 56) {
      return asset;
    }

    return null;
  }
}

export const stellarTerminalService = new StellarTerminalService();

