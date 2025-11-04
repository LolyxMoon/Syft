// Network validation modal - prompts user to switch to testnet if not connected
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { getNetworkDisplayName, getRequiredNetwork } from '../../util/networkValidation';

interface NetworkValidationModalProps {
  isOpen: boolean;
  currentNetwork: string;
  onClose: () => void;
  onSwitchNetwork: () => void;
}

export const NetworkValidationModal = ({
  isOpen,
  currentNetwork,
  onClose,
  onSwitchNetwork,
}: NetworkValidationModalProps) => {
  console.log('[NetworkValidationModal] Render:', { isOpen, currentNetwork });
  
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-md mx-4 p-6 bg-gradient-to-br from-neutral-900 to-neutral-800 border border-warning-500/30 rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-warning-500/10 rounded-full">
            <AlertTriangle className="w-8 h-8 text-warning-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-3">
          Wrong Network Detected
        </h2>

        {/* Message */}
        <p className="text-neutral-300 text-center mb-6">
          You are currently connected to <span className="font-semibold text-warning-400">{getNetworkDisplayName(currentNetwork)}</span>.
          <br />
          <br />
          This application requires <span className="font-semibold text-green-400">{getRequiredNetwork()}</span> to function properly.
        </p>

        {/* Instructions */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg mb-6">
          <h3 className="text-sm font-semibold text-white mb-2">How to switch networks:</h3>
          <ol className="text-sm text-neutral-300 space-y-1 list-decimal list-inside">
            <li>Open your Stellar wallet extension</li>
            <li>Find the network settings</li>
            <li>Select <span className="font-semibold text-green-400">Testnet</span></li>
            <li>Refresh this page</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            I'll Stay Here
          </Button>
          <Button
            variant="gradient"
            size="md"
            onClick={onSwitchNetwork}
            className="flex-1"
          >
            Open Wallet Settings
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
