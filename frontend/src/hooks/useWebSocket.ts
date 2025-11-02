import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onVaultUpdate?: (vaultId: string, data: any) => void;
  onPortfolioUpdate?: (userId: string, data: any) => void;
  onPriceUpdate?: (asset: string, price: number) => void;
  onRuleTrigger?: (vaultId: string, ruleIndex: number, data: any) => void;
  onRebalanceComplete?: (vaultId: string, data: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws';

    console.log('🔌 Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        optionsRef.current.onConnected?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('📡 WebSocket handshake complete');
              break;

            case 'vault_update':
              optionsRef.current.onVaultUpdate?.(message.vaultId, message.data);
              break;

            case 'portfolio_update':
              optionsRef.current.onPortfolioUpdate?.(message.userId, message.data);
              break;

            case 'price_update':
              optionsRef.current.onPriceUpdate?.(message.asset, message.price);
              break;

            case 'rule_trigger':
              optionsRef.current.onRuleTrigger?.(message.vaultId, message.ruleIndex, message.data);
              break;

            case 'rebalance_complete':
              optionsRef.current.onRebalanceComplete?.(message.vaultId, message.data);
              break;

            case 'subscribed':
              console.log('📡 Subscribed to channels:', message.channels);
              break;

            case 'error':
              console.error('WebSocket error message:', message.message);
              setConnectionError(message.message);
              break;

            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionError('Connection error');
        optionsRef.current.onError?.(error);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        optionsRef.current.onDisconnected?.();

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 5000);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionError('Failed to create connection');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const subscribe = useCallback((channels: string[], userId?: string, vaultIds?: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'subscribe',
        channels,
        userId,
        vaultIds,
      };
      wsRef.current.send(JSON.stringify(message));
      console.log('📡 Subscribing to:', channels, vaultIds);
    } else {
      console.warn('Cannot subscribe - WebSocket not connected');
    }
  }, []);

  const unsubscribe = useCallback((channels: string[], vaultIds?: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'unsubscribe',
        channels,
        vaultIds,
      };
      wsRef.current.send(JSON.stringify(message));
      console.log('📡 Unsubscribing from:', channels, vaultIds);
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []); // Empty deps - connect/disconnect are stable, only run once on mount

  return {
    isConnected,
    connectionError,
    subscribe,
    unsubscribe,
    reconnect: connect,
  };
};
