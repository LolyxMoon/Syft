import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import corsMiddleware from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger, requestId } from './middleware/logger.js';
import apiRoutes from './routes/index.js';
import { startRuleMonitoring } from './services/ruleTriggerService.js';
import { startVaultSync } from './services/vaultSyncService.js';
import { startYieldMonitoring } from './services/protocolYieldMonitor.js';
import { executeRebalance } from './services/vaultActionService.js';
import { wsService } from './services/websocketService.js';

// Load environment variables
dotenv.config();

// Filter out verbose logs to reduce noise
const originalLog = console.log;
console.log = (...args: any[]) => {
  const message = args.join(' ');
  // Skip these verbose logs
  if (message.includes('[getVaultAnalytics]') || 
      message.includes('[calculateAPY]') ||
      message.includes('[getTransactionTotals]') ||
      message.includes('[monitorVaultState]') ||
      message.includes('[getUserPosition]') ||
      message.includes('[getYieldsForAsset]') ||
      message.includes('[Yield Monitor]') ||
      message.includes('[Blend APY]') ||
      message.includes('[Staking APY]') ||
      message.includes('[getBlendPoolSupplyAPY]') ||
      message.includes('[findSoroswapPools]') ||
      message.includes('[Soroswap APY]') ||
      message.includes('[getPoolInfo]') ||
      message.includes('[calculatePoolAPY]') ||
      message.includes('[calculateOptimalRouting]') ||
      message.includes('[PriceService]') ||
      message.includes('Sync complete') ||
      message.includes('Monitoring ') ||
      message.includes('GET /api/terminal') ||
      message.includes('POST /api/terminal') ||
      message.includes('GET /jobs/') ||
      message.includes('POST /chat')) {
    return;
  }
  originalLog.apply(console, args);
};

// Add BigInt serialization support for JSON
// This allows BigInt values to be serialized as strings in JSON responses
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app: Express = express();
const port = process.env.PORT || 3001;

// Apply middleware
app.use(requestId);
app.use(logger);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Create HTTP server for both Express and WebSocket
const server = createServer(app);

// Initialize WebSocket server
wsService.initialize(server);

// Start server
server.listen(port, () => {
  console.log(`\n🚀 Syft Backend - http://localhost:${port}`);
  console.log(`⚙️  ${process.env.STELLAR_NETWORK || 'testnet'} | ${process.env.MVP_MODE === 'true' ? '🟡 Simulation' : '🔴 Live'}\n`);
  
  // Start background services silently
  const syncInterval = startVaultSync();
  const ruleInterval = startRuleMonitoring((trigger) => {
    console.log(`🎯 Rule triggered for vault ${trigger.vaultId}`);
    // Execute rebalance asynchronously without blocking
    (async () => {
      try {
        const result = await executeRebalance(trigger.vaultId, trigger.ruleIndex);
        if (result.success) {
          console.log(`✅ Rebalance executed for vault ${trigger.vaultId}`);
          if (result.transactionHash && !result.transactionHash.startsWith('mock_') && !result.transactionHash.startsWith('simulated_')) {
            console.log(`🔗 TX: ${result.transactionHash}`);
          }
        } else {
          console.error(`❌ Rebalance failed for vault ${trigger.vaultId}:`, result.error);
        }
      } catch (error) {
        console.error(`❌ Error executing rebalance for vault ${trigger.vaultId}:`, error);
      }
    })();
  });
  const yieldInterval = startYieldMonitoring(60);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    clearInterval(syncInterval);
    clearInterval(ruleInterval);
    if (typeof yieldInterval === 'function') {
      yieldInterval(); // Call cleanup function
    }
    process.exit(0);
  });
});

