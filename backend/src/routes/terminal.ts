import express from 'express';
import { terminalAIService } from '../services/terminalAIService.js';
import { jobQueue } from '../services/jobQueue.js';
import { sessionRateLimiter, globalRateLimiter } from '../utils/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/terminal/chat
 * Send a message to the Terminal AI (creates a background job)
 */
router.post('/chat', async (req, res): Promise<void> => {
  try {
    const { message, sessionId, walletAddress } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    // Check rate limits
    const sessionLimit = await sessionRateLimiter.checkLimit(sessionId);
    if (!sessionLimit.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${sessionLimit.resetIn} seconds.`,
      });
      return;
    }

    const globalLimit = await globalRateLimiter.checkLimit('terminal');
    if (!globalLimit.allowed) {
      res.status(429).json({
        error: 'Service busy',
        message: 'Too many requests across all users. Please try again later.',
      });
      return;
    }

    // Create a job ID for this chat request
    const jobId = `terminal_${sessionId}_${Date.now()}`;
    
    // Create the job
    jobQueue.createJob(jobId);

    // Start processing in background
    processTerminalChat(jobId, sessionId, message, walletAddress);

    // Return job ID immediately
    res.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Your request is being processed',
    });
  } catch (error: any) {
    console.error('Terminal chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message,
    });
  }
});

/**
 * Background processing function
 */
async function processTerminalChat(jobId: string, sessionId: string, message: string, walletAddress?: string) {
  try {
    jobQueue.markProcessing(jobId);

    const response = await terminalAIService.chat(sessionId, message, walletAddress);

    jobQueue.completeJob(jobId, response);
  } catch (error: any) {
    console.error('Terminal chat processing error:', error);
    jobQueue.failJob(jobId, error.message);
  }
}

/**
 * GET /api/terminal/jobs/:jobId
 * Poll for job status and result
 */
router.get('/jobs/:jobId', async (req, res): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = jobQueue.getJob(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found or expired',
      });
      return;
    }

    if (job.status === 'completed') {
      res.json({
        success: true,
        status: 'completed',
        data: job.result,
      });
    } else if (job.status === 'failed') {
      res.json({
        success: false,
        status: 'failed',
        error: job.error,
      });
    } else {
      res.json({
        success: true,
        status: job.status,
        message: 'Job is still processing',
      });
    }
  } catch (error: any) {
    console.error('Job polling error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
      details: error.message,
    });
  }
});

/**
 * POST /api/terminal/swap
 * Direct swap function call (used for follow-up swaps after trustline)
 */
router.post('/swap', async (req, res): Promise<void> => {
  try {
    const { sessionId, fromAsset, toAsset, amount, slippage } = req.body;

    console.log('[Terminal Route] Direct swap request:', {
      sessionId,
      fromAsset,
      toAsset,
      amount,
      slippage,
    });

    if (!sessionId || !fromAsset || !toAsset || !amount) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Create a job ID for this swap request
    const jobId = `swap_${sessionId}_${Date.now()}`;
    
    // Create the job
    jobQueue.createJob(jobId);

    // Start processing in background
    processDirectSwap(jobId, sessionId, fromAsset, toAsset, amount, slippage || '0.5');

    // Return job ID immediately
    res.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Swap is being processed',
    });
  } catch (error: any) {
    console.error('Terminal swap error:', error);
    res.status(500).json({
      error: 'Failed to process swap',
      details: error.message,
    });
  }
});

/**
 * Background processing for direct swap
 */
async function processDirectSwap(
  jobId: string,
  sessionId: string,
  fromAsset: string,
  toAsset: string,
  amount: string,
  slippage: string
) {
  try {
    jobQueue.markProcessing(jobId);

    // Call the swap function directly via terminalAIService
    const response = await terminalAIService.executeSwap(sessionId, fromAsset, toAsset, amount, slippage);

    jobQueue.completeJob(jobId, response);
  } catch (error: any) {
    console.error('Direct swap processing error:', error);
    jobQueue.failJob(jobId, error.message);
  }
}

/**
 * Direct add liquidity function call (used for follow-up deposit after trustline)
 */
router.post('/add-liquidity', async (req, res): Promise<void> => {
  try {
    const { sessionId, asset1, asset2, amount1, amount2 } = req.body;

    console.log('[Terminal Route] Direct add liquidity request:', {
      sessionId,
      asset1,
      asset2,
      amount1,
      amount2,
    });

    if (!sessionId || !asset1 || !asset2 || !amount1 || !amount2) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Create a job ID for this add liquidity request
    const jobId = `addliq_${sessionId}_${Date.now()}`;
    
    // Create the job
    jobQueue.createJob(jobId);

    // Start processing in background
    processDirectAddLiquidity(jobId, sessionId, asset1, asset2, amount1, amount2);

    // Return job ID immediately
    res.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Add liquidity is being processed',
    });
  } catch (error: any) {
    console.error('Terminal add liquidity error:', error);
    res.status(500).json({
      error: 'Failed to process add liquidity',
      details: error.message,
    });
  }
});

/**
 * Background processing for direct add liquidity
 */
async function processDirectAddLiquidity(
  jobId: string,
  sessionId: string,
  asset1: string,
  asset2: string,
  amount1: string,
  amount2: string
) {
  try {
    jobQueue.markProcessing(jobId);

    // Call the add liquidity function directly via terminalAIService
    const response = await terminalAIService.executeAddLiquidity(
      sessionId,
      asset1,
      asset2,
      amount1,
      amount2
    );

    jobQueue.completeJob(jobId, response);
  } catch (error: any) {
    console.error('Direct add liquidity processing error:', error);
    jobQueue.failJob(jobId, error.message);
  }
}

/**
 * POST /api/terminal/borrow
 * Direct borrow function call (used for follow-up after asset approval)
 */
router.post('/borrow', async (req, res): Promise<void> => {
  try {
    const { sessionId, asset, amount, poolAddress } = req.body;

    console.log('[Terminal Route] Direct borrow request:', {
      sessionId,
      asset,
      amount,
      poolAddress,
    });

    if (!sessionId || !asset || !amount) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Create a job ID for this borrow request
    const jobId = `borrow_${sessionId}_${Date.now()}`;
    
    // Create the job
    jobQueue.createJob(jobId);

    // Start processing in background
    processDirectBorrow(jobId, sessionId, asset, amount, poolAddress);

    // Return job ID immediately
    res.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Borrow is being processed',
    });
  } catch (error: any) {
    console.error('Terminal borrow error:', error);
    res.status(500).json({
      error: 'Failed to process borrow',
      details: error.message,
    });
  }
});

/**
 * Background processing for direct borrow
 */
async function processDirectBorrow(
  jobId: string,
  sessionId: string,
  asset: string,
  amount: string,
  poolAddress?: string
) {
  try {
    jobQueue.markProcessing(jobId);

    // Call the borrow function directly via terminalAIService
    const response = await terminalAIService.executeBorrow(
      sessionId,
      asset,
      amount,
      poolAddress
    );

    jobQueue.completeJob(jobId, response);
  } catch (error: any) {
    console.error('Direct borrow processing error:', error);
    jobQueue.failJob(jobId, error.message);
  }
}

/**
 * POST /api/terminal/upload-wasm
 * Upload WASM file and install it to Stellar network
 */
router.post('/upload-wasm', express.raw({ type: 'multipart/form-data', limit: '10mb' }), async (req, res): Promise<void> => {
  try {
    // Note: For production, you should use multer for proper multipart form handling
    // This is a simplified implementation that expects base64-encoded WASM
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
      return;
    }

    // Parse multipart form data manually (simplified)
    // In production, use multer middleware
    const body = req.body.toString();
    const sessionIdMatch = body.match(/name="sessionId"\r?\n\r?\n([^\r\n]+)/);
    const walletMatch = body.match(/name="walletAddress"\r?\n\r?\n([^\r\n]+)/);
    
    const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;
    const walletAddress = walletMatch ? walletMatch[1] : null;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    if (!walletAddress) {
      res.status(400).json({ error: 'Wallet must be connected to upload WASM' });
      return;
    }

    // Extract WASM file from multipart
    const fileMatch = body.match(/data:application\/octet-stream;base64,(.+)/);
    if (!fileMatch) {
      res.status(400).json({ error: 'No WASM file found in upload' });
      return;
    }

    // Return success
    res.json({
      success: true,
      message: 'WASM upload received',
    });
  } catch (error: any) {
    console.error('WASM upload error:', error);
    res.status(500).json({
      error: 'Failed to process WASM upload',
      details: error.message,
    });
  }
});



/**
 * POST /api/terminal/prepare-swap
 * Build and prepare a swap transaction with FRESH sequence number
 * This is called right before user signs to prevent tx_bad_seq
 */
router.post('/prepare-swap', async (req, res): Promise<void> => {
  try {
    const { sessionId, fromAsset, toAsset, amount, slippage } = req.body;

    console.log('[Terminal Route] Prepare swap (fresh):', {
      sessionId: sessionId?.substring(0, 8) + '...',
      fromAsset,
      toAsset,
      amount,
      slippage,
    });

    if (!sessionId || !fromAsset || !toAsset || !amount) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Build transaction with CURRENT sequence number
    const response = await terminalAIService.executeSwap(sessionId, fromAsset, toAsset, amount, slippage || '0.5');

    res.json(response);
  } catch (error: any) {
    console.error('Terminal prepare swap error:', error);
    res.status(500).json({
      error: 'Failed to prepare swap',
      details: error.message,
    });
  }
});

/**
 * POST /api/terminal/submit-signed
 * Submit a signed transaction XDR to the network
 * Handles both Horizon and Soroban transactions
 */
router.post('/submit-signed', async (req, res): Promise<void> => {
  try {
    const { signedXdr, network = 'testnet' } = req.body;

    if (!signedXdr) {
      res.status(400).json({ error: 'Signed XDR is required' });
      return;
    }

    console.log('[Terminal Route] Submit signed transaction:', {
      xdrLength: signedXdr.length,
      network,
    });

    // Create a job ID for this submission
    const jobId = `submit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the job
    jobQueue.createJob(jobId);

    // Start processing in background
    processSignedTransaction(jobId, signedXdr, network);

    // Return job ID immediately
    res.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Transaction is being submitted',
    });
  } catch (error: any) {
    console.error('Terminal submit signed error:', error);
    res.status(500).json({
      error: 'Failed to submit transaction',
      details: error.message,
    });
  }
});

