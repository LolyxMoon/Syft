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
 * Our custom tokens with real liquidity pools
 */
const CUSTOM_TOKEN_ADDRESSES = [
  'CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3', // AQX
  'CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME', // VLTK
  'CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5', // SLX
  'CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE', // WRX
  'CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O', // SIXN
  'CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP', // MBIUS
  'CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL', // TRIO
  'CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H', // RELIO
  'CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW', // TRI
  'CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR', // NUMER
];

/**
 * Search tokens by symbol or name
 * IMPORTANT: When searching for custom tokens, only returns our 10 custom tokens with real liquidity pools
 * Other searches return all Soroban tokens (addresses starting with 'C')
 */
export async function searchTokens(
  query: string,
  network: Network = 'testnet',
  customOnly: boolean = false
): Promise<TokenInfo[]> {
  try {
    // First try server-side search (will query Soroswap API for Soroban tokens only)
    const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
    const customOnlyParam = customOnly ? '&customOnly=true' : '';
    const response = await fetch(`${backendUrl}/api/tokens/popular?network=${network}&search=${encodeURIComponent(query)}${customOnlyParam}`);
    const data = await response.json();

    if (data.success && data.tokens && data.tokens.length > 0) {
      let results = data.tokens.filter((token: TokenInfo) => 
        token.address && token.address.startsWith('C')
      );
      
      // If customOnly is true and backend didn't filter, filter to only show our 10 custom tokens
      if (customOnly) {
        results = results.filter((token: TokenInfo) => 
          token.address && CUSTOM_TOKEN_ADDRESSES.includes(token.address)
        );
      }
      
      return results;
    }
  } catch (error) {
    console.warn('Server-side search failed, falling back to client-side filter:', error);
  }
  
  // Fallback to client-side filtering of cached popular tokens
  const popularTokens = await fetchPopularTokens(network);
  const queryLower = query.toLowerCase();
  
  // Filter to only show Soroban tokens (addresses starting with 'C')
  let results = popularTokens.filter(
    (token) =>
      (token.symbol.toLowerCase().includes(queryLower) ||
       token.name.toLowerCase().includes(queryLower)) &&
      token.address &&
      token.address.startsWith('C')
  );
  
  // If customOnly is true, filter to only show our 10 custom tokens
  if (customOnly) {
    results = results.filter((token) => 
      token.address && CUSTOM_TOKEN_ADDRESSES.includes(token.address)
    );
  }
  
  return results;
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
