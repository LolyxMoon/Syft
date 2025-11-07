import { openai } from '../lib/openaiClient.js';
import { stellarTerminalService } from './stellarTerminalService.js';
import { tavilyService } from './tavilyService.js';
import { 
  countConversationTokens, 
  isApproachingLimit
} from '../utils/tokenCounter.js';
import { supabase } from '../lib/supabase.js';
import * as StellarSdk from '@stellar/stellar-sdk';
import { pollUntil } from '../utils/retryLogic.js';

// Stellar network configuration
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);
const sorobanServer = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);

/**
 * OpenAI Function Definitions for Stellar Terminal
 * Each function represents a blockchain operation the AI can perform
 */
const TERMINAL_FUNCTIONS = [
  // WALLET FUNCTIONS
  {
    name: 'connect_wallet',
    description: 'DEPRECATED - Wallet should be connected via Freighter browser extension only. User\'s wallet is automatically available when connected through the UI. Do NOT call this function - inform user to connect via the wallet button in the top-right corner of the interface.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'fund_from_faucet',
    description: 'Fund an account from the Stellar testnet Friendbot faucet.',
    parameters: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'The public key (address) to fund',
        },
        amount: {
          type: 'string',
          description: 'Amount of XLM to request (default 10000)',
          default: '10000',
        },
      },
      required: ['publicKey'],
    },
  },
  {
    name: 'get_balance',
    description: 'Show all balances (XLM + custom assets) for the connected wallet including trustlines. Use ONLY when user explicitly asks to check/show balance. When user requests swap/transfer with relative amounts (half, 50%, etc.), use this to calculate then IMMEDIATELY proceed with the action. DO NOT specify publicKey - it uses the connected wallet automatically.',
    parameters: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'INTERNAL USE ONLY - automatically populated with connected wallet. DO NOT provide this parameter.',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_account',
    description: 'Create a new Stellar account and fund it from the faucet.',
    parameters: {
      type: 'object',
      properties: {
        seedAmount: {
          type: 'string',
          description: 'Initial XLM funding amount',
          default: '100',
        },
      },
    },
  },

  // ASSET FUNCTIONS
  {
    name: 'create_asset',
    description: `Generate an asset identifier for a custom Stellar asset. NOTE: This does NOT submit a blockchain transaction. In Stellar, assets are created implicitly when first transferred. This function generates the asset string format (CODE:ISSUER) that recipients need to establish trustlines. No signature required. IMPORTANT: The user (issuer) does NOT need to setup a trustline for their own asset - issuers automatically trust their own assets. Only recipients need to setup trustlines to receive the asset.`,
    parameters: {
      type: 'object',
      properties: {
        assetCode: {
          type: 'string',
          description: 'Asset code (e.g., MYCATTY, SYFT, USDC) - max 12 alphanumeric characters',
        },
        supply: {
          type: 'string',
          description: 'Intended total supply (informational only, not enforced on-chain)',
        },
        description: {
          type: 'string',
          description: 'Optional asset description for reference',
        },
      },
      required: ['assetCode', 'supply'],
    },
  },
  {
    name: 'transfer_asset',
    description: 'Transfer assets (XLM or custom) to another address with optional memo.',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Recipient public key',
        },
        asset: {
          type: 'string',
          description: 'Asset to transfer (XLM or CODE:ISSUER format)',
        },
        amount: {
          type: 'string',
          description: 'Amount to transfer',
        },
        memo: {
          type: 'string',
          description: 'Optional transaction memo',
        },
      },
      required: ['destination', 'asset', 'amount'],
    },
  },
  {
    name: 'batch_transfer',
    description: 'Execute multiple transfers in a single transaction for efficiency.',
    parameters: {
      type: 'object',
      properties: {
        transfers: {
          type: 'array',
          description: 'Array of transfer objects',
          items: {
            type: 'object',
            properties: {
              destination: { type: 'string' },
              asset: { type: 'string' },
              amount: { type: 'string' },
            },
          },
        },
      },
      required: ['transfers'],
    },
  },

  // TRUSTLINE FUNCTIONS
  {
    name: 'setup_trustline',
    description: `Add trustline for a custom asset with optional limit. IMPORTANT: Users do NOT need trustlines for assets they themselves issued - issuers automatically trust their own assets. Only call this function when the user wants to trust someone else's asset. Check if the issuer address matches the user's wallet address before suggesting a trustline setup.`,
    parameters: {
      type: 'object',
      properties: {
        assetCode: {
          type: 'string',
          description: 'Asset code',
        },
        issuer: {
          type: 'string',
          description: 'Asset issuer public key (must be different from the user\'s wallet address)',
        },
        limit: {
          type: 'string',
          description: 'Optional trust limit',
        },
      },
      required: ['assetCode', 'issuer'],
    },
  },
  {
    name: 'revoke_trustline',
    description: 'Remove trustline for an asset (sets limit to 0).',
    parameters: {
      type: 'object',
      properties: {
        assetCode: {
          type: 'string',
          description: 'Asset code',
        },
        issuer: {
          type: 'string',
          description: 'Asset issuer public key',
        },
      },
      required: ['assetCode', 'issuer'],
    },
  },

  // DEX & LIQUIDITY FUNCTIONS
  {
    name: 'swap_assets',
    description: 'Swap assets on testnet DEX with slippage protection. Call this IMMEDIATELY when user requests a swap - even if you need to check balance first for percentage calculations.',
    parameters: {
      type: 'object',
      properties: {
        fromAsset: {
          type: 'string',
          description: 'Asset to swap from (e.g., XLM, USDC)',
        },
        toAsset: {
          type: 'string',
          description: 'Asset to swap to (e.g., XLM, USDC)',
        },
        amount: {
          type: 'string',
          description: 'Exact amount to swap (calculate from balance if user said "half", "50%", etc.)',
        },
        slippage: {
          type: 'string',
          description: 'Max slippage percentage',
          default: '0.5',
        },
      },
      required: ['fromAsset', 'toAsset', 'amount'],
    },
  },
  {
    name: 'establish_pool_trustline',
    description: 'Establish trustline for liquidity pool shares BEFORE adding liquidity. This is REQUIRED before you can deposit into a pool.',
    parameters: {
      type: 'object',
      properties: {
        asset1: {
          type: 'string',
          description: 'First asset (e.g., XLM or USDC:ISSUER)',
        },
        asset2: {
          type: 'string',
          description: 'Second asset (e.g., XLM or USDC:ISSUER)',
        },
      },
      required: ['asset1', 'asset2'],
    },
  },
  {
    name: 'add_liquidity',
    description: 'Add liquidity to a pool and receive LP tokens. NOTE: User must have trustline for pool shares first (use establish_pool_trustline).',
    parameters: {
      type: 'object',
      properties: {
        asset1: {
          type: 'string',
          description: 'First asset',
        },
        asset2: {
          type: 'string',
          description: 'Second asset',
        },
        amount1: {
          type: 'string',
          description: 'Amount of first asset',
        },
        amount2: {
          type: 'string',
          description: 'Amount of second asset',
        },
      },
      required: ['asset1', 'asset2', 'amount1', 'amount2'],
    },
  },
  {
    name: 'remove_liquidity',
    description: 'Remove liquidity from a pool by burning LP (liquidity pool) tokens to receive back underlying assets.',
    parameters: {
      type: 'object',
      properties: {
        poolId: {
          type: 'string',
          description: 'The liquidity pool ID (hexadecimal string)',
        },
        lpTokens: {
          type: 'string',
          description: 'Amount of LP tokens to burn (numeric string)',
        },
      },
      required: ['poolId', 'lpTokens'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_pool_analytics',
    description: 'Get liquidity pool analytics (TVL, volume, APR).',
    parameters: {
      type: 'object',
      properties: {
        poolId: {
          type: 'string',
          description: 'Pool ID or asset pair',
        },
      },
      required: ['poolId'],
    },
  },

  // NFT FUNCTIONS
  {
    name: 'mint_nft',
    description: 'Mint a custom NFT with AI-generated artwork. Accepts creative prompts like "Goku NFT", "cyberpunk cat", "abstract galaxy art", etc. The AI will generate unique artwork and mint it as an NFT on the Stellar blockchain.',
    parameters: {
      type: 'object',
      properties: {
        metadataUri: {
          type: 'string',
          description: 'Creative prompt for the NFT artwork (e.g., "Goku from Dragon Ball", "cyberpunk cityscape", "mystical phoenix"). This will be used to generate AI artwork via Runware.',
        },
        collectionId: {
          type: 'string',
          description: 'Collection type: "custom" for user-created NFTs, "quest" for quest reward NFTs, or "vault" for vault-related NFTs',
          default: 'custom',
        },
      },
      required: ['metadataUri'],
    },
  },
  {
    name: 'transfer_nft',
    description: 'Transfer NFT to another address.',
    parameters: {
      type: 'object',
      properties: {
        tokenId: {
          type: 'string',
          description: 'NFT token ID',
        },
        toAddress: {
          type: 'string',
          description: 'Recipient address',
        },
      },
      required: ['tokenId', 'toAddress'],
    },
  },
  {
    name: 'burn_nft',
    description: 'Burn (destroy) an NFT permanently from the connected wallet.',
    parameters: {
      type: 'object',
      properties: {
        tokenId: {
          type: 'string',
          description: 'NFT token ID to burn',
        },
      },
      required: ['tokenId'],
    },
  },
  {
    name: 'list_nfts',
    description: 'List all NFTs owned by the connected wallet. DO NOT specify an address - it will automatically use the connected wallet.',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'INTERNAL USE ONLY - automatically populated with connected wallet address. DO NOT provide this parameter.',
        },
        collectionId: {
          type: 'string',
          description: 'Optional: filter by collection',
        },
      },
      required: [],
    },
  },

  // TRANSACTION & EXPLORER FUNCTIONS
  {
    name: 'simulate_transaction',
    description: 'Simulate transaction from XDR without broadcasting.',
    parameters: {
      type: 'object',
      properties: {
        xdr: {
          type: 'string',
          description: 'Transaction XDR',
        },
      },
      required: ['xdr'],
    },
  },
  {
    name: 'get_transaction_history',
    description: 'Get transaction history for the connected wallet. DO NOT specify an address - it uses the connected wallet automatically.',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'INTERNAL USE ONLY - automatically populated with connected wallet. DO NOT provide this parameter.',
        },
        days: {
          type: 'number',
          description: 'Number of days to look back',
          default: 7,
        },
      },
      required: [],
    },
  },
  {
    name: 'search_explorer',
    description: 'Search for transaction, account, or ledger on explorer.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Transaction hash, account address, or ledger number',
        },
        type: {
          type: 'string',
          enum: ['tx', 'account', 'ledger'],
          description: 'Type of search',
        },
      },
      required: ['query', 'type'],
    },
  },

  // NETWORK & ANALYTICS FUNCTIONS
  {
    name: 'get_network_stats',
    description: 'Get current network statistics (latest block, tx volume, fees).',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_price_oracle',
    description: 'Get current price from Soroban oracle.',
    parameters: {
      type: 'object',
      properties: {
        assetPair: {
          type: 'string',
          description: 'Asset pair (e.g., XLM/USDC)',
        },
      },
      required: ['assetPair'],
    },
  },

  // BLEND PROTOCOL - LENDING & BORROWING
  {
    name: 'lend_to_pool',
    description: 'Supply (lend) assets to a Blend lending pool to earn interest. Your supplied assets become available for others to borrow, and you receive bTokens representing your position. You earn interest over time from borrowers.',
    parameters: {
      type: 'object',
      properties: {
        poolAddress: {
          type: 'string',
          description: 'Blend pool contract address. Use "default" for the main USDC/XLM pool on testnet.',
          default: 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65',
        },
        asset: {
          type: 'string',
          description: 'Asset to supply (e.g., "XLM", "USDC", or "CODE:ISSUER" format)',
        },
        amount: {
          type: 'string',
          description: 'Amount to supply to the pool',
        },
      },
      required: ['asset', 'amount'],
    },
  },
  {
    name: 'borrow_from_pool',
    description: 'Borrow assets from a Blend lending pool against your supplied collateral. You must have sufficient collateral supplied to the pool first. Interest accrues on borrowed amounts.',
    parameters: {
      type: 'object',
      properties: {
        poolAddress: {
          type: 'string',
          description: 'Blend pool contract address. Use "default" for the main USDC/XLM pool on testnet.',
          default: 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65',
        },
        asset: {
          type: 'string',
          description: 'Asset to borrow (e.g., "XLM", "USDC", or "CODE:ISSUER" format)',
        },
        amount: {
          type: 'string',
          description: 'Amount to borrow from the pool',
        },
      },
      required: ['asset', 'amount'],
    },
  },
  {
    name: 'repay_loan',
    description: 'Repay borrowed assets to a Blend lending pool. This reduces your debt and frees up your collateral. You can repay partial or full amounts.',
    parameters: {
      type: 'object',
      properties: {
        poolAddress: {
          type: 'string',
          description: 'Blend pool contract address. Use "default" for the main USDC/XLM pool on testnet.',
          default: 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65',
        },
        asset: {
          type: 'string',
          description: 'Asset to repay (e.g., "XLM", "USDC", or "CODE:ISSUER" format)',
        },
        amount: {
          type: 'string',
          description: 'Amount to repay. Use "max" to repay full debt.',
        },
      },
      required: ['asset', 'amount'],
    },
  },
  {
    name: 'withdraw_lended',
    description: 'Withdraw your supplied (lent) assets from a Blend pool. This burns your bTokens and returns the underlying asset plus accrued interest. You can only withdraw up to your available balance (minus any amount being used as collateral for borrows).',
    parameters: {
      type: 'object',
      properties: {
        poolAddress: {
          type: 'string',
          description: 'Blend pool contract address. Use "default" for the main USDC/XLM pool on testnet.',
          default: 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65',
        },
        asset: {
          type: 'string',
          description: 'Asset to withdraw (e.g., "XLM", "USDC", or "CODE:ISSUER" format)',
        },
        amount: {
          type: 'string',
          description: 'Amount to withdraw. Use "max" to withdraw all available (not locked as collateral).',
        },
      },
      required: ['asset', 'amount'],
    },
  },
  {
    name: 'get_blend_position',
    description: 'Check your lending and borrowing position in a Blend pool. Shows supplied amounts, borrowed amounts, available to borrow, health factor, and interest rates.',
    parameters: {
      type: 'object',
      properties: {
        poolAddress: {
          type: 'string',
          description: 'Blend pool contract address. Use "default" for the main USDC/XLM pool on testnet.',
          default: 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65',
        },
        address: {
          type: 'string',
          description: 'INTERNAL USE ONLY - automatically populated with connected wallet. DO NOT provide this parameter.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_pool_info',
    description: 'Get detailed information about a Blend lending pool including available liquidity, total supplied, total borrowed, utilization rate, and current APYs for each asset.',
    parameters: {
      type: 'object',
      properties: {
        poolAddress: {
          type: 'string',
          description: 'Blend pool contract address. Use "default" for the main USDC/XLM pool on testnet.',
          default: 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65',
        },
      },
      required: [],
    },
  },

  // UTILITY FUNCTIONS
  {
    name: 'resolve_federated_address',
    description: 'Resolve federated address (alice*example.com) to Stellar address.',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Federated address',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for real-time information using Tavily advanced search. Use this freely when you need to find: asset issuer addresses, contract addresses, Stellar documentation, protocol information, current market data, or any information not in your knowledge base. ALWAYS use this for asset issuers when user doesn\'t provide them. You can call this multiple times to refine your search.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "Stellar testnet USDC issuer address", "BTC token issuer on Stellar testnet", "Soroswap router contract address"). Be specific and include "Stellar testnet" for testnet assets.',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10, max: 20)',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
];

/**
 * Context metadata for each conversation session
 */
interface ConversationContext {
  messages: any[];
  tokenCount: number;
  lastSummarizedAt: number; // Message index of last summarization
  summarizationCount: number; // How many times we've summarized
}

/**
 * Terminal AI Service
 * Handles AI chat interactions with blockchain function calling
 * Features automatic context management with summarization at 80k tokens
 */
export class TerminalAIService {
  private conversationHistory: Map<string, ConversationContext> = new Map();
  
  // Context management settings
  private readonly TOKEN_LIMIT = 100000; // 100k token limit
  private readonly SUMMARIZATION_THRESHOLD = 0.80; // Summarize at 80% (80k tokens)
  private readonly MIN_MESSAGES_TO_SUMMARIZE = 10; // Don't summarize if fewer than this many messages

  async chat(sessionId: string, message: string, walletAddress?: string): Promise<any> {
    try {
      // Auto-connect wallet if provided
      if (walletAddress) {
        const service = stellarTerminalService;
        const existingSession = (service as any).sessions?.get(sessionId);
        
        // Always ensure wallet is connected (update if needed)
        if (!existingSession || existingSession.publicKey !== walletAddress) {
          // Auto-connect the wallet to this session (view-only mode without secret key)
          (service as any).sessions = (service as any).sessions || new Map();
          (service as any).sessions.set(sessionId, { 
            publicKey: walletAddress,
            secretKey: undefined // No secret key - will prompt user when signing is needed
          });
        }
      }

      // Get or initialize conversation context
      if (!this.conversationHistory.has(sessionId)) {
        const initialMessages = [
          {
            role: 'system',
            content: `You are a helpful Stellar blockchain assistant. You can help users interact with the Stellar testnet through natural language.

Key capabilities:
- Wallet management (fund, check balances)
- Asset operations (create, transfer, batch transfers)
- Trustlines (setup, revoke)
- DEX operations (swap, add/remove liquidity, analytics)
- Blend Protocol (lend, borrow, repay, withdraw, position tracking)
- NFTs (mint, transfer, burn, list)
- Transaction management (simulate, history, explorer)
- Network analytics and price oracles
- Web search (Tavily) - for real-time information lookup

IMPORTANT - Web Search Usage:
You have access to web_search function with ADVANCED search mode for deep, accurate results. Use it FREELY and MULTIPLE TIMES if needed:
- Asset issuer addresses (e.g., "Stellar testnet USDC issuer address", "BTC token Stellar testnet issuer", "random testnet asset issuers")
- Contract addresses (e.g., "Soroswap router address")
- Protocol documentation or guides
- Current market information
- Any information you're uncertain about

When user asks to swap/transfer assets without providing issuer addresses:
1. Web search for the asset issuer (be specific: include "Stellar testnet" in your query)
2. If first search doesn't find a valid issuer, try different search terms
3. Use multiple searches if needed to find accurate information
4. Once you have the issuer, proceed with the swap/transfer operation

CRITICAL TESTNET LIMITATION:
Stellar testnet has VERY LIMITED liquidity pools. Most swaps will fail with "No path found for this swap".
Known working swaps on testnet:
- XLM ↔ USDC (issuer: GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5) ✅

⭐ CUSTOM TOKENS WITH REAL LIQUIDITY POOLS (10,000 XLM EACH):
We have 10 custom tokens with dedicated liquidity pools for testing vault auto-swap functionality:

1. AQX (Aquatic Exchange Token)
   - Token: CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3
   - Pool: CD7U5F4EKUC7UM72F3D5G4UPS6DJ54RNNPSHKJBK7KCRX4N3MNNBDGES
   - XLM ↔ AQX swaps fully supported ✅

2. VLTK (Vault Token)
   - Token: CBBBGORMTQ4B2DULIT3GG2GOQ5VZ724M652JYIDHNDWVUC76242VINME
   - Pool: CCPV4CJUVHJ7DHN7UTHXORHOBVBP7ALNYU5QBXA6MJBFVS2Z5JWQHJRC
   - XLM ↔ VLTK swaps fully supported ✅

3. SLX (Stellar Lux Token)
   - Token: CCU7FIONTYIEZK2VWF4IBRHGWQ6ZN2UYIL6A4NKFCG32A2JUEWN2LPY5
   - Pool: CBIM5CPY2T3KM6BDH6KVQNTPZ244VF6SJYB6DHB25UU6XGUWDNGICQMA
   - XLM ↔ SLX swaps fully supported ✅

4. WRX (Wormhole Exchange Token)
   - Token: CCAIKLYMECH7RTVNR3GLWDU77WHOEDUKRVFLYMDXJDA7CX74VX6SRXWE
   - Pool: CCYBUIBFOWROWGLZWJWWVOWJSDVYF4XX3PW6U7Z4SWZVG64LPTWUT3S4
   - XLM ↔ WRX swaps fully supported ✅

5. SIXN (Sixty-Nine Token)
   - Token: CDYGMXR7K4DSN4SE4YAIGBZDP7GHSPP7DADUBHLO3VPQEHHCDJRNWU6O
   - Pool: CCOQIJJM6VWFH6YA4QU2D3GX5YUEJOWDLZP4EPTIIL5AFLMRZKTBNRJW
   - XLM ↔ SIXN swaps fully supported ✅

6. MBIUS (Mobius Token)
   - Token: CBXSQDQUYGJ7TDXPJTVISXYRMJG4IPLGN22NTLXX27Y2TPXA5LZUHQDP
   - Pool: CBERM7NGHSHHKDNOFE7DAMYLHYKK2M5JJBP4QSYL65OMSYGKBN3M2GUE
   - XLM ↔ MBIUS swaps fully supported ✅

7. TRIO (Triangle Token)
   - Token: CB4MYY4N7IPH76XX6HFJNKPNORSDFMWBL4ZWDJ4DX73GK4G2KPSRLBGL
   - Pool: CBP6CNZQIJHP66L6NY7YJVZ4GBC773XKNRLG4TMD7D773HQ5LZ46OEZ4
   - XLM ↔ TRIO swaps fully supported ✅

8. RELIO (Reliable Token)
   - Token: CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H
   - Pool: CDPGBKILVQXIDSVOUHQ4YOK5P7PNZVPSVM7GNSJX3JI5NQRNTSGOKEGN
   - XLM ↔ RELIO swaps fully supported ✅

9. TRI (Trinity Token)
   - Token: CB4JLZSNRR37UQMFZITKTFMQYG7LJR3JHJXKITXEVDFXRQTFYLFKLEDW
   - Pool: CAQ2366OMMX74H7QB4MQTEMH3RVSLNU4O5Y2HMJ5AWT2M4ONZR7IE47Y
   - XLM ↔ TRI swaps fully supported ✅

10. NUMER (Numerator Token)
    - Token: CDBBFLGF35YDKD3VXFB7QGZOJFYZ4I2V2BE3NB766D5BUDFCRVUB7MRR
    - Pool: CA6KURSAHVBAOZXPD3M5CQLWNDCJ6IWEH2A3XCCVPAXI2DDVVBESAVB5
    - XLM ↔ NUMER swaps fully supported ✅

HOW TO SWAP TO CUSTOM TOKENS:
When user requests to swap XLM to any of these tokens (AQX, VLTK, SLX, WRX, SIXN, MBIUS, TRIO, RELIO, TRI, NUMER):
1. Use the custom token CONTRACT ADDRESS (e.g., CAABHEKIZJ3ZKVLTI63LHEZNQATLIZHSZAIGSKTAOBWGGINONRUUBIF3 for AQX)
2. Call swap_assets with fromAsset: "XLM", toAsset: "<TOKEN_ADDRESS>", amount: "<amount>"
3. The swap will use the dedicated liquidity pool with 10,000 XLM liquidity
4. Slippage tolerance: 0.5% (0.005) recommended
5. **IMPORTANT: These are Soroban tokens - NO TRUSTLINE NEEDED!** Unlike classic Stellar assets, custom Soroban tokens don't require trustlines. You can swap directly!

Example: "Swap 100 XLM to RELIO"
→ swap_assets(fromAsset: "XLM", toAsset: "CDRFQC4J5ZRAYZQUUSTS3KGDMJ35RWAOITXGHQGRXDVRJACMXB32XF7H", amount: "100", slippage: "0.005")

**DO NOT call setup_trustline for custom Soroban tokens (AQX, VLTK, SLX, etc.) - they don't need trustlines!**

If user asks to setup trustline for a custom token, explain:
"That's a Soroban token - no trustline needed! Soroban tokens work differently from classic Stellar assets. You can swap directly without establishing a trustline first."

For CLASSIC Stellar assets (with G-address issuers like USDC), trustlines ARE required.

If user requests swap to "random token" or any other non-listed asset:
1. Inform them that testnet has limited liquidity
2. Suggest swapping to USDC or one of the 10 custom tokens above
3. Explain that these custom tokens have real liquidity pools for testing
4. DO NOT attempt swaps to tokens without confirmed liquidity pools

Example response:
"Stellar testnet has limited liquidity pools. I can swap your XLM to:
- USDC (stablecoin) ✅
- 10 custom tokens with real liquidity: AQX, VLTK, SLX, WRX, SIXN, MBIUS, TRIO, RELIO, TRI, NUMER ✅

Which one would you like to swap to?"

CRITICAL - LIQUIDITY POOL TRUSTLINES:
Before adding liquidity to ANY pool, you MUST establish a trustline for the pool shares:
1. First call: establish_pool_trustline(asset1, asset2) - User signs this
2. Then call: add_liquidity(asset1, asset2, amount1, amount2) - User signs this
Without step 1, the add_liquidity transaction will FAIL with "tx_failed" error!

The updated addLiquidity function now automatically includes trustline operations, but it's still good practice to inform users about this two-step process.

IMPORTANT - Blend Protocol Lending & Borrowing:
Blend is a decentralized lending protocol on Stellar where users can:
1. LEND (Supply): Deposit assets to earn interest. Blend automatically mints bTokens (receipt tokens) to your wallet.
2. BORROW: Take loans against your supplied collateral. Interest accrues on borrowed amounts.
3. REPAY: Pay back borrowed assets to reduce debt and free up collateral.
4. WITHDRAW: Withdraw supplied assets plus earned interest (only available amounts, not locked as collateral).

Key Concepts:
- Health Factor: Ratio of collateral value to borrowed value. Must stay above 1.0 to avoid liquidation.
- Collateral Factor: Percentage of supplied asset value that can be borrowed against (e.g., 75% for XLM).
- APY: Annual percentage yield - interest earned on supplied assets or paid on borrowed assets.
- Utilization Rate: Percentage of supplied assets currently borrowed (affects interest rates).
- bTokens: Receipt tokens automatically minted when you supply assets (e.g., bUSDC when supplying USDC).

IMPORTANT - Automatic Trustline Management (Two-Step Process):
- When BORROWING an asset you don't have approved, the system returns a trustline/approval transaction FIRST, then the borrow transaction (2 separate signatures required).
- This is a 2-step process like add_liquidity: Step 1 = Approve asset, Step 2 = Borrow operation.
- When LENDING/SUPPLYING assets, Blend automatically handles bToken minting via Soroban contracts (no manual trustline needed - single transaction).
- The AI should NOT manually call borrow_from_pool twice - the system handles the continuation automatically after trustline is signed.

Testnet Default Pool: CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65 (supports USDC, XLM, wETH, wBTC)

Example Workflow:
1. User: "Lend 1000 USDC to Blend" → Call lend_to_pool(asset: "USDC", amount: "1000")
   - If first time: Blend mints bUSDC tokens to your wallet automatically
2. User: "Borrow 500 XLM from Blend" → Call borrow_from_pool(asset: "XLM", amount: "500")
   - If you don't have XLM trustline: Automatically sets it up first, then borrows
3. User: "Check my Blend position" → Call get_blend_position()
4. User: "Repay my XLM loan" → Call repay_loan(asset: "XLM", amount: "max")

CRITICAL: Do NOT show web search results in your response! Web search is a SILENT helper tool. Only show the final blockchain operation (swap, transfer, trustline) to the user. Your reasoning is internal - just present the final action.

IMPORTANT - Wallet Integration:
The user's wallet is already connected to the platform${walletAddress ? ` (${walletAddress})` : ''}. 

CRITICAL WALLET RULES:
- When they ask about "my wallet", "my balance", or "my NFTs", ALWAYS use their connected wallet address: ${walletAddress || 'the connected address'}
- NEVER make up, guess, or hallucinate wallet addresses
- NEVER call functions with random addresses
- For operations on the user's wallet, the connected address is AUTOMATICALLY used
- For list_nfts, get_balance, and similar functions: DO NOT provide an address parameter - the system will use the connected wallet automatically

IMPORTANT - Transaction Execution:
When a user clearly requests a blockchain operation (transfer, swap, deploy, etc.), IMMEDIATELY call the appropriate function. DO NOT ask for confirmation or secret keys first.
- The functions will automatically return an interactive UI card for the user to sign with their wallet
- Users will see a "Sign & Send" button that triggers their wallet popup (Freighter)
- This is secure and production-ready - never ask users for secret keys in chat

Examples of direct execution:
- "Transfer 100 XLM to GABC..." → Immediately call transfer_asset function
- "Swap 50 XLM for USDC" → Immediately call swap_assets function

IMPORTANT - Handling Percentage/Relative Amounts (MULTI-STEP OPERATIONS):
When users say "swap half of my XLM" or "transfer 50% of my balance", you MUST perform BOTH steps:
1. Call get_balance to determine the exact amount
2. THEN IMMEDIATELY call swap_assets/transfer_asset with the calculated amount in the SAME conversation turn

You have the ability to call MULTIPLE functions in sequence. Use this for:
- Percentage-based swaps/transfers
- Operations that need balance checking first
- Multi-step workflows

Example flow for "swap half of my XLM to USDC":
STEP 1: Call get_balance(publicKey: "GBWFM...") 
STEP 2: See result → 12892.8809766 XLM
STEP 3: Calculate half → 6446.4404883 XLM
STEP 4: IMMEDIATELY call swap_assets(fromAsset: "XLM", toAsset: "USDC", amount: "6446.4404883")

DO NOT stop after get_balance! Continue with the actual swap operation in the same turn.

IMPORTANT - Trustline Requirements:
When swapping to a non-XLM asset, the user MUST have a trustline established for that asset first.
If the swap_assets function returns a "setup_trustline" action:
1. Explain to the user that they need to establish a trustline first
2. Tell them to sign the trustline transaction
3. The system will AUTOMATICALLY proceed with the swap after the trustline is signed (no need for user to retry)
4. The follow-up swap will happen seamlessly in the background

Example response for trustline requirement:
"To receive USDC, you first need a trustline for USDC on the Testnet. I've prepared the trustline transaction - sign it in Freighter, then I'll automatically proceed with your swap!"

IMPORTANT - Response Formatting for Actions:
When a function returns an action object (requiresSigning: true), format your response VERY CONCISELY:
- DO NOT include or mention the XDR string - it's too long and will cause display issues
- Provide a SHORT, friendly summary of what's happening
- Include key details: from/to addresses (truncated), amount, asset, network
- Mention that they'll see a Freighter popup to sign & approve
- Keep it brief - just a few lines - the action card UI shows the details
- Example format: "✅ Ready to transfer 1000 XLM to GCXHLDX... via Freighter. Click the button below to sign."

SPECIAL - NFT Minting Success:
When an NFT is successfully minted (with imageUrl in the result), be enthusiastic and mention:
- The NFT name
- That the AI-generated artwork is ready
- That it's been added to their wallet
- Example: "🎉 Your [NFT Name] NFT has been created with custom AI artwork! It's now in your wallet."

Always be friendly, explain technical concepts clearly, and provide transaction links when operations complete.
Format transaction hashes and addresses nicely for readability.`,
          },
        ];
        
        this.conversationHistory.set(sessionId, {
          messages: initialMessages,
          tokenCount: countConversationTokens(initialMessages, process.env.OPENAI_MODEL),
          lastSummarizedAt: 0,
          summarizationCount: 0,
        });
      }

      const context = this.conversationHistory.get(sessionId)!;
      
      // Check if we need to summarize before adding new message
      await this.checkAndSummarizeIfNeeded(sessionId, context);
      
      // Add user message
      context.messages.push({ role: 'user', content: message });
      context.tokenCount = countConversationTokens(
        context.messages,
        process.env.OPENAI_MODEL
      );

      // Convert functions to tools format for OpenAI API
      const tools = TERMINAL_FUNCTIONS.map(func => ({
        type: 'function' as const,
        function: func,
      }));

      console.log('[Terminal AI] Sending request with', tools.length, 'tools');

      // Call OpenAI with function calling - NO max_tokens to allow full responses
      let response;
      try {
        response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-5-nano-2025-08-07',
          messages: context.messages,
          tools,
          tool_choice: 'auto',
          temperature: 0.7,
        });
      } catch (error: any) {
        console.error('[Terminal AI] OpenAI API Error:', {
          status: error.status,
          message: error.message,
          type: error.type,
          code: error.code,
          toolCount: tools.length,
          lastUserMessage: context.messages[context.messages.length - 1],
        });
        
        // If it's an authentication error with tools, try without specific problematic tools
        if (error.status === 401 && error.type === 'new_api_error') {
          console.warn('[Terminal AI] Auth error - this might be a New API/One API proxy issue with tool definitions');
        }
        
        throw error;
      }

      const assistantMessage = response.choices[0].message;

      // Check if AI wants to call a function
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Store the first function call info
        let firstFunctionName = assistantMessage.tool_calls[0].function.name;
        let lastFunctionResult: any;

        // Add assistant message with tool calls to context
        context.messages.push(assistantMessage);
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);

        // Execute all tool calls requested by the AI
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`[Terminal AI] 🔧 ${functionName}`, functionArgs);

          // Execute the blockchain function
          const functionResult = await this.executeFunction(
            sessionId,
            functionName,
            functionArgs
          );

          lastFunctionResult = functionResult;

          // Add function result to context
          context.messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult),
          });
          context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
        }

        // Allow AI to potentially call MORE functions based on results (multi-step operations)
        // This enables "get balance then swap" workflows
        let continueChain = true;
        let maxIterations = 5; // Prevent infinite loops (increased for web_search + trustline + swap chains)
        let iteration = 0;
        let primaryFunctionName = firstFunctionName; // Track the primary operation
        let primaryFunctionResult = lastFunctionResult;

        while (continueChain && iteration < maxIterations) {
          iteration++;
          
          // Get AI's next action based on previous results
          const nextResponse = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-5-nano-2025-08-07',
            messages: context.messages,
            tools,
            tool_choice: 'auto',
            temperature: 0.7,
          });

          const nextMessage = nextResponse.choices[0].message;

          // Check if AI wants to call more functions
          if (nextMessage.tool_calls && nextMessage.tool_calls.length > 0) {
            console.log(`[Terminal AI] Chain iteration ${iteration}: AI calling more functions`);
            
            context.messages.push(nextMessage);
            context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);

            // Execute the new tool calls
            for (const toolCall of nextMessage.tool_calls) {
              const functionName = toolCall.function.name;
              const functionArgs = JSON.parse(toolCall.function.arguments);

              console.log(`[Terminal AI] Chain executing: ${functionName}`, functionArgs);

              const functionResult = await this.executeFunction(
                sessionId,
                functionName,
                functionArgs
              );

              // Track the primary operation (skip web_search as it's just a helper)
              if (functionName !== 'web_search') {
                primaryFunctionName = functionName;
                primaryFunctionResult = functionResult;
              }

              lastFunctionResult = functionResult;

              context.messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(functionResult),
              });
              context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
            }
          } else {
            // No more function calls, get final response
            continueChain = false;
            context.messages.push(nextMessage);
            context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);

            return {
              success: true,
              message: nextMessage.content,
              functionCalled: primaryFunctionName, // Return the PRIMARY function (not web_search)
              functionResult: primaryFunctionResult,
              type: 'function_call',
            };
          }
        }

        // If we hit max iterations, get final response
        const finalResponse = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-5-nano-2025-08-07',
          messages: context.messages,
          temperature: 0.7,
        });

        const finalMessage = finalResponse.choices[0].message;
        context.messages.push(finalMessage);
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);

        return {
          success: true,
          message: finalMessage.content,
          functionCalled: primaryFunctionName, // Use primary function, not web_search
          functionResult: primaryFunctionResult,
          type: 'function_call',
        };
      } else {
        // No function call, just a regular response
        context.messages.push(assistantMessage);
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);

        return {
          success: true,
          message: assistantMessage.content,
          type: 'text',
        };
      }
    } catch (error: any) {
      console.error('Terminal AI error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Sorry, I encountered an error processing your request.',
      };
    }
  }

  /**
   * Check if context needs summarization and perform it if needed
   * This prevents the context from exceeding the token limit
   */
  private async checkAndSummarizeIfNeeded(
    sessionId: string,
    context: ConversationContext
  ): Promise<void> {
    // Check if we're approaching the token limit
    const limitCheck = isApproachingLimit(
      context.messages,
      TERMINAL_FUNCTIONS,
      this.TOKEN_LIMIT,
      this.SUMMARIZATION_THRESHOLD,
      process.env.OPENAI_MODEL
    );

    if (!limitCheck.approaching) {
      return; // No need to summarize yet
    }

    // Don't summarize if there are too few messages
    if (context.messages.length < this.MIN_MESSAGES_TO_SUMMARIZE) {
      console.log(
        `[Terminal AI] ⚠️  Context approaching limit (${limitCheck.percentage}%) but too few messages to summarize`
      );
      return;
    }

    console.log(
      `[Terminal AI] 🔄 Context summarization triggered at ${limitCheck.percentage}% (${limitCheck.current}/${limitCheck.limit} tokens)`
    );

    try {
      // Get the system message (first message)
      const systemMessage = context.messages[0];
      
      // Get messages to summarize (excluding the system message and recent messages)
      // Keep the last 10 messages as "recent context"
      const recentMessageCount = 10;
      const messagesToKeep = Math.min(recentMessageCount, context.messages.length - 1);
      const messagesToSummarize = context.messages.slice(1, -messagesToKeep);
      const recentMessages = context.messages.slice(-messagesToKeep);

      if (messagesToSummarize.length === 0) {
        console.log('[Terminal AI] ⚠️  No messages to summarize, skipping');
        return;
      }

      // Ask AI to summarize the conversation
      const summarizationPrompt = `Please provide a concise summary of this conversation history between a user and a Stellar blockchain assistant. Focus on:
1. Key operations performed (transfers, swaps, NFT minting, etc.)
2. Important addresses and amounts mentioned
3. Current state of the conversation
4. Any pending or incomplete tasks

Keep the summary under 500 tokens and maintain all critical information.

Conversation to summarize:
${JSON.stringify(messagesToSummarize, null, 2)}`;

      const summarizationResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-5-nano-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are a conversation summarizer. Create concise, information-dense summaries.',
          },
          {
            role: 'user',
            content: summarizationPrompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent summaries
      });

      const summary = summarizationResponse.choices[0].message.content;

      // Create new context with system message, summary, and recent messages
      const newMessages = [
        systemMessage,
        {
          role: 'system',
          content: `[Conversation Summary - ${new Date().toISOString()}]\n\nPrevious conversation context (${messagesToSummarize.length} messages summarized):\n\n${summary}\n\n[End of Summary - Recent messages follow]`,
        },
        ...recentMessages,
      ];

      // Update the context
      context.messages = newMessages;
      context.tokenCount = countConversationTokens(newMessages, process.env.OPENAI_MODEL);
      context.lastSummarizedAt = newMessages.length - recentMessages.length;
      context.summarizationCount += 1;

      console.log(
        `[Terminal AI] ✅ Summarization complete!
        - Summarized ${messagesToSummarize.length} messages
        - Kept ${recentMessages.length} recent messages
        - New token count: ${context.tokenCount} (${Math.round((context.tokenCount / this.TOKEN_LIMIT) * 100)}%)
        - Saved ~${limitCheck.current - context.tokenCount} tokens
        - Summarization #${context.summarizationCount} for session ${sessionId}`
      );
    } catch (error: any) {
      console.error('[Terminal AI] ❌ Summarization failed:', error);
      // Don't throw - continue with the conversation even if summarization fails
    }
  }

  private async executeFunction(
    sessionId: string,
    functionName: string,
    args: any
  ): Promise<any> {
    try {
      const service = stellarTerminalService;

      // Get the connected wallet for this session
      const session = (service as any).sessions?.get(sessionId);
      const connectedWallet = session?.publicKey;

      // List of functions that require a connected wallet
      const walletRequiredFunctions = ['list_nfts', 'get_balance', 'get_transaction_history'];
      
      // If function requires wallet but none is connected, return error
      if (walletRequiredFunctions.includes(functionName) && !connectedWallet) {
        console.error(`[Terminal AI] ❌ ${functionName} called without connected wallet`);
        return {
          success: false,
          error: 'No wallet connected',
          message: 'Please connect your wallet first to perform this operation.',
        };
      }

      // Auto-inject connected wallet address for user-wallet operations
      // This prevents the AI from hallucinating random addresses
      if (connectedWallet) {
        // For list_nfts
        if (functionName === 'list_nfts') {
          if (args.address && args.address !== connectedWallet) {
            console.warn(`[Terminal AI] ⚠️  AI tried to use wrong address for list_nfts. Expected: ${connectedWallet}, Got: ${args.address}`);
            return {
              success: false,
              error: 'Cannot query NFTs for a different wallet. Please use the connected wallet.',
              message: `I can only check NFTs for your connected wallet (${connectedWallet}). I cannot access other wallets.`,
            };
          }
          args.address = connectedWallet;
          console.log(`[Terminal AI] Auto-injecting connected wallet for list_nfts: ${connectedWallet}`);
        }
        
        // For get_balance
        if (functionName === 'get_balance') {
          if (args.publicKey && args.publicKey !== connectedWallet) {
            console.warn(`[Terminal AI] ⚠️  AI tried to use wrong address for get_balance. Expected: ${connectedWallet}, Got: ${args.publicKey}`);
            return {
              success: false,
              error: 'Cannot check balance for a different wallet. Please use the connected wallet.',
              message: `I can only check the balance for your connected wallet (${connectedWallet}). I cannot access other wallets.`,
            };
          }
          args.publicKey = connectedWallet;
          console.log(`[Terminal AI] Auto-injecting connected wallet for get_balance: ${connectedWallet}`);
        }
        
        // For get_transaction_history
        if (functionName === 'get_transaction_history') {
          if (args.address && args.address !== connectedWallet) {
            console.warn(`[Terminal AI] ⚠️  AI tried to use wrong address for get_transaction_history. Expected: ${connectedWallet}, Got: ${args.address}`);
            return {
              success: false,
              error: 'Cannot check transaction history for a different wallet. Please use the connected wallet.',
              message: `I can only check transaction history for your connected wallet (${connectedWallet}). I cannot access other wallets.`,
            };
          }
          args.address = connectedWallet;
          console.log(`[Terminal AI] Auto-injecting connected wallet for get_transaction_history: ${connectedWallet}`);
        }
      }

      // Route to appropriate service method
      switch (functionName) {
        // Wallet operations
        case 'connect_wallet':
          // DEPRECATED: Wallet connection should only happen via Freighter
          return {
            success: false,
            error: 'Wallet connection via AI is disabled for security.',
            message: '🔐 Please connect your wallet using the **Connect Wallet** button in the top-right corner of the interface. This ensures your private keys remain secure in your browser wallet (Freighter).',
            instructions: [
              '1. Click the "Connect Wallet" button (top-right)',
              '2. Approve the connection in your Freighter popup',
              '3. Once connected, you can use all blockchain features',
            ],
          };
        case 'fund_from_faucet':
          return await service.fundFromFaucet(args.publicKey, args.amount);
        case 'get_balance':
          return await service.getBalance(args.publicKey);
        case 'create_account':
          return await service.createAccount(args.seedAmount);

        // Asset operations
        case 'create_asset':
          return await service.createAsset(
            sessionId,
            args.assetCode,
            args.supply,
            args.description
          );
        case 'transfer_asset':
          return await service.transferAsset(
            sessionId,
            args.destination,
            args.asset,
            args.amount,
            args.memo
          );
        case 'batch_transfer':
          return await service.batchTransfer(sessionId, args.transfers);

        // Trustline operations
        case 'setup_trustline':
          return await service.setupTrustline(
            sessionId,
            args.assetCode,
            args.issuer,
            args.limit
          );
        case 'revoke_trustline':
          return await service.revokeTrustline(sessionId, args.assetCode, args.issuer);

        // DEX operations
        case 'swap_assets':
          return await service.swapAssets(
            sessionId,
            args.fromAsset,
            args.toAsset,
            args.amount,
            args.slippage
          );
        case 'establish_pool_trustline':
          return await service.establishPoolTrustline(
            sessionId,
            args.asset1,
            args.asset2
          );
        case 'add_liquidity':
          return await service.addLiquidity(
            sessionId,
            args.asset1,
            args.asset2,
            args.amount1,
            args.amount2
          );
        case 'remove_liquidity':
          return await service.removeLiquidity(sessionId, args.poolId, args.lpTokens);
        case 'get_pool_analytics':
          return await service.getPoolAnalytics(args.poolId);

        // NFT operations
        case 'mint_nft':
          return await service.mintNFT(sessionId, args.metadataUri, args.collectionId || 'custom');
        case 'transfer_nft':
          return await service.transferNFT(sessionId, args.tokenId, args.toAddress);
        case 'burn_nft':
          return await service.burnNFT(sessionId, args.tokenId);
        case 'list_nfts':
          return await service.listNFTs(args.address, args.collectionId);

        // Transaction & Explorer
        case 'simulate_transaction':
          return await service.simulateTransaction(args.xdr);
        case 'get_transaction_history':
          return await service.getTransactionHistory(args.address, args.days);
        case 'search_explorer':
          return await service.searchExplorer(args.query, args.type);

        // Network & Analytics
        case 'get_network_stats':
          return await service.getNetworkStats();
        case 'get_price_oracle':
          return await service.getPriceOracle(args.assetPair);

        // Blend Protocol - Lending & Borrowing
        case 'lend_to_pool':
          return await service.lendToPool(
            sessionId,
            args.asset,
            args.amount,
            args.poolAddress || 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65'
          );
        case 'borrow_from_pool':
          return await service.borrowFromPool(
            sessionId,
            args.asset,
            args.amount,
            args.poolAddress || 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65'
          );
        case 'repay_loan':
          return await service.repayLoan(
            sessionId,
            args.asset,
            args.amount,
            args.poolAddress || 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65'
          );
        case 'withdraw_lended':
          return await service.withdrawLended(
            sessionId,
            args.asset,
            args.amount,
            args.poolAddress || 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65'
          );
        case 'get_blend_position':
          return await service.getBlendPosition(
            args.address || connectedWallet,
            args.poolAddress || 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65'
          );
        case 'get_pool_info':
          return await service.getPoolInfo(
            args.poolAddress || 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65'
          );

        // Utilities
        case 'resolve_federated_address':
          return await service.resolveFederatedAddress(args.address);
        case 'web_search':
          return await this.webSearch(args.query, args.maxResults);

        default:
          return {
            success: false,
            error: `Unknown function: ${functionName}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Web search using Tavily for real-time information
   */
  private async webSearch(query: string, maxResults: number = 10): Promise<any> {
    try {
      if (!tavilyService.isConfigured()) {
        return {
          success: false,
          error: 'Web search is not available. Tavily API key not configured.',
          message: 'Please ask the user to configure TAVILY_API_KEY in environment variables.',
        };
      }

      console.log(`[Terminal AI] Web search: "${query}"`);

      const searchResults = await tavilyService.search(query, {
        searchDepth: 'advanced', // Use advanced mode for deeper, more accurate results
        maxResults,
        includeAnswer: true,
        includeDomains: [
          'stellar.org',
          'soroban.stellar.org',
          'developers.stellar.org',
          'stellar.expert',
          'github.com',
          'docs.stellar.org',
        ],
      });

      // Format results for AI consumption
      const formattedResults = searchResults.results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content.slice(0, 300), // First 300 chars
      }));

      return {
        success: true,
        query,
        answer: searchResults.answer,
        results: formattedResults,
        message: `Found ${formattedResults.length} results for: ${query}`,
      };
    } catch (error: any) {
      console.error('[Terminal AI] Web search error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Web search failed. Please try again or rephrase your query.',
      };
    }
  }

  /**
   * Execute swap directly (used for follow-up swaps after trustline)
   * This maintains conversation context while directly calling the swap function
   */
  async executeSwap(
    sessionId: string,
    fromAsset: string,
    toAsset: string,
    amount: string,
    slippage: string = '0.5'
  ): Promise<any> {
    try {
      console.log('[Terminal AI] Direct swap execution:', { sessionId, fromAsset, toAsset, amount, slippage });
      
      // Get conversation context to maintain history
      const context = this.conversationHistory.get(sessionId);
      
      // Add system message about auto-continuation
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: `[Auto-continuing after trustline setup] Now executing swap: ${amount} ${fromAsset} → ${toAsset}`,
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }
      
      const service = stellarTerminalService;
      const result = await service.swapAssets(sessionId, fromAsset, toAsset, amount, slippage);

      console.log('[Terminal AI] Swap result:', JSON.stringify(result, null, 2));

      // Add the swap execution to conversation history
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: `Executed swap_assets function with parameters: fromAsset=${fromAsset}, toAsset=${toAsset}, amount=${amount}, slippage=${slippage}`,
        });
        
        context.messages.push({
          role: 'tool',
          content: JSON.stringify(result),
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }

      // Format response similar to chat responses
      if (result.action) {
        const responseMessage = `✅ Ready to swap ${amount} ${fromAsset} to ${toAsset.split(':')[0]}. Expected output: ~${result.action.details.expected_output}. You'll see a Freighter popup to sign & approve.`;
        
        if (context) {
          context.messages.push({
            role: 'assistant',
            content: responseMessage,
          });
          context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
        }
        
        return {
          success: true,
          message: responseMessage,
          functionCalled: 'swap_assets',
          functionResult: result,
          type: 'function_call',
        };
      }

      // Check if the result indicates failure
      if (!result.success) {
        const errorMsg = result.error || 'Swap failed';
        console.error('[Terminal AI] Swap failed:', errorMsg);
        
        return {
          success: false,
          error: errorMsg,
          message: errorMsg,
          functionCalled: 'swap_assets',
          functionResult: result,
          type: 'function_call',
        };
      }

      const responseMessage = result.message || 'Swap completed successfully';
      
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: responseMessage,
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }

      return {
        success: true,
        message: responseMessage,
        functionCalled: 'swap_assets',
        functionResult: result,
        type: 'function_call',
      };
    } catch (error: any) {
      console.error('[Terminal AI] Direct swap error:', error);
      
      // Add error to conversation history
      const context = this.conversationHistory.get(sessionId);
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: `Error executing auto-swap: ${error.message}`,
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }
      
      return {
        success: false,
        error: error.message,
        message: `Failed to execute swap: ${error.message}`,
        functionCalled: 'swap_assets',
        functionResult: { success: false, error: error.message },
        type: 'function_call',
      };
    }
  }

  /**
   * Execute add liquidity directly (used for follow-up actions after trustline)
   * This maintains conversation context while directly calling the add liquidity function
   */
  async executeAddLiquidity(
    sessionId: string,
    asset1: string,
    asset2: string,
    amount1: string,
    amount2: string
  ): Promise<any> {
    try {
      console.log('[Terminal AI] Direct add liquidity execution:', { 
        sessionId, asset1, asset2, amount1, amount2 
      });
      
      // Get conversation context to maintain history
      const context = this.conversationHistory.get(sessionId);
      
      // Add system message about auto-continuation
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: `[Auto-continuing after pool trustline setup] Now executing add liquidity: ${amount1} ${asset1} + ${amount2} ${asset2}`,
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }
      
      const service = stellarTerminalService;
      const result = await service.addLiquidity(sessionId, asset1, asset2, amount1, amount2);

      console.log('[Terminal AI] Add liquidity result:', JSON.stringify(result, null, 2));

      // Add the execution to conversation history
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: `Executed add_liquidity function with parameters: asset1=${asset1}, asset2=${asset2}, amount1=${amount1}, amount2=${amount2}`,
        });
        
        context.messages.push({
          role: 'tool',
          content: JSON.stringify(result),
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }

      // Format response similar to chat responses
      if (result.action) {
        const responseMessage = result.message || `✅ Ready to add ${amount1} ${asset1} + ${amount2} ${asset2} to pool. You'll see a Freighter popup to sign & approve.`;
        
        if (context) {
          context.messages.push({
            role: 'assistant',
            content: responseMessage,
          });
          context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
        }
        
        return {
          success: true,
          message: responseMessage,
          functionCalled: 'add_liquidity',
          functionResult: result,
          type: 'function_call',
        };
      }

      // Check if the result indicates failure
      if (!result.success) {
        const errorMsg = result.error || 'Add liquidity failed';
        console.error('[Terminal AI] Add liquidity failed:', errorMsg);
        
        return {
          success: false,
          error: errorMsg,
          message: errorMsg,
          functionCalled: 'add_liquidity',
          functionResult: result,
          type: 'function_call',
        };
      }

      const responseMessage = result.message || 'Liquidity added successfully';
      
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: responseMessage,
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }

      return {
        success: true,
        message: responseMessage,
        functionCalled: 'add_liquidity',
        functionResult: result,
        type: 'function_call',
      };
    } catch (error: any) {
      console.error('[Terminal AI] Direct add liquidity error:', error);
      
      // Add error to conversation history
      const context = this.conversationHistory.get(sessionId);
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: `Error executing auto add liquidity: ${error.message}`,
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }
      
      return {
        success: false,
        error: error.message,
        message: `Failed to execute add liquidity: ${error.message}`,
        functionCalled: 'add_liquidity',
        functionResult: { success: false, error: error.message },
        type: 'function_call',
      };
    }
  }

  /**
   * Execute a direct borrow operation (called after asset approval trustline is set up)
   */
  async executeBorrow(
    sessionId: string,
    asset: string,
    amount: string,
    poolAddress?: string
  ): Promise<any> {
    try {
      console.log('[Terminal AI] Direct borrow execution:', { 
        sessionId, asset, amount, poolAddress 
      });
      
      // Get conversation context to maintain history
      const context = this.conversationHistory.get(sessionId);
      
      // Add system message about auto-continuation
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: `[Auto-continuing after asset approval] Now executing borrow: ${amount} ${asset} from Blend pool`,
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }
      
      const service = stellarTerminalService;
      const result = await service.borrowFromPool(
        sessionId, 
        asset, 
        amount, 
        poolAddress || 'default'
      );

      console.log('[Terminal AI] Borrow result:', JSON.stringify(result, null, 2));

      // Add the execution to conversation history
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: `Executed borrow_from_pool function with parameters: asset=${asset}, amount=${amount}, poolAddress=${poolAddress || 'default'}`,
        });
        
        context.messages.push({
          role: 'tool',
          content: JSON.stringify(result),
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }

      // Format response similar to chat responses
      if (result.action) {
        const responseMessage = result.message || `✅ Ready to borrow ${amount} ${asset} from Blend pool. Sign the transaction in Freighter.`;
        
        if (context) {
          context.messages.push({
            role: 'assistant',
            content: responseMessage,
          });
          context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
        }
        
        return {
          success: true,
          message: responseMessage,
          functionCalled: 'borrow_from_pool',
          functionResult: result,
          type: 'function_call',
        };
      }

      // Check if the result indicates failure
      if (!result.success) {
        const errorMsg = result.error || 'Borrow failed';
        console.error('[Terminal AI] Borrow failed:', errorMsg);
        
        return {
          success: false,
          error: errorMsg,
          message: errorMsg,
          functionCalled: 'borrow_from_pool',
          functionResult: result,
          type: 'function_call',
        };
      }

      const responseMessage = result.message || `Successfully borrowed ${amount} ${asset} from Blend pool`;
      
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: responseMessage,
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }

      return {
        success: true,
        message: responseMessage,
        functionCalled: 'borrow_from_pool',
        functionResult: result,
        type: 'function_call',
      };
    } catch (error: any) {
      console.error('[Terminal AI] Direct borrow error:', error);
      
      // Add error to conversation history
      const context = this.conversationHistory.get(sessionId);
      if (context) {
        context.messages.push({
          role: 'assistant',
          content: `Error executing auto borrow: ${error.message}`,
        });
        context.tokenCount = countConversationTokens(context.messages, process.env.OPENAI_MODEL);
      }
      
      return {
        success: false,
        error: error.message,
        message: `Failed to execute borrow: ${error.message}`,
        functionCalled: 'borrow_from_pool',
        functionResult: { success: false, error: error.message },
        type: 'function_call',
      };
    }
  }

  /**
   * Get conversation statistics for a session
   */
  getConversationStats(sessionId: string): {
    exists: boolean;
    messageCount?: number;
    tokenCount?: number;
    tokenPercentage?: number;
    summarizationCount?: number;
    lastSummarizedAt?: number;
  } {
    const context = this.conversationHistory.get(sessionId);
    
    if (!context) {
      return { exists: false };
    }

    return {
      exists: true,
      messageCount: context.messages.length,
      tokenCount: context.tokenCount,
      tokenPercentage: Math.round((context.tokenCount / this.TOKEN_LIMIT) * 100),
      summarizationCount: context.summarizationCount,
      lastSummarizedAt: context.lastSummarizedAt,
    };
  }

  /**
   * Clear conversation history for a session
   */
  clearHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
    console.log(`[Terminal AI] 🗑️  Cleared conversation history for session: ${sessionId}`);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.conversationHistory.keys());
  }

  /**
   * Get total memory usage stats
   */
  getMemoryStats(): {
    activeSessions: number;
    totalMessages: number;
    totalTokens: number;
    averageTokensPerSession: number;
  } {
    const sessions = Array.from(this.conversationHistory.values());
    const totalMessages = sessions.reduce((sum, ctx) => sum + ctx.messages.length, 0);
    const totalTokens = sessions.reduce((sum, ctx) => sum + ctx.tokenCount, 0);

    return {
      activeSessions: sessions.length,
      totalMessages,
      totalTokens,
      averageTokensPerSession: sessions.length > 0 ? Math.round(totalTokens / sessions.length) : 0,
    };
  }

  /**
   * Save a conversation to the database
   */
  async saveConversation(
    userId: string,
    sessionId: string,
    walletAddress: string | undefined,
    title: string | undefined,
    messages: any[]
  ): Promise<{ conversationId: string }> {
    try {
      // Generate title from first user message if not provided
      const conversationTitle = title || this.generateConversationTitle(messages);
      
      // Count tokens
      const tokenCount = countConversationTokens(messages, process.env.OPENAI_MODEL);

      // Check if conversation already exists
      const { data: existingConv, error: findError } = await supabase
        .from('terminal_conversations')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      let conversationId: string;

      if (existingConv) {
        // Update existing conversation
        const { error: updateError } = await supabase
          .from('terminal_conversations')
          .update({
            title: conversationTitle,
            message_count: messages.length,
            token_count: tokenCount,
            wallet_address: walletAddress,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingConv.id);

        if (updateError) throw updateError;

        conversationId = existingConv.id;

        // Delete old messages
        const { error: deleteError } = await supabase
          .from('terminal_messages')
          .delete()
          .eq('conversation_id', conversationId);

        if (deleteError) throw deleteError;
      } else {
        // Create new conversation
        const { data: newConv, error: insertError } = await supabase
          .from('terminal_conversations')
          .insert({
            user_id: userId,
            session_id: sessionId,
            wallet_address: walletAddress,
            title: conversationTitle,
            message_count: messages.length,
            token_count: tokenCount,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        conversationId = newConv.id;
      }

      // Insert messages
      const messageRecords = messages.map((msg) => ({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
        function_called: msg.functionCalled || null,
        function_result: msg.functionResult || null,
        message_type: msg.type || 'text',
        tool_call_id: msg.tool_call_id || null,
        timestamp: msg.timestamp || new Date().toISOString(),
      }));

      const { error: messagesError } = await supabase
        .from('terminal_messages')
        .insert(messageRecords);

      if (messagesError) throw messagesError;

      console.log(`[Terminal AI] 💾 Saved conversation ${conversationId} with ${messages.length} messages`);

      return { conversationId };
    } catch (error: any) {
      console.error('[Terminal AI] Failed to save conversation:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('terminal_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('[Terminal AI] Failed to get conversations:', error);
      throw error;
    }
  }

  /**
   * Load a specific conversation with all messages
   */
  async loadConversation(conversationId: string): Promise<any | null> {
    try {
      // Get conversation metadata
      const { data: conversation, error: convError } = await supabase
        .from('terminal_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;
      if (!conversation) return null;

      // Get all messages
      const { data: messages, error: messagesError } = await supabase
        .from('terminal_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (messagesError) throw messagesError;

      return {
        ...conversation,
        messages: messages || [],
      };
    } catch (error: any) {
      console.error('[Terminal AI] Failed to load conversation:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('terminal_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      console.log(`[Terminal AI] 🗑️  Deleted conversation ${conversationId}`);
    } catch (error: any) {
      console.error('[Terminal AI] Failed to delete conversation:', error);
      throw error;
    }
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('terminal_conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;

      console.log(`[Terminal AI] ✏️  Updated conversation ${conversationId} title to: ${title}`);
    } catch (error: any) {
      console.error('[Terminal AI] Failed to update conversation title:', error);
      throw error;
    }
  }

  /**
   * Generate a conversation title from messages
   */
  private generateConversationTitle(messages: any[]): string {
    // Find first user message
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    
    if (!firstUserMessage) {
      return `Terminal Session ${new Date().toLocaleDateString()}`;
    }

    // Use first 50 characters of first user message
    let title = firstUserMessage.content.slice(0, 50);
    if (firstUserMessage.content.length > 50) {
      title += '...';
    }

    return title;
  }

  /**
   * Submit a signed transaction XDR to the network
   * Handles both Horizon and Soroban RPC submissions
   */
  async submitSignedTransaction(signedXdr: string, network: string = 'testnet'): Promise<any> {
    try {
      console.log(`\n========== SUBMIT SIGNED TRANSACTION START ==========`);
      console.log('[Submit Signed] Network:', network);
      console.log('[Submit Signed] XDR length:', signedXdr?.length);
      console.log('[Submit Signed] Parsing transaction XDR...');
      
      // Parse the signed transaction
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        network === 'testnet' ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC
      );

      console.log('[Submit Signed] ✓ Transaction parsed successfully');
      console.log('[Submit Signed] Transaction details:', {
        fee: transaction.fee,
        operations: transaction.operations.length,
        operationTypes: transaction.operations.map((op: any) => op.type),
      });

      // Determine if this is a Soroban transaction (has Soroban operations)
      const hasSorobanOps = transaction.operations.some((op: any) => 
        op.type === 'invokeHostFunction' || 
        op.type === 'extendFootprintTtl' || 
        op.type === 'restoreFootprint'
      );

      console.log('[Submit Signed] Transaction type:', hasSorobanOps ? 'SOROBAN' : 'HORIZON');

      if (hasSorobanOps) {
        console.log('[Submit Signed] Detected Soroban transaction, submitting via Soroban RPC...');
        
        // Submit to Soroban RPC
        const result = await sorobanServer.sendTransaction(transaction);

        console.log('[Submit Signed] Send result:', {
          status: result.status,
          hash: result.hash,
          errorResultXdr: result.errorResult?.toXDR('base64')?.substring(0, 100),
        });

        if (result.status === 'PENDING') {
          // Poll for result
          console.log('[Submit Signed] Transaction pending, polling for result...');
          
          const getResponse = await pollUntil(
            () => sorobanServer.getTransaction(result.hash),
            (response: any) =>
              response !== null &&
              response.status !== StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND,
            {
              intervalMs: 1000,
              timeoutMs: 30000,
            }
          );

          console.log('[Submit Signed] Poll result:', {
            status: getResponse.status,
          });

          if (getResponse.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
            console.log('[Submit Signed] ✅ Transaction successful!');
            console.log(`========== SUBMIT SIGNED TRANSACTION END ==========\n`);
            
            return {
              success: true,
              message: 'Transaction submitted successfully!',
              transactionHash: result.hash,
              status: 'SUCCESS',
              link: `https://stellar.expert/explorer/${network}/tx/${result.hash}`,
            };
          } else {
            console.error('[Submit Signed] ❌ Transaction failed on blockchain');
            console.error('[Submit Signed] Failure details:', JSON.stringify(getResponse, null, 2));
            console.error(`========== SUBMIT SIGNED TRANSACTION END ==========\n`);
            
            return {
              success: false,
              error: 'Transaction failed on blockchain',
              status: getResponse.status,
              details: getResponse,
            };
          }
        } else {
          console.error('[Submit Signed] ❌ Transaction submission failed');
          console.error('[Submit Signed] Result:', JSON.stringify(result, null, 2));
          console.error(`========== SUBMIT SIGNED TRANSACTION END ==========\n`);
          
          return {
            success: false,
            error: 'Transaction submission failed',
            status: result.status,
            details: result,
          };
        }
      } else {
        console.log('[Submit Signed] Detected Horizon transaction, submitting via Horizon...');
        
        // Submit to Horizon
        const result = await horizonServer.submitTransaction(transaction);

        console.log('[Submit Signed] ✅ Transaction successful!');
        console.log(`========== SUBMIT SIGNED TRANSACTION END ==========\n`);
        
        return {
          success: true,
          message: 'Transaction submitted successfully!',
          transactionHash: result.hash,
          ledger: result.ledger,
          link: `https://stellar.expert/explorer/${network}/tx/${result.hash}`,
        };
      }
    } catch (error: any) {
      console.error(`\n========== SUBMIT SIGNED ERROR ==========`);
      console.error('[Submit Signed] ❌ Error occurred:', error.message);
      console.error('[Submit Signed] Error type:', error.constructor.name);
      
      // Extract meaningful error messages
      let errorMessage = error.message || 'Unknown error occurred';
      let errorCode = 'UNKNOWN';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        console.error('[Submit Signed] Response data:', JSON.stringify(errorData, null, 2));
        
        const txCode = errorData.extras?.result_codes?.transaction;
        const opCodes = errorData.extras?.result_codes?.operations;
        
        if (txCode) {
          errorCode = txCode;
          errorMessage = `Transaction error: ${txCode}`;
          if (opCodes && opCodes.length > 0) {
            const failedOps = opCodes
              .map((code: string, idx: number) => 
                code !== 'op_success' ? `Op ${idx + 1}: ${code}` : null
              )
              .filter(Boolean);
            if (failedOps.length > 0) {
              errorMessage += ` (${failedOps.join(', ')})`;
            }
          }
        }
      }
      
      console.error('[Submit Signed] Extracted error:', {
        code: errorCode,
        message: errorMessage,
      });
      console.error('[Submit Signed] Full error:', error);
      console.error(`========== SUBMIT SIGNED ERROR END ==========\n`);
      
      return {
        success: false,
        error: errorMessage,
        errorCode,
        details: error.response?.data,
      };
    }
  }
}

export const terminalAIService = new TerminalAIService();
