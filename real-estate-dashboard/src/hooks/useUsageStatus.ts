import { useState, useEffect } from 'react';
import apiClient from '../lib/api/client';

interface UsageData {
  users: {
    current: number;
    limit: number;
    percentage: number;
  };
  storage: {
    current_gb: number;
    limit_gb: number;
    percentage: number;
  };
  properties: {
    current: number;
    limit: number;
    percentage: number;
  };
}

interface UsageStatus {
  data: UsageData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  shouldShowBanner: boolean;
  bannerType: 'warning' | 'alert' | 'critical';
}

export const useUsageStatus = (): UsageStatus => {
  const [data, setData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get('/api/v1/billing/usage/summary');
      const responseData = response as any;

      // Calculate percentages
      const usersPercentage = responseData.users.limit > 0 ? (responseData.users.current / responseData.users.limit) * 100 : 0;
      const storagePercentage = responseData.storage.limit_gb > 0 ? (responseData.storage.current_gb / responseData.storage.limit_gb) * 100 : 0;
      const propertiesPercentage = responseData.properties.limit > 0 ? (responseData.properties.current / responseData.properties.limit) * 100 : 0;

      const usageData: UsageData = {
        users: {
          current: responseData.users.current,
          limit: responseData.users.limit,
          percentage: Math.round(usersPercentage)
        },
        storage: {
          current_gb: Math.round(responseData.storage.current_gb * 100) / 100,
          limit_gb: responseData.storage.limit_gb,
          percentage: Math.round(storagePercentage)
        },
        properties: {
          current: responseData.properties.current,
          limit: responseData.properties.limit,
          percentage: Math.round(propertiesPercentage)
        }
      };

      setData(usageData);
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Fehler beim Laden der Nutzungsdaten');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine if banner should be shown
  const shouldShowBanner = data ? (
    data.users.percentage >= 80 || 
    data.storage.percentage >= 80 || 
    data.properties.percentage >= 80
  ) : false;

  // Determine banner type
  const bannerType = data ? (() => {
    const maxPercentage = Math.max(
      data.users.percentage,
      data.storage.percentage,
      data.properties.percentage
    );

    if (maxPercentage >= 100) return 'critical' as const;
    if (maxPercentage >= 90) return 'alert' as const;
    return 'warning' as const;
  })() : 'warning';

  return {
    data,
    isLoading,
    error,
    refetch: fetchUsage,
    shouldShowBanner,
    bannerType
  };
};
