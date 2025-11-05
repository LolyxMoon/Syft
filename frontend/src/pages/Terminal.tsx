import { useState, useRef, useEffect } from 'react';
import { Send, Terminal as TerminalIcon, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionCalled?: string;
  functionResult?: any;
  type?: 'text' | 'function_call';
}

const Terminal = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'system',
      content: `🚀 **Welcome to Stellar Terminal AI!**

I'm your intelligent blockchain assistant for the Stellar testnet. I can help you with:

✨ **Wallet Operations:** Connect wallets, check balances, fund from faucet
💰 **Asset Management:** Create assets, transfer funds, batch transactions
🔗 **Trustlines:** Setup and manage asset trustlines
📜 **Smart Contracts:** Deploy, invoke, and upgrade Soroban contracts
💱 **DEX Trading:** Swap assets, add/remove liquidity, check pool analytics
🎨 **NFTs:** Mint, transfer, burn, and list NFTs
📊 **Analytics:** Transaction history, network stats, price oracles
🔍 **Explorer:** Search transactions and accounts

**Try asking me:**
- "Connect my wallet and show me my balance"
- "Fund my account from the faucet"
- "Transfer 100 XLM to [address]"
- "What's the current XLM/USDC price?"
- "Show me the latest network stats"

Let's build on Stellar! 🌟`,
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const pollJobStatus = async (jobId: string): Promise<any> => {
    const maxAttempts = 60; // 60 attempts = 30 seconds max
    const pollInterval = 500; // Poll every 500ms

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`/api/terminal/jobs/${jobId}`);

        if (response.data.status === 'completed') {
          return response.data.data;
        } else if (response.data.status === 'failed') {
          throw new Error(response.data.error || 'Job failed');
        }

        // Job still processing, wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        if (error.response?.status === 404) {
          throw new Error('Job expired or not found');
        }
        throw error;
      }
    }

    throw new Error('Request timeout - please try again');
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Start the background job
      const startResponse = await axios.post('/api/terminal/chat', {
        message: input,
        sessionId,
      });

      if (!startResponse.data.success || !startResponse.data.jobId) {
        throw new Error('Failed to start processing');
      }

      const jobId = startResponse.data.jobId;

      // Poll for the result
      const result = await pollJobStatus(jobId);

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
          functionCalled: result.functionCalled,
          functionResult: result.functionResult,
          type: result.type,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || 'Failed to get response');
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error.response?.data?.error || error.message || 'Failed to process message'}`,
        timestamp: new Date(),
        type: 'text',
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = async () => {
    try {
      await axios.post('/api/terminal/clear', { sessionId });
      setMessages([
        {
          id: '0',
          role: 'system',
          content: '🔄 **Chat cleared!** How can I help you with Stellar today?',
          timestamp: new Date(),
          type: 'text',
        },
      ]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const formatContent = (content: string) => {
    // Convert markdown-style formatting to JSX
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <div key={idx} className="mb-1">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-semibold text-primary-400">
                  {part}
                </strong>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </div>
        );
      }

      // Headers
      if (line.startsWith('##')) {
        return (
          <h3 key={idx} className="text-lg font-semibold text-neutral-50 mt-3 mb-2">
            {line.replace('##', '').trim()}
          </h3>
        );
      }

      // Links
      if (line.includes('http')) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = line.split(urlRegex);
        return (
          <div key={idx} className="mb-1">
            {parts.map((part, i) =>
              urlRegex.test(part) ? (
                <a
                  key={i}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 underline"
                >
                  {part}
                </a>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </div>
        );
      }

      // Regular lines
      return line ? (
        <div key={idx} className="mb-1">
          {line}
        </div>
      ) : (
        <div key={idx} className="h-2" />
      );
    });
  };

  const renderFunctionResult = (result: any) => {
    if (!result) return null;

    return (
      <div className="mt-2 p-3 bg-neutral-900/50 border border-primary-500/20 rounded-lg">
        <div className="text-xs font-mono text-neutral-400">
          {result.success ? (
            <div className="space-y-2">
              {result.transactionHash && (
                <div>
                  <span className="text-primary-400">Tx Hash:</span> {result.transactionHash}
                </div>
              )}
              {result.link && (
                <div>
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    View on Explorer →
                  </a>
                </div>
              )}
              {result.balances && (
                <div>
                  <span className="text-primary-400">Balances:</span>
                  <div className="ml-2 mt-1 space-y-1">
                    {result.balances.map((bal: any, idx: number) => (
                      <div key={idx}>
                        {bal.asset}: {bal.balance}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-400">Error: {result.error}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-app">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-default bg-secondary">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <TerminalIcon className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-50">Stellar Terminal</h1>
              <p className="text-sm text-neutral-400">AI-Powered Blockchain Assistant</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-500/10 border border-primary-500/20'
                    : message.role === 'system'
                    ? 'bg-neutral-900/50 border border-neutral-800'
                    : 'bg-secondary border border-default'
                }`}
              >
                {message.role === 'assistant' && message.functionCalled && (
                  <div className="mb-2 flex items-center gap-2 text-xs text-primary-400">
                    <Sparkles className="w-3 h-3" />
                    <span>Executed: {message.functionCalled.replace(/_/g, ' ')}</span>
                  </div>
                )}

                <div className="text-sm text-neutral-200 leading-relaxed">
                  {formatContent(message.content)}
                </div>

                {message.functionResult && renderFunctionResult(message.functionResult)}

                <div className="mt-2 text-xs text-neutral-500">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-3xl rounded-lg p-4 bg-secondary border border-default">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI is thinking and executing blockchain operations...</span>
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                This may take a few seconds for complex operations
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-default bg-secondary p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me anything about Stellar... (e.g., 'Show my balance', 'Transfer 100 XLM to...')"
              className="flex-1 px-4 py-3 bg-app border border-default rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
          <div className="mt-2 text-xs text-neutral-500 text-center">
            💡 Try: "Fund me from faucet" • "What's XLM price?" • "Show network stats"
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
