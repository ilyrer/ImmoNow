import { useState, useEffect } from 'react';
import { billingService } from '../services/billing';

export interface TrialStatus {
  status: string;
  trial_end?: string;
  days_remaining?: number;
  is_expired?: boolean;
  show_payment_modal?: boolean;
}

export const useTrialStatus = () => {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkTrial = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await billingService.getTrialStatus();
      setTrialStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden des Trial-Status');
      console.error('Trial status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkTrial();
    
    // Check alle 5 Minuten
    const interval = setInterval(checkTrial, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    trialStatus,
    loading,
    error,
    refetch: checkTrial,
  };
};