/**
 * Background processing for signed transaction submission
 */
async function processSignedTransaction(
  jobId: string,
  signedXdr: string,
  network: string
) {
  try {
    jobQueue.markProcessing(jobId);

    const response = await terminalAIService.submitSignedTransaction(signedXdr, network);

    jobQueue.completeJob(jobId, response);
  } catch (error: any) {
    console.error('Signed transaction processing error:', error);
    jobQueue.failJob(jobId, error.message);
  }
}

/**
 * POST /api/terminal/clear
 * Clear conversation history for a session
 */
router.post('/clear', async (req, res): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    terminalAIService.clearHistory(sessionId);

    res.json({
      success: true,
      message: 'Conversation history cleared',
    });
  } catch (error: any) {
    console.error('Terminal clear error:', error);
    res.status(500).json({
      error: 'Failed to clear history',
      details: error.message,
    });
  }
});

/**
 * POST /api/terminal/history/save
 * Save a conversation to database
 */
router.post('/history/save', async (req, res): Promise<void> => {
  try {
    const { userId, sessionId, walletAddress, title, messages } = req.body;

    if (!userId || !sessionId) {
      res.status(400).json({ error: 'User ID (UUID) and Session ID are required' });
      return;
    }

    const result = await terminalAIService.saveConversation(
      userId,
      sessionId,
      walletAddress,
      title,
      messages
    );

    res.json({
      success: true,
      conversationId: result.conversationId,
      message: 'Conversation saved successfully',
    });
  } catch (error: any) {
    console.error('Save conversation error:', error);
    res.status(500).json({
      error: 'Failed to save conversation',
      details: error.message,
    });
  }
});

