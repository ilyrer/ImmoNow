/**
 * PerformanceChart Component
 * Performance visualization chart
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceData {
  label: string;
  value: number;
  previousValue?: number;
  color?: string;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  type?: 'bar' | 'line' | 'radial';
  showTrend?: boolean;
  className?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  type = 'bar',
  showTrend = true,
  className = '',
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus className="w-3 h-3 text-gray-400" />;
    
    if (current > previous) {
      return <TrendingUp className="w-3 h-3 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="w-3 h-3 text-red-500" />;
    } else {
      return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTrendColor = (current: number, previous?: number) => {
    if (!previous) return 'text-gray-500';
    
    if (current > previous) {
      return 'text-green-600 dark:text-green-400';
    } else if (current < previous) {
      return 'text-red-600 dark:text-red-400';
    } else {
      return 'text-gray-500';
    }
  };

  const getTrendPercentage = (current: number, previous?: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (type === 'bar') {
    return (
      <div className={`space-y-4 ${className}`}>
        {data.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                {showTrend && getTrendIcon(item.value, item.previousValue)}
                <span className={`text-sm font-semibold ${getTrendColor(item.value, item.previousValue)}`}>
                  {item.value.toLocaleString()}
                </span>
                {showTrend && item.previousValue && (
                  <span className={`text-xs ${getTrendColor(item.value, item.previousValue)}`}>
                    {getTrendPercentage(item.value, item.previousValue) > 0 ? '+' : ''}
                    {getTrendPercentage(item.value, item.previousValue).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-2 rounded-full ${
                  item.color || 'bg-gradient-to-r from-blue-500 to-purple-600'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'radial') {
    return (
      <div className={`grid grid-cols-2 gap-4 ${className}`}>
        {data.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200 dark:text-gray-700"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  className={`${item.color || 'text-blue-500'}`}
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 100' }}
                  animate={{ strokeDasharray: `${(item.value / maxValue) * 100} 100` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {Math.round((item.value / maxValue) * 100)}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </p>
              <p className={`text-sm font-semibold ${getTrendColor(item.value, item.previousValue)}`}>
                {item.value.toLocaleString()}
              </p>
              {showTrend && item.previousValue && (
                <div className="flex items-center justify-center gap-1">
                  {getTrendIcon(item.value, item.previousValue)}
                  <span className={`text-xs ${getTrendColor(item.value, item.previousValue)}`}>
                    {getTrendPercentage(item.value, item.previousValue) > 0 ? '+' : ''}
                    {getTrendPercentage(item.value, item.previousValue).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Line chart (simplified)
  return (
    <div className={`space-y-4 ${className}`}>
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${item.color || 'bg-blue-500'}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {item.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showTrend && getTrendIcon(item.value, item.previousValue)}
            <span className={`text-sm font-semibold ${getTrendColor(item.value, item.previousValue)}`}>
              {item.value.toLocaleString()}
            </span>
            {showTrend && item.previousValue && (
              <span className={`text-xs ${getTrendColor(item.value, item.previousValue)}`}>
                {getTrendPercentage(item.value, item.previousValue) > 0 ? '+' : ''}
                {getTrendPercentage(item.value, item.previousValue).toFixed(1)}%
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
