// Network validation utilities for Stellar
// Purpose: Validate and check network compatibility

export type StellarNetwork = 'TESTNET' | 'FUTURENET' | 'PUBLIC' | 'MAINNET';

/**
 * Check if the current network is Stellar Testnet
 */
export const isTestnet = (network?: string): boolean => {
  if (!network) return false;
  const result = network.toUpperCase() === 'TESTNET';
  console.log('[networkValidation] isTestnet check:', { network, result });
  return result;
};

/**
 * Check if the network is valid for the application
 * Currently, only Testnet is allowed
 */
export const isValidNetwork = (network?: string): boolean => {
  const result = isTestnet(network);
  console.log('[networkValidation] isValidNetwork check:', { network, result });
  return result;
};

/**
 * Get a user-friendly network name
 */
export const getNetworkDisplayName = (network?: string): string => {
  if (!network) return 'Unknown';
  
  const networkMap: Record<string, string> = {
    FUTURENET: 'Futurenet',
    TESTNET: 'Testnet',
    PUBLIC: 'Mainnet',
    MAINNET: 'Mainnet',
  };
  
  return networkMap[network.toUpperCase()] || network;
};

/**
 * Get the required network name for the application
 */
export const getRequiredNetwork = (): string => {
  return 'Testnet';
};

/**
 * Get network validation error message
 */
export const getNetworkErrorMessage = (currentNetwork?: string): string => {
  return `You are currently connected to ${getNetworkDisplayName(currentNetwork)}. This application requires ${getRequiredNetwork()} to function properly.`;
};
