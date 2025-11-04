/**
 * Suggestion Card Component
 * Displays individual AI suggestion with details
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Suggestion } from '../../types/suggestion';
import styles from './SuggestionCard.module.css';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply?: (suggestion: Suggestion) => void;
}

export function SuggestionCard({ suggestion, onApply }: SuggestionCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);

  const priorityColors = {
    low: styles.priorityLow,
    medium: styles.priorityMedium,
    high: styles.priorityHigh,
  };

  const typeIcons = {
    rebalance: '⚖️',
    add_asset: '➕',
    remove_asset: '➖',
    adjust_rule: '⚙️',
    risk_adjustment: '🛡️',
  };

  const handleApply = async () => {
    console.log('[SuggestionCard] Apply button clicked for suggestion:', suggestion.id);
    console.log('[SuggestionCard] Suggestion data:', {
      vaultId: suggestion.vaultId,
      title: suggestion.title,
      hasActionPrompt: !!suggestion.actionPrompt,
      actionPrompt: suggestion.actionPrompt,
    });
    
    setApplying(true);
    try {
      // If there's a custom onApply handler, use it
      if (onApply) {
        console.log('[SuggestionCard] Using custom onApply handler');
        await onApply(suggestion);
      } else {
        // Default behavior: Navigate to Vault Builder with suggestion context
        // Use location state to pass the suggestion data
        console.log('[SuggestionCard] Navigating to /app/builder with state');
        navigate('/app/builder', {
          state: {
            mode: 'chat',
            vaultId: suggestion.vaultId,
            actionPrompt: suggestion.actionPrompt || `Apply the following suggestion to the vault: ${suggestion.title}. ${suggestion.description}`,
            suggestionId: suggestion.id,
          }
        });
      }
    } catch (error) {
      console.error('[SuggestionCard] Error applying suggestion:', error);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={`${styles.card} ${priorityColors[suggestion.priority]}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <span className={styles.icon}>{typeIcons[suggestion.type]}</span>
          <h3 className={styles.title}>{suggestion.title}</h3>
        </div>
        <span className={`${styles.priority} ${priorityColors[suggestion.priority]}`}>
          {suggestion.priority.toUpperCase()}
        </span>
      </div>

      <p className={styles.description}>{suggestion.description}</p>

      {suggestion.expectedImpact && (
        (suggestion.expectedImpact.returnIncrease !== null && 
         suggestion.expectedImpact.returnIncrease !== undefined) ||
        (suggestion.expectedImpact.riskReduction !== null && 
         suggestion.expectedImpact.riskReduction !== undefined) ||
        (suggestion.expectedImpact.efficiencyGain !== null && 
         suggestion.expectedImpact.efficiencyGain !== undefined)
      ) && (
        <div className={styles.impact}>
          {(suggestion.expectedImpact.returnIncrease !== null && 
            suggestion.expectedImpact.returnIncrease !== undefined) && (
            <div className={styles.impactItem}>
              <span className={styles.impactIcon}>📈</span>
              <span>+{suggestion.expectedImpact.returnIncrease}% Return</span>
            </div>
          )}
          {(suggestion.expectedImpact.riskReduction !== null && 
            suggestion.expectedImpact.riskReduction !== undefined) && (
            <div className={styles.impactItem}>
              <span className={styles.impactIcon}>🛡️</span>
              <span>-{suggestion.expectedImpact.riskReduction}% Risk</span>
            </div>
          )}
          {(suggestion.expectedImpact.efficiencyGain !== null && 
            suggestion.expectedImpact.efficiencyGain !== undefined) && (
            <div className={styles.impactItem}>
              <span className={styles.impactIcon}>⚡</span>
              <span>+{suggestion.expectedImpact.efficiencyGain}% Efficiency</span>
            </div>
          )}
        </div>
      )}

      <button
        className={styles.expandButton}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Show Less' : 'Show Details'}
        <span className={expanded ? styles.arrowUp : styles.arrowDown}>▼</span>
      </button>

      {expanded && (
        <div className={styles.details}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Rationale</h4>
            <p className={styles.sectionContent}>{suggestion.rationale}</p>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Implementation Steps</h4>
            <ol className={styles.stepsList}>
              {suggestion.implementation.steps.map((step, index) => (
                <li key={index} className={styles.step}>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Difficulty:</span>
              <span className={styles.metaValue}>
                {suggestion.implementation.difficulty}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Est. Time:</span>
              <span className={styles.metaValue}>
                {suggestion.implementation.estimatedTime}
              </span>
            </div>
          </div>

          <button
            className={styles.applyButton}
            onClick={handleApply}
            disabled={applying}
          >
            {applying ? 'Applying...' : 'Apply Suggestion'}
          </button>
        </div>
      )}
    </div>
  );
}
