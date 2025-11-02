/**
 * Centralized Token Address Configuration
 * 
 * This file manages all token addresses across different Stellar networks.
 * Uses Soroswap-compatible addresses for DEX operations.
 */

// Native XLM SAC addresses by network
export const nativeXLMAddresses: { [key: string]: string } = {
  'testnet': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  'futurenet': 'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT',
  'mainnet': 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
  'public': 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
};

/**
 * USDC Token Addresses
 * 
 * IMPORTANT: For vault operations and DEX swaps, we use the Soroswap custom USDC
 * to ensure compatibility with existing liquidity pools on Soroswap.
 * 
 * Official USDC is primarily used by Aquarius and other protocols.
 */
export const usdcAddresses = {
  // Soroswap-compatible USDC (used for vault base token and DEX operations)
  'soroswap': {
    'testnet': 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
    'futurenet': process.env.FUTURENET_USDC_ADDRESS || nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  // Official Stellar USDC (used by Aquarius and some protocols)
  'official': {
    'testnet': 'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5',
    'futurenet': process.env.FUTURENET_USDC_ADDRESS || nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
};

/**
 * Get the primary USDC address for vault operations
 * Uses Soroswap-compatible USDC by default
 */
export function getUSDCAddress(network: string = 'testnet'): string {
  const normalizedNetwork = network.toLowerCase();
  return usdcAddresses.soroswap[normalizedNetwork as keyof typeof usdcAddresses.soroswap] || 
         usdcAddresses.soroswap['testnet'];
}

/**
 * Token addresses by symbol
 * Default to Soroswap-compatible addresses for better DEX integration
 */
export const tokenAddresses: { [key: string]: { [key: string]: string } } = {
  'XLM': nativeXLMAddresses,
  'USDC': usdcAddresses.soroswap, // Use Soroswap USDC by default for vault operations
  'EURC': {
    'testnet': 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  'AQUA': {
    'testnet': 'CCRRYUTYU3UJQME6ZKBDZMZS6P4ZXVFWRXLQGVL7TWVCXHWMLQOAAQUA',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
};

/**
 * Get asset address from symbol or validate contract address
 * 
 * @param asset - Asset symbol (e.g., "XLM", "USDC") or contract address (starts with "C")
 * @param network - Network name (testnet, futurenet, mainnet)
 * @returns Contract address for the asset
 */
export function getAssetAddress(asset: string, network: string = 'testnet'): string {
  const normalizedNetwork = network.toLowerCase();
  
  // If it's already a valid contract address, return it
  if (asset.startsWith('C') && asset.length === 56) {
    return asset;
  }
  
  // Warn about classic Stellar assets
  if (asset.startsWith('G') && asset.length === 56) {
    throw new Error(
      `Classic Stellar asset address detected. Please provide the Stellar Asset Contract (SAC) wrapper address instead. ` +
      `Learn more: https://developers.stellar.org/docs/tokens/stellar-asset-contract`
    );
  }
  
  // Look up asset symbol
  const assetSymbol = asset.toUpperCase();
  const networkAddresses = tokenAddresses[assetSymbol];
  
  if (!networkAddresses) {
    throw new Error(
      `Unknown asset symbol: "${asset}". ` +
      `Please use a known symbol (XLM, USDC, EURC, AQUA) or provide a Stellar contract address (starts with 'C', 56 characters).`
    );
  }
  
  const address = networkAddresses[normalizedNetwork as keyof typeof networkAddresses];
  
  if (!address) {
    console.warn(`⚠️  ${asset} not available on ${network}, using Native XLM instead`);
    return nativeXLMAddresses[normalizedNetwork as keyof typeof nativeXLMAddresses] || 
           nativeXLMAddresses['testnet'];
  }
  
  return address;
}

/**
 * Get asset symbol from contract address
 * Supports both Soroswap and official USDC addresses
 */
export function getAssetSymbol(assetAddress: string): string {
  const knownAssets: { [key: string]: string } = {
    // XLM addresses
    'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC': 'XLM',
    'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT': 'XLM',
    'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA': 'XLM',
    // USDC addresses (both variants)
    'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA': 'USDC', // Soroswap custom USDC
    'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5': 'USDC', // Official Stellar USDC
    // Other tokens
    'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU': 'EURC',
    'CCRRYUTYU3UJQME6ZKBDZMZS6P4ZXVFWRXLQGVL7TWVCXHWMLQOAAQUA': 'AQUA',
  };
  return knownAssets[assetAddress] || 'TOKEN';
}

/**
 * Check if an address is one of the USDC variants
 */
export function isUSDCAddress(address: string): boolean {
  return address === usdcAddresses.soroswap['testnet'] ||
         address === usdcAddresses.official['testnet'] ||
         address === usdcAddresses.soroswap['futurenet'] ||
         address === usdcAddresses.official['futurenet'];
}

/**
 * Get all USDC addresses for a network (for yield comparison)
 */
export function getAllUSDCAddresses(network: string = 'testnet'): string[] {
  const normalizedNetwork = network.toLowerCase();
  const addresses = [
    usdcAddresses.soroswap[normalizedNetwork as keyof typeof usdcAddresses.soroswap],
    usdcAddresses.official[normalizedNetwork as keyof typeof usdcAddresses.official],
  ].filter(Boolean);
  return addresses;
}
