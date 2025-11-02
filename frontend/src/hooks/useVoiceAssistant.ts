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
  const conversationHistoryRef = useRef<ConversationMessage[]>([]);

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
      setState(prev => {
        const newHistory = [...prev.conversationHistory, message];
        conversationHistoryRef.current = newHistory;
        return {
          ...prev,
          conversationHistory: newHistory,
        };
      });
    };

    const handleFunctionCall = async (data: { name: string; parameters: any; messageId: string }) => {
      console.log('[useVoiceAssistant] Function call received (server-side execution):', data);
      // Note: VAPI executes these as server-side tools. We don't need to call the backend again.
      // The results will come via the functionCallResult event handler.
    };

    const handleFunctionCallResult = async (data: { name: string; result: any; messageId: string }) => {
      console.log('[useVoiceAssistant] Function call result received:', data);
      
      try {
        switch (data.name) {
          case 'generate_vault_strategy':
            handleGenerateVaultResult(data.result);
            break;
          case 'modify_vault_strategy':
            handleModifyVaultResult(data.result);
            break;
          case 'explain_contract':
            handleExplainContractResult(data.result);
            break;
          case 'get_vault_templates':
            handleGetTemplatesResult(data.result);
            break;
          case 'analyze_strategy':
            handleAnalyzeStrategyResult(data.result);
            break;
          default:
            console.warn('[useVoiceAssistant] Unknown function result:', data.name);
        }
      } catch (error) {
        console.error('[useVoiceAssistant] Error handling function call result:', error);
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
    vapiService.on('functionCallResult', handleFunctionCallResult);

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
      vapiService.off('functionCallResult', handleFunctionCallResult);
    };
  }, []);

  // Function call result handlers - these receive the results from VAPI server-side tool execution
  const handleGenerateVaultResult = (result: any) => {
    try {
      console.log('[useVoiceAssistant] handleGenerateVaultResult called with result:', result);
      
      // The backend returns either {success: true, data: {...}} or VAPI format {results: [...]}
      // After parsing in vapiService, we should have the actual data
      const vaultData = result.data || result;
      
      if (!vaultData) {
        console.error('[useVoiceAssistant] No vault data in result:', result);
        vapiService.sendMessage(
          `Error: I couldn't generate the vault strategy. Please try describing it again.`
        );
        return;
      }

      const { nodes, edges, metadata } = vaultData;
      
      if (!nodes || !edges) {
        console.error('[useVoiceAssistant] Missing nodes or edges in result:', vaultData);
        vapiService.sendMessage(
          `Error: The vault data was incomplete. Please try again.`
        );
        return;
      }
      
      // Notify all registered callbacks
      vaultGeneratedCallbacks.current.forEach(callback => {
        callback(nodes, edges, metadata);
      });

      console.log('[useVoiceAssistant] Successfully processed vault with', nodes.length, 'nodes');

      // Send success message back to assistant
      vapiService.sendMessage(
        `Successfully generated vault strategy: "${metadata?.name || 'Custom Strategy'}". The vault has ${nodes.length} blocks configured.`
      );
    } catch (error) {
      console.error('[useVoiceAssistant] Error processing vault result:', error);
      vapiService.sendMessage(
        `Error generating vault: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleModifyVaultResult = (result: any) => {
    try {
      const modificationData = result.data || result;
      
      // Notify callbacks with modification data
      strategyRefinementCallbacks.current.forEach(callback => {
        callback(modificationData.modifications || modificationData);
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

  const handleExplainContractResult = (result: any) => {
    try {
      const explanationData = result.data || result;
      
      // Notify callbacks with contract explanation
      contractExplanationCallbacks.current.forEach(callback => {
        callback(explanationData.explanation || explanationData);
      });

      // Assistant will speak the explanation naturally
      vapiService.sendMessage(
        `Here's the explanation: ${explanationData.explanation || 'See the interface for details.'}`
      );
    } catch (error) {
      console.error('[useVoiceAssistant] Error with contract explanation:', error);
      vapiService.sendMessage(
        `Error explaining contract: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleGetTemplatesResult = (result: any) => {
    try {
      const templates = result.data || result;
      
      if (templates && Array.isArray(templates)) {
        vapiService.sendMessage(
          `I found ${templates.length} vault templates. ${templates.map((t: any) => t.name).join(', ')}`
        );
      }
    } catch (error) {
      console.error('[useVoiceAssistant] Error getting templates:', error);
    }
  };

  const handleAnalyzeStrategyResult = (result: any) => {
    try {
      const analysis = result.data || result;
      
      if (analysis && analysis.summary) {
        vapiService.sendMessage(
          `Strategy analysis: ${analysis.summary}`
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
