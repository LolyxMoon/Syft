/**
 * Natural Language to Vault Strategy Router
 * Handles AI-powered vault generation from natural language
 */

import { Router } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schemas
const GenerateVaultSchema = z.object({
  prompt: z.string().min(1),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  strategyType: z.string().optional(),
  conversationContext: z.array(z.any()).optional(),
});

const ExplainContractSchema = z.object({
  contractCode: z.string().optional(),
  vaultConfig: z.any().optional(),
  vaultId: z.string().optional(),
});

const AnalyzeStrategySchema = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

/**
 * System prompt for vault generation
 */
const VAULT_GENERATION_SYSTEM_PROMPT = `You are an expert DeFi strategist specializing in creating Stellar-based vault strategies.

Your task is to convert natural language descriptions into structured vault configurations using these block types:

1. START - Entry point (always required)
2. CONDITION - Decision logic (if/then)
3. ACTION - Operations (deposit, stake, swap, harvest, rebalance)
4. TRIGGER - Time or event-based activation
5. END - Exit point (always required)

Available Actions:
- DEPOSIT: Add funds to vault
- STAKE: Stake tokens in protocols
- SWAP: Exchange tokens via DEX
- HARVEST: Collect yields
- REBALANCE: Adjust allocations
- WITHDRAW: Remove funds

Risk Levels:
- LOW: Conservative, mostly stablecoins, <10% APY target
- MEDIUM: Balanced, mixed assets, 10-30% APY target
- HIGH: Aggressive, high-yield strategies, >30% APY target

Response Format (JSON):
{
  "name": "Vault Name",
  "description": "Strategy description",
  "riskLevel": "low|medium|high",
  "estimatedAPY": "10-15%",
  "blocks": [
    {
      "id": "unique-id",
      "type": "START|CONDITION|ACTION|TRIGGER|END",
      "label": "Block Label",
      "position": { "x": number, "y": number },
      "data": {
        "action": "DEPOSIT|STAKE|etc",
        "token": "USDC|XLM|etc",
        "protocol": "protocol-name",
        "amount": "percentage or amount",
        "condition": "if applicable",
        "schedule": "if trigger"
      }
    }
  ],
  "connections": [
    { "source": "block-id", "target": "block-id" }
  ]
}

Guidelines:
1. Always start with START block and end with END block
2. Use logical flow: START -> (TRIGGER/CONDITION) -> ACTION -> END
3. Position blocks vertically with 150px spacing
4. Be specific with protocols, tokens, and amounts
5. Match complexity to risk level
6. Ensure all blocks are connected`;

/**
 * POST /api/nl/generate-vault
 * Generate vault strategy from natural language
 */
router.post('/generate-vault', async (req, res) => {
  try {
    const validated = GenerateVaultSchema.parse(req.body);
    const { prompt, riskLevel, conversationContext } = validated;

    // Build conversation messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: VAULT_GENERATION_SYSTEM_PROMPT },
    ];

    // Add conversation context if provided
    if (conversationContext && conversationContext.length > 0) {
      messages.push(...conversationContext as OpenAI.Chat.ChatCompletionMessageParam[]);
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content: `Create a vault strategy: ${prompt}${riskLevel ? ` (Risk level: ${riskLevel})` : ''}`,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const vaultConfig = JSON.parse(responseContent);

    // Convert to React Flow format
    const nodes = vaultConfig.blocks.map((block: any) => ({
      id: block.id,
      type: block.type.toLowerCase(),
      position: block.position,
      data: {
        label: block.label,
        ...block.data,
      },
    }));

    const edges = vaultConfig.connections.map((conn: any, idx: number) => ({
      id: `e${idx}`,
      source: conn.source,
      target: conn.target,
      type: 'smoothstep',
    }));

    res.json({
      success: true,
      data: {
        nodes,
        edges,
        metadata: {
          name: vaultConfig.name,
          description: vaultConfig.description,
          riskLevel: vaultConfig.riskLevel,
          estimatedAPY: vaultConfig.estimatedAPY,
        },
      },
    });

  } catch (error: any) {
    console.error('[NL API] Error generating vault:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate vault strategy',
    });
  }
});

