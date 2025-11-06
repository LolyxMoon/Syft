import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { wallet } from "../util/wallet";
import storage from "../util/storage";
import { questValidation } from "../services/questValidation";
import { WatchWalletChanges } from "@stellar/freighter-api";

const API_URL = `${import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com'}/api`;

export interface WalletContextType {
  address?: string;
  network?: string;
  networkPassphrase?: string;
  isPending: boolean;
  signTransaction?: typeof wallet.signTransaction;
}

const initialState = {
  address: undefined,
  network: undefined,
  networkPassphrase: undefined,
};

export const WalletContext = // eslint-disable-line react-refresh/only-export-components
  createContext<WalletContextType>({ isPending: true });

// Export useWallet hook
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] =
    useState<Omit<WalletContextType, "isPending">>(initialState);
  const [isPending] = useState(false);
  const signTransaction = wallet.signTransaction.bind(wallet);

  const nullify = () => {
    updateState(initialState);
    storage.removeItem("walletId");
    storage.removeItem("walletAddress");
    storage.removeItem("walletNetwork");
    storage.removeItem("networkPassphrase");
  };

  // Register user in database when wallet connects
  const registerUser = async (walletAddress: string, network?: string) => {
    try {
      console.log("[WalletProvider] Registering user in database:", walletAddress);
      
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          network: network || 'testnet',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("[WalletProvider] User registered successfully:", data.data);
      } else {
        console.error("[WalletProvider] Failed to register user:", data.error);
      }
    } catch (error) {
      console.error("[WalletProvider] Error registering user:", error);
      // Don't throw - registration failure shouldn't block wallet connection
    }
  };

  const updateState = (newState: Omit<WalletContextType, "isPending">) => {
    setState((prev: Omit<WalletContextType, "isPending">) => {
      const hasChanged =
        prev.address !== newState.address ||
        prev.network !== newState.network ||
        prev.networkPassphrase !== newState.networkPassphrase;

      if (hasChanged) {
        console.log("[WalletProvider] State updated:", newState);
        
        // Track wallet connection for quests
        if (newState.address && !prev.address) {
          questValidation.setWalletAddress(newState.address);
          // Validate connect wallet quest
          questValidation.validateConnectWallet();
          
          // Register user in database
          void registerUser(newState.address, newState.network);
        }
        
        // Reset quest validation when disconnecting
        if (!newState.address && prev.address) {
          questValidation.reset();
        }
      }

      return newState;
    });
  };

  // Listen to storage events from other tabs/windows
  const handleStorageChange = (e: StorageEvent) => {
    // Only respond to wallet-related storage changes
    if (!e.key || !['walletId', 'walletAddress', 'walletNetwork', 'networkPassphrase'].includes(e.key)) {
      return;
    }

    console.log("[WalletProvider] Storage change detected:", e.key);

    // Re-check wallet state
    const walletId = storage.getItem("walletId");
    const walletAddr = storage.getItem("walletAddress");
    const walletNetworkRaw = storage.getItem("walletNetwork");
    const walletNetwork = walletNetworkRaw?.toLowerCase();
    const passphrase = storage.getItem("networkPassphrase");

    if (walletId && walletAddr && walletNetwork && passphrase) {
      if (state.address !== walletAddr || state.network !== walletNetwork || state.networkPassphrase !== passphrase) {
        console.log("[WalletProvider] Syncing state from storage");
        updateState({
          address: walletAddr,
          network: walletNetwork,
          networkPassphrase: passphrase,
        });
      }
    } else if (state.address) {
      console.log("[WalletProvider] Clearing state - wallet disconnected");
      updateState(initialState);
    }
  };

  // Listen to custom wallet connection events from the same tab
  const handleWalletConnected = (e: CustomEvent) => {
    console.log("[WalletProvider] Wallet connected event received:", e.detail);
    
    const { address: walletAddr, network: walletNetwork, networkPassphrase: passphrase } = e.detail;
    const normalizedNetwork = walletNetwork?.toLowerCase();
    
    if (walletAddr && normalizedNetwork && passphrase) {
      console.log("[WalletProvider] Updating state from wallet connection");
      updateState({
        address: walletAddr,
        network: normalizedNetwork,
        networkPassphrase: passphrase,
      });
    }
  };

  useEffect(() => {
    // Try to restore wallet connection from localStorage on mount
    // This allows the wallet to stay connected across page refreshes
    const restoreWalletConnection = async () => {
      const walletId = storage.getItem("walletId");
      const walletAddr = storage.getItem("walletAddress");
      const walletNetworkRaw = storage.getItem("walletNetwork");
      const walletNetwork = walletNetworkRaw?.toLowerCase();
      const passphrase = storage.getItem("networkPassphrase");

      console.log("[WalletProvider] Attempting to restore wallet connection:", { 
        walletId, 
        walletAddr, 
        walletNetwork,
        passphrase 
      });

      // If we have stored wallet data, try to reconnect
      if (walletId && walletAddr && walletNetwork && passphrase) {
        try {
          // Set the wallet in the kit to restore the connection
          wallet.setWallet(walletId);
          
          // CRITICAL: Actually re-establish connection with Freighter
          // Just setting the wallet isn't enough - we need to verify the connection
          const currentAddress = await wallet.getAddress();
          
          // Verify the address matches what we stored
          if (currentAddress.address === walletAddr) {
            // Update state with restored wallet info
            updateState({
              address: walletAddr,
              network: walletNetwork,
              networkPassphrase: passphrase,
            });
            
            console.log("[WalletProvider] Wallet connection restored and verified successfully");
          } else {
            // Address mismatch - user may have switched accounts
            console.warn("[WalletProvider] Address mismatch during restoration");
            nullify();
          }
        } catch (error) {
          console.error("[WalletProvider] Failed to restore wallet connection:", error);
          // If restoration fails, clear the storage
          // This is expected if user hasn't granted permission yet
          nullify();
        }
      } else {
        console.log("[WalletProvider] No stored wallet data found");
      }
    };

    // Restore connection on mount
    void restoreWalletConnection();

    // Listen for storage events (for cross-tab sync)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for wallet connection events from the same tab
    window.addEventListener('walletConnected', handleWalletConnected as EventListener);

    // Set up wallet watcher to detect account changes in Freighter
    const walletWatcher = new WatchWalletChanges(2000); // Poll every 2 seconds
    
    walletWatcher.watch((watcherResults) => {
      console.log("[WalletProvider] Wallet change detected:", watcherResults);
      
      const storedAddress = storage.getItem("walletAddress");
      const storedNetwork = storage.getItem("walletNetwork")?.toLowerCase();
      const storedPassphrase = storage.getItem("networkPassphrase");
      
      // Only update if there's a stored wallet (user is connected)
      if (storedAddress) {
        // Check if address has changed
        if (watcherResults.address && watcherResults.address !== storedAddress) {
          console.log("[WalletProvider] Account changed from", storedAddress, "to", watcherResults.address);
          
          // Update storage with new address
          storage.setItem("walletAddress", watcherResults.address);
          
          // Register the new account in database
          void registerUser(
            watcherResults.address, 
            watcherResults.network?.toLowerCase() || storedNetwork
          );
          
          // Update state
          updateState({
            address: watcherResults.address,
            network: watcherResults.network?.toLowerCase() || storedNetwork,
            networkPassphrase: watcherResults.networkPassphrase || storedPassphrase || undefined,
          });
          
          // Update network if it changed too
          if (watcherResults.network) {
            storage.setItem("walletNetwork", watcherResults.network);
          }
          if (watcherResults.networkPassphrase) {
            storage.setItem("networkPassphrase", watcherResults.networkPassphrase);
          }
        }
        // Check if network has changed
        else if (watcherResults.network && watcherResults.network.toLowerCase() !== storedNetwork) {
          console.log("[WalletProvider] Network changed from", storedNetwork, "to", watcherResults.network);
          
          // Update storage and state with new network
          storage.setItem("walletNetwork", watcherResults.network);
          if (watcherResults.networkPassphrase) {
            storage.setItem("networkPassphrase", watcherResults.networkPassphrase);
          }
          
          updateState({
            address: storedAddress,
            network: watcherResults.network.toLowerCase(),
            networkPassphrase: watcherResults.networkPassphrase || storedPassphrase || undefined,
          });
        }
      }
    });

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('walletConnected', handleWalletConnected as EventListener);
      walletWatcher.stop(); // Stop polling when component unmounts
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- it SHOULD only run once per component mount

  const contextValue = useMemo(
    () => ({
      ...state,
      isPending,
      signTransaction,
    }),
    [state, isPending, signTransaction],
  );

  return <WalletContext value={contextValue}>{children}</WalletContext>;
};
