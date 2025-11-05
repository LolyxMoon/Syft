// T037, T044, T046: WalletConnect component with Stellar Wallet Kit
// Purpose: One-click wallet connection with error handling and disconnect functionality

import { useState, useEffect } from 'react';
import { Wallet, LogOut, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { WalletSelector } from './WalletSelector';
import { NetworkValidationModal } from './NetworkValidationModal';
import { useWallet } from '../../hooks/useWallet';
import { wallet } from '../../util/wallet';
import storage from '../../util/storage';
import { isValidNetwork, getNetworkDisplayName } from '../../util/networkValidation';
import { showToast } from '../ui/Toast';

export const WalletConnect = () => {
  const { address, network, isPending } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = () => {
    setError(null);
    setIsModalOpen(true);
  };

  // Validate network whenever wallet connects or network changes
  useEffect(() => {
    console.log('[WalletConnect] Network validation check:', { address, network });
    
    if (address && network) {
      const networkIsValid = isValidNetwork(network);
      console.log('[WalletConnect] Network valid?', networkIsValid, 'Network:', network);
      
      if (!networkIsValid) {
        // Show network validation modal if not on testnet
        console.log('[WalletConnect] Showing network validation modal');
        setIsNetworkModalOpen(true);
      } else {
        // Close modal if user is on testnet
        console.log('[WalletConnect] Network is valid, closing modal');
        setIsNetworkModalOpen(false);
      }
    }
  }, [address, network]);

  // Listen for network changes from the wallet
  useEffect(() => {
    if (!address) return;

    const checkNetworkChange = async () => {
      try {
        const networkData = await wallet.getNetwork();
        console.log('[WalletConnect] Network check:', networkData);
        
        if (networkData.network && networkData.network.toLowerCase() !== network?.toLowerCase()) {
          console.log('[WalletConnect] Network changed! Updating storage...');
          // Update storage with new network
          storage.setItem('walletNetwork', networkData.network);
          storage.setItem('networkPassphrase', networkData.networkPassphrase);
          
          // Dispatch event to update WalletProvider
          window.dispatchEvent(new CustomEvent('walletConnected', {
            detail: {
              address,
              network: networkData.network,
              networkPassphrase: networkData.networkPassphrase,
            }
          }));
        }
      } catch (error) {
        console.error('[WalletConnect] Error checking network:', error);
      }
    };

    // Check network every 2 seconds
    const interval = setInterval(checkNetworkChange, 2000);

    return () => clearInterval(interval);
  }, [address, network]);

  const handleWalletSelect = async (walletId: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Set the selected wallet
      wallet.setWallet(walletId);

      // Request address and network from wallet
      const [addressData, networkData] = await Promise.all([
        wallet.getAddress(),
        wallet.getNetwork(),
      ]);

      if (!addressData.address) {
        throw new Error('Failed to get wallet address. Please make sure your wallet is unlocked.');
      }

      // Save to storage (wallet will be cleared on page reload/close)
      storage.setItem('walletId', walletId);
      storage.setItem('walletAddress', addressData.address);
      storage.setItem('walletNetwork', networkData.network);
      storage.setItem('networkPassphrase', networkData.networkPassphrase);

      // Dispatch a custom event to notify WalletProvider of the connection
      // This is necessary because storage events don't fire in the same tab
      window.dispatchEvent(new CustomEvent('walletConnected', {
        detail: {
          address: addressData.address,
          network: networkData.network,
          networkPassphrase: networkData.networkPassphrase,
        }
      }));

      // Close modal on success
      setIsModalOpen(false);

      // Validate network after connection
      const networkIsValid = isValidNetwork(networkData.network);
      if (!networkIsValid) {
        setIsNetworkModalOpen(true);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      
      // User-friendly error messages
      let errorMessage = 'Failed to connect wallet. ';
      
      if (err.message?.includes('User rejected')) {
        errorMessage += 'You rejected the connection request.';
      } else if (err.message?.includes('not installed')) {
        errorMessage += 'Wallet extension not found. Please install it first.';
      } else if (err.message?.includes('unlocked')) {
        errorMessage += 'Please unlock your wallet and try again.';
      } else if (err.message?.includes('timeout')) {
        errorMessage += 'Connection timed out. Please try again.';
      } else {
        errorMessage += err.message || 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);

    try {
      // Clear all wallet storage
      storage.removeItem('walletId');
      storage.removeItem('walletAddress');
      storage.removeItem('walletNetwork');
      storage.removeItem('networkPassphrase');

      // Force page reload to reset state
      window.location.reload();
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setError('Failed to disconnect wallet. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleSwitchNetwork = () => {
    // Since we can't programmatically switch networks, we guide users to do it manually
    // This will open their wallet extension
    showToast.info('Please open your wallet extension and switch to Testnet network.');
    setIsNetworkModalOpen(false);
  };

  const handleCloseNetworkModal = () => {
    setIsNetworkModalOpen(false);
  };

  // Render UI content based on state
  let content;

  // Show connecting state
  if (isConnecting || isPending) {
    content = (
      <Button variant="outline" size="md" disabled>
        <Wallet className="w-4 h-4" />
        Connecting...
      </Button>
    );
  }
  // Show connected state
  else if (address && !isPending) {
    const networkIsValid = isValidNetwork(network);
    
    content = (
      <div className="flex items-center gap-3">
        {/* Network indicator */}
        <div className={`px-3 py-1.5 rounded-lg ${
          networkIsValid 
            ? 'bg-green-500/10 border border-green-500/30' 
            : 'bg-warning-500/10 border border-warning-500/30 animate-pulse'
        }`}>
          <div className={`flex items-center gap-2 text-sm ${
            networkIsValid ? 'text-green-400' : 'text-warning-400'
          }`}>
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{getNetworkDisplayName(network)}</span>
            {!networkIsValid && (
              <span className="text-xs">(Wrong Network)</span>
            )}
          </div>
        </div>

        {/* Connected wallet address */}
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-white">
            <Wallet className="w-4 h-4 text-purple-400" />
            <span className="font-mono">{formatAddress(address)}</span>
          </div>
        </div>

        {/* Disconnect button */}
        <Button
          variant="ghost"
          size="md"
          onClick={handleDisconnect}
          isLoading={isDisconnecting}
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }
  // Show connect button
  else {
    content = (
      <>
        <Button
          variant="gradient"
          size="md"
          onClick={handleConnect}
          leftIcon={<Wallet className="w-4 h-4" />}
        >
          Connect Wallet
        </Button>

        {/* Error message */}
        {error && (
          <div className="absolute top-full mt-2 right-0 max-w-md p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}
      </>
    );
  }

  // Always render modals outside of conditional content
  return (
    <>
      {content}

      {/* Wallet selector modal */}
      <WalletSelector
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleWalletSelect}
        error={error}
      />

      {/* Network validation modal - always rendered so it can show when connected */}
      <NetworkValidationModal
        isOpen={isNetworkModalOpen}
        currentNetwork={network || ''}
        onClose={handleCloseNetworkModal}
        onSwitchNetwork={handleSwitchNetwork}
      />
    </>
  );
};
