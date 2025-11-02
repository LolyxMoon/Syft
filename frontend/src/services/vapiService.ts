/**
 * VAPI Voice AI Service
 * Handles voice-to-vault interactions using VAPI's conversational AI
 */

import Vapi from '@vapi-ai/web';
import type { Node, Edge } from '@xyflow/react';

export interface VaultGenerationRequest {
  userMessage: string;
  conversationContext?: ConversationMessage[];
  currentNodes?: Node[];
  currentEdges?: Edge[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface VaultConfiguration {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  strategy: string;
  blocks: {
    type: string;
    label: string;
    position: { x: number; y: number };
    data: any;
  }[];
  connections: {
    source: string;
    target: string;
    type?: string;
  }[];
}

export interface VoiceCommand {
  type: 'create_vault' | 'modify_vault' | 'explain_contract' | 'refine_strategy' | 'query_vault';
  data: any;
}

export interface CallMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  stages: {
    stage: string;
    status: 'started' | 'completed' | 'failed';
    duration?: number;
    timestamp: string;
  }[];
}

class VapiService {
  private vapi: Vapi | null = null;
  private isInitialized: boolean = false;
  private conversationHistory: ConversationMessage[] = [];
  private currentCallMetrics: CallMetrics | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeVapi();
  }

  private initializeVapi() {
    const publicKey = import.meta.env.VITE_PUBLIC_VAPI_PUBLIC_KEY;
    
    if (!publicKey) {
      console.error('[VAPI] Public key not found in environment variables');
      return;
    }

    try {
      this.vapi = new Vapi(publicKey);
      this.setupEventListeners();
      this.isInitialized = true;
      console.log('[VAPI] Service initialized successfully');
    } catch (error) {
      console.error('[VAPI] Failed to initialize:', error);
      this.isInitialized = false;
    }
  }

  private setupEventListeners() {
    if (!this.vapi) return;

    // Call lifecycle events
    this.vapi.on('call-start', () => {
      console.log('[VAPI] Call started');
      this.emit('callStart');
      if (this.currentCallMetrics) {
        this.currentCallMetrics.startTime = Date.now();
      }
    });

    this.vapi.on('call-end', () => {
      console.log('[VAPI] Call ended');
      this.emit('callEnd');
      if (this.currentCallMetrics) {
        this.currentCallMetrics.endTime = Date.now();
        this.currentCallMetrics.duration = this.currentCallMetrics.endTime - this.currentCallMetrics.startTime;
      }
    });

    // Speech detection
    this.vapi.on('speech-start', () => {
      console.log('[VAPI] Assistant speaking');
      this.emit('speechStart');
    });

    this.vapi.on('speech-end', () => {
      console.log('[VAPI] Assistant stopped speaking');
      this.emit('speechEnd');
    });

    // Volume level for visual feedback
    this.vapi.on('volume-level', (level: number) => {
      this.emit('volumeLevel', level);
    });

    // Message handling - most important for function calls
    this.vapi.on('message', (message: any) => {
      console.log('[VAPI] Message received:', message);
      this.handleMessage(message);
    });

    // Error handling
    this.vapi.on('error', (error: any) => {
      console.error('[VAPI] Error:', error);
      this.emit('error', error);
    });

    // Call progress tracking
    this.vapi.on('call-start-progress', (event: any) => {
      console.log('[VAPI] Call progress:', event);
      if (this.currentCallMetrics && event.stage) {
        this.currentCallMetrics.stages.push(event);
      }
    });

    this.vapi.on('call-start-success', (event: any) => {
      console.log('[VAPI] Call started successfully:', event);
    });

    this.vapi.on('call-start-failed', (event: any) => {
      console.error('[VAPI] Call start failed:', event);
      this.emit('error', event);
    });
  }

  private handleMessage(message: any) {
    console.log('[VAPI] ===== MESSAGE RECEIVED =====');
    console.log('[VAPI] Message type:', message.type);
    console.log('[VAPI] Full message:', JSON.stringify(message, null, 2));
    
    // Handle different message types
    switch (message.type) {
      case 'transcript':
        this.handleTranscript(message);
        break;
      case 'function-call':
        console.log('[VAPI] Handling function-call');
        this.handleFunctionCall(message);
        break;
      case 'function-call-result':
        console.log('[VAPI] Handling function-call-result');
        this.handleFunctionCallResult(message);
        break;
      case 'conversation-update':
        console.log('[VAPI] Conversation update:', message);
        // Check for tool call results in the messages array
        this.handleConversationUpdate(message);
        break;
      case 'status-update':
        console.log('[VAPI] Status update:', message);
        this.emit('statusUpdate', message);
        break;
      default:
        console.log('[VAPI] Unknown message type:', message.type);
    }

    // Emit all messages to subscribers
    this.emit('message', message);
  }

