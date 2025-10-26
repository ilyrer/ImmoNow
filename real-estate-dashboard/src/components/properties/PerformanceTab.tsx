import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, MessageSquare, Users, Clock, BarChart3, RefreshCw } from 'lucide-react';
import { PropertyResponse, PropertyMetrics } from '../../types/property';
import { usePropertyMetrics } from '../../hooks/useProperties';

interface PerformanceTabProps {
  property: PropertyResponse;
  propertyId: string;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ 
  property, 
  propertyId
}) => {
  const { data: metrics, isLoading, error, refetch } = usePropertyMetrics(propertyId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <BarChart3 className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Fehler beim Laden der Daten
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Die Performance-Daten konnten nicht geladen werden.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  // Fallback zu Mock-Daten wenn keine echten Daten vorhanden
  const displayMetrics = metrics || {
    views: 0,
    inquiries: 0,
    visits: 0,
    favorites: 0,
    daysOnMarket: 0,
    averageViewDuration: 0,
    conversionRate: 0,
    chartData: []
  };

  const stats = [
    {
      label: 'Aufrufe',
      value: displayMetrics.views.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Anfragen',
      value: displayMetrics.inquiries,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Besichtigungen',
      value: displayMetrics.visits,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: 'Favoriten',
      value: displayMetrics.favorites,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      label: 'Tage am Markt',
      value: displayMetrics.daysOnMarket,
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    },
    {
      label: 'Conversion Rate',
      value: `${displayMetrics.conversionRate}%`,
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
  ];

  // Berechne Conversion-Rate dynamisch
  const calculatedConversionRate = displayMetrics.views > 0 
    ? ((displayMetrics.inquiries / displayMetrics.views) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance-Analytics
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Live-Daten zur Performance dieser Immobilie
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Daten aktualisieren"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Live-Daten</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700 rounded-2xl p-4 shadow-xl shadow-blue-500/10 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700 rounded-2xl p-6 shadow-xl shadow-blue-500/10"
        >
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Aufrufe (letzte 30 Tage)
          </h4>
          
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                {displayMetrics.chartData && displayMetrics.chartData.length > 0 
                  ? 'Chart-Daten verfügbar' 
                  : 'Keine Chart-Daten verfügbar'
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Conversion Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700 rounded-2xl p-6 shadow-xl shadow-blue-500/10"
        >
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Conversion-Funnel
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Aufrufe</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {displayMetrics.views.toLocaleString()}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Anfragen</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {displayMetrics.inquiries}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${displayMetrics.views > 0 ? (displayMetrics.inquiries / displayMetrics.views) * 100 : 0}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Besichtigungen</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {displayMetrics.visits}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${displayMetrics.views > 0 ? (displayMetrics.visits / displayMetrics.views) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="backdrop-blur-xl bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/40 dark:border-blue-800/40 rounded-2xl p-6 shadow-xl shadow-blue-500/10"
      >
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Performance-Insights
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                Conversion-Rate
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aktuelle Conversion-Rate: {calculatedConversionRate}% 
                ({displayMetrics.inquiries} Anfragen von {displayMetrics.views} Aufrufen)
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                Marktzeit
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {displayMetrics.daysOnMarket} Tage am Markt
                {displayMetrics.daysOnMarket > 30 && ' - Erwägen Sie eine Preisanpassung'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PerformanceTab;