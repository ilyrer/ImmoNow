import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  ArrowRight,
  Eye,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Zap,
  Activity
} from 'lucide-react';

interface SalesData {
  month: string;
  revenue: number;
  commission: number;
  target: number;
  forecast: number;
  deals: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
  avgDealSize: number;
}

interface CommissionTarget {
  agent: string;
  target: number;
  achieved: number;
  percentage: number;
  commission: number;
}

const SalesModule: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedView, setSelectedView] = useState<'overview' | 'forecast' | 'pipeline'>('overview');

  // TODO: Implement real sales data API
  const salesData: SalesData[] = [];
  const pipelineStages: PipelineStage[] = [];
  const commissionTargets: CommissionTarget[] = [];

  // Calculate totals
  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCommission = salesData.reduce((sum, item) => sum + item.commission, 0);
  const totalTarget = salesData.reduce((sum, item) => sum + item.target, 0);
  const totalDeals = salesData.reduce((sum, item) => sum + item.deals, 0);

  const revenueGrowth = salesData.length > 1 
    ? ((salesData[salesData.length - 1]?.revenue || 0) - (salesData[salesData.length - 2]?.revenue || 0)) / (salesData[salesData.length - 2]?.revenue || 1) * 100
    : 0;

  const targetAchievement = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Umsatz, Provisionen und Pipeline-Übersicht</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Aktualisieren</span>
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Zeitraum:</span>
        {(['month', 'quarter', 'year'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {period === 'month' ? 'Monat' : period === 'quarter' ? 'Quartal' : 'Jahr'}
          </button>
        ))}
      </div>

      {/* View Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ansicht:</span>
        {(['overview', 'forecast', 'pipeline'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedView === view
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {view === 'overview' ? 'Übersicht' : view === 'forecast' ? 'Prognose' : 'Pipeline'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamtumsatz</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRevenue.toLocaleString('de-DE')}€
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {revenueGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(revenueGrowth).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs. Vormonat</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Provisionen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalCommission.toLocaleString('de-DE')}€
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (totalCommission / (totalTarget * 0.07)) * 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {((totalCommission / (totalTarget * 0.07)) * 100).toFixed(1)}% des Ziels
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Zielerreichung</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {targetAchievement.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, targetAchievement)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalTarget.toLocaleString('de-DE')}€ Ziel
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Abschlüsse</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalDeals}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {salesData.length > 0 ? (totalDeals / salesData.length).toFixed(1) : 0} pro Monat
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {selectedView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Umsatzentwicklung</h3>
            {salesData.length > 0 ? (
              <div className="h-64 flex items-center justify-center">
                <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                <p className="ml-4 text-gray-500 dark:text-gray-400">Chart wird geladen...</p>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Keine Verkaufsdaten verfügbar</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Verkaufsdaten werden über die API geladen
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {selectedView === 'forecast' && (
          <motion.div
            key="forecast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prognose</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Prognose-Feature wird implementiert</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Basierend auf historischen Daten und aktuellen Trends
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {selectedView === 'pipeline' && (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Pipeline</h3>
            {pipelineStages.length > 0 ? (
              <div className="space-y-4">
                {pipelineStages.map((stage, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{stage.stage}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {stage.count} Deals • {stage.value.toLocaleString('de-DE')}€
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {stage.conversionRate}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Konversion
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Keine Pipeline-Daten verfügbar</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Pipeline-Daten werden über die API geladen
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesModule;
