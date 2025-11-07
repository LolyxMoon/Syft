import { Router, Request, Response } from 'express';
import * as StellarSdk from '@stellar/stellar-sdk';
import { getNetworkServers } from '../lib/horizonClient.js';

const router = Router();

/**
 * GET /api/tokens/validate/:address
 * Validate if a token contract exists and implements SEP-41 standard
 * ⚠️ TESTNET ONLY - Only validates tokens on testnet
 */
router.get('/validate/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { network } = req.query;

    // Validate address format
    if (!address.startsWith('C') || address.length !== 56) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract address format. Must start with C and be 56 characters.',
      });
    }

    // FORCE TESTNET ONLY - ignore user's network parameter
    const userNetwork = 'testnet';
    console.log(`[Tokens API] Forcing testnet validation only. Original request: ${network}, Using: ${userNetwork}`);
    const servers = getNetworkServers(userNetwork);

    // Try to get token metadata
    const contract = new StellarSdk.Contract(address);
    const dummyKeypair = StellarSdk.Keypair.random();
    
    try {
      // Create a temporary account for simulation
      const account = new StellarSdk.Account(dummyKeypair.publicKey(), '0');
      
      // Build transactions to get token metadata
      const nameOp = contract.call('name');
      const symbolOp = contract.call('symbol');
      const decimalsOp = contract.call('decimals');
      
      const nameTx = new StellarSdk.TransactionBuilder(account, {
        fee: '1000',
        networkPassphrase: servers.networkPassphrase,
      })
        .addOperation(nameOp)
        .setTimeout(30)
        .build();
      
      const symbolTx = new StellarSdk.TransactionBuilder(account, {
        fee: '1000',
        networkPassphrase: servers.networkPassphrase,
      })
        .addOperation(symbolOp)
        .setTimeout(30)
        .build();
      
      const decimalsTx = new StellarSdk.TransactionBuilder(account, {
        fee: '1000',
        networkPassphrase: servers.networkPassphrase,
      })
        .addOperation(decimalsOp)
        .setTimeout(30)
        .build();
      
      // Simulate all transactions
      const [nameResult, symbolResult, decimalsResult] = await Promise.all([
        servers.sorobanServer.simulateTransaction(nameTx),
        servers.sorobanServer.simulateTransaction(symbolTx),
        servers.sorobanServer.simulateTransaction(decimalsTx),
      ]);
      
      // Check if all simulations succeeded
      const nameSuccess = StellarSdk.rpc.Api.isSimulationSuccess(nameResult);
      const symbolSuccess = StellarSdk.rpc.Api.isSimulationSuccess(symbolResult);
      const decimalsSuccess = StellarSdk.rpc.Api.isSimulationSuccess(decimalsResult);
      
      if (!nameSuccess || !symbolSuccess || !decimalsSuccess) {
        return res.json({
          success: false,
          valid: false,
          error: 'Token contract does not implement SEP-41 standard (missing name, symbol, or decimals)',
          network: userNetwork,
          address,
        });
      }
      
      // Decode the results
      let name = 'Unknown';
      let symbol = 'UNKNOWN';
      let decimals = 0;
      
      try {
        if (nameSuccess && nameResult.result) {
          name = StellarSdk.scValToNative(nameResult.result.retval);
        }
        if (symbolSuccess && symbolResult.result) {
          symbol = StellarSdk.scValToNative(symbolResult.result.retval);
        }
        if (decimalsSuccess && decimalsResult.result) {
          decimals = StellarSdk.scValToNative(decimalsResult.result.retval);
        }
      } catch (decodeError) {
        console.warn('Error decoding token metadata:', decodeError);
      }
      
      return res.json({
        success: true,
        valid: true,
        token: {
          address,
          name,
          symbol,
          decimals,
          network: userNetwork,
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('MissingValue') || errorMsg.includes('not found')) {
        return res.json({
          success: false,
          valid: false,
          error: `Token contract not found or not initialized on ${userNetwork}`,
          network: userNetwork,
          address,
        });
      }
      
      return res.status(500).json({
        success: false,
        error: `Failed to validate token: ${errorMsg}`,
        network: userNetwork,
        address,
      });
    }
  } catch (error) {
    console.error('Error in GET /api/tokens/validate/:address:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/tokens/popular
 * Get list of popular/known tokens for the specified network
 * Fetches from multiple sources: Soroswap curated list + Stellar Horizon API
 */
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const { network, limit, customOnly } = req.query;
    // FORCE TESTNET ONLY - ignore user's network parameter
    const userNetwork = 'testnet';
    const resultLimit = parseInt(limit as string) || 100; // Default to 100 tokens
    const onlyCustomTokens = customOnly === 'true';
    
    console.log(`[Tokens API] Forcing testnet network only. Original request: ${network}, Using: ${userNetwork}, Custom only: ${onlyCustomTokens}`);
    
    // Custom token addresses for filtering
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
    
    try {
      // Strategy: Fetch only from Soroswap testnet (curated, high-quality Soroban tokens)
      const tokens: any[] = [];
      
      // 1. Get curated tokens from Soroswap - TESTNET ONLY
      try {
        const soroswapUrl = 'https://api.soroswap.finance/api/tokens';
        const soroswapResponse = await fetch(soroswapUrl);
        
        if (soroswapResponse.ok) {
          const soroswapData = await soroswapResponse.json() as any;
          // FORCE testnet network search
          const networkData = soroswapData.find((n: any) => n.network === 'testnet');
          
          if (networkData && networkData.assets) {
            networkData.assets.forEach((asset: any) => {
              let type = 'token';
              if (asset.code === 'XLM') {
                type = 'native';
              } else if (['USDC', 'EURC', 'ARST', 'BRL'].includes(asset.code)) {
                type = 'stablecoin';
              }
              
              tokens.push({
                symbol: asset.code,
                name: asset.name,
                address: asset.contract,
                issuer: asset.issuer,
                decimals: asset.decimals,
                type,
                icon: asset.icon || undefined,
                source: 'soroswap',
                verified: true, // Soroswap tokens are curated
              });
            });
          }
        }
        
        // Add our custom tokens with real liquidity pools
        const customTokens = [
          { symbol: 'AQX', name: 'Aquinox Token', address: 'CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3' },
          { symbol: 'VLTK', name: 'Velitok Token', address: 'CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME' },
          { symbol: 'SLX', name: 'Solarix Token', address: 'CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5' },
          { symbol: 'WRX', name: 'Wortex Token', address: 'CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE' },
          { symbol: 'SIXN', name: 'Sixion Token', address: 'CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O' },
          { symbol: 'MBIUS', name: 'Mobius Token', address: 'CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP' },
          { symbol: 'TRIO', name: 'Trionic Token', address: 'CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL' },
          { symbol: 'RELIO', name: 'Relion Token', address: 'CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H' },
          { symbol: 'TRI', name: 'Trion Token', address: 'CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW' },
          { symbol: 'NUMER', name: 'Numeris Token', address: 'CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR' },
        ];
        
        customTokens.forEach(token => {
          tokens.push({
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            decimals: 7,
            type: 'token',
            source: 'custom',
            verified: true, // Our custom tokens with real liquidity pools
          });
        });
      } catch (err) {
        console.warn('Failed to fetch from Soroswap, continuing with Horizon...', err);
      }
      
      // 2. Then get comprehensive list from Stellar Horizon (Classic assets)
      // NOTE: We SKIP Horizon API entirely because custom asset nodes should only show Soroban tokens (C addresses)
      // Classic assets (G issuers) are not compatible with Soroban vault contracts
      // If users need Classic assets, they must be wrapped to Soroban first
      console.log(`[Tokens API] Skipping Horizon Classic assets - only Soroban tokens (C addresses) are supported`);
      
      // We intentionally comment out the Horizon API call to prevent Classic assets from appearing
      /*
      try {
        const horizonUrls: { [key: string]: string } = {
          testnet: 'https://horizon-testnet.stellar.org',
          futurenet: 'https://horizon-futurenet.stellar.org',
          mainnet: 'https://horizon.stellar.org',
        };
        
        const horizonUrl = horizonUrls[userNetwork.toLowerCase()] || horizonUrls.testnet;
        
        // If searching, query by asset_code; otherwise get popular assets
        const horizonQueryUrl = searchQuery 
          ? `${horizonUrl}/assets?asset_code=${searchQuery}&limit=20`
          : `${horizonUrl}/assets?limit=${resultLimit}&order=desc`;
        
        const horizonResponse = await fetch(horizonQueryUrl);
        
        if (horizonResponse.ok) {
          const horizonData = await horizonResponse.json() as any;
          
          if (horizonData._embedded && horizonData._embedded.records) {
            horizonData._embedded.records.forEach((asset: any) => {
              // Skip if already in Soroswap list
              const existingToken = tokens.find(t => 
                t.symbol === asset.asset_code && t.issuer === asset.asset_issuer
              );
              
              if (!existingToken) {
                let type = 'token';
                if (['USDC', 'USDT', 'EURC', 'ARST', 'BRL', 'CETES'].includes(asset.asset_code)) {
                  type = 'stablecoin';
                }
                
                tokens.push({
                  symbol: asset.asset_code,
                  name: asset.asset_code, // Horizon doesn't provide full names
                  address: undefined, // Classic assets don't have contract addresses until wrapped
                  issuer: asset.asset_issuer,
                  decimals: 7, // Stellar classic assets use 7 decimals
                  type,
                  source: 'horizon',
                  verified: false,
                  accounts: asset.accounts?.authorized || 0, // Number of accounts holding this asset
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch from Horizon:', err);
      }
      */
      
      // Sort: Verified (Soroswap) first, then by number of accounts
      tokens.sort((a, b) => {
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        return (b.accounts || 0) - (a.accounts || 0);
      });
      
      // Filter to only custom tokens if requested
      let finalTokens = tokens;
      if (onlyCustomTokens) {
        finalTokens = tokens.filter((token) => 
          token.address && CUSTOM_TOKEN_ADDRESSES.includes(token.address)
        );
        console.log(`[Tokens API] Filtered to ${finalTokens.length} custom tokens with real liquidity pools`);
      }
      
      return res.json({
        success: true,
        network: 'testnet',
        tokens: finalTokens.slice(0, resultLimit),
        total: finalTokens.length,
        sources: onlyCustomTokens ? ['custom-tokens'] : ['soroswap-testnet'],
        note: onlyCustomTokens 
          ? '✅ Custom tokens with real liquidity pools (XLM pairs)' 
          : '⚠️ TESTNET ONLY: Token list includes only Soroban testnet tokens (contract addresses starting with C). Classic Stellar assets are not supported.',
      });
    } catch (fetchError) {
      // Fallback to hardcoded testnet list if API fails
      console.warn('Failed to fetch from Soroswap API, using testnet fallback:', fetchError);
      
      const fallbackTokens: { [key: string]: any[] } = {
        testnet: [
          {
            symbol: 'XLM',
            name: 'Stellar Lumens',
            address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
            decimals: 7,
            type: 'native',
          },
          {
            symbol: 'USDC',
            name: 'USDCoin',
            address: 'CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK',
            decimals: 7,
            type: 'stablecoin',
          },
          // Custom tokens with real liquidity pools
          {
            symbol: 'AQX',
            name: 'Aquinox Token',
            address: 'CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3',
            decimals: 7,
            type: 'token',
          },
          {
            symbol: 'VLTK',
            name: 'Velitok Token',
            address: 'CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME',
            decimals: 7,
            type: 'token',
          },
          {
            symbol: 'SLX',
            name: 'Solarix Token',
            address: 'CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5',
            decimals: 7,
            type: 'token',
          },
          {
            symbol: 'WRX',
            name: 'Wortex Token',
            address: 'CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE',
            decimals: 7,
            type: 'token',
          },
          {
            symbol: 'SIXN',
            name: 'Sixion Token',
            address: 'CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O',
            decimals: 7,
            type: 'token',
          },
          {
            symbol: 'MBIUS',
            name: 'Mobius Token',
            address: 'CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP',
            decimals: 7,
            type: 'token',
          },
          {
            symbol: 'TRIO',
            name: 'Trionic Token',
            address: 'CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL',
            decimals: 7,
            type: 'token',
          },
          {
            symbol: 'RELIO',
            name: 'Relion Token',
            address: 'CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H',
            decimals: 7,
            type: 'token',
          },
          {
            symbol: 'TRI',
            name: 'Trion Token',
            address: 'CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW',
            decimals: 7,
            type: 'token',
          },
          {
            symbol: 'NUMER',
            name: 'Numeris Token',
            address: 'CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR',
            decimals: 7,
            type: 'token',
          },
        ],
        futurenet: [
          {
            symbol: 'XLM',
            name: 'Stellar Lumens',
            address: 'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT',
            decimals: 7,
            type: 'native',
          },
        ],
        mainnet: [
          {
            symbol: 'XLM',
            name: 'Stellar Lumens',
            address: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
            decimals: 7,
            type: 'native',
          },
        ],
      };
      
      // FORCE testnet fallback only
      const tokens = fallbackTokens.testnet;
      
      return res.json({
        success: true,
        network: 'testnet',
        tokens,
        source: 'fallback-testnet',
        note: '⚠️ TESTNET ONLY: Using fallback testnet token list. Soroswap API unavailable.',
      });
    }
  } catch (error) {
    console.error('Error in GET /api/tokens/popular:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;


