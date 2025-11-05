import { openai } from '../lib/openaiClient.js';
import { stellarTerminalService } from './stellarTerminalService.js';
import { tavilyService } from './tavilyService.js';

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
  {
    name: 'export_secret_key',
    description: 'Export secret key with security warnings. Use for backup purposes only. This shows the connected wallet\'s secret key (if available) along with critical security warnings.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
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

  // SMART CONTRACT FUNCTIONS
  {
    name: 'deploy_contract',
    description: 'Deploy a smart contract from WASM hash.',
    parameters: {
      type: 'object',
      properties: {
        wasmHash: {
          type: 'string',
          description: 'WASM hash of the contract',
        },
        contractId: {
          type: 'string',
          description: 'Optional contract ID',
        },
      },
      required: ['wasmHash'],
    },
  },
  {
    name: 'invoke_contract',
    description: 'Invoke a contract method with arguments.',
    parameters: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'Contract ID',
        },
        method: {
          type: 'string',
          description: 'Method name to invoke',
        },
        args: {
          type: 'array',
          description: 'Method arguments',
          items: {
            type: 'string',
          },
        },
      },
      required: ['contractId', 'method'],
    },
  },
  {
    name: 'read_contract',
    description: 'Read contract state (view-only, no fees).',
    parameters: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'Contract ID',
        },
        method: {
          type: 'string',
          description: 'View method name',
        },
      },
      required: ['contractId', 'method'],
    },
  },
  {
    name: 'upgrade_contract',
    description: 'Upgrade contract to new WASM version.',
    parameters: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'Contract ID',
        },
        newWasmHash: {
          type: 'string',
          description: 'New WASM hash',
        },
      },
      required: ['contractId', 'newWasmHash'],
    },
  },
  {
    name: 'stream_events',
    description: 'Stream contract events in real-time.',
    parameters: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'Contract ID',
        },
        minutes: {
          type: 'number',
          description: 'Duration to stream (minutes)',
          default: 10,
        },
      },
      required: ['contractId'],
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
    name: 'add_liquidity',
    description: 'Add liquidity to a pool and receive LP tokens.',
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
    description: 'Remove liquidity from pool by burning LP tokens.',
    parameters: {
      type: 'object',
      properties: {
        poolId: {
          type: 'string',
          description: 'Liquidity pool ID',
        },
        lpTokens: {
          type: 'string',
          description: 'Amount of LP tokens to burn',
        },
      },
      required: ['poolId', 'lpTokens'],
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
 * Terminal AI Service
 * Handles AI chat interactions with blockchain function calling
 */
export class TerminalAIService {
  private conversationHistory: Map<string, any[]> = new Map();

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

      // Get or initialize conversation history
      if (!this.conversationHistory.has(sessionId)) {
        this.conversationHistory.set(sessionId, [
          {
            role: 'system',
            content: `You are a helpful Stellar blockchain assistant. You can help users interact with the Stellar testnet through natural language.

Key capabilities:
- Wallet management (fund, check balances)
- Asset operations (create, transfer, batch transfers)
- Trustlines (setup, revoke)
- Smart contracts (deploy, invoke, read, upgrade)
- DEX operations (swap, add/remove liquidity, analytics)
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

If user requests swap to "random token" or any non-USDC asset:
1. Inform them that testnet has limited liquidity
2. Suggest swapping to USDC as the only reliable option
3. Explain that mainnet has many more trading pairs
4. DO NOT attempt swaps to tokens without confirmed liquidity pools

Example response:
"Stellar testnet has limited liquidity pools. The most reliable swap on testnet is XLM ↔ USDC. Would you like me to swap your XLM to USDC instead? On mainnet, there are many more token pairs available."

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
- "Deploy contract with hash XYZ" → Immediately call deploy_contract function

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
        ]);
      }

      const history = this.conversationHistory.get(sessionId)!;
      history.push({ role: 'user', content: message });

      // Convert functions to tools format for OpenAI API
      const tools = TERMINAL_FUNCTIONS.map(func => ({
        type: 'function' as const,
        function: func,
      }));

      // Call OpenAI with function calling - NO max_tokens to allow full responses
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-5-nano-2025-08-07',
        messages: history,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0].message;

      // Check if AI wants to call a function
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Store the first function call info
        let firstFunctionName = assistantMessage.tool_calls[0].function.name;
        let lastFunctionResult: any;

        // Add assistant message with tool calls to history
        history.push(assistantMessage);

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

          // Add function result to history
          history.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult),
          });
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
            messages: history,
            tools,
            tool_choice: 'auto',
            temperature: 0.7,
          });

          const nextMessage = nextResponse.choices[0].message;

          // Check if AI wants to call more functions
          if (nextMessage.tool_calls && nextMessage.tool_calls.length > 0) {
            console.log(`[Terminal AI] Chain iteration ${iteration}: AI calling more functions`);
            
            history.push(nextMessage);

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

              history.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(functionResult),
              });
            }
          } else {
            // No more function calls, get final response
            continueChain = false;
            history.push(nextMessage);

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
          messages: history,
          temperature: 0.7,
        });

        const finalMessage = finalResponse.choices[0].message;
        history.push(finalMessage);

        return {
          success: true,
          message: finalMessage.content,
          functionCalled: primaryFunctionName, // Use primary function, not web_search
          functionResult: primaryFunctionResult,
          type: 'function_call',
        };
      } else {
        // No function call, just a regular response
        history.push(assistantMessage);

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
        case 'export_secret_key':
          return await service.exportSecretKey(sessionId);

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

        // Contract operations
        case 'deploy_contract':
          return await service.deployContract(sessionId, args.wasmHash, args.contractId);
        case 'invoke_contract':
          return await service.invokeContract(
            sessionId,
            args.contractId,
            args.method,
            args.args || []
          );
        case 'read_contract':
          return await service.readContract(args.contractId, args.method);
        case 'upgrade_contract':
          return await service.upgradeContract(
            sessionId,
            args.contractId,
            args.newWasmHash
          );
        case 'stream_events':
          return await service.streamEvents(args.contractId, args.minutes);

        // DEX operations
        case 'swap_assets':
          return await service.swapAssets(
            sessionId,
            args.fromAsset,
            args.toAsset,
            args.amount,
            args.slippage
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

  clearHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
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
      
      // Get conversation history to maintain context
      const history = this.conversationHistory.get(sessionId);
      
      // Add system message about auto-continuation
      if (history) {
        history.push({
          role: 'assistant',
          content: `[Auto-continuing after trustline setup] Now executing swap: ${amount} ${fromAsset} → ${toAsset}`,
        });
      }
      
      const service = stellarTerminalService;
      const result = await service.swapAssets(sessionId, fromAsset, toAsset, amount, slippage);

      console.log('[Terminal AI] Swap result:', JSON.stringify(result, null, 2));

      // Add the swap execution to conversation history
      if (history) {
        history.push({
          role: 'assistant',
          content: `Executed swap_assets function with parameters: fromAsset=${fromAsset}, toAsset=${toAsset}, amount=${amount}, slippage=${slippage}`,
        });
        
        history.push({
          role: 'tool',
          content: JSON.stringify(result),
        });
      }

      // Format response similar to chat responses
      if (result.action) {
        const responseMessage = `✅ Ready to swap ${amount} ${fromAsset} to ${toAsset.split(':')[0]}. Expected output: ~${result.action.details.expected_output}. You'll see a Freighter popup to sign & approve.`;
        
        if (history) {
          history.push({
            role: 'assistant',
            content: responseMessage,
          });
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
      
      if (history) {
        history.push({
          role: 'assistant',
          content: responseMessage,
        });
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
      const history = this.conversationHistory.get(sessionId);
      if (history) {
        history.push({
          role: 'assistant',
          content: `Error executing auto-swap: ${error.message}`,
        });
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
}

export const terminalAIService = new TerminalAIService();
