import { openai } from '../lib/openaiClient.js';
import { stellarTerminalService } from './stellarTerminalService.js';

/**
 * OpenAI Function Definitions for Stellar Terminal
 * Each function represents a blockchain operation the AI can perform
 */
const TERMINAL_FUNCTIONS = [
  // WALLET FUNCTIONS
  {
    name: 'connect_wallet',
    description: 'Connect or create a Freighter wallet. Can import existing wallet with secret key.',
    parameters: {
      type: 'object',
      properties: {
        secretKey: {
          type: 'string',
          description: 'Optional: Secret key to import existing wallet (starts with S)',
        },
      },
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
    description: 'Show all balances (XLM + custom assets) for an account including trustlines.',
    parameters: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'The public key (address) to check',
        },
      },
      required: ['publicKey'],
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
    description: 'Export secret key with security warnings. Use for backup purposes.',
    parameters: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'The public key of the account',
        },
      },
      required: ['publicKey'],
    },
  },

  // ASSET FUNCTIONS
  {
    name: 'create_asset',
    description: 'Create a custom asset with specified code, supply, and issuer.',
    parameters: {
      type: 'object',
      properties: {
        assetCode: {
          type: 'string',
          description: 'Asset code (e.g., SYFT, USDC) - max 12 characters',
        },
        supply: {
          type: 'string',
          description: 'Total supply to issue',
        },
        description: {
          type: 'string',
          description: 'Optional asset description',
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
    description: 'Add trustline for a custom asset with optional limit.',
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
    description: 'Swap assets on testnet DEX with slippage protection.',
    parameters: {
      type: 'object',
      properties: {
        fromAsset: {
          type: 'string',
          description: 'Asset to swap from',
        },
        toAsset: {
          type: 'string',
          description: 'Asset to swap to',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap',
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
    description: 'Mint NFT with metadata to a collection.',
    parameters: {
      type: 'object',
      properties: {
        metadataUri: {
          type: 'string',
          description: 'IPFS or HTTP URI for metadata',
        },
        collectionId: {
          type: 'string',
          description: 'Collection contract ID',
        },
      },
      required: ['metadataUri', 'collectionId'],
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
    description: 'Burn (destroy) an NFT permanently.',
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
    description: 'List all NFTs owned by an address.',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Owner address',
        },
        collectionId: {
          type: 'string',
          description: 'Optional: filter by collection',
        },
      },
      required: ['address'],
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
    description: 'Get transaction history for an account.',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Account address',
        },
        days: {
          type: 'number',
          description: 'Number of days to look back',
          default: 7,
        },
      },
      required: ['address'],
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
];

/**
 * Terminal AI Service
 * Handles AI chat interactions with blockchain function calling
 */
export class TerminalAIService {
  private conversationHistory: Map<string, any[]> = new Map();

  async chat(sessionId: string, message: string): Promise<any> {
    try {
      // Get or initialize conversation history
      if (!this.conversationHistory.has(sessionId)) {
        this.conversationHistory.set(sessionId, [
          {
            role: 'system',
            content: `You are a helpful Stellar blockchain assistant. You can help users interact with the Stellar testnet through natural language.

Key capabilities:
- Wallet management (connect, fund, check balances)
- Asset operations (create, transfer, batch transfers)
- Trustlines (setup, revoke)
- Smart contracts (deploy, invoke, read, upgrade)
- DEX operations (swap, add/remove liquidity, analytics)
- NFTs (mint, transfer, burn, list)
- Transaction management (simulate, history, explorer)
- Network analytics and price oracles

Always be friendly, explain technical concepts clearly, and provide transaction links when operations complete.
When users ask about blockchain operations, use the appropriate function calls.
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
        const toolCall = assistantMessage.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        // Execute the blockchain function
        const functionResult = await this.executeFunction(
          sessionId,
          functionName,
          functionArgs
        );

        // Add function call and result to history
        history.push(assistantMessage);
        history.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        });

        // Get AI's interpretation of the result
        const secondResponse = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-5-nano-2025-08-07',
          messages: history,
          temperature: 0.7,
        });

        const finalMessage = secondResponse.choices[0].message;
        history.push(finalMessage);

        return {
          success: true,
          message: finalMessage.content,
          functionCalled: functionName,
          functionResult,
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

      // Route to appropriate service method
      switch (functionName) {
        // Wallet operations
        case 'connect_wallet':
          return await service.connectWallet(sessionId, args.secretKey);
        case 'fund_from_faucet':
          return await service.fundFromFaucet(args.publicKey, args.amount);
        case 'get_balance':
          return await service.getBalance(args.publicKey);
        case 'create_account':
          return await service.createAccount(args.seedAmount);
        case 'export_secret_key':
          return await service.exportSecretKey(args.publicKey);

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
          return await service.mintNFT(sessionId, args.metadataUri, args.collectionId);
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

  clearHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
  }
}

export const terminalAIService = new TerminalAIService();
