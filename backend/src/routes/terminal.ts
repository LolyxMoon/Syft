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
    const fileMatch = body.match(/Content-Type: application\/wasm\r?\n\r?\n([\s\S]+?)\r?\n--/);
    if (!fileMatch) {
      res.status(400).json({ error: 'No WASM file found in upload' });
      return;
    }

    const wasmBuffer = Buffer.from(fileMatch[1], 'binary');

    // Create a job ID for this upload
    const jobId = `wasm_upload_${sessionId}_${Date.now()}`;
    
    // Create the job
    jobQueue.createJob(jobId);

    // Start processing in background
    processWasmUpload(jobId, sessionId, walletAddress, wasmBuffer);

    // Return job ID immediately
    res.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'WASM upload is being processed',
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
 * Background processing for WASM upload
 */
async function processWasmUpload(
  jobId: string,
  sessionId: string,
  walletAddress: string,
  wasmBuffer: Buffer
) {
  try {
    jobQueue.markProcessing(jobId);

    // Call the install_wasm function via terminalAIService
    const response = await terminalAIService.installWasm(sessionId, walletAddress, wasmBuffer);

    jobQueue.completeJob(jobId, response);
  } catch (error: any) {
    console.error('WASM upload processing error:', error);
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
