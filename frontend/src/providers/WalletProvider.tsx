import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { wallet } from "../util/wallet";
import storage from "../util/storage";

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

  const updateState = (newState: Omit<WalletContextType, "isPending">) => {
    setState((prev: Omit<WalletContextType, "isPending">) => {
      if (
        prev.address !== newState.address ||
        prev.network !== newState.network ||
        prev.networkPassphrase !== newState.networkPassphrase
      ) {
        return newState;
      }
      return prev;
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
          
          // Update state with restored wallet info
          updateState({
            address: walletAddr,
            network: walletNetwork,
            networkPassphrase: passphrase,
          });
          
          console.log("[WalletProvider] Wallet connection restored successfully");
        } catch (error) {
          console.error("[WalletProvider] Failed to restore wallet connection:", error);
          // If restoration fails, clear the storage
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

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
