/**
 * Contract Explainer Component
 * Provides AI-powered explanations of vault contracts in plain English
 * Redesigned to match Syft's design system
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface ContractExplainerProps {
  vaultConfig?: any;
  vaultId?: string;
  contractCode?: string;
}

export function ContractExplainer({ vaultConfig, vaultId, contractCode }: ContractExplainerProps) {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleExplain = async () => {
    if (!vaultConfig && !contractCode && !vaultId) {
      setError('No contract or vault configuration provided');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const backendUrl = import.meta.env.VITE_VITE_PUBLIC_BACKEND_URL || 'https://syft-f6ad696f49ee.herokuapp.com';
      const response = await fetch(`${backendUrl}/api/nl/explain-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultConfig, vaultId, contractCode }),
      });

      const result = await response.json();

      if (result.success) {
        setExplanation(result.data.explanation);
      } else {
        throw new Error(result.message || 'Failed to explain contract');
      }
    } catch (err) {
      console.error('Error explaining contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to explain contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-default rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary-500/20 border border-primary-500/30 rounded-lg">
          <FileText className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-neutral-50">Contract Explainer</h3>
          <p className="text-xs text-neutral-400">AI-powered plain English explanations</p>
        </div>
      </div>

      {!explanation && !loading && (
        <motion.button
          onClick={handleExplain}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-md font-semibold transition-all disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Sparkles className="w-4 h-4" />
          <span>Explain This Contract</span>
        </motion.button>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-3" />
            <p className="text-sm text-neutral-400">Analyzing contract...</p>
          </motion.div>
        )}

        {explanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-neutral-900 border border-default rounded-lg">
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {explanation}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setExplanation('')}
              className="text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              Clear explanation
            </button>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-4 bg-error-500/10 border border-error-500/30 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-error-400" />
            <p className="text-sm text-error-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
