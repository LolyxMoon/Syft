import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface SubscriptionMessage {
  type: 'subscribe' | 'unsubscribe';
  channels: string[];
  userId?: string;
  vaultIds?: string[];
}

interface WebSocketClient {
  ws: WebSocket;
  userId?: string;
  subscribedChannels: Set<string>;
  subscribedVaults: Set<string>;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, WebSocketClient> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 WebSocket client connected');

      const client: WebSocketClient = {
        ws,
        subscribedChannels: new Set(),
        subscribedVaults: new Set(),
      };

      this.clients.set(ws, client);

      // Send welcome message
      this.send(ws, {
        type: 'connected',
        message: 'Connected to Syft WebSocket server',
        timestamp: new Date().toISOString(),
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as SubscriptionMessage;
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.send(ws, {
            type: 'error',
            message: 'Invalid message format',
          });
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('✅ WebSocket server initialized on /ws');
  }

  private handleMessage(ws: WebSocket, message: SubscriptionMessage) {
    const client = this.clients.get(ws);
    if (!client) return;

    if (message.type === 'subscribe') {
      // Subscribe to channels
      if (message.channels) {
        message.channels.forEach(channel => {
          client.subscribedChannels.add(channel);
        });
      }

      // Subscribe to specific vaults
      if (message.vaultIds) {
        message.vaultIds.forEach(vaultId => {
          client.subscribedVaults.add(vaultId);
        });
      }

      // Store user ID for user-specific updates
      if (message.userId) {
        client.userId = message.userId;
      }

      this.send(ws, {
        type: 'subscribed',
        channels: Array.from(client.subscribedChannels),
        vaults: Array.from(client.subscribedVaults),
        userId: client.userId,
      });

      console.log(`📡 Client subscribed to: ${Array.from(client.subscribedChannels).join(', ')}`);
    } else if (message.type === 'unsubscribe') {
      // Unsubscribe from channels
      if (message.channels) {
        message.channels.forEach(channel => {
          client.subscribedChannels.delete(channel);
        });
      }

      // Unsubscribe from vaults
      if (message.vaultIds) {
        message.vaultIds.forEach(vaultId => {
          client.subscribedVaults.delete(vaultId);
        });
      }

      this.send(ws, {
        type: 'unsubscribed',
        channels: Array.from(client.subscribedChannels),
        vaults: Array.from(client.subscribedVaults),
      });
    }
  }

  private send(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Broadcast vault update to all subscribed clients
  broadcastVaultUpdate(vaultId: string, data: any) {
    const message = {
      type: 'vault_update',
      vaultId,
      data,
      timestamp: new Date().toISOString(),
    };

    let sentCount = 0;
    this.clients.forEach((client, ws) => {
      if (client.subscribedVaults.has(vaultId) || client.subscribedChannels.has('vaults')) {
        this.send(ws, message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`📤 Broadcasted vault update for ${vaultId} to ${sentCount} clients`);
    }
  }

  // Broadcast portfolio update to specific user
  broadcastPortfolioUpdate(userId: string, data: any) {
    const message = {
      type: 'portfolio_update',
      userId,
      data,
      timestamp: new Date().toISOString(),
    };

    let sentCount = 0;
    this.clients.forEach((client, ws) => {
      if (client.userId === userId || client.subscribedChannels.has('portfolio')) {
        this.send(ws, message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`📤 Broadcasted portfolio update for ${userId} to ${sentCount} clients`);
    }
  }

  // Broadcast price update to all clients subscribed to prices
  broadcastPriceUpdate(asset: string, price: number) {
    const message = {
      type: 'price_update',
      asset,
      price,
      timestamp: new Date().toISOString(),
    };

    let sentCount = 0;
    this.clients.forEach((client, ws) => {
      if (client.subscribedChannels.has('prices')) {
        this.send(ws, message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`📤 Broadcasted price update for ${asset} to ${sentCount} clients`);
    }
  }

  // Broadcast rule trigger event
  broadcastRuleTrigger(vaultId: string, ruleIndex: number, data: any) {
    const message = {
      type: 'rule_trigger',
      vaultId,
      ruleIndex,
      data,
      timestamp: new Date().toISOString(),
    };

    let sentCount = 0;
    this.clients.forEach((client, ws) => {
      if (client.subscribedVaults.has(vaultId) || client.subscribedChannels.has('rules')) {
        this.send(ws, message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`📤 Broadcasted rule trigger for ${vaultId} to ${sentCount} clients`);
    }
  }

  // Broadcast rebalance completion
  broadcastRebalanceComplete(vaultId: string, data: any) {
    const message = {
      type: 'rebalance_complete',
      vaultId,
      data,
      timestamp: new Date().toISOString(),
    };

    let sentCount = 0;
    this.clients.forEach((client, ws) => {
      if (client.subscribedVaults.has(vaultId) || client.subscribedChannels.has('vaults')) {
        this.send(ws, message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`📤 Broadcasted rebalance completion for ${vaultId} to ${sentCount} clients`);
    }
  }

  // Get connected clients count
  getClientCount(): number {
    return this.clients.size;
  }

  // Get subscription stats
  getStats() {
    const stats = {
      totalClients: this.clients.size,
      channelSubscriptions: {} as Record<string, number>,
      vaultSubscriptions: {} as Record<string, number>,
    };

    this.clients.forEach(client => {
      client.subscribedChannels.forEach(channel => {
        stats.channelSubscriptions[channel] = (stats.channelSubscriptions[channel] || 0) + 1;
      });

      client.subscribedVaults.forEach(vaultId => {
        stats.vaultSubscriptions[vaultId] = (stats.vaultSubscriptions[vaultId] || 0) + 1;
      });
    });

    return stats;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
