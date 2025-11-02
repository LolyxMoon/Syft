/**
 * React Hook for Voice Assistant Integration
 * Manages VAPI state and provides a clean interface for components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { vapiService, type ConversationMessage, type CallMetrics } from '../services/vapiService';
import type { Node, Edge } from '@xyflow/react';

export interface VoiceAssistantState {
  isActive: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  volumeLevel: number;
  error: string | null;
  conversationHistory: ConversationMessage[];
  callMetrics: CallMetrics | null;
}

export interface VoiceCommandResult {
  success: boolean;
  action: string;
  data?: any;
  message?: string;
}

export interface UseVoiceAssistantReturn {
  state: VoiceAssistantState;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  toggleMute: () => void;
  sendTextMessage: (message: string) => void;
  clearHistory: () => void;
  onVaultGenerated: (callback: (nodes: Node[], edges: Edge[], metadata: any) => void) => () => void;
  onStrategyRefinement: (callback: (modifications: any) => void) => () => void;
  onContractExplanation: (callback: (explanation: string) => void) => () => void;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [state, setState] = useState<VoiceAssistantState>({
    isActive: false,
    isConnecting: false,
    isSpeaking: false,
    isMuted: false,
    volumeLevel: 0,
    error: null,
    conversationHistory: [],
    callMetrics: null,
  });

  // Refs to store callbacks without causing re-renders
  const vaultGeneratedCallbacks = useRef<Set<(nodes: Node[], edges: Edge[], metadata: any) => void>>(new Set());
  const strategyRefinementCallbacks = useRef<Set<(modifications: any) => void>>(new Set());
  const contractExplanationCallbacks = useRef<Set<(explanation: string) => void>>(new Set());

  // Setup event listeners
  useEffect(() => {
    const handleCallStart = () => {
      setState(prev => ({
        ...prev,
        isActive: true,
        isConnecting: false,
        error: null,
      }));
    };

    const handleCallEnd = () => {
      setState(prev => ({
        ...prev,
        isActive: false,
        isConnecting: false,
        isSpeaking: false,
        callMetrics: vapiService.getCallMetrics(),
      }));
    };

    const handleSpeechStart = () => {
      setState(prev => ({ ...prev, isSpeaking: true }));
    };

    const handleSpeechEnd = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
    };

    const handleVolumeLevel = (level: number) => {
      setState(prev => ({ ...prev, volumeLevel: level }));
    };

    const handleError = (error: any) => {
      console.error('[useVoiceAssistant] Error:', error);
      setState(prev => ({
        ...prev,
        error: error?.message || 'An error occurred',
        isConnecting: false,
        isActive: false,
      }));
    };

    const handleTranscript = (message: ConversationMessage) => {
      setState(prev => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, message],
      }));
    };

    const handleFunctionCall = async (data: { name: string; parameters: any; messageId: string }) => {
      console.log('[useVoiceAssistant] Function call received:', data);
      
      try {
        switch (data.name) {
          case 'generate_vault_strategy':
            await handleGenerateVault(data.parameters);
            break;
          case 'modify_vault_strategy':
            await handleModifyVault(data.parameters);
            break;
          case 'explain_contract':
            await handleExplainContract(data.parameters);
            break;
          case 'get_vault_templates':
            await handleGetTemplates(data.parameters);
            break;
          case 'analyze_strategy':
            await handleAnalyzeStrategy(data.parameters);
            break;
          default:
            console.warn('[useVoiceAssistant] Unknown function:', data.name);
        }
      } catch (error) {
        console.error('[useVoiceAssistant] Error handling function call:', error);
      }
    };

    // Register event listeners
    vapiService.on('callStart', handleCallStart);
    vapiService.on('callEnd', handleCallEnd);
    vapiService.on('speechStart', handleSpeechStart);
    vapiService.on('speechEnd', handleSpeechEnd);
    vapiService.on('volumeLevel', handleVolumeLevel);
    vapiService.on('error', handleError);
    vapiService.on('transcript', handleTranscript);
    vapiService.on('functionCall', handleFunctionCall);

    // Cleanup
    return () => {
      vapiService.off('callStart', handleCallStart);
      vapiService.off('callEnd', handleCallEnd);
      vapiService.off('speechStart', handleSpeechStart);
      vapiService.off('speechEnd', handleSpeechEnd);
      vapiService.off('volumeLevel', handleVolumeLevel);
      vapiService.off('error', handleError);
      vapiService.off('transcript', handleTranscript);
      vapiService.off('functionCall', handleFunctionCall);
    };
  }, []);

  // Function call handlers
  const handleGenerateVault = async (params: any) => {
    try {
      const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
      const response = await fetch(`${backendUrl}/api/nl/generate-vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (result.success) {
        const { nodes, edges, metadata } = result.data;
        
        // Notify all registered callbacks
        vaultGeneratedCallbacks.current.forEach(callback => {
          callback(nodes, edges, metadata);
        });

        // Send success message back to assistant
        vapiService.sendMessage(
          `Successfully generated vault strategy: "${metadata.name}". The vault has ${nodes.length} blocks configured.`
        );
      } else {
        throw new Error(result.message || 'Failed to generate vault');
      }
    } catch (error) {
      console.error('[useVoiceAssistant] Error generating vault:', error);
      vapiService.sendMessage(
        `Error generating vault: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleModifyVault = async (params: any) => {
    try {
      // Notify callbacks with modification data
      strategyRefinementCallbacks.current.forEach(callback => {
        callback(params.modifications);
      });

      vapiService.sendMessage(
        `Applied modifications to the vault strategy.`
      );
    } catch (error) {
      console.error('[useVoiceAssistant] Error modifying vault:', error);
      vapiService.sendMessage(
        `Error modifying vault: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleExplainContract = async (params: any) => {
    try {
      const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
      const response = await fetch(`${backendUrl}/api/nl/explain-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (result.success) {
        // Notify callbacks
        contractExplanationCallbacks.current.forEach(callback => {
          callback(result.data.explanation);
        });

        // Assistant will speak the explanation naturally
        vapiService.sendMessage(
          `Here's the explanation: ${result.data.explanation}`
        );
      } else {
        throw new Error(result.message || 'Failed to explain contract');
      }
    } catch (error) {
      console.error('[useVoiceAssistant] Error explaining contract:', error);
      vapiService.sendMessage(
        `Error explaining contract: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleGetTemplates = async (params: any) => {
    try {
      const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
      const response = await fetch(`${backendUrl}/api/nl/vault-templates?category=${params.category || 'all'}`);
      const result = await response.json();

      if (result.success) {
        const templates = result.data;
        vapiService.sendMessage(
          `I found ${templates.length} vault templates. ${templates.map((t: any) => t.name).join(', ')}`
        );
      }
    } catch (error) {
      console.error('[useVoiceAssistant] Error getting templates:', error);
    }
  };

  const handleAnalyzeStrategy = async (params: any) => {
    try {
      const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
      const response = await fetch(`${backendUrl}/api/nl/analyze-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (result.success) {
        vapiService.sendMessage(
          `Strategy analysis: ${result.data.summary}`
        );
      }
    } catch (error) {
      console.error('[useVoiceAssistant] Error analyzing strategy:', error);
    }
  };

  // Public methods
  const startListening = useCallback(async () => {
    if (!vapiService.isReady()) {
      setState(prev => ({
        ...prev,
        error: 'Voice assistant not initialized. Please check your configuration.',
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      await vapiService.startCall();
    } catch (error) {
      console.error('[useVoiceAssistant] Failed to start listening:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start voice assistant',
        isConnecting: false,
      }));
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await vapiService.stopCall();
    } catch (error) {
      console.error('[useVoiceAssistant] Failed to stop listening:', error);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const newMutedState = !state.isMuted;
    vapiService.setMuted(newMutedState);
    setState(prev => ({ ...prev, isMuted: newMutedState }));
  }, [state.isMuted]);

  const sendTextMessage = useCallback((message: string) => {
    vapiService.sendMessage(message, 'user');
  }, []);

  const clearHistory = useCallback(() => {
    vapiService.clearConversationHistory();
    setState(prev => ({ ...prev, conversationHistory: [] }));
  }, []);

  // Callback registration methods
  const onVaultGenerated = useCallback((callback: (nodes: Node[], edges: Edge[], metadata: any) => void) => {
    vaultGeneratedCallbacks.current.add(callback);
    return () => {
      vaultGeneratedCallbacks.current.delete(callback);
    };
  }, []);

  const onStrategyRefinement = useCallback((callback: (modifications: any) => void) => {
    strategyRefinementCallbacks.current.add(callback);
    return () => {
      strategyRefinementCallbacks.current.delete(callback);
    };
  }, []);

  const onContractExplanation = useCallback((callback: (explanation: string) => void) => {
    contractExplanationCallbacks.current.add(callback);
    return () => {
      contractExplanationCallbacks.current.delete(callback);
    };
  }, []);

  return {
    state,
    startListening,
    stopListening,
    toggleMute,
    sendTextMessage,
    clearHistory,
    onVaultGenerated,
    onStrategyRefinement,
    onContractExplanation,
  };
}
