import React, { useEffect, useState } from 'react';
import apiClient from '../../lib/api/client';

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

interface UsageWidgetProps {
  className?: string;
}

const UsageWidget: React.FC<UsageWidgetProps> = ({ className = '' }) => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get('/api/v1/billing/usage/summary');
        const data = response as any;

        // Calculate percentages
        const usersPercentage = data.users.limit > 0 ? (data.users.current / data.users.limit) * 100 : 0;
        const storagePercentage = data.storage.limit_gb > 0 ? (data.storage.current_gb / data.storage.limit_gb) * 100 : 0;
        const propertiesPercentage = data.properties.limit > 0 ? (data.properties.current / data.properties.limit) * 100 : 0;

        setUsage({
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
        });
      } catch (err) {
        console.error('Error fetching usage data:', err);
        setError('Fehler beim Laden der Nutzungsdaten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-100';
    if (percentage >= 90) return 'text-orange-600 bg-orange-100';
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <i className="ri-error-warning-line text-2xl mb-2"></i>
          <p>{error || 'Keine Nutzungsdaten verfügbar'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="ri-dashboard-line mr-2 text-blue-600"></i>
          Nutzung
        </h3>
        <button 
          onClick={() => window.location.href = '/dashboard/billing'}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Verwalten
        </button>
      </div>

      <div className="space-y-4">
        {/* Users */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Benutzer</span>
            <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(usage.users.percentage)}`}>
              {usage.users.current} / {usage.users.limit === -1 ? '∞' : usage.users.limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(usage.users.percentage)}`}
              style={{ width: `${Math.min(usage.users.percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Storage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Speicher</span>
            <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(usage.storage.percentage)}`}>
              {usage.storage.current_gb} / {usage.storage.limit_gb === -1 ? '∞' : usage.storage.limit_gb} GB
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(usage.storage.percentage)}`}
              style={{ width: `${Math.min(usage.storage.percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Properties */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Immobilien</span>
            <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(usage.properties.percentage)}`}>
              {usage.properties.current} / {usage.properties.limit === -1 ? '∞' : usage.properties.limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(usage.properties.percentage)}`}
              style={{ width: `${Math.min(usage.properties.percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Warning message if approaching limits */}
      {(usage.users.percentage >= 80 || usage.storage.percentage >= 80 || usage.properties.percentage >= 80) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <i className="ri-warning-line text-yellow-600 mr-2"></i>
            <span className="text-sm text-yellow-800">
              {usage.users.percentage >= 80 || usage.storage.percentage >= 80 || usage.properties.percentage >= 80
                ? 'Sie nähern sich Ihren Nutzungslimits. '
                : ''}
              <button 
                onClick={() => window.location.href = '/dashboard/billing'}
                className="font-medium underline hover:no-underline"
              >
                Plan upgraden
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Last updated */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>Live-Daten</span>
          </div>
          <span>Aktualisiert: {new Date().toLocaleTimeString('de-DE')}</span>
        </div>
      </div>
    </div>
  );
};

export default UsageWidget;
