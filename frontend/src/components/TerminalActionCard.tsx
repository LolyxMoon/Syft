/**
 * Terminal Action Card - Interactive UI for blockchain operations
 */

import { useState } from 'react';
import { Send, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { signAndSubmitTransaction } from '../util/transactionSigner';

export interface TransactionAction {
  type: string;
  title: string;
  description: string;
  xdr: string;
  details: Record<string, any>;
  followUpAction?: {
    type: string;
    params: Record<string, any>;
  };
  nextAction?: {
    type: string;
    asset1?: string;
    asset2?: string;
    amount1?: string;
    amount2?: string;
    poolId?: string;
  };
}

interface TerminalActionCardProps {
  action: TransactionAction;
  onComplete?: (result: { success: boolean; hash?: string; error?: string; nextAction?: any }) => void;
}

export const TerminalActionCard = ({ action, onComplete }: TerminalActionCardProps) => {
  const [status, setStatus] = useState<'pending' | 'signing' | 'submitting' | 'success' | 'error'>('pending');
  const [transactionHash, setTransactionHash] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleSign = async () => {
    try {
      setStatus('signing');
      setErrorMessage(undefined);

      console.log('[TerminalAction] Starting transaction signing...');

      // Sign and submit the transaction
      const result = await signAndSubmitTransaction({
        xdr: action.xdr,
        network: action.details.network || 'testnet',
        description: action.description,
      });

      console.log('[TerminalAction] Transaction successful:', result.hash);

      setStatus('success');
      setTransactionHash(result.hash);

      // Notify parent component (include nextAction if this was step 1)
      onComplete?.({ 
        success: true, 
        hash: result.hash,
        nextAction: action.nextAction // Pass along the next action if present
      });
    } catch (error: any) {
      console.error('[TerminalAction] Transaction failed:', error);

      setStatus('error');
      setErrorMessage(error.message || 'Transaction failed');

      // Notify parent component
      onComplete?.({ success: false, error: error.message });
    }
  };

  const getExplorerLink = () => {
    const network = action.details.network || 'testnet';
    return `https://stellar.expert/explorer/${network}/tx/${transactionHash}`;
  };

  return (
    <div className="border border-primary-500/20 rounded-lg p-4 bg-gradient-to-br from-primary-500/5 to-transparent">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-neutral-50 flex items-center gap-2">
            <Send className="w-4 h-4 text-primary-400" />
            {action.title}
          </h3>
          <p className="text-sm text-neutral-400 mt-1">{action.description}</p>
        </div>
        
        {/* Status badge */}
        {status === 'success' && (
          <div className="flex items-center gap-1 text-green-400 text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Completed</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1 text-red-400 text-xs">
            <XCircle className="w-4 h-4" />
            <span>Failed</span>
          </div>
        )}
      </div>

      {/* NFT Image Preview - show if this is an NFT minting action */}
      {action.type === 'mint_nft' && action.details.image_preview && (
        <div className="mb-4">
          <img 
            src={action.details.image_preview} 
            alt="NFT Preview" 
            className="w-full h-48 object-cover rounded-lg border border-primary-500/20"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src = 'https://api.dicebear.com/7.x/shapes/svg?seed=nft-preview';
            }}
          />
          <p className="text-xs text-neutral-400 mt-2 text-center">
            🎨 AI-Generated Artwork
          </p>
        </div>
      )}

      {/* Transaction Details */}
      <div className="space-y-2 mb-4 bg-neutral-900/50 rounded-lg p-3">
        {Object.entries(action.details).map(([key, value]) => {
          // Skip image_preview in the details list (we show it above)
          if (key === 'image_preview') return null;
          
          // Format the value appropriately
          let displayValue: string;
          if (typeof value === 'object' && value !== null) {
            // For objects and arrays, use JSON.stringify
            displayValue = JSON.stringify(value, null, 2);
          } else if (typeof value === 'string' && value.length > 40) {
            // Truncate long strings
            displayValue = `${value.substring(0, 8)}...${value.substring(value.length - 8)}`;
          } else {
            displayValue = String(value);
          }
          
          return (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-neutral-400 capitalize">{key.replace(/_/g, ' ')}:</span>
              <span className="text-neutral-200 font-mono text-xs max-w-[60%] text-right break-words">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {status === 'pending' && (
          <button
            onClick={handleSign}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-black rounded-lg transition-colors font-medium"
          >
            <Send className="w-4 h-4" />
            Sign & Send Transaction
          </button>
        )}

        {(status === 'signing' || status === 'submitting') && (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500/50 text-black rounded-lg font-medium cursor-not-allowed"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            {status === 'signing' ? 'Waiting for signature...' : 'Submitting...'}
          </button>
        )}

        {status === 'success' && transactionHash && (
          <a
            href={getExplorerLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            View on Explorer
          </a>
        )}

        {status === 'error' && (
          <button
            onClick={handleSign}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
          >
            <Send className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