/**
 * POST /api/nl/explain-contract
 * Explain deployed vault contract in plain English
 */
router.post('/explain-contract', async (req, res) => {
  try {
    const validated = ExplainContractSchema.parse(req.body);
    const { contractCode, vaultConfig } = validated;

    let explanation = '';

    if (vaultConfig) {
      // Explain based on vault configuration
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are a DeFi expert explaining smart contracts to non-technical users. 
          Explain what the vault does, its strategy, risks, and expected outcomes in simple, clear language.
          Avoid technical jargon. Use analogies when helpful.`,
        },
        {
          role: 'user',
          content: `Explain this vault configuration in simple terms:\n\n${JSON.stringify(vaultConfig, null, 2)}`,
        },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      explanation = completion.choices[0].message.content || '';

    } else if (contractCode) {
      // Explain based on contract code
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are a blockchain expert explaining smart contracts. 
          Analyze the contract code and explain what it does in plain English.`,
        },
        {
          role: 'user',
          content: `Explain this smart contract:\n\n${contractCode}`,
        },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      explanation = completion.choices[0].message.content || '';

    } else {
      throw new Error('Either contractCode or vaultConfig must be provided');
    }

    res.json({
      success: true,
      data: { explanation },
    });

  } catch (error: any) {
    console.error('[NL API] Error explaining contract:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to explain contract',
    });
  }
});

/**
 * POST /api/nl/analyze-strategy
 * Analyze an existing vault strategy
 */
router.post('/analyze-strategy', async (req, res) => {
  try {
    const validated = AnalyzeStrategySchema.parse(req.body);
    const { nodes, edges } = validated;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a DeFi analyst reviewing vault strategies. 
        Analyze the strategy for:
        1. Logic correctness
        2. Risk assessment
        3. Optimization opportunities
        4. Potential issues
        Provide actionable feedback.`,
      },
      {
        role: 'user',
        content: `Analyze this vault strategy:\n\nBlocks: ${JSON.stringify(nodes, null, 2)}\n\nConnections: ${JSON.stringify(edges, null, 2)}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const analysis = completion.choices[0].message.content || '';

    res.json({
      success: true,
      data: {
        analysis,
        summary: analysis.split('\n')[0], // First line as summary
      },
    });

  } catch (error: any) {
    console.error('[NL API] Error analyzing strategy:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze strategy',
    });
  }
});

/**
 * GET /api/nl/vault-templates
 * Get available vault templates
 */
router.get('/vault-templates', async (req, res) => {
  try {
    const { category } = req.query;

    // Pre-defined templates
    const templates = [
      {
        id: 'conservative-stablecoin',
        name: 'Conservative Stablecoin',
        category: 'low-risk',
        description: '70% USDC staking, 30% liquidity provision',
        riskLevel: 'low',
        estimatedAPY: '5-8%',
      },
      {
        id: 'balanced-yield',
        name: 'Balanced Yield',
        category: 'medium-risk',
        description: 'Mixed protocol staking with auto-compounding',
        riskLevel: 'medium',
        estimatedAPY: '15-25%',
      },
      {
        id: 'aggressive-defi',
        name: 'Aggressive DeFi',
        category: 'high-risk',
        description: 'Multi-protocol yield farming with leverage',
        riskLevel: 'high',
        estimatedAPY: '30-50%',
      },
      {
        id: 'liquidity-provider',
        name: 'Liquidity Provider',
        category: 'medium-risk',
        description: 'DEX liquidity provision with yield optimization',
        riskLevel: 'medium',
        estimatedAPY: '12-20%',
      },
    ];

    const filtered = category && category !== 'all'
      ? templates.filter(t => t.category === category)
      : templates;

    res.json({
      success: true,
      data: filtered,
    });

  } catch (error: any) {
    console.error('[NL API] Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch templates',
    });
  }
});

export default router;
