import { useState, useRef, useEffect } from 'react';
import { Send, Terminal as TerminalIcon, Sparkles, Trash2, Loader2, History, Plus, X, Clock, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useWallet } from '../providers/WalletProvider';
import { TerminalActionCard, TransactionAction } from '../components/TerminalActionCard';

// Backend API URL configuration
const API_BASE_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionCalled?: string;
  functionResult?: any;
  type?: 'text' | 'function_call';
  action?: TransactionAction; // Action requiring user interaction
}

interface ConversationHistory {
  id: string;
  session_id: string;
  title: string;
  message_count: number;
  wallet_address?: string;
  created_at: string;
  updated_at: string;
}

const Terminal = () => {
  // Get connected wallet from WalletProvider
  const { address: walletAddress } = useWallet();
  const isConnected = !!walletAddress; // Wallet is connected if address exists

  // localStorage keys
  const STORAGE_KEY_MESSAGES = 'syft_terminal_messages';
  const STORAGE_KEY_SESSION = 'syft_terminal_session_id';

  // Initialize messages from localStorage or default welcome message
  const getInitialMessages = (): Message[] => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error('[Terminal] Failed to load messages from localStorage:', error);
    }

    // Return default welcome message
    return [
      {
        id: '0',
        role: 'system',
        content: `🚀 **Welcome to Stellar Terminal AI!**

I'm your intelligent blockchain assistant for the Stellar testnet. I can help you with:

✨ **Wallet Operations:** Check balances, fund from faucet
💰 **Asset Management:** Create assets, transfer funds, batch transactions
🔗 **Trustlines:** Setup and manage asset trustlines
 **DEX Trading:** Swap assets, add/remove liquidity, check pool analytics
🎨 **NFTs:** Mint, transfer, burn, and list NFTs with AI-generated artwork
📊 **Analytics:** Transaction history, network stats, price oracles
🔍 **Explorer:** Search transactions and accounts

**Try asking me:**
- "Show me my balance"
- "Fund my account from the faucet"
- "Mint me a Goku NFT" or "Create a cyberpunk cat NFT"
- "List my NFTs"
- "Transfer 100 XLM to [address]"
- "What's the current XLM/USDC price?"

${isConnected ? `✅ **Wallet Connected:** ${walletAddress}` : '⚠️ **Please connect your wallet** using the button in the top-right corner.'}

Let's build on Stellar! 🌟`,
        timestamp: new Date(),
        type: 'text',
      },
    ];
  };

  // Initialize sessionId from localStorage or create new one
  const getInitialSessionId = (): string => {
    try {
      const savedSessionId = localStorage.getItem(STORAGE_KEY_SESSION);
      if (savedSessionId) {
        return savedSessionId;
      }
    } catch (error) {
      console.error('[Terminal] Failed to load sessionId from localStorage:', error);
    }
    return `session_${Date.now()}_${Math.random()}`;
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(getInitialSessionId);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('[Terminal] Failed to save messages to localStorage:', error);
    }
  }, [messages]);

  // Save sessionId to localStorage on mount
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, sessionId);
    } catch (error) {
      console.error('[Terminal] Failed to save sessionId to localStorage:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update welcome message when wallet connection changes
  useEffect(() => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[0].id === '0' && newMessages[0].role === 'system') {
        newMessages[0] = {
          ...newMessages[0],
          content: `🚀 **Welcome to Stellar Terminal AI!**

I'm your intelligent blockchain assistant for the Stellar testnet. I can help you with:

✨ **Wallet Operations:** Check balances, fund from faucet
💰 **Asset Management:** Create assets, transfer funds, batch transactions
🔗 **Trustlines:** Setup and manage asset trustlines
 **DEX Trading:** Swap assets, add/remove liquidity, check pool analytics
🎨 **NFTs:** Mint, transfer, burn, and list NFTs with AI-generated artwork
📊 **Analytics:** Transaction history, network stats, price oracles
🔍 **Explorer:** Search transactions and accounts

**Try asking me:**
- "Show me my balance"
- "Fund my account from the faucet"
- "Mint me a Goku NFT" or "Create a cyberpunk cat NFT"
- "List my NFTs"
- "Transfer 100 XLM to [address]"
- "What's the current XLM/USDC price?"

${isConnected ? `✅ **Wallet Connected:** ${walletAddress}` : '⚠️ **Please connect your wallet** using the button in the top-right corner.'}

Let's build on Stellar! 🌟`,
          timestamp: new Date(newMessages[0].timestamp), // Preserve original timestamp
        };
      }
      return newMessages;
    });
  }, [isConnected, walletAddress]);

  const pollJobStatus = async (jobId: string, abortSignal?: AbortSignal): Promise<any> => {
    const maxAttempts = 1200; // 1200 attempts × 500ms = 10 minutes max (for complex operations like web search + multi-step functions)
    const pollInterval = 500; // Poll every 500ms

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Check if request was aborted
      if (abortSignal?.aborted) {
        throw new Error('Request cancelled by user');
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/terminal/jobs/${jobId}`, {
          signal: abortSignal,
        });

        if (response.data.status === 'completed') {
          return response.data.data;
        } else if (response.data.status === 'failed') {
          throw new Error(response.data.error || 'Job failed');
        }

        // Job still processing, wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.message === 'Request cancelled by user') {
          throw new Error('Request cancelled by user');
        }
        if (error.response?.status === 404) {
          throw new Error('Job expired or not found');
        }
        throw error;
      }
    }

    throw new Error('Request timeout after 10 minutes - operation may be too complex or stuck');
  };

  const stopCurrentRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      
      const cancelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⏹️ **Request cancelled**\n\nYou can start a new request anytime.',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, cancelMessage]);
    }
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

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Start the background job
      console.log('[Terminal] Sending message with wallet:', {
        sessionId,
        walletAddress: isConnected ? walletAddress : undefined,
        isConnected,
      });
      
      const startResponse = await axios.post(`${API_BASE_URL}/api/terminal/chat`, {
        message: input,
        sessionId,
        walletAddress: isConnected ? walletAddress : undefined,
      }, {
        signal: abortController.signal,
      });

      if (!startResponse.data.success || !startResponse.data.jobId) {
        throw new Error('Failed to start processing');
      }

      const jobId = startResponse.data.jobId;

      // Poll for the result with abort signal
      const result = await pollJobStatus(jobId, abortController.signal);

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
          functionCalled: result.functionCalled,
          functionResult: result.functionResult,
          type: result.type,
          action: result.functionResult?.action, // Include action if present
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || 'Failed to get response');
      }
    } catch (error: any) {
      // Don't show error message if request was cancelled
      if (error.name === 'CanceledError' || error.message === 'Request cancelled by user') {
        return;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error.response?.data?.error || error.message || 'Failed to process message'}`,
        timestamp: new Date(),
        type: 'text',
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Load conversation history for the user
  const loadConversationHistory = async () => {
    if (!walletAddress) return;
    
    setIsLoadingHistory(true);
    try {
      // Get user ID from wallet address
      const userResponse = await axios.get(`${API_BASE_URL}/api/users/${walletAddress}`);
      const userId = userResponse.data.data.id;

      const response = await axios.get(`${API_BASE_URL}/api/terminal/history/${userId}`);
      if (response.data.success) {
        setConversationHistory(response.data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load a specific conversation
  const loadConversation = async (conversationId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/terminal/history/conversation/${conversationId}`);
      if (response.data.success) {
        const conv = response.data.conversation;
        
        // Convert database messages to UI message format
        const loadedMessages: Message[] = conv.messages.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          functionCalled: msg.function_called,
          functionResult: msg.function_result,
          type: msg.message_type || 'text',
        }));

        setMessages(loadedMessages);
        setSessionId(conv.session_id);
        setCurrentConversationId(conversationId);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(loadedMessages));
        localStorage.setItem(STORAGE_KEY_SESSION, conv.session_id);
        
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  // Save current conversation
  const saveCurrentConversation = async () => {
    if (!walletAddress) return;
    
    try {
      // Get user ID
      const userResponse = await axios.get(`${API_BASE_URL}/api/users/${walletAddress}`);
      const userId = userResponse.data.data.id;

      await axios.post(`${API_BASE_URL}/api/terminal/history/save`, {
        userId,
        sessionId,
        walletAddress,
        title: undefined, // Will be auto-generated
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          functionCalled: msg.functionCalled,
          functionResult: msg.functionResult,
          type: msg.type,
        })),
      });

      console.log('[Terminal] Conversation saved successfully');
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  // Start a new conversation
  const startNewConversation = () => {
    // Save current conversation before starting new one
    if (messages.length > 1) {
      saveCurrentConversation();
    }

    // Generate new session ID
    const newSessionId = `session_${Date.now()}_${Math.random()}`;
    
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    localStorage.setItem(STORAGE_KEY_SESSION, newSessionId);
    
    // Reset state
    setSessionId(newSessionId);
    setCurrentConversationId(null);
    setMessages(getInitialMessages());
    setShowHistory(false);
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering loadConversation
    
    try {
      await axios.delete(`${API_BASE_URL}/api/terminal/history/${conversationId}`);
      
      // Remove from local state
      setConversationHistory(prev => prev.filter(c => c.id !== conversationId));
      
      // If deleted conversation was current, start new
      if (currentConversationId === conversationId) {
        startNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // Auto-save conversation periodically (every 30 seconds when there are messages)
  useEffect(() => {
    if (messages.length <= 1) return; // Don't save if only welcome message
    
    const autoSaveInterval = setInterval(() => {
      saveCurrentConversation();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [messages, walletAddress, sessionId]);

  // Load history when showing history panel
  useEffect(() => {
    if (showHistory) {
      loadConversationHistory();
    }
  }, [showHistory, walletAddress]);

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

      // Links - support both markdown style [text](url) and plain URLs
      if (line.includes('http')) {
        // Check for markdown-style links first: [text](url)
        const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
        if (markdownLinkRegex.test(line)) {
          const parts = line.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g);
          return (
            <div key={idx} className="mb-1">
              {parts.map((part, i) => {
                const match = part.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
                if (match) {
                  const [, text, url] = match;
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 underline"
                    >
                      {text}
                    </a>
                  );
                }
                return <span key={i}>{part}</span>;
              })}
            </div>
          );
        }
        
        // Fall back to plain URL detection
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
                  View on Explorer
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

    // Special rendering for NFT minting success
    if (result.success && result.imageUrl && result.nftName) {
      return (
        <div className="mt-3 border border-primary-500/30 rounded-lg overflow-hidden bg-gradient-to-br from-primary-500/10 to-purple-500/10">
          {/* NFT Image */}
          <div className="relative">
            <img 
              src={result.imageUrl} 
              alt={result.nftName}
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://api.dicebear.com/7.x/shapes/svg?seed=nft-minted';
              }}
            />
            <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1">
              <span>✨</span>
              <span>Minted</span>
            </div>
          </div>

          {/* NFT Details */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-lg font-bold text-neutral-50 mb-1">{result.nftName}</h3>
              <p className="text-sm text-neutral-400">Token ID: {result.nftTokenId || 'Pending...'}</p>
            </div>

            {result.collection && (
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="px-2 py-1 bg-neutral-800 rounded">
                  Collection: {result.collection}
                </span>
              </div>
            )}

            {result.transactionHash && (
              <div className="pt-2 border-t border-neutral-800">
                <div className="text-xs text-neutral-500 mb-1">Transaction Hash:</div>
                <div className="font-mono text-xs text-primary-400 break-all">
                  {result.transactionHash}
                </div>
              </div>
            )}

            {result.link && (
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-black rounded-lg transition-colors text-sm font-medium"
              >
                View on Stellar Expert →
              </a>
            )}
          </div>
        </div>
      );
    }

    // Default rendering for other function results
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
          <div className="flex items-center gap-2">
            <button
              onClick={startNewConversation}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 transition-colors"
              title="Start new conversation"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">New</span>
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-50 transition-colors"
              title="View conversation history"
            >
              <History className="w-4 h-4" />
              <span className="text-sm">History</span>
            </button>
          </div>
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

                <div className="text-sm text-neutral-200 leading-relaxed break-words overflow-hidden">
                  {formatContent(message.content)}
                </div>

                {message.functionResult && renderFunctionResult(message.functionResult)}

                {message.action && (
                  <TerminalActionCard
                    action={message.action}
                    onComplete={async (result) => {
                      // Add a new message with the transaction result
                      const network = message.action?.details?.network || 'testnet';
                      const explorerLink = result.hash 
                        ? `https://stellar.expert/explorer/${network}/tx/${result.hash}`
                        : '';
                      
                      // For NFT minting, create a rich result message with NFT details
                      let resultMessage: Message;
                      
                      if (result.success && message.action?.type === 'mint_nft') {
                        // Create a success message with NFT card rendering
                        resultMessage = {
                          id: Date.now().toString(),
                          role: 'assistant',
                          content: `🎉 **NFT Minted Successfully!**\n\nYour "${message.action.details.nft_name}" NFT has been created and added to your wallet!`,
                          timestamp: new Date(),
                          functionResult: {
                            success: true,
                            nftName: message.action.details.nft_name,
                            imageUrl: message.action.details.image_preview,
                            nftTokenId: 'Confirming...', // Will be updated via polling
                            collection: message.action.details.collection,
                            transactionHash: result.hash,
                            link: explorerLink,
                          },
                        };
                      } else {
                        // Regular transaction result message
                        resultMessage = {
                          id: Date.now().toString(),
                          role: 'assistant',
                          content: result.success
                            ? `✅ **Transaction Successful!**\nHash: \`${result.hash}\`\n[View on Stellar Expert](${explorerLink})`
                            : `❌ **Transaction Failed**\n\nError: ${result.error}`,
                          timestamp: new Date(),
                        };
                      }
                      
                      setMessages((prev) => [...prev, resultMessage]);

                      // Check if there's a next action (e.g., deposit after pool trustline)
                      // Check both result.nextAction and message.action.nextAction for compatibility
                      const nextAction = result.nextAction || message.action?.nextAction;
                      console.log('[Terminal] Checking for next action:', { 
                        hasResultNextAction: !!result.nextAction, 
                        hasMessageNextAction: !!message.action?.nextAction,
                        nextAction 
                      });
                      
                      if (result.success && nextAction) {
                        console.log('[Terminal] Next action found, type:', nextAction.type);
                        
                        if (nextAction.type === 'add_liquidity') {
                          // Automatically trigger the liquidity deposit now that trustline is established
                          const nextStepMessage: Message = {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: `✅ **Pool trustline established!** Now proceeding with liquidity deposit...`,
                            timestamp: new Date(),
                          };
                          setMessages((prev) => [...prev, nextStepMessage]);

                          // Trigger the add_liquidity function directly
                          setIsLoading(true);
                          try {
                            const { asset1, asset2, amount1, amount2 } = nextAction;
                            
                            const depositResponse = await axios.post(`${API_BASE_URL}/api/terminal/add-liquidity`, {
                              sessionId,
                              asset1,
                              asset2,
                              amount1,
                              amount2,
                            });

                            if (!depositResponse.data.success || !depositResponse.data.jobId) {
                              throw new Error('Failed to start liquidity deposit');
                            }

                            const depositResult = await pollJobStatus(depositResponse.data.jobId);

                            console.log('[Terminal] Auto-deposit result:', depositResult);

                            if (depositResult.success) {
                              const depositResponseMessage: Message = {
                                id: (Date.now() + 2).toString(),
                                role: 'assistant',
                                content: depositResult.message || '✅ Liquidity added successfully!',
                                timestamp: new Date(),
                                functionCalled: depositResult.functionCalled,
                                functionResult: depositResult.functionResult,
                                type: depositResult.type,
                                action: depositResult.functionResult?.action,
                              };
                              setMessages((prev) => [...prev, depositResponseMessage]);
                            } else {
                              throw new Error(depositResult.error || depositResult.message || 'Liquidity deposit failed');
                            }
                          } catch (error: any) {
                            const errorMessage: Message = {
                              id: (Date.now() + 2).toString(),
                              role: 'assistant',
                              content: `❌ Auto-deposit failed: ${error.message}. Please try your add liquidity command again manually.`,
                              timestamp: new Date(),
                            };
                            setMessages((prev) => [...prev, errorMessage]);
                          } finally {
                            setIsLoading(false);
                          }
                        } else if (nextAction.type === 'borrow_from_pool') {
                          // Automatically trigger the borrow operation now that asset approval is done
                          const nextStepMessage: Message = {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: `✅ **Asset approved!** Now proceeding with borrow operation...`,
                            timestamp: new Date(),
                          };
                          setMessages((prev) => [...prev, nextStepMessage]);

                          // Trigger the borrow function directly
                          setIsLoading(true);
                          try {
                            const { asset, amount, poolAddress } = nextAction;
                            
                            const borrowResponse = await axios.post(`${API_BASE_URL}/api/terminal/borrow`, {
                              sessionId,
                              asset,
                              amount,
                              poolAddress,
                            });

                            if (!borrowResponse.data.success || !borrowResponse.data.jobId) {
                              throw new Error('Failed to start borrow operation');
                            }

                            const borrowResult = await pollJobStatus(borrowResponse.data.jobId);

                            console.log('[Terminal] Auto-borrow result:', borrowResult);

                            if (borrowResult.success) {
                              const borrowResponseMessage: Message = {
                                id: (Date.now() + 2).toString(),
                                role: 'assistant',
                                content: borrowResult.message || `✅ Successfully borrowed ${amount} ${asset}!`,
                                timestamp: new Date(),
                                functionCalled: borrowResult.functionCalled,
                                functionResult: borrowResult.functionResult,
                                type: borrowResult.type,
                                action: borrowResult.functionResult?.action,
                              };
                              setMessages((prev) => [...prev, borrowResponseMessage]);
                            } else {
                              throw new Error(borrowResult.error || borrowResult.message || 'Borrow operation failed');
                            }
                          } catch (error: any) {
                            const errorMessage: Message = {
                              id: (Date.now() + 2).toString(),
                              role: 'assistant',
                              content: `❌ Auto-borrow failed: ${error.message}. Please try your borrow command again manually.`,
                              timestamp: new Date(),
                            };
                            setMessages((prev) => [...prev, errorMessage]);
                          } finally {
                            setIsLoading(false);
                          }
                        }
                      }

                      // Check if there's a follow-up action (e.g., swap after trustline)
                      if (result.success && message.action?.followUpAction) {
                        const followUp = message.action.followUpAction;
                        
                        if (followUp.type === 'swap_assets') {
                          // Automatically trigger the swap now that trustline is established
                          const followUpMessage: Message = {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: `🔄 **Trustline established!** Now proceeding with your swap...`,
                            timestamp: new Date(),
                          };
                          setMessages((prev) => [...prev, followUpMessage]);

                          // Trigger the swap directly using the stored parameters
                          setIsLoading(true);
                          try {
                            const { fromAsset, toAsset, amount, slippage } = followUp.params;
                            
                            // Call the swap function directly via API instead of sending a chat message
                            // This preserves the exact asset parameters (with issuer)
                            const startResponse = await axios.post(`${API_BASE_URL}/api/terminal/swap`, {
                              sessionId,
                              fromAsset,
                              toAsset,
                              amount,
                              slippage: slippage || '0.5',
                            });

                            if (!startResponse.data.success || !startResponse.data.jobId) {
                              throw new Error('Failed to start swap processing');
                            }

                            const swapResult = await pollJobStatus(startResponse.data.jobId);

                            console.log('[Terminal] Auto-swap result:', swapResult);

                            if (swapResult.success) {
                              // Check if the result contains an action (transaction to sign)
                              const hasAction = swapResult.functionResult?.action;
                              
                              const swapResponseMessage: Message = {
                                id: (Date.now() + 2).toString(),
                                role: 'assistant',
                                content: hasAction 
                                  ? swapResult.message 
                                  : swapResult.message || '✅ Swap completed successfully!',
                                timestamp: new Date(),
                                functionCalled: swapResult.functionCalled,
                                functionResult: swapResult.functionResult,
                                type: swapResult.type,
                                action: swapResult.functionResult?.action,
                              };
                              setMessages((prev) => [...prev, swapResponseMessage]);
                            } else {
                              // Log the full error for debugging
                              console.error('[Terminal] Auto-swap failed:', swapResult);
                              throw new Error(swapResult.error || swapResult.message || 'Swap failed');
                            }
                          } catch (error: any) {
                            const errorMessage: Message = {
                              id: (Date.now() + 2).toString(),
                              role: 'assistant',
                              content: `❌ Auto-swap failed: ${error.message}. Please try your swap command again manually.`,
                              timestamp: new Date(),
                            };
                            setMessages((prev) => [...prev, errorMessage]);
                          } finally {
                            setIsLoading(false);
                          }
                        }
                      }
                    }}
                  />
                )}

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
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI is thinking and executing blockchain operations...</span>
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">
                    This may take a few seconds for complex operations
                  </div>
                </div>
                <button
                  onClick={stopCurrentRequest}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20 hover:border-red-500/30"
                  title="Stop current request"
                >
                  <StopCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Stop</span>
                </button>
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
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-black rounded-lg transition-colors flex items-center gap-2"
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

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowHistory(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-secondary border-l border-default z-50 flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-default">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary-400" />
                  <h2 className="text-lg font-semibold text-neutral-50">Chat History</h2>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                  </div>
                ) : conversationHistory.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No conversation history yet</p>
                    <p className="text-sm mt-1">Start chatting to build your history</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversationHistory.map((conv) => (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group p-3 rounded-lg border transition-all cursor-pointer ${
                          currentConversationId === conv.id
                            ? 'bg-primary-500/10 border-primary-500/30'
                            : 'bg-app border-default hover:border-primary-500/20 hover:bg-neutral-900/50'
                        }`}
                        onClick={() => loadConversation(conv.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-neutral-50 truncate mb-1">
                              {conv.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(conv.updated_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{conv.message_count} messages</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => deleteConversation(conv.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-default">
                <button
                  onClick={startNewConversation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-black rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Conversation</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Terminal;
