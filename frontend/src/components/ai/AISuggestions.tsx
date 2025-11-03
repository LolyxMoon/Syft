/**
 * AI Suggestions Component (T117)
 * Displays AI-generated strategy improvement suggestions
 */

import { useState, useEffect } from 'react';
import { Suggestion } from '../../types/suggestion';
import { SuggestionCard } from './SuggestionCard';
import styles from './AISuggestions.module.css';

interface AISuggestionsProps {
  vaultId: string;
  onApplySuggestion?: (suggestion: Suggestion) => void;
}

export function AISuggestions({ vaultId, onApplySuggestion }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch existing suggestions on mount
  useEffect(() => {
    fetchSuggestions();
  }, [vaultId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vaults/${vaultId}/suggestions`);
      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions || []);
      } else {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to poll for job status
  const pollJobStatus = async (jobId: string): Promise<any> => {
    const maxAttempts = 120; // Poll for up to 60 seconds
    const pollInterval = 1000; // Poll every 1 second
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      try {
        const statusResponse = await fetch(
          `/api/vaults/${vaultId}/suggestions/status/${jobId}`
        );
        
        if (!statusResponse.ok) {
          throw new Error('Failed to check job status');
        }
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          return statusData.data;
        }
        
        if (statusData.status === 'failed') {
          throw new Error(statusData.error || 'Job failed');
        }
        
        // Still processing, continue polling
        console.log(`Job ${jobId} still processing... (attempt ${attempt + 1}/${maxAttempts})`);
      } catch (error) {
        console.error('Error polling job status:', error);
        throw error;
      }
    }
    
    throw new Error('Job timed out - took longer than expected');
  };

  const generateNewSuggestions = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/vaults/${vaultId}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forceRefresh: true,
        }),
      });

      const data = await response.json();

      if (data.success && data.jobId) {
        // Show cached suggestions immediately if available
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
        
        // Poll for job completion
        console.log(`Polling for job: ${data.jobId}`);
        const result = await pollJobStatus(data.jobId);
        
        // Update with fresh suggestions
        setSuggestions(result.suggestions || []);
        console.log(`Received ${result.suggestions?.length || 0} fresh suggestions`);
      } else {
        throw new Error(data.error || 'Failed to generate suggestions');
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>AI Strategy Suggestions</h2>
          <p className={styles.subtitle}>
            Data-driven recommendations to optimize your vault's performance
          </p>
        </div>
        <button
          className={styles.generateButton}
          onClick={generateNewSuggestions}
          disabled={generating}
        >
          {generating ? (
            <>
              <div className={styles.buttonSpinner} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span className={styles.icon}>✨</span>
              <span>Get New Suggestions</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {suggestions.length === 0 && !error && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💡</div>
          <h3>No Suggestions Yet</h3>
          <p>Generate AI-powered suggestions to optimize your vault strategy</p>
          <button
            className={styles.generateButtonLarge}
            onClick={generateNewSuggestions}
            disabled={generating}
          >
            Generate Suggestions
          </button>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className={styles.suggestionsGrid}>
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={onApplySuggestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
