import { useState, useEffect } from 'react';
import { billingService, BillingInfo } from '../services/billing';
import { useAuth } from '../contexts/AuthContext';

export const useBilling = () => {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await billingService.getBillingInfo();
      setBillingInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Billing-Informationen');
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (plan: string) => {
    try {
      await billingService.upgradePlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Plan-Upgrade');
      throw err;
    }
  };

  const openCustomerPortal = async () => {
    try {
      await billingService.openCustomerPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Öffnen des Customer Portals');
      throw err;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBillingInfo();
    }
  }, [isAuthenticated]);

  return {
    billingInfo,
    loading,
    error,
    fetchBillingInfo,
    upgradePlan,
    openCustomerPortal,
  };
};
