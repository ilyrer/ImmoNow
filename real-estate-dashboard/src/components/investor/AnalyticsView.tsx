/**
 * Analytics View - Investor Module
 * Vacancy trends and cost analysis with charts
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Home
} from 'lucide-react';
// TODO: Implement real investor analytics API hooks

const AnalyticsView: React.FC = () => {
  // TODO: Implement real investor analytics API hooks
  const trends: any[] = [];
  const trendsLoading = false;
  const analysis: any[] = [];
  const analysisLoading = false;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate metrics
  const currentVacancy = trends.length > 0 ? trends[trends.length - 1].rate : 0;
  const avgVacancy = trends.reduce((sum, t) => sum + t.rate, 0) / (trends.length || 1);
  const vacancyTrend = trends.length >= 2 
    ? trends[trends.length - 1].rate - trends[trends.length - 2].rate 
    : 0;

  const avgMaintenance = analysis.reduce((sum, a) => sum + a.maintenance, 0) / (analysis.length || 1);
  const totalRevenue = analysis.reduce((sum, a) => sum + a.revenue, 0);
  const totalCosts = analysis.reduce((sum, a) => sum + a.maintenance + a.utilities + a.management, 0);

  if (trendsLoading || analysisLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Analysen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aktuelle Leerstandsquote</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentVacancy.toFixed(1)}%
            </div>
            <p className={`text-sm mt-2 flex items-center ${
              vacancyTrend < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {vacancyTrend < 0 ? (
                <TrendingDown className="w-4 h-4 mr-1" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-1" />
              )}
              {Math.abs(vacancyTrend).toFixed(1)}% vs. Vormonat
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ø Leerstandsquote</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {avgVacancy.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Letztes Jahr
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ø Instandhaltung/Monat</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(avgMaintenance)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Letztes Jahr
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Kosten/Einnahmen-Ratio</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {((totalCosts / totalRevenue) * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              Effiziente Verwaltung
            </p>
          </div>
        </motion.div>
      </div>

      {/* Vacancy Trends Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
      >
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Leerstandsentwicklung
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Monatliche Leerstandsquote über die letzten 12 Monate
          </p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <defs>
                <linearGradient id="vacancyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                label={{ value: 'Quote (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff'
                }}
                labelStyle={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '8px' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="rate"
                name="Leerstandsquote"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 5 }}
                activeDot={{ r: 7 }}
                fill="url(#vacancyGradient)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Cost Analysis Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
      >
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Kosten vs. Einnahmen
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Monatliche Aufschlüsselung der Betriebskosten im Vergleich zu Einnahmen
          </p>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff'
                }}
                labelStyle={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '8px' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="revenue" 
                name="Einnahmen" 
                fill="#10b981" 
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="maintenance" 
                name="Instandhaltung" 
                fill="#ef4444" 
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="utilities" 
                name="Nebenkosten" 
                fill="#f59e0b" 
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="management" 
                name="Verwaltung" 
                fill="#8b5cf6" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Gesamteinnahmen (12 Monate)
          </h4>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalRevenue)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Gesamtkosten (12 Monate)
          </h4>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalCosts)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Netto-Ergebnis (12 Monate)
          </h4>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(totalRevenue - totalCosts)}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsView;
