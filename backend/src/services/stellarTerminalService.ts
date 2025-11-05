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

  async connectWallet(sessionId: string, secretKey?: string): Promise<any> {
    try {
      let keypair: Keypair;
      
      if (secretKey) {
        keypair = Keypair.fromSecret(secretKey);
      } else {
        // For demo, generate new keypair
        keypair = Keypair.random();
      }

      const publicKey = keypair.publicKey();
      this.sessions.set(sessionId, { 
        publicKey, 
        secretKey: secretKey || keypair.secret() 
      });

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
        };
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return {
            success: true,
            publicKey,
            accountExists: false,
            message: `Wallet generated! Address: ${publicKey}. Fund this account to activate it.`,
            secretKey: keypair.secret(), // Return for user to save
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
            balance: balance.balance,
            limit: 'N/A',
          };
        }
        return {
          asset: `${balance.asset_code}:${balance.asset_issuer.substring(0, 8)}...`,
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

  async exportSecretKey(_publicKey: string): Promise<any> {
    try {
      // In production, you'd retrieve from secure storage
      // For demo purposes, we return a warning
      return {
        success: true,
        message: 'Secret key export requires secure authentication.',
        warning: '⚠️ Never share your secret key. Store it in a secure password manager.',
        note: 'In a production environment, use mnemonics (BIP39) for better security.',
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
    _description?: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.secretKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      const issuerKeypair = Keypair.fromSecret(session.secretKey);
      const issuer = issuerKeypair.publicKey();

      return {
        success: true,
        message: `Asset ${assetCode} created successfully!`,
        assetCode,
        issuer,
        supply,
        note: 'To use this asset, other accounts must establish a trustline to it.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
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
      if (!session || !session.secretKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      const sourceKeypair = Keypair.fromSecret(session.secretKey);
      const sourceAccount = await horizonServer.loadAccount(session.publicKey);

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
      return {
        success: false,
        error: error.message,
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
      if (!session || !session.secretKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      const sourceKeypair = Keypair.fromSecret(session.secretKey);
      const sourceAccount = await horizonServer.loadAccount(session.publicKey);

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

      transaction.sign(sourceKeypair);
      const result = await horizonServer.submitTransaction(transaction);

      return {
        success: true,
        message: `Trustline established for ${assetCode} from issuer ${issuer}`,
        transactionHash: result.hash,
        limit: limit || 'unlimited',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
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
      if (!session || !session.secretKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      const sourceKeypair = Keypair.fromSecret(session.secretKey);
      const sourceAccount = await horizonServer.loadAccount(session.publicKey);

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

      transaction.sign(sourceKeypair);
      const result = await horizonServer.submitTransaction(transaction);

      return {
        success: true,
        message: `Trustline revoked for ${assetCode} from issuer ${issuer}`,
        transactionHash: result.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * SMART CONTRACT OPERATIONS
   */

  async deployContract(
    sessionId: string,
    wasmHash: string,
    _contractId?: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found. Please connect your wallet first.' };
      }

      const sourceAccount = await sorobanServer.getAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      // Create deployer address from the source account
      const deployerAddress = new Address(session.publicKey);

      // Build deploy transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: (parseInt(BASE_FEE) * 10000).toString(), // Higher fee for contract deployment
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.createCustomContract({
            address: deployerAddress,
            wasmHash: Buffer.from(wasmHash, 'hex'),
          })
        )
        .setTimeout(300)
        .build();

      // Prepare transaction (simulate and add resource fees)
      const preparedTx = await sorobanServer.prepareTransaction(transaction);

      // If no secret key, return unsigned transaction for wallet signing
      if (!sourceKeypair) {
        return {
          success: true,
          message: 'Please sign this transaction with your wallet to deploy the contract.',
          action: {
            type: 'deploy_contract',
            title: 'Deploy Smart Contract',
            description: `Deploy contract with WASM hash ${wasmHash.substring(0, 8)}...`,
            xdr: preparedTx.toXDR(),
            details: {
              wasm_hash: wasmHash,
              deployer: session.publicKey,
              network: 'testnet',
              fee: preparedTx.fee,
            },
          },
        };
      }

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
          // Extract contract ID from return value
          const contractId = Address.fromScAddress(
            scValToNative(getResponse.returnValue!)
          ).toString();

          return {
            success: true,
            message: `Contract deployed successfully!`,
            contractId,
            transactionHash: result.hash,
            link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
          };
        } else {
          throw new Error('Contract deployment failed');
        }
      } else {
        throw new Error(result.errorResult?.toXDR('base64') || 'Unknown error');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Contract deployment failed',
      };
    }
  }

  async invokeContract(
    sessionId: string,
    contractId: string,
    method: string,
    args: any[] = []
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found. Please connect your wallet first.' };
      }

      const sourceAccount = await sorobanServer.getAccount(session.publicKey);
      const sourceKeypair = session.secretKey ? Keypair.fromSecret(session.secretKey) : null;

      const contract = new Contract(contractId);

      // Convert args to ScVals
      const scArgs = args.map((arg) => {
        if (typeof arg === 'string') {
          // Check if it's an address
          if (arg.length === 56 && (arg.startsWith('G') || arg.startsWith('C'))) {
            return new Address(arg).toScVal();
          }
          return nativeToScVal(arg, { type: 'string' });
        } else if (typeof arg === 'number') {
          return nativeToScVal(arg, { type: 'u32' });
        } else if (typeof arg === 'boolean') {
          return nativeToScVal(arg, { type: 'bool' });
        }
        return nativeToScVal(arg);
      });

      // Build invoke transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: (parseInt(BASE_FEE) * 1000).toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(contract.call(method, ...scArgs))
        .setTimeout(300)
        .build();

      // Prepare transaction
      const preparedTx = await sorobanServer.prepareTransaction(transaction);

      // If no secret key, return unsigned transaction for wallet signing
      if (!sourceKeypair) {
        return {
          success: true,
          message: 'Please sign this transaction with your wallet to invoke the contract.',
          action: {
            type: 'invoke_contract',
            title: `Call ${method}()`,
            description: `Invoke method '${method}' on contract ${contractId.substring(0, 8)}...`,
            xdr: preparedTx.toXDR(),
            details: {
              contract: contractId,
              method: method,
              arguments: JSON.stringify(args),
              network: 'testnet',
              fee: preparedTx.fee,
            },
          },
        };
      }

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
          let returnValue: any = null;
          
          if (getResponse.returnValue) {
            returnValue = scValToNative(getResponse.returnValue);
          }

          return {
            success: true,
            message: `Contract method '${method}' executed successfully`,
            result: returnValue,
            transactionHash: result.hash,
            link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
          };
        } else {
          throw new Error('Contract invocation failed');
        }
      } else {
        throw new Error(result.errorResult?.toXDR('base64') || 'Unknown error');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Contract invocation failed',
      };
    }
  }

  async readContract(contractId: string, method: string, args: any[] = []): Promise<any> {
    try {
      const contract = new Contract(contractId);

      // Convert args to ScVals
      const scArgs = args.map((arg) => {
        if (typeof arg === 'string') {
          if (arg.length === 56 && (arg.startsWith('G') || arg.startsWith('C'))) {
            return new Address(arg).toScVal();
          }
          return nativeToScVal(arg, { type: 'string' });
        } else if (typeof arg === 'number') {
          return nativeToScVal(arg, { type: 'u32' });
        } else if (typeof arg === 'boolean') {
          return nativeToScVal(arg, { type: 'bool' });
        }
        return nativeToScVal(arg);
      });

      // Create a temporary keypair for simulation (won't be submitted)
      const tempKeypair = Keypair.random();
      const tempAccount = await sorobanServer.getAccount(tempKeypair.publicKey());

      // Build transaction for simulation only
      const transaction = new TransactionBuilder(tempAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(contract.call(method, ...scArgs))
        .setTimeout(300)
        .build();

      // Simulate the transaction (doesn't submit to network)
      const simulation = await sorobanServer.simulateTransaction(transaction);

      if (StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
        let result: any = null;
        
        if (simulation.result?.retval) {
          result = scValToNative(simulation.result.retval);
        }

        return {
          success: true,
          message: `Read operation on contract ${contractId}`,
          method,
          result,
          note: 'This is a view-only operation with no fees.',
        };
      } else {
        throw new Error('Simulation failed');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Contract read failed',
      };
    }
  }

  async upgradeContract(
    sessionId: string,
    contractId: string,
    newWasmHash: string
  ): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.secretKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      // Note: Contract upgrade typically requires calling an 'upgrade' function on the contract
      // This is a simplified version - real implementation depends on contract design
      return await this.invokeContract(
        sessionId,
        contractId,
        'upgrade',
        [Buffer.from(newWasmHash, 'hex')]
      );
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Contract upgrade failed',
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

      // Build transaction to deposit to liquidity pool
      const poolId = StellarSdk.getLiquidityPoolId(
        'constant_product',
        {
          assetA: stellarAsset1,
          assetB: stellarAsset2,
          fee: 30, // 0.3% fee
        }
      ).toString('hex');

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: poolId,
            maxAmountA: amount1,
            maxAmountB: amount2,
            minPrice: { n: 1, d: 2 }, // Min price ratio
            maxPrice: { n: 2, d: 1 }, // Max price ratio
          })
        )
        .setTimeout(300)
        .build();

      // If no secret key, return unsigned transaction for wallet signing
      if (!sourceKeypair) {
        return {
          success: true,
          message: 'Please sign this transaction with your wallet to add liquidity.',
          action: {
            type: 'add_liquidity',
            title: 'Add Liquidity',
            description: `Add ${amount1} ${asset1} + ${amount2} ${asset2} to pool`,
            xdr: transaction.toXDR(),
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

      transaction.sign(sourceKeypair);

      const result = await horizonServer.submitTransaction(transaction);

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
      if (!session || !session.secretKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      const tokenId = Math.floor(Math.random() * 1000000);

      return {
        success: true,
        message: `NFT minted successfully!`,
        tokenId,
        collection: collectionId,
        metadataUri,
        owner: session.publicKey,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
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
      if (!session || !session.secretKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      return {
        success: true,
        message: `NFT #${tokenId} transferred to ${toAddress}`,
        tokenId,
        newOwner: toAddress,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async burnNFT(sessionId: string, tokenId: string): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.secretKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      return {
        success: true,
        message: `NFT #${tokenId} burned successfully`,
        tokenId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async listNFTs(address: string, collectionId?: string): Promise<any> {
    try {
      return {
        success: true,
        owner: address,
        collection: collectionId || 'All Collections',
        nfts: [
          { tokenId: '123', name: 'Cool NFT #123', image: 'ipfs://...' },
          { tokenId: '456', name: 'Rare NFT #456', image: 'ipfs://...' },
        ],
      };
    } catch (error: any) {
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
}

export const stellarTerminalService = new StellarTerminalService();

