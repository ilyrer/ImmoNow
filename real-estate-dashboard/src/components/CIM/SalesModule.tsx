import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  Calendar,
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  PieChart,
  Activity,
  Filter,
  Sparkles,
  Star,
  ChevronLeft,
  Home
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

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

  // Mock data - in real app this would come from API
  const salesData: SalesData[] = [
    { month: 'Jan', revenue: 1250000, commission: 87500, target: 1200000, forecast: 1280000, deals: 15 },
    { month: 'Feb', revenue: 1340000, commission: 93800, target: 1200000, forecast: 1380000, deals: 18 },
    { month: 'Mär', revenue: 1180000, commission: 82600, target: 1200000, forecast: 1220000, deals: 14 },
    { month: 'Apr', revenue: 1420000, commission: 99400, target: 1200000, forecast: 1450000, deals: 21 },
    { month: 'Mai', revenue: 1560000, commission: 109200, target: 1200000, forecast: 1600000, deals: 23 },
    { month: 'Jun', revenue: 1380000, commission: 96600, target: 1200000, forecast: 1420000, deals: 19 },
  ];

  const pipelineStages: PipelineStage[] = [
    { stage: 'Interessenten', count: 125, value: 15750000, conversionRate: 25, avgDealSize: 126000 },
    { stage: 'Qualifizierte Leads', count: 68, value: 8840000, conversionRate: 45, avgDealSize: 130000 },
    { stage: 'Besichtigungen', count: 42, value: 5670000, conversionRate: 62, avgDealSize: 135000 },
    { stage: 'Verhandlungen', count: 23, value: 3220000, conversionRate: 78, avgDealSize: 140000 },
    { stage: 'Vertragsabschluss', count: 15, value: 2175000, conversionRate: 92, avgDealSize: 145000 },
  ];

  const commissionTargets: CommissionTarget[] = [
    { agent: 'M. Schmidt', target: 120000, achieved: 134500, percentage: 112, commission: 9415 },
    { agent: 'A. Müller', target: 100000, achieved: 95800, percentage: 96, commission: 6706 },
    { agent: 'S. Weber', target: 110000, achieved: 127300, percentage: 116, commission: 8911 },
    { agent: 'T. Fischer', target: 90000, achieved: 102400, percentage: 114, commission: 7168 },
    { agent: 'L. Wagner', target: 105000, achieved: 89200, percentage: 85, commission: 6244 },
  ];

  const COLORS = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    purple: '#8B5CF6',
    teal: '#0D9488'
  };

  const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.teal];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (current: number, target: number) => {
    if (current > target * 1.05) return <ArrowUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    if (current < target * 0.95) return <ArrowDown className="w-4 h-4 text-red-500 dark:text-red-400" />;
    return <Minus className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
  };

  const currentMonth = salesData[salesData.length - 1];
  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCommission = salesData.reduce((sum, item) => sum + item.commission, 0);
  const totalTarget = salesData.reduce((sum, item) => sum + item.target, 0);
  const targetAchievement = (totalRevenue / totalTarget) * 100;

  return (
    <div className="space-y-6">
      {/* Zurück Navigation */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => navigate('/cim')}
          className="flex items-center px-4 py-2.5 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/40 transition-all duration-300 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Zurück zum CIM Dashboard
        </button>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Home className="w-4 h-4" />
          <span>CIM Analytics</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-200 font-medium">Umsatz & Provisionen</span>
        </div>
      </div>

      {/* Glasmorphism Header */}
      <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-glass">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-gray-100 dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
                  Umsatz & Provisionen
                </h2>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  Zielerreichung, Forecast und Pipeline-Tracking
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Glasmorphism View Toggle */}
            <div className="flex bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl p-1.5 shadow-glass-sm">
              <button
                onClick={() => setSelectedView('overview')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedView === 'overview'
                    ? 'bg-white/60 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 shadow-glass-sm border border-white/30 dark:border-gray-600/40'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/30 dark:hover:bg-gray-700/30'
                }`}
              >
                Übersicht
              </button>
              <button
                onClick={() => setSelectedView('forecast')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedView === 'forecast'
                    ? 'bg-white/60 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 shadow-glass-sm border border-white/30 dark:border-gray-600/40'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/30 dark:hover:bg-gray-700/30'
                }`}
              >
                Forecast
              </button>
              <button
                onClick={() => setSelectedView('pipeline')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedView === 'pipeline'
                    ? 'bg-white/60 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 shadow-glass-sm border border-white/30 dark:border-gray-600/40'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/30 dark:hover:bg-gray-700/30'
                }`}
              >
                Pipeline
              </button>
            </div>

            {/* Glasmorphism Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-3 bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 shadow-glass-sm hover:bg-white/30 dark:hover:bg-gray-700/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="month">Monatlich</option>
              <option value="quarter">Quartalsweise</option>
              <option value="year">Jährlich</option>
            </select>
          </div>
        </div>
      </div>

      {/* Glasmorphism Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Gesamt-Umsatz</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                {formatCurrency(totalRevenue)}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {getTrendIcon(totalRevenue, totalTarget)}
                <span className={`text-sm font-medium ${
                  totalRevenue > totalTarget 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : totalRevenue < totalTarget * 0.95 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {formatPercentage(targetAchievement)}
                </span>
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Provisionen</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">
                {formatCurrency(totalCommission)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                {formatPercentage((totalCommission / totalRevenue) * 100)} vom Umsatz
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Pipeline-Wert</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent">
                {formatCurrency(pipelineStages.reduce((sum, stage) => sum + stage.value, 0))}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                {pipelineStages.reduce((sum, stage) => sum + stage.count, 0)} Opportunities
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Conversion Rate</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-amber-800 dark:from-white dark:to-amber-200 bg-clip-text text-transparent">
                {formatPercentage(
                  (pipelineStages[pipelineStages.length - 1].count / pipelineStages[0].count) * 100
                )}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Interesse → Abschluss
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Glasmorphism Revenue vs Target Chart */}
          <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-purple-400/10 to-blue-600/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-glass">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                    Umsatz vs. Ziel
                  </h3>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-glass-sm"></div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Umsatz</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-glass-sm"></div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Ziel</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill={COLORS.primary} name="Umsatz" />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke={COLORS.danger} 
                      strokeWidth={3}
                      name="Ziel"
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Glasmorphism Commission Targets */}
          <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/20 via-blue-400/10 to-emerald-600/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-glass">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">
                  Provisionsziele
                </h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {commissionTargets.map((target, index) => (
                <div key={index} className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl p-4 shadow-glass-sm hover:shadow-glass hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glass">
                        <span className="text-white font-bold text-sm">{target.agent.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{target.agent}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          {formatCurrency(target.achieved)} / {formatCurrency(target.target)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        target.percentage >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 
                        target.percentage >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatPercentage(target.percentage)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {formatCurrency(target.commission)} Provision
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3 w-full bg-white/10 dark:bg-gray-800/20 rounded-full h-2 shadow-glass-sm">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        target.percentage >= 100 
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                          : target.percentage >= 80 
                          ? 'bg-gradient-to-r from-amber-400 to-amber-600' 
                          : 'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                      style={{ width: `${Math.min(target.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'forecast' && (
        <div className="space-y-6">
          {/* Glasmorphism Forecast Chart */}
          <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/20 via-blue-400/10 to-purple-600/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glass">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent">
                  Umsatz-Forecast
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={COLORS.primary} 
                      fill="url(#revenueGradient)"
                      name="Tatsächlicher Umsatz"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke={COLORS.secondary} 
                      fill="url(#forecastGradient)"
                      name="Forecast"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Glasmorphism Forecast Accuracy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-glass">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">
                  Forecast-Genauigkeit
                </h4>
              </div>
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">94.2%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Durchschnittliche Abweichung: 5.8%</p>
            </div>

            <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-glass">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                  Nächster Monat
                </h4>
              </div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {formatCurrency(1650000)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Erwarteter Umsatz</p>
            </div>

            <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glass">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent">
                  Quartalsziel
                </h4>
              </div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">87%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Wahrscheinlichkeit der Zielerreichung</p>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'pipeline' && (
        <div className="space-y-6">
          {/* Glasmorphism Pipeline Funnel */}
          <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 via-blue-400/10 to-emerald-600/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-glass">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent">
                  Sales Pipeline
                </h3>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {pipelineStages.map((stage, index) => {
                const maxValue = pipelineStages[0].value;
                const widthPercentage = (stage.value / maxValue) * 100;
                
                return (
                  <div key={index} className="bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl p-4 shadow-glass-sm hover:shadow-glass hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-glass`}
                             style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{stage.stage}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {stage.count} Opportunities • Ø {formatCurrency(stage.avgDealSize)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(stage.value)}
                        </div>
                        <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatPercentage(stage.conversionRate)} Conversion
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-white/10 dark:bg-gray-800/20 rounded-full h-3 mb-2 shadow-glass-sm">
                      <div 
                        className="h-3 rounded-full transition-all duration-500 shadow-glass-sm"
                        style={{ 
                          width: `${widthPercentage}%`,
                          background: `linear-gradient(90deg, ${PIE_COLORS[index % PIE_COLORS.length]}, ${PIE_COLORS[index % PIE_COLORS.length]}cc)`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Glasmorphism Pipeline Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/20 via-orange-400/10 to-amber-600/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-glass">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-amber-800 dark:from-white dark:to-amber-200 bg-clip-text text-transparent">
                    Conversion Rates
                  </h4>
                </div>
              </div>
              
              <div className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineStages}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="stage" 
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [formatPercentage(value), 'Conversion Rate']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: 'white',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="conversionRate" fill={COLORS.accent} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-teal-500/20 via-cyan-400/10 to-teal-600/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-glass">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-teal-800 dark:from-white dark:to-teal-200 bg-clip-text text-transparent">
                    Pipeline Velocity
                  </h4>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl p-4 shadow-glass-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Durchschnittliche Deal-Größe</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(135000)}</span>
                  </div>
                </div>
                <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl p-4 shadow-glass-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Verkaufszyklus</span>
                    <span className="font-bold text-gray-900 dark:text-white">42 Tage</span>
                  </div>
                </div>
                <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl p-4 shadow-glass-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Win Rate</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">68%</span>
                  </div>
                </div>
                <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl p-4 shadow-glass-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Pipeline Velocity</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">€2.2M/Monat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesModule;
