/**
 * Natural Language to Vault Strategy Router
 * Handles AI-powered vault generation from natural language
 */

import { Router } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';
import { openai } from '../lib/openaiClient.js';

const router = Router();

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
 * Extract parameters from VAPI message format or direct POST body
 * VAPI sends tool calls in a nested message structure
 */
function extractVaultParams(body: any) {
  // Check if this is a VAPI message format with toolCalls
  if (body.message?.toolCalls?.[0]?.function?.arguments) {
    // Trust VAPI's agent - it already has the full conversation context
    // and constructs the prompt intelligently
    return body.message.toolCalls[0].function.arguments;
  }
  
  // Otherwise, assume it's a direct POST with parameters
  return body;
}

/**
 * POST /api/nl/generate-vault
 * Generate vault strategy from natural language
 * This endpoint is called by VAPI voice assistant
 * It uses the EXACT same service as AI Chat (/api/vaults/generate-from-prompt)
 */
router.post('/generate-vault', async (req, res) => {
  try {
    console.log('[NL API] Received request body:', JSON.stringify(req.body, null, 2));
    
    // Extract parameters from either VAPI format or direct POST
    const params = extractVaultParams(req.body);
    console.log('[NL API] Extracted params:', JSON.stringify(params, null, 2));
    
    const validated = GenerateVaultSchema.parse(params);
    const { prompt, conversationContext } = validated;

    console.log('[NL API] Validated params - prompt:', prompt);

    // Import and use the same vault generator service that AI Chat uses
    const { naturalLanguageVaultGenerator } = await import('../services/naturalLanguageVaultGenerator.js');
    
    // Generate vault using the proven AI Chat method
    // This intelligently handles: build, modify, explain, chat, etc.
    const result = await naturalLanguageVaultGenerator.generateVault({
      userPrompt: prompt,
      conversationHistory: conversationContext || [],
      network: 'testnet',
    });

    console.log('[NL API] Generated response:', {
      nodeCount: result.nodes.length,
      edgeCount: result.edges.length,
      responseType: result.responseType,
    });

    // VAPI requires a COMPLETELY different format than AI Chat
    // VAPI expects: { results: [{ toolCallId, result }] }
    // The result must be a JSON string (not an object)
    
    // Check if this is a VAPI request (has message.toolCallId)
    const isVAPIRequest = req.body.message?.toolCallId;
    
    if (isVAPIRequest) {
      // VAPI format: return as required by VAPI docs
      res.json({
        results: [
          {
            toolCallId: req.body.message.toolCallId,
            result: JSON.stringify({
              success: true,
              data: result
            })
          }
        ]
      });
    } else {
      // Regular API format (for AI Chat compatibility)
      res.json({
        success: true,
        data: result,
      });
    }

  } catch (error: any) {
    console.error('[NL API] Error generating vault:', error);
    
    // Log additional context for debugging
    if (error.name === 'ZodError') {
      console.error('[NL API] Validation error details:', JSON.stringify(error.issues, null, 2));
    }
    
    // Check if this is a VAPI request
    const isVAPIRequest = req.body.message?.toolCallId;
    
    if (isVAPIRequest) {
      // VAPI format for errors (still return 200 with error in result)
      res.status(200).json({
        results: [
          {
            toolCallId: req.body.message.toolCallId,
            error: error.message || 'Failed to generate vault strategy'
          }
        ]
      });
    } else {
      // Regular error response
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate vault strategy',
        ...(error.name === 'ZodError' && { validationErrors: error.issues }),
      });
    }
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
        model: 'gpt-5-nano-2025-08-07',
        messages,
        temperature: 0.7
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
        model: 'gpt-5-nano-2025-08-07',
        messages,
        temperature: 0.7
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
      model: 'gpt-5-nano-2025-08-07',
      messages,
      temperature: 0.7,
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
