// Hook for tracking user activity and quest completion
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWallet } from './useWallet';
import { trackPageVisit, checkAllQuests } from '../services/activityTracker';

/**
 * Hook to automatically track page visits for quest validation
 * Call this in your main App component or layout
 */
export function useActivityTracker() {
  const location = useLocation();
  const { address } = useWallet();

  useEffect(() => {
    if (!address) return;

    console.log('[ActivityTracker] Tracking page visit:', location.pathname, 'for wallet:', address);
    // Track page visit
    trackPageVisit(address, location.pathname);
  }, [location.pathname, address]);

  // Check all quests when wallet connects
  useEffect(() => {
    if (!address) return;
    
    checkAllQuests(address);
  }, [address]);
}
