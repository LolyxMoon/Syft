/**
 * Transaction signing utilities for Terminal AI actions
 */

import { wallet } from './wallet';
import { TransactionBuilder, Networks, rpc as StellarRpc, Transaction } from '@stellar/stellar-sdk';

export interface SignTransactionParams {
  xdr: string;
  network?: 'testnet' | 'mainnet';
  description?: string;
  needsPreparation?: boolean; // Signal that this is unprepared Soroban transaction
}

/**
 * Sign a transaction XDR using the connected wallet
 * If needsPreparation=true, will prepare it with Soroban RPC first to get fresh sequence
 */
export async function signTransaction(params: SignTransactionParams): Promise<string> {
  const { xdr, network = 'testnet', description, needsPreparation = false } = params;

  try {
    // Get network passphrase
    const networkPassphrase = network === 'mainnet' 
      ? Networks.PUBLIC 
      : Networks.TESTNET;

    console.log('[TransactionSigner] Signing transaction:', {
      xdr: xdr.substring(0, 50) + '...',
      network,
      description,
      needsPreparation,
    });

    // Parse transaction to validate
    let transaction = TransactionBuilder.fromXDR(xdr, networkPassphrase) as Transaction;
    
    console.log('[TransactionSigner] Transaction parsed successfully');
    console.log('[TransactionSigner] Operations:', transaction.operations.length);
    console.log('[TransactionSigner] Source:', transaction.source);
    console.log('[TransactionSigner] Current sequence:', transaction.sequence);

    // If this needs preparation (Soroban contract invocation), prepare it NOW for fresh sequence
    if (needsPreparation) {
      console.log('[TransactionSigner] 🔄 This is an UNPREPARED Soroban transaction');
      console.log('[TransactionSigner] Need to rebuild with FRESH account sequence...');
      
      const sorobanUrl = network === 'mainnet'
        ? 'https://soroban-pubnet.stellar.org'
        : 'https://soroban-testnet.stellar.org';
      
      const sorobanServer = new StellarRpc.Server(sorobanUrl, {
        allowHttp: false,
      });
      
      // Get the source account address from the transaction
      const sourceAddress = transaction.source;
      console.log('[TransactionSigner] Loading fresh account for:', sourceAddress);
      
      // Load account with CURRENT sequence number
      const freshAccount = await sorobanServer.getAccount(sourceAddress);
      console.log('[TransactionSigner] ✓ Fresh account loaded. Sequence:', freshAccount.sequenceNumber());
      console.log('[TransactionSigner] Old transaction had sequence:', transaction.sequence);
      
      // CORRECT APPROACH: Rebuild the transaction from scratch using the fresh account
      console.log('[TransactionSigner] Rebuilding transaction with fresh account...');
      
      // Build with fresh account by reconstructing from XDR operations
      const freshTxBuilder = new TransactionBuilder(freshAccount, {
        fee: transaction.fee,
        networkPassphrase,
      });
      
      // For Soroban transactions, we need to extract the raw operation XDR
      // and add it properly to the new transaction
      console.log('[TransactionSigner] Extracting operations from XDR...');
      const txEnvelope = transaction.toEnvelope();
      const txBody = txEnvelope.v1().tx();
      const rawOperations = txBody.operations();
      
      console.log('[TransactionSigner] Found', rawOperations.length, 'operations');
      
      // Add each operation from the raw XDR
      rawOperations.forEach((opXdr: any) => {
        freshTxBuilder.addOperation(opXdr);
      });
      
      // Add memo if present
      if (transaction.memo && transaction.memo.type !== 'none') {
        freshTxBuilder.addMemo(transaction.memo);
      }
      
      // Check if original transaction has timeBounds, if so, preserve them
      if (transaction.timeBounds) {
        console.log('[TransactionSigner] Preserving original timeBounds:', transaction.timeBounds);
        freshTxBuilder.setTimebounds(
          parseInt(transaction.timeBounds.minTime),
          parseInt(transaction.timeBounds.maxTime)
        );
      } else {
        // Only set timeout if no timeBounds exist
        freshTxBuilder.setTimeout(300);
      }
      
      // Build the final transaction with fresh sequence
      const finalTx = freshTxBuilder.build() as Transaction;
      
      console.log('[TransactionSigner] ✓ Transaction rebuilt with fresh sequence:', finalTx.sequence);
      
      // NOW prepare it (adds Soroban fees and resource footprint)
      transaction = await sorobanServer.prepareTransaction(finalTx);
      
      console.log('[TransactionSigner] ✓ Transaction prepared with Soroban resources');
      console.log('[TransactionSigner] Final sequence:', transaction.sequence);
      console.log('[TransactionSigner] Final fee:', transaction.fee);
    }

    // Sign with connected wallet (use the prepared XDR if we prepared it)
    const xdrToSign = needsPreparation ? transaction.toXDR() : xdr;
    
    const { signedTxXdr } = await wallet.signTransaction(xdrToSign, {
      networkPassphrase,
    });

    console.log('[TransactionSigner] Transaction signed successfully');

    return signedTxXdr;
  } catch (error: any) {
    console.error('[TransactionSigner] Error signing transaction:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('User declined')) {
      throw new Error('Transaction signing was cancelled');
    } else if (error.message?.includes('wallet not connected')) {
      throw new Error('Please connect your wallet first');
    } else {
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }
}

/**
 * Sign and submit a transaction
 * Automatically detects if this is a Soroban contract invocation and uses the appropriate server
 */
export async function signAndSubmitTransaction(
  params: SignTransactionParams,
  horizonUrl: string = 'https://horizon-testnet.stellar.org'
): Promise<{ hash: string; ledger?: number }> {
  try {
    // Sign the transaction (will prepare if needsPreparation=true)
    const signedXdr = await signTransaction(params);

    // Parse the signed transaction to determine type
    const networkPassphrase = params.network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
    const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase) as Transaction;
    
    // Check if this is a Soroban contract invocation
    const isSorobanTx = signedTx.operations.some(op => 
      op.type === 'invokeHostFunction' || 
      op.type === 'extendFootprintTtl' || 
      op.type === 'restoreFootprint'
    );

    if (isSorobanTx) {
      console.log('[TransactionSigner] Detected Soroban transaction, using Soroban RPC...');
      
      const sorobanUrl = params.network === 'mainnet'
        ? 'https://soroban-pubnet.stellar.org'
        : 'https://soroban-testnet.stellar.org';
      
      const sorobanServer = new StellarRpc.Server(sorobanUrl, { allowHttp: false });
      
      // Submit to Soroban RPC
      console.log('[TransactionSigner] Submitting to Soroban RPC:', sorobanUrl);
      console.log('[TransactionSigner] Transaction hash (before submit):', signedTx.hash().toString('hex'));
      
      const result = await sorobanServer.sendTransaction(signedTx);
      
      console.log('[TransactionSigner] Soroban RPC sendTransaction result:', JSON.stringify(result, null, 2));
      console.log('[TransactionSigner] Transaction hash from result:', result.hash);
      console.log('[TransactionSigner] Status:', result.status);
      
      // For Soroban, we always need to poll for the result
      console.log('[TransactionSigner] Polling for transaction result...');
      
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        console.log(`[TransactionSigner] Polling attempt ${attempts + 1}/${maxAttempts} for tx ${result.hash}...`);
        const statusResult = await sorobanServer.getTransaction(result.hash);
        
        console.log(`[TransactionSigner] Status check ${attempts + 1}:`, statusResult.status);
        
        if (statusResult.status === 'SUCCESS') {
          console.log('[TransactionSigner] ✅ Transaction successful!', result.hash);
          return { hash: result.hash };
        } else if (statusResult.status === 'FAILED') {
          console.error('[TransactionSigner] ❌ Transaction failed:', statusResult);
          throw new Error(`Transaction failed: ${JSON.stringify(statusResult)}`);
        } else if (statusResult.status === 'NOT_FOUND') {
          // Transaction might not be indexed yet, keep polling
          console.log('[TransactionSigner] ⏳ Transaction not found yet, continuing to poll...');
        }
        
        attempts++;
      }
      
      throw new Error('Transaction confirmation timeout. Check explorer for status.');
    } else {
      // Traditional Stellar transaction - use Horizon
      console.log('[TransactionSigner] Detected classic Stellar transaction, using Horizon...');

      const response = await fetch(`${horizonUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `tx=${encodeURIComponent(signedXdr)}`,
      });

      if (!response.ok) {
        const error = await response.json();
        const errorCode = error.extras?.result_codes?.transaction;
        const operationErrors = error.extras?.result_codes?.operations;
        
        console.error('[TransactionSigner] Transaction failed:', {
          errorCode,
          operationErrors,
          fullError: error
        });
        
        // Provide user-friendly error messages
        if (errorCode === 'tx_too_late') {
          throw new Error('Transaction expired. Please try again - you\'ll have 5 minutes to sign.');
        } else if (errorCode === 'tx_bad_seq') {
          throw new Error('Transaction sequence number is invalid. Please try again.');
        } else if (errorCode === 'tx_insufficient_balance') {
          throw new Error('Insufficient balance to complete this transaction.');
        } else if (errorCode === 'tx_bad_auth') {
          throw new Error('Invalid signature. Please try signing again.');
        } else if (errorCode === 'tx_failed' && operationErrors) {
          // Extract detailed operation errors
          const opErrorMessages = operationErrors
            .map((opErr: string, idx: number) => 
              opErr !== 'op_success' ? `Operation ${idx + 1}: ${opErr}` : null
            )
            .filter(Boolean)
            .join(', ');
          
          // Provide specific error messages for common operation errors
          if (opErrorMessages.includes('op_underfunded')) {
            throw new Error(`Insufficient balance. You don't have enough XLM to complete all transfers. ${opErrorMessages}`);
          } else if (opErrorMessages.includes('op_no_destination')) {
            throw new Error(`Invalid destination address. One or more addresses don't exist on the network. ${opErrorMessages}`);
          } else if (opErrorMessages.includes('op_line_full')) {
            throw new Error(`Destination account would exceed limit. ${opErrorMessages}`);
          } else {
            throw new Error(`Transaction failed: ${opErrorMessages || errorCode}`);
          }
        } else {
          throw new Error(errorCode || 'Transaction submission failed');
        }
      }

      const result = await response.json();

      console.log('[TransactionSigner] Transaction submitted successfully:', result.hash);

      return {
        hash: result.hash,
        ledger: result.ledger,
      };
    }
  } catch (error: any) {
    console.error('[TransactionSigner] Error submitting transaction:', error);
    
    // Re-throw with user-friendly message if available
    if (error.message) {
      throw error;
    } else {
      throw new Error('Failed to submit transaction. Please try again.');
    }
  }
}
