/**
 * Voice Assistant Provider
 * Provides persistent voice assistant state across component unmounts
 */

import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useVoiceAssistant, type UseVoiceAssistantReturn } from '../hooks/useVoiceAssistant';

const VoiceAssistantContext = createContext<UseVoiceAssistantReturn | null>(null);

export function VoiceAssistantProvider({ children }: { children: ReactNode }) {
  const voiceAssistant = useVoiceAssistant();
  const stopListeningRef = useRef(voiceAssistant.stopListening);
  
  // Keep ref up to date
  useEffect(() => {
    stopListeningRef.current = voiceAssistant.stopListening;
  }, [voiceAssistant.stopListening]);

  // Cleanup: Disconnect voice agent when provider unmounts (user leaves page)
  useEffect(() => {
    return () => {
      console.log('[VoiceAssistantProvider] Unmounting - disconnecting voice assistant');
      // Always try to stop the call when leaving the page
      stopListeningRef.current().catch(err => {
        console.error('[VoiceAssistantProvider] Error stopping voice assistant:', err);
      });
    };
  }, []); // Empty deps - only run on unmount

  return (
    <VoiceAssistantContext.Provider value={voiceAssistant}>
      {children}
    </VoiceAssistantContext.Provider>
  );
}

export function useVoiceAssistantContext(): UseVoiceAssistantReturn {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistantContext must be used within VoiceAssistantProvider');
  }
  return context;
}
