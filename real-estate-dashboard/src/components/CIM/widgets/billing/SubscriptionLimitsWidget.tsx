import React, { useState, useEffect } from 'react';
import { CreditCard, Users, Home, HardDrive, ArrowUpRight, CheckCircle, AlertTriangle } from 'lucide-react';

interface SubscriptionData {
  planName: string;
  planKey: string;
  limits: {
    users: number;
    properties: number;
    storageGB: number;
  };
  usage: {
    users: number;
    properties: number;
    storageGB: number;
  };
  usagePercentages: {
    users: number;
    properties: number;
    storage: number;
  };
}

const SubscriptionLimitsWidget: React.FC = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch billing usage summary
        const response = await fetch('/api/v1/billing/usage/summary');
        const data = await response.json();

        console.log('📊 Subscription Data Response:', data);

        // Berechne Usage-Percentages
        const usagePercentages = {
          users: data.users.limit > 0 ? (data.users.used / data.users.limit) * 100 : 0,
          properties: data.properties.limit > 0 ? (data.properties.used / data.properties.limit) * 100 : 0,
          storage: data.storage.limit_gb > 0 ? (data.storage.used_gb / data.storage.limit_gb) * 100 : 0
        };

        setSubscriptionData({
          planName: data.plan_name || 'Starter',
          planKey: data.plan_key || 'starter',
          limits: {
            users: data.users.limit || 0,
            properties: data.properties.limit || 0,
            storageGB: data.storage.limit_gb || 0
          },
          usage: {
            users: data.users.used || 0,
            properties: data.properties.used || 0,
            storageGB: data.storage.used_gb || 0
          },
          usagePercentages
        });

      } catch (error) {
        console.error('❌ Error fetching subscription data:', error);
        // Fallback data
        setSubscriptionData({
          planName: 'Starter',
          planKey: 'starter',
          limits: {
            users: 5,
            properties: 50,
            storageGB: 10
          },
          usage: {
            users: 3,
            properties: 12,
            storageGB: 2.5
          },
          usagePercentages: {
            users: 60,
            properties: 24,
            storage: 25
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchSubscriptionData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt Abo-Daten...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Fehler beim Laden der Abo-Daten</p>
        </div>
      </div>
    );
  }

  // Bestimme Status-Farbe und Icon
  const getStatusInfo = (percentage: number) => {
    if (percentage < 70) {
      return { color: 'text-green-600 dark:text-green-400', icon: <CheckCircle className="w-4 h-4 text-green-600" /> };
    }
    if (percentage < 90) {
      return { color: 'text-yellow-600 dark:text-yellow-400', icon: <AlertTriangle className="w-4 h-4 text-yellow-600" /> };
    }
    return { color: 'text-red-600 dark:text-red-400', icon: <AlertTriangle className="w-4 h-4 text-red-600" /> };
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const limitItems = [
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Benutzer',
      used: subscriptionData.usage.users,
      limit: subscriptionData.limits.users,
      percentage: subscriptionData.usagePercentages.users,
      unit: 'Benutzer'
    },
    {
      icon: <Home className="w-5 h-5" />,
      label: 'Immobilien',
      used: subscriptionData.usage.properties,
      limit: subscriptionData.limits.properties,
      percentage: subscriptionData.usagePercentages.properties,
      unit: 'Properties'
    },
    {
      icon: <HardDrive className="w-5 h-5" />,
      label: 'Speicherplatz',
      used: subscriptionData.usage.storageGB,
      limit: subscriptionData.limits.storageGB,
      percentage: subscriptionData.usagePercentages.storage,
      unit: 'GB'
    }
  ];

  const needsUpgrade = Object.values(subscriptionData.usagePercentages).some(p => p > 80);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Abo-Limits
        </h3>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {subscriptionData.planName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {subscriptionData.planKey}
          </div>
        </div>
      </div>

      {/* Limits Übersicht */}
      <div className="space-y-4 mb-6">
        {limitItems.map((item, index) => {
          const statusInfo = getStatusInfo(item.percentage);
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-600 dark:text-gray-400">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {statusInfo.icon}
                  <span className={`text-sm font-semibold ${statusInfo.color}`}>
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{item.used} {item.unit}</span>
                <span>{item.limit} {item.unit}</span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(item.percentage)}`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Hinweis */}
      {needsUpgrade && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Upgrade empfohlen
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Einige Limits sind fast erreicht. Upgrade für mehr Kapazität.
              </p>
            </div>
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Status</span>
          <div className="flex items-center space-x-1">
            {needsUpgrade ? (
              <>
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-600 dark:text-yellow-400">Aufmerksamkeit erforderlich</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Alles in Ordnung</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLimitsWidget;