  private handleConversationUpdate(message: any) {
    // Check if there are any tool_call_result messages in the conversation
    if (message.messages && Array.isArray(message.messages)) {
      const toolResults = message.messages.filter((msg: any) => msg.role === 'tool_call_result');
      
      toolResults.forEach((toolResult: any) => {
        console.log('[VAPI] Found tool call result in conversation:', toolResult);
        
        // Extract and parse the result
        let parsedResult = toolResult.result;
        
        // Try to parse if it's a string
        if (typeof parsedResult === 'string' && !parsedResult.includes('No result returned')) {
          try {
            parsedResult = JSON.parse(parsedResult);
            console.log('[VAPI] Parsed tool result:', parsedResult);
          } catch (e) {
            console.warn('[VAPI] Could not parse tool result as JSON:', parsedResult);
          }
        }
        
        // Check if this is an error message
        if (typeof parsedResult === 'string' && parsedResult.includes('No result returned')) {
          console.error('[VAPI] Tool call failed:', parsedResult);
          return;
        }
        
        // Extract the actual data if it's in the expected format
        let functionData = parsedResult;
        if (parsedResult?.success && parsedResult?.data) {
          functionData = parsedResult.data;
        }
        
        console.log('[VAPI] Emitting tool result for:', toolResult.name);
        
        // Emit the function result
        this.emit('functionCallResult', {
          name: toolResult.name,
          result: functionData,
          toolCallId: toolResult.toolCallId,
        });
      });
    }
  }

  private handleTranscript(message: any) {
    if (message.role && message.transcriptType === 'final') {
      const conversationMsg: ConversationMessage = {
        role: message.role,
        content: message.transcript,
        timestamp: Date.now(),
      };
      this.conversationHistory.push(conversationMsg);
      this.emit('transcript', conversationMsg);
    }
  }

  private async handleFunctionCall(message: any) {
    console.log('[VAPI] Function call:', message);
    
    try {
      const { functionCall } = message;
      if (!functionCall) return;

      const { name, parameters } = functionCall;

      // Parse parameters if they're a string
      const params = typeof parameters === 'string' 
        ? JSON.parse(parameters) 
        : parameters;

      // Emit function call event with parsed parameters
      this.emit('functionCall', {
        name,
        parameters: params,
        messageId: message.id,
      });

    } catch (error) {
      console.error('[VAPI] Error handling function call:', error);
      this.emit('error', error);
    }
  }

  private handleFunctionCallResult(message: any) {
    console.log('[VAPI] Processing function call result:', message);
    
    try {
      const { functionCall } = message;
      if (!functionCall) return;

      const { name, result } = functionCall;

      // Parse the result - VAPI returns it in the format: {results: [{result: "..."}]}
      let parsedResult = result;
      
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch (e) {
          console.warn('[VAPI] Could not parse result as JSON:', result);
        }
      }

      // Extract the actual data from the VAPI response format
      let functionData = parsedResult;
      
      // If it's in VAPI's results array format, extract it
      if (parsedResult?.results?.[0]?.result) {
        try {
          functionData = typeof parsedResult.results[0].result === 'string'
            ? JSON.parse(parsedResult.results[0].result)
            : parsedResult.results[0].result;
        } catch (e) {
          console.warn('[VAPI] Could not parse nested result:', e);
          functionData = parsedResult.results[0].result;
        }
      }

      console.log('[VAPI] Emitting function result for:', name, functionData);

      // Emit the function result with parsed data
      this.emit('functionCallResult', {
        name,
        result: functionData,
        messageId: message.id,
      });

    } catch (error) {
      console.error('[VAPI] Error handling function call result:', error);
      this.emit('error', error);
    }
  }

  /**
   * Start a voice conversation with the assistant
   */
  async startCall(): Promise<void> {
    if (!this.vapi || !this.isInitialized) {
      throw new Error('VAPI not initialized');
    }

    try {
      const assistantId = import.meta.env.VITE_PUBLIC_ASSISTANT_ID;
      
      if (!assistantId) {
        throw new Error('Assistant ID not configured');
      }

      // Initialize call metrics
      this.currentCallMetrics = {
        startTime: Date.now(),
        stages: [],
      };

      // Start the call with assistant overrides
      await this.vapi.start(assistantId, {
        variableValues: {
          conversationContext: JSON.stringify(this.conversationHistory.slice(-5)), // Last 5 messages for context
        },
      });

      console.log('[VAPI] Call started successfully');
    } catch (error) {
      console.error('[VAPI] Failed to start call:', error);
      throw error;
    }
  }

  /**
   * Stop the current call
   */
  async stopCall(): Promise<void> {
    if (!this.vapi) return;

    try {
      await this.vapi.stop();
      console.log('[VAPI] Call stopped');
    } catch (error) {
      console.error('[VAPI] Error stopping call:', error);
    }
  }

  /**
   * End the call gracefully
   */
  endCall(): void {
    if (!this.vapi) return;
    this.vapi.end();
  }

  /**
   * Send a text message during the call
   */
  sendMessage(message: string, role: 'user' | 'system' = 'system'): void {
    if (!this.vapi) return;

    this.vapi.send({
      type: 'add-message',
      message: {
        role,
        content: message,
      },
    });
  }

  /**
   * Make the assistant say something
   */
  say(message: string, endCallAfter: boolean = false): void {
    if (!this.vapi) return;
    this.vapi.say(message, endCallAfter);
  }

  /**
   * Mute/unmute the microphone
   */
  setMuted(muted: boolean): void {
    if (!this.vapi) return;
    this.vapi.setMuted(muted);
  }

  /**
   * Check if microphone is muted
   */
  isMuted(): boolean {
    if (!this.vapi) return true;
    return this.vapi.isMuted();
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get call metrics
   */
  getCallMetrics(): CallMetrics | null {
    return this.currentCallMetrics;
  }

  /**
   * Event emitter pattern for subscribing to events
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event listener
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all subscribers
   */
  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`[VAPI] Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.vapi !== null;
  }

  /**
   * Get the underlying VAPI instance (for advanced usage)
   */
  getVapiInstance(): Vapi | null {
    return this.vapi;
  }
}

// Export singleton instance
export const vapiService = new VapiService();
