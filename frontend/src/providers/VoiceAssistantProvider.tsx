/**
 * Voice Assistant Provider
 * Provides persistent voice assistant state across component unmounts
 */

import { createContext, useContext, ReactNode } from 'react';
import { useVoiceAssistant, type UseVoiceAssistantReturn } from '../hooks/useVoiceAssistant';

const VoiceAssistantContext = createContext<UseVoiceAssistantReturn | null>(null);

export function VoiceAssistantProvider({ children }: { children: ReactNode }) {
  const voiceAssistant = useVoiceAssistant();

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