/**
 * GET /api/terminal/history/:userId
 * Get all conversations for a user
 */
router.get('/history/:userId', async (req, res): Promise<void> => {
  try {
    const { userId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    if (!userId) {
      res.status(400).json({ error: 'User ID (UUID) is required' });
      return;
    }

    const conversations = await terminalAIService.getConversations(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      conversations,
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      error: 'Failed to get conversations',
      details: error.message,
    });
  }
});

/**
 * GET /api/terminal/history/conversation/:conversationId
 * Load a specific conversation with all messages
 */
router.get('/history/conversation/:conversationId', async (req, res): Promise<void> => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID (UUID) is required' });
      return;
    }

    const conversation = await terminalAIService.loadConversation(conversationId);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    console.error('Load conversation error:', error);
    res.status(500).json({
      error: 'Failed to load conversation',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/terminal/history/:conversationId
 * Delete a conversation
 */
router.delete('/history/:conversationId', async (req, res): Promise<void> => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID (UUID) is required' });
      return;
    }

    await terminalAIService.deleteConversation(conversationId);

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      error: 'Failed to delete conversation',
      details: error.message,
    });
  }
});

/**
 * PATCH /api/terminal/history/:conversationId/title
 * Update conversation title
 */
router.patch('/history/:conversationId/title', async (req, res): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;

    if (!conversationId || !title) {
      res.status(400).json({ error: 'Conversation ID (UUID) and title are required' });
      return;
    }

    await terminalAIService.updateConversationTitle(conversationId, title);

    res.json({
      success: true,
      message: 'Conversation title updated successfully',
    });
  } catch (error: any) {
    console.error('Update conversation title error:', error);
    res.status(500).json({
      error: 'Failed to update conversation title',
      details: error.message,
    });
  }
});

/**
 * GET /api/terminal/stats/:sessionId
 * Get conversation statistics for a session
 */
router.get('/stats/:sessionId', async (req, res): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const stats = terminalAIService.getConversationStats(sessionId);

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Terminal stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      details: error.message,
    });
  }
});

/**
 * GET /api/terminal/memory
 * Get global memory statistics
 */
router.get('/memory', async (_req, res): Promise<void> => {
  try {
    const memoryStats = terminalAIService.getMemoryStats();

    res.json({
      success: true,
      memory: memoryStats,
    });
  } catch (error: any) {
    console.error('Terminal memory error:', error);
    res.status(500).json({
      error: 'Failed to get memory stats',
      details: error.message,
    });
  }
});

/**
 * GET /api/terminal/health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Terminal AI',
    capabilities: [
      'Wallet Management',
      'Asset Operations',
      'Trustlines',
      'Smart Contracts',
      'DEX Operations',
      'NFTs',
      'Transaction Management',
      'Network Analytics',
    ],
    features: [
      'Context Management',
      'Automatic Summarization',
      'Token Tracking',
    ],
  });
});

export default router;
