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
    'testnet': 'CD56XOMAZ55LIKCYVFXH5CP2AKCLYMPMBFRN5XIJVOTWOVY2KFGLZVJD',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  'BTC': {
    'testnet': 'CBFX54THH4KKRDDOMV5G6TNGDPHXEUAXM7SGTOOXTZKODACI7O5ND6U7',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  'XRP': {
    'testnet': 'CBFM34O7P6YJG2DCS3C7AJI6WDKD2JPMPPA7RTVYC7ZYEPKDLGEIFP5D',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  'ARST': {
    'testnet': 'CB3TIJR2B5NZFKZLBUE5LAASV7WIRDKS24VPIYUXXEHM7XN3X2JXFHZY',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  'BRL': {
    'testnet': 'CAG6QUTOUL3M4HPOPFYYDGJQODY7I3WUYKO2DFYDHIRHLD4HHPGIHWBJ',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  'XTAR': {
    'testnet': 'CCSV3Y6QKPRZCPLCMC5W7OCS5BFPKMYFK5GC25SSSS44U2WA4Y7QRKED',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  'RYAW': {
    'testnet': 'CBIWPSUKAYOE5ORIDLYNPFMWWNIZSA5LQVDNXYTW7HI4H5TIU64DGJ7F',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  'JAHV': {
    'testnet': 'CAZKRTMRBEMSMRCGC4C6YDUU22H5AVQZ5HAASR4PGWITXPDDBB3BTGHI',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  'VOEZ': {
    'testnet': 'CDUCWV4VK6MXD3JMYFQUQ2KUHHGTMR7RAS6C2SPF7EHHUEGKFCRO3ZZF',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  'JORV': {
    'testnet': 'CAT5EZTZVB4V4O7E5ZA2HQJTL7MZPWDJWQZIJYPMTAY6DMRWOIK5AMCD',
    'futurenet': nativeXLMAddresses['futurenet'],
    'mainnet': '',
    'public': '',
  },
  // Custom testnet tokens with real liquidity pools (10 functional tokens)
  'AQX': {
    'testnet': process.env.AQX_ADDRESS || '',
    'futurenet': '',
    'mainnet': '',
    'public': '',
  },
  'VLTK': {
    'testnet': process.env.VLTK_ADDRESS || '',
    'futurenet': '',
    'mainnet': '',
    'public': '',
  },
  'SLX': {
    'testnet': process.env.SLX_ADDRESS || '',
    'futurenet': '',
    'mainnet': '',
    'public': '',
  },
  'WRX': {
    'testnet': process.env.WRX_ADDRESS || '',
    'futurenet': '',
    'mainnet': '',
    'public': '',
  },
  'SIXN': {
    'testnet': process.env.SIXN_ADDRESS || '',
    'futurenet': '',
    'mainnet': '',
    'public': '',
  },
  'MBIUS': {
    'testnet': process.env.MBIUS_ADDRESS || '',
    'futurenet': '',
    'mainnet': '',
    'public': '',
  },
  'TRIO': {
    'testnet': process.env.TRIO_ADDRESS || '',
    'futurenet': '',
    'mainnet': '',
    'public': '',
  },
  'RELIO': {
    'testnet': process.env.RELIO_ADDRESS || '',
    'futurenet': '',
    'mainnet': '',
    'public': '',
  },
  'TRI': {
    'testnet': process.env.TRI_ADDRESS || '',
    'futurenet': '',
    'mainnet': '',
    'public': '',
  },
  'NUMER': {
    'testnet': process.env.NUMER_ADDRESS || '',
    'futurenet': '',
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
export function getAssetAddress(asset: any, network: string = 'testnet'): string {
  const normalizedNetwork = network.toLowerCase();
  
  // Convert asset to string if it's an object
  let assetStr: string;
  if (typeof asset === 'string') {
    assetStr = asset;
  } else if (asset && typeof asset === 'object') {
    // Handle object format: {code: 'XLM'} or {assetCode: 'XLM'} or {address: '...'}
    assetStr = asset.code || asset.assetCode || asset.symbol || asset.address || String(asset);
  } else {
    assetStr = String(asset);
  }
  
  // If it's already a valid contract address, return it
  if (assetStr.startsWith('C') && assetStr.length === 56) {
    return assetStr;
  }
  
  // Warn about classic Stellar assets
  if (assetStr.startsWith('G') && assetStr.length === 56) {
    throw new Error(
      `Classic Stellar asset address detected. Please provide the Stellar Asset Contract (SAC) wrapper address instead. ` +
      `Learn more: https://developers.stellar.org/docs/tokens/stellar-asset-contract`
    );
  }
  
  // Look up asset symbol
  const assetSymbol = assetStr.toUpperCase();
  const networkAddresses = tokenAddresses[assetSymbol];
  
  if (!networkAddresses) {
    throw new Error(
      `Unknown asset symbol: "${assetStr}". ` +
      `Please use a known symbol (XLM, USDC, EURC, AQUA) or provide a Stellar contract address (starts with 'C', 56 characters).`
    );
  }
  
  const address = networkAddresses[normalizedNetwork as keyof typeof networkAddresses];
  
  if (!address) {
    console.warn(`⚠️  ${assetSymbol} not available on ${network}, using Native XLM instead`);
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
    // USDC addresses (multiple variants)
    'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA': 'USDC', // Soroswap custom USDC
    'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5': 'USDC', // Official Stellar USDC
    'CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK': 'USDC', // Alternative USDC
    // EURC addresses (multiple variants)
    'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU': 'EURC',
    'CAUL6I3KR55BAOSOE23VRR5FUFD2EBWF3DHGWUZN7N3ZGVR4QQU6DQMD': 'EURC',
    // All other testnet tokens
    'CD56XOMAZ55LIKCYVFXH5CP2AKCLYMPMBFRN5XIJVOTWOVY2KFGLZVJD': 'AQUA',
    'CBFX54THH4KKRDDOMV5G6TNGDPHXEUAXM7SGTOOXTZKODACI7O5ND6U7': 'BTC',
    'CBFM34O7P6YJG2DCS3C7AJI6WDKD2JPMPPA7RTVYC7ZYEPKDLGEIFP5D': 'XRP',
    'CB3TIJR2B5NZFKZLBUE5LAASV7WIRDKS24VPIYUXXEHM7XN3X2JXFHZY': 'ARST',
    'CAG6QUTOUL3M4HPOPFYYDGJQODY7I3WUYKO2DFYDHIRHLD4HHPGIHWBJ': 'BRL',
    'CCSV3Y6QKPRZCPLCMC5W7OCS5BFPKMYFK5GC25SSSS44U2WA4Y7QRKED': 'XTAR',
    'CBIWPSUKAYOE5ORIDLYNPFMWWNIZSA5LQVDNXYTW7HI4H5TIU64DGJ7F': 'RYAW',
    'CAZKRTMRBEMSMRCGC4C6YDUU22H5AVQZ5HAASR4PGWITXPDDBB3BTGHI': 'JAHV',
    'CDUCWV4VK6MXD3JMYFQUQ2KUHHGTMR7RAS6C2SPF7EHHUEGKFCRO3ZZF': 'VOEZ',
    'CAT5EZTZVB4V4O7E5ZA2HQJTL7MZPWDJWQZIJYPMTAY6DMRWOIK5AMCD': 'JORV',
  };
  
  // Check if it's a custom token from env
  if (process.env.ALPHA_ADDRESS === assetAddress) return 'ALPHA';
  if (process.env.BETA_ADDRESS === assetAddress) return 'BETA';
  if (process.env.GAMMA_ADDRESS === assetAddress) return 'GAMMA';
  
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
