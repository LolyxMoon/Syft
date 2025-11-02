/**
 * Voice-to-Vault Component
 * Interactive voice interface for creating and modifying vault strategies
 * Redesigned to match Syft's dark cyberpunk aesthetic
 */

import { motion } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Volume2, MessageSquare, Loader2, Activity, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useVoiceAssistantContext } from '../../providers/VoiceAssistantProvider';
import type { Node, Edge } from '@xyflow/react';

interface VoiceToVaultProps {
  onVaultGenerated?: (nodes: Node[], edges: Edge[], metadata: any) => void;
  onStrategyModified?: (modifications: any) => void;
  onContractExplained?: (explanation: string) => void;
  currentNodes?: Node[];
  currentEdges?: Edge[];
}

export function VoiceToVault({
  onVaultGenerated,
  onStrategyModified,
  onContractExplained,
}: VoiceToVaultProps) {
  const {
    state,
    startListening,
    stopListening,
    toggleMute,
    sendTextMessage,
    onVaultGenerated: registerVaultCallback,
    onStrategyRefinement: registerRefinementCallback,
    onContractExplanation: registerExplanationCallback,
  } = useVoiceAssistantContext();

  const showTranscript = true;
  const [textInput, setTextInput] = useState('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Register callbacks
  useEffect(() => {
    if (onVaultGenerated) {
      return registerVaultCallback(onVaultGenerated);
    }
  }, [onVaultGenerated, registerVaultCallback]);

  useEffect(() => {
    if (onStrategyModified) {
      return registerRefinementCallback(onStrategyModified);
    }
  }, [onStrategyModified, registerRefinementCallback]);

  useEffect(() => {
    if (onContractExplained) {
      return registerExplanationCallback(onContractExplained);
    }
  }, [onContractExplained, registerExplanationCallback]);

  // Auto-scroll transcript
  useEffect(() => {
    if (showTranscript && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.conversationHistory, showTranscript]);

  const handleStartCall = async () => {
    try {
      await startListening();
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const handleEndCall = async () => {
    try {
      await stopListening();
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const handleSendText = () => {
    if (textInput.trim()) {
      sendTextMessage(textInput);
      setTextInput('');
    }
  };

  const getStatusText = () => {
    if (state.error) return state.error;
    if (state.isActive) return 'Connected - Speak naturally to create your vault';
    if (state.isConnecting) return 'Connecting to voice assistant...';
    return 'Click "Start Voice Call" to begin building your vault with AI';
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-default bg-neutral-900 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-primary-500/20 rounded-lg border border-primary-500/30">
                <Sparkles className="w-4 h-4 text-primary-500" />
              </div>
              {state.isActive && (
                <motion.div
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-50">Voice-to-Vault</h2>
              <p className="text-xs text-neutral-400">AI-powered vault creation</p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md ${
              state.isActive 
                ? 'bg-success-500/20 border border-success-500/30' 
                : state.isConnecting
                ? 'bg-warning-500/20 border border-warning-500/30'
                : 'bg-neutral-800 border border-default'
            }`}>
              {state.isConnecting ? (
                <Loader2 className="w-3 h-3 text-warning-400 animate-spin" />
              ) : state.isActive ? (
                <Activity className="w-3 h-3 text-success-400 animate-pulse" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
              )}
              <span className={`text-xs font-medium ${
                state.isActive ? 'text-success-400' : state.isConnecting ? 'text-warning-400' : 'text-neutral-400'
              }`}>
                {state.isActive ? 'Live' : state.isConnecting ? 'Connecting' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="mt-2 text-xs text-neutral-300">
          {getStatusText()}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Voice Visualization */}
        {state.isActive && (
          <div className="px-6 py-2 bg-neutral-900 border-b border-default">
            <div className="flex items-center gap-3">
              <Volume2 className="w-3.5 h-3.5 text-primary-400" />
              <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400"
                  style={{ width: `${state.volumeLevel * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              {state.isSpeaking && (
                <motion.div
                  className="text-xs text-primary-400 font-medium"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  Speaking...
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Conversation Transcript */}
        <div className="flex-1 overflow-y-auto px-6 py-3 bg-card">
          {state.conversationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-primary-400" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border border-primary-500/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
              
              <h3 className="text-base font-semibold text-neutral-50 mb-1.5">
                Ready to Create Your Vault
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mb-4">
                Start a voice call and describe your investment strategy naturally. 
                The AI will build your vault automatically.
              </p>
              
              {/* Quick Examples */}
              <div className="w-full max-w-md space-y-1.5">
                <div className="text-xs text-neutral-500 text-left mb-1.5 font-medium">Example commands:</div>
                {[
                  'Create a low-risk vault with 70% USDC staking',
                  'Build an aggressive yield farming strategy',
                  'Make a balanced portfolio with multiple protocols',
                  'Explain what this vault does in simple terms',
                ].map((example, i) => (
                  <motion.button
                    key={i}
                    className="w-full text-left px-3 py-2 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-default hover:border-hover text-xs text-neutral-300 transition-all"
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => state.isActive && sendTextMessage(example)}
                    disabled={!state.isActive}
                  >
                    <span className="text-primary-400 mr-1.5">"</span>
                    {example}
                    <span className="text-primary-400 ml-1">"</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {state.conversationHistory.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary-500/20 border border-primary-500/30 text-neutral-50'
                        : 'bg-neutral-900 border border-default text-neutral-100'
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-0.5 font-medium">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="text-xs leading-relaxed">{message.content}</div>
                  </div>
                </motion.div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>

        {/* Text Input (when call is active) */}
        {state.isActive && (
          <div className="px-6 py-3 bg-neutral-900 border-t border-default">
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                placeholder="Type a message (optional)..."
                className="flex-1 px-3 py-1.5 bg-neutral-800 border border-default rounded-md text-neutral-50 placeholder-neutral-500 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleSendText}
                disabled={!textInput.trim()}
                className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-dark-950 rounded-md transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="bg-neutral-900 border-t border-default px-6 py-3">
        <div className="flex items-center justify-center gap-3">
          {!state.isActive ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartCall}
              disabled={state.isConnecting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-neutral-800 disabled:to-neutral-800 text-neutral-900 rounded-md font-semibold shadow-lg transition-all disabled:opacity-50"
            >
              {state.isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Connecting...</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Start Voice Call</span>
                </>
              )}
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={`p-2.5 rounded-md transition-colors ${
                  state.isMuted
                    ? 'bg-warning-500/20 hover:bg-warning-500/30 border border-warning-500/30 text-warning-400'
                    : 'bg-neutral-800 hover:bg-neutral-700 border border-default text-neutral-300'
                }`}
              >
                {state.isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEndCall}
                className="flex items-center gap-2 px-5 py-2.5 bg-error-500 hover:bg-error-600 text-white rounded-md font-semibold text-sm shadow-lg transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </motion.button>
            </>
          )}
        </div>

        {/* Metrics (if available) */}
        {state.callMetrics && !state.isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 text-xs text-neutral-500 text-center"
          >
            Call duration: {((state.callMetrics.duration || 0) / 1000).toFixed(1)}s
          </motion.div>
        )}
      </div>
    </div>
  );
}
