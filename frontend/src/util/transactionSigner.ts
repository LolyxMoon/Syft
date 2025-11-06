/**
 * Transaction signing utilities for Terminal AI actions
 */

import { wallet } from './wallet';
import { TransactionBuilder, Networks } from '@stellar/stellar-sdk';

export interface SignTransactionParams {
  xdr: string;
  network?: 'testnet' | 'mainnet';
  description?: string;
}

/**
 * Sign a transaction XDR using the connected wallet
 */
export async function signTransaction(params: SignTransactionParams): Promise<string> {
  const { xdr, network = 'testnet', description } = params;

  try {
    // Get network passphrase
    const networkPassphrase = network === 'mainnet' 
      ? Networks.PUBLIC 
      : Networks.TESTNET;

    console.log('[TransactionSigner] Signing transaction:', {
      xdr: xdr.substring(0, 50) + '...',
      network,
      description,
    });

    // Parse transaction to validate
    const transaction = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    
    console.log('[TransactionSigner] Transaction parsed successfully');
    console.log('[TransactionSigner] Operations:', transaction.operations.length);

    // Sign with connected wallet
    const { signedTxXdr } = await wallet.signTransaction(xdr, {
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
 */
export async function signAndSubmitTransaction(
  params: SignTransactionParams,
  horizonUrl: string = 'https://horizon-testnet.stellar.org'
): Promise<{ hash: string; ledger: number }> {
  try {
    // Sign the transaction
    const signedXdr = await signTransaction(params);

    console.log('[TransactionSigner] Submitting transaction to Horizon...');

    // Submit to Horizon
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
