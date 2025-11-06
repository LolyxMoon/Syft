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
        // VAPI only has one function now: generate_vault_strategy
        // The backend AI intelligently decides whether to build, modify, explain, or chat
        if (data.name === 'generate_vault_strategy') {
          handleGenerateVaultResult(data.result);
        } else {
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

  // Poll for async job results
  const pollJobStatus = async (jobId: string, maxAttempts = 60) => {
    console.log('[useVoiceAssistant] Starting to poll for job:', jobId);
    
    const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 
                       'https://syft-f6ad696f49ee.herokuapp.com';
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${backendUrl}/api/nl/job-status/${jobId}`);
        const data = await response.json();
        
        console.log(`[useVoiceAssistant] Poll attempt ${attempt + 1}:`, data.status);
        
        if (data.status === 'completed') {
          console.log('[useVoiceAssistant] Job completed!', data.data);
          return data.data;
        }
        
        if (data.status === 'failed') {
          throw new Error(data.error || 'Job failed');
        }
        
        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('[useVoiceAssistant] Poll error:', error);
        throw error;
      }
    }
    
    throw new Error('Job timeout - exceeded maximum polling attempts');
  };

  // Function call result handler - processes results from VAPI server-side tool execution
  // The backend AI (naturalLanguageVaultGenerator) intelligently decides the response type:
  // - 'build': Generate new vault → display in visual builder
  // - 'chat': Just conversation → assistant speaks the response
  // - Can also handle modifications, explanations, etc. all through one endpoint
  const handleGenerateVaultResult = async (result: any) => {
    try {
      console.log('[useVoiceAssistant] ===== VAULT RESULT RECEIVED =====');
      console.log('[useVoiceAssistant] Raw result:', JSON.stringify(result, null, 2));
      
      // The backend returns: {success: true, data: {nodes, edges, explanation, responseType, ...}}
      // After VAPI and vapiService parsing, we should have this structure
      let vaultData = result.data || result;
      
      console.log('[useVoiceAssistant] Extracted vaultData:', JSON.stringify(vaultData, null, 2));
      
      // Check if this is an async job response
      if (vaultData.jobId && vaultData.status === 'processing') {
        console.log('[useVoiceAssistant] Async job detected, polling for results...');
        vapiService.sendMessage('Processing your vault request...');
        
        try {
          vaultData = await pollJobStatus(vaultData.jobId);
          console.log('[useVoiceAssistant] Async job completed:', vaultData);
        } catch (error) {
          console.error('[useVoiceAssistant] Failed to poll job:', error);
          vapiService.sendMessage(
            `Error: ${error instanceof Error ? error.message : 'Failed to generate vault'}`
          );
          return;
        }
      }
      
      if (!vaultData) {
        console.error('[useVoiceAssistant] No vault data in result');
        vapiService.sendMessage(
          `Error: I couldn't process your request. Please try again.`
        );
        return;
      }

      const { nodes, edges, responseType } = vaultData;
      
      console.log('[useVoiceAssistant] Parsed data - nodes:', nodes?.length, 'edges:', edges?.length, 'responseType:', responseType);
      
      // Check if the AI actually built a vault or just chatted
      if (responseType === 'build' && nodes && edges && nodes.length > 0) {
        console.log('[useVoiceAssistant] ✅ Building vault with', nodes.length, 'nodes');
        
        // Notify all registered callbacks to display the vault
        vaultGeneratedCallbacks.current.forEach(callback => {
          console.log('[useVoiceAssistant] Calling vault generated callback');
          callback(nodes, edges, vaultData.metadata);
        });

        console.log('[useVoiceAssistant] Successfully processed vault with', nodes.length, 'nodes');

        // Send success message back to assistant
        vapiService.sendMessage(
          `Successfully generated vault strategy. The vault has ${nodes.length} blocks configured and is now displayed in the visual builder.`
        );
      } else {
        // AI chose to just chat - the explanation is already spoken by the assistant
        console.log('[useVoiceAssistant] ℹ️ AI response type:', responseType, '- No vault built (nodes:', nodes?.length, ')');
        
        // The VAPI assistant will speak the explanation naturally
        // No need to manually send it as it's already in the tool result
      }
    } catch (error) {
      console.error('[useVoiceAssistant] ❌ Error processing vault result:', error);
      console.error('[useVoiceAssistant] Error stack:', error instanceof Error ? error.stack : 'No stack');
      vapiService.sendMessage(
        `Error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
