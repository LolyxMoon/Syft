// Asset service for fetching and validating tokens across networks
import type { Network } from '../types/network';

export interface TokenInfo {
  symbol: string;
  name: string;
  address?: string;
  issuer?: string;
  decimals: number;
  type: 'native' | 'stablecoin' | 'token' | 'custom';
  network: string;
  icon?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  token?: TokenInfo;
  error?: string;
}

/**
 * Fetch popular/known tokens for a given network
 * IMPORTANT: Only returns Soroban tokens (addresses starting with 'C')
 */
export async function fetchPopularTokens(network: Network = 'testnet'): Promise<TokenInfo[]> {
  try {
    const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
    const response = await fetch(`${backendUrl}/api/tokens/popular?network=${network}`);
    const data = await response.json();

    if (data.success) {
      // Filter to only show Soroban tokens (addresses starting with 'C')
      return data.tokens.filter((token: TokenInfo) => 
        token.address && token.address.startsWith('C')
      );
    }

    throw new Error(data.error || 'Failed to fetch popular tokens');
  } catch (error) {
    console.error('Error fetching popular tokens:', error);
    // Return fallback list
    return getFallbackTokens(network);
  }
}

/**
 * Validate a custom token contract address
 * IMPORTANT: Only accepts Soroban contract addresses (starting with 'C')
 * Classic Stellar issuers (starting with 'G') are not supported
 */
export async function validateTokenContract(
  address: string,
  network: Network = 'testnet'
): Promise<TokenValidationResult> {
  try {
    // Basic validation - MUST be a Soroban contract address (C prefix)
    if (!address.startsWith('C')) {
      return {
        valid: false,
        error: 'Only Soroban contract addresses are supported. Address must start with C (not G).',
      };
    }
    
    if (address.length !== 56) {
      return {
        valid: false,
        error: 'Invalid Soroban contract address length. Must be exactly 56 characters.',
      };
    }

    const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
    const response = await fetch(
      `${backendUrl}/api/tokens/validate/${address}?network=${network}`
    );
    const data = await response.json();

    if (data.valid) {
      return {
        valid: true,
        token: {
          symbol: data.token.symbol,
          name: data.token.name,
          address: data.token.address,
          decimals: data.token.decimals,
          type: 'custom',
          network: data.token.network,
        },
      };
    }

    return {
      valid: false,
      error: data.error || 'Token validation failed',
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token validation failed',
    };
  }
}

/**
 * Search tokens by symbol or name
 * IMPORTANT: Only returns Soroban tokens (addresses starting with 'C')
 * Classic Stellar assets (G issuers) are filtered out
 */
export async function searchTokens(
  query: string,
  network: Network = 'testnet'
): Promise<TokenInfo[]> {
  try {
    // First try server-side search (will query Soroswap API for Soroban tokens only)
    const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
    const response = await fetch(`${backendUrl}/api/tokens/popular?network=${network}&search=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (data.success && data.tokens && data.tokens.length > 0) {
      // Filter to only show Soroban tokens (addresses starting with 'C')
      return data.tokens.filter((token: TokenInfo) => 
        token.address && token.address.startsWith('C')
      );
    }
  } catch (error) {
    console.warn('Server-side search failed, falling back to client-side filter:', error);
  }
  
  // Fallback to client-side filtering of cached popular tokens
  const popularTokens = await fetchPopularTokens(network);
  const queryLower = query.toLowerCase();
  
  // Filter to only show Soroban tokens (addresses starting with 'C')
  return popularTokens.filter(
    (token) =>
      (token.symbol.toLowerCase().includes(queryLower) ||
       token.name.toLowerCase().includes(queryLower)) &&
      token.address &&
      token.address.startsWith('C')
  );
}

/**
 * Get token info by symbol
 */
export async function getTokenBySymbol(
  symbol: string,
  network: Network = 'testnet'
): Promise<TokenInfo | null> {
  const popularTokens = await fetchPopularTokens(network);
  return popularTokens.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase()) || null;
}

/**
 * Fallback token list if backend is unavailable
 */
function getFallbackTokens(network: Network): TokenInfo[] {
  const tokens: Record<Network, TokenInfo[]> = {
    testnet: [
      {
        symbol: 'XLM',
        name: 'Stellar Lumens',
        address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
        decimals: 7,
        type: 'native',
        network: 'testnet',
      },
      {
        symbol: 'USDC',
        name: 'USD Coin (Official)',
        address: 'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5', // Official Stellar testnet USDC (Aquarius)
        decimals: 6,
        type: 'stablecoin',
        network: 'testnet',
      },
      {
        symbol: 'USDC',
        name: 'USD Coin (Soroswap)',
        address: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA', // Custom USDC (Soroswap)
        decimals: 6,
        type: 'stablecoin',
        network: 'testnet',
      },
    ],
    futurenet: [
      {
        symbol: 'XLM',
        name: 'Stellar Lumens',
        address: 'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT',
        decimals: 7,
        type: 'native',
        network: 'futurenet',
      },
    ],
    mainnet: [
      {
        symbol: 'XLM',
        name: 'Stellar Lumens',
        address: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
        decimals: 7,
        type: 'native',
        network: 'mainnet',
      },
    ],
  };

  return tokens[network] || tokens.testnet;
}
