import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';

interface StorageData {
  totalBytes: number;
  totalGB: number;
  limitGB: number;
  usagePercentage: number;
  breakdown: {
    documents: number;
    propertyImages: number;
    propertyDocuments: number;
    other: number;
  };
}

const StorageUsageWidget: React.FC = () => {
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStorageData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch storage usage data
        const [usageResponse, billingResponse] = await Promise.all([
          fetch('/api/v1/storage/usage'),
          fetch('/api/v1/billing/usage/summary')
        ]);

        const usageData = await usageResponse.json();
        const billingData = await billingResponse.json();

        console.log('📊 Storage Usage Response:', usageData);
        console.log('📊 Billing Response:', billingData);

        // Berechne Storage-Daten
        const totalBytes = usageData.total_bytes || 0;
        const totalGB = totalBytes / (1024 ** 3);
        const limitGB = billingData.storage_limit_gb || 100; // Fallback
        const usagePercentage = limitGB > 0 ? (totalGB / limitGB) * 100 : 0;

        const breakdown = {
          documents: usageData.documents_bytes || 0,
          propertyImages: usageData.property_images_bytes || 0,
          propertyDocuments: usageData.property_documents_bytes || 0,
          other: totalBytes - (usageData.documents_bytes || 0) - (usageData.property_images_bytes || 0) - (usageData.property_documents_bytes || 0)
        };

        setStorageData({
          totalBytes,
          totalGB,
          limitGB,
          usagePercentage,
          breakdown
        });

      } catch (error) {
        console.error('❌ Error fetching storage data:', error);
        // Fallback data
        setStorageData({
          totalBytes: 0,
          totalGB: 0,
          limitGB: 100,
          usagePercentage: 0,
          breakdown: {
            documents: 0,
            propertyImages: 0,
            propertyDocuments: 0,
            other: 0
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStorageData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchStorageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt Speicher-Daten...</p>
        </div>
      </div>
    );
  }

  if (!storageData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Fehler beim Laden der Speicher-Daten</p>
        </div>
      </div>
    );
  }

  // Bestimme Status-Farbe
  const getStatusColor = (percentage: number) => {
    if (percentage < 70) return 'text-green-600 dark:text-green-400';
    if (percentage < 90) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage < 70) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (percentage < 90) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  // Pie Chart Daten
  const pieData = [
    { name: 'Dokumente', value: storageData.breakdown.documents, color: '#3b82f6' },
    { name: 'Property Bilder', value: storageData.breakdown.propertyImages, color: '#10b981' },
    { name: 'Property Docs', value: storageData.breakdown.propertyDocuments, color: '#f59e0b' },
    { name: 'Sonstiges', value: storageData.breakdown.other, color: '#6b7280' }
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <HardDrive className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Speicherplatz
        </h3>
        <div className="flex items-center space-x-2">
          {getStatusIcon(storageData.usagePercentage)}
          <span className={`text-sm font-semibold ${getStatusColor(storageData.usagePercentage)}`}>
            {storageData.usagePercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Hauptanzeige */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {storageData.totalGB.toFixed(1)} GB
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          von {storageData.limitGB} GB verwendet
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mt-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              storageData.usagePercentage < 70
                ? 'bg-green-500'
                : storageData.usagePercentage < 90
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(storageData.usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Pie Chart */}
      <div className="h-32 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${(value / (1024 ** 3)).toFixed(2)} GB`, '']}
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {pieData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
            </div>
            <span className="text-gray-900 dark:text-white font-medium">
              {(item.value / (1024 ** 3)).toFixed(1)} GB
            </span>
          </div>
        ))}
      </div>

      {/* Warning bei hoher Auslastung */}
      {storageData.usagePercentage > 80 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              {storageData.usagePercentage > 90 
                ? 'Speicherplatz fast voll! Upgrade empfohlen.'
                : 'Speicherplatz-Auslastung hoch.'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageUsageWidget;
