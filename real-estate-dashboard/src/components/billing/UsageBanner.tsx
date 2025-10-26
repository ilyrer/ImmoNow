import React, { useEffect, useState } from 'react';
import apiClient from '../../lib/api/client';

interface UsageBannerProps {
  onClose?: () => void;
}

interface UsageData {
  users: { current: number; limit: number; percentage: number };
  storage: { current_gb: number; limit_gb: number; percentage: number };
  properties: { current: number; limit: number; percentage: number };
}

const UsageBanner: React.FC<UsageBannerProps> = ({ onClose }) => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/api/v1/billing/usage/summary');
        const data = response as any;

        // Calculate percentages
        const usersPercentage = data.users.limit > 0 ? (data.users.current / data.users.limit) * 100 : 0;
        const storagePercentage = data.storage.limit_gb > 0 ? (data.storage.current_gb / data.storage.limit_gb) * 100 : 0;
        const propertiesPercentage = data.properties.limit > 0 ? (data.properties.current / data.properties.limit) * 100 : 0;

        const usageData = {
          users: {
            current: data.users.current,
            limit: data.users.limit,
            percentage: Math.round(usersPercentage)
          },
          storage: {
            current_gb: Math.round(data.storage.current_gb * 100) / 100,
            limit_gb: data.storage.limit_gb,
            percentage: Math.round(storagePercentage)
          },
          properties: {
            current: data.properties.current,
            limit: data.properties.limit,
            percentage: Math.round(propertiesPercentage)
          }
        };

        setUsage(usageData);

        // Show banner if any usage is above 80%
        const shouldShow = usageData.users.percentage >= 80 || 
                         usageData.storage.percentage >= 80 || 
                         usageData.properties.percentage >= 80;
        
        setIsVisible(shouldShow);
      } catch (err) {
        console.error('Error fetching usage data:', err);
        setIsVisible(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getBannerType = () => {
    if (!usage) return 'warning';
    
    const maxPercentage = Math.max(
      usage.users.percentage,
      usage.storage.percentage,
      usage.properties.percentage
    );

    if (maxPercentage >= 100) return 'critical';
    if (maxPercentage >= 90) return 'alert';
    return 'warning';
  };

  const getBannerConfig = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          icon: 'ri-error-warning-line',
          title: 'Kritische Nutzungslimits erreicht!',
          message: 'Sie haben Ihre Nutzungslimits erreicht. Einige Funktionen sind möglicherweise eingeschränkt.'
        };
      case 'alert':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          icon: 'ri-alert-line',
          title: 'Nutzungslimits fast erreicht',
          message: 'Sie nähern sich Ihren Nutzungslimits. Plan upgraden empfohlen.'
        };
      default:
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: 'ri-warning-line',
          title: 'Nutzungslimits erreichen',
          message: 'Sie nähern sich Ihren Nutzungslimits. Plan upgraden empfohlen.'
        };
    }
  };

  if (isLoading || !isVisible || !usage) {
    return null;
  }

  const bannerType = getBannerType();
  const config = getBannerConfig(bannerType);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${config.bgColor} ${config.borderColor} border-b shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            <i className={`${config.icon} ${config.iconColor} text-xl mr-3`}></i>
            <div>
              <h3 className={`text-sm font-semibold ${config.textColor}`}>
                {config.title}
              </h3>
              <p className={`text-sm ${config.textColor} opacity-90`}>
                {config.message}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Usage indicators */}
            <div className="hidden sm:flex items-center space-x-3 text-xs">
              {usage.users.percentage >= 80 && (
                <span className={`px-2 py-1 rounded-full ${config.textColor} bg-white bg-opacity-50`}>
                  Benutzer: {usage.users.current}/{usage.users.limit === -1 ? '∞' : usage.users.limit}
                </span>
              )}
              {usage.storage.percentage >= 80 && (
                <span className={`px-2 py-1 rounded-full ${config.textColor} bg-white bg-opacity-50`}>
                  Speicher: {usage.storage.current_gb}/{usage.storage.limit_gb === -1 ? '∞' : usage.storage.limit_gb}GB
                </span>
              )}
              {usage.properties.percentage >= 80 && (
                <span className={`px-2 py-1 rounded-full ${config.textColor} bg-white bg-opacity-50`}>
                  Immobilien: {usage.properties.current}/{usage.properties.limit === -1 ? '∞' : usage.properties.limit}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.location.href = '/dashboard/billing'}
                className={`px-4 py-2 text-sm font-medium rounded-md ${config.textColor} bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors`}
              >
                Plan upgraden
              </button>
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose?.();
                }}
                className={`p-2 ${config.textColor} hover:bg-white hover:bg-opacity-20 rounded-md transition-colors`}
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageBanner;
