import express from 'express';
import { terminalAIService } from '../services/terminalAIService.js';
import { jobQueue } from '../services/jobQueue.js';

const router = express.Router();

/**
 * POST /api/terminal/chat
 * Send a message to the Terminal AI (creates a background job)
 */
router.post('/chat', async (req, res): Promise<void> => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    // Create a job ID for this chat request
    const jobId = `terminal_${sessionId}_${Date.now()}`;
    
    // Create the job
    jobQueue.createJob(jobId);

    // Start processing in background
    processTerminalChat(jobId, sessionId, message);

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
async function processTerminalChat(jobId: string, sessionId: string, message: string) {
  try {
    jobQueue.markProcessing(jobId);

    const response = await terminalAIService.chat(sessionId, message);

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
  });
});

export default router;
