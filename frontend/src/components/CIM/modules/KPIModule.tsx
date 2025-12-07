import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import kpiService from '../../../services/kpi.service';
import type { KPIDashboardResponse } from '../../../services/kpi.service';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Timer,
  Calendar,
  Percent,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Filter,
  ChevronLeft,
  Home,
  Loader2
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface KPIData {
  metric: string;
  current: number;
  previous: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: 'percentage' | 'days' | 'euro' | 'count';
}

interface ConversionFunnel {
  stage: string;
  count: number;
  conversionRate: number;
  dropoff: number;
}

interface TimeToCloseData {
  month: string;
  avgDays: number;
  target: number;
  fastest: number;
  slowest: number;
  properties: number;
}

interface VacancyData {
  propertyType: string;
  totalUnits: number;
  vacantUnits: number;
  vacancyRate: number;
  avgVacancyTime: number;
  rentLoss: number;
}

interface PerformanceRadar {
  metric: string;
  score: number;
  maxScore: number;
}

const KPIModule: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'conversion' | 'timing' | 'vacancy'>('all');
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([]);
  const [timeToCloseData, setTimeToCloseData] = useState<TimeToCloseData[]>([]);
  const [vacancyData, setVacancyData] = useState<VacancyData[]>([]);
  const [performanceRadar, setPerformanceRadar] = useState<PerformanceRadar[]>([]);

  // Load KPI data from backend
  useEffect(() => {
    const loadKPIData = async () => {
      try {
        setLoading(true);
        const data = await kpiService.getKPIDashboard(selectedTimeframe);
        
        // Map backend data to frontend format
        setKpiData(data.kpi_metrics.map(metric => ({
          metric: metric.metric,
          current: metric.current,
          previous: metric.previous,
          target: metric.target,
          trend: metric.trend,
          unit: metric.unit
        })));
        
        setConversionFunnel(data.conversion_funnel.map(stage => ({
          stage: stage.stage,
          count: stage.count,
          conversionRate: stage.conversion_rate,
          dropoff: stage.dropoff
        })));
        
        setTimeToCloseData(data.time_to_close.map(item => ({
          month: item.month,
          avgDays: item.avg_days,
          target: item.target,
          fastest: item.fastest,
          slowest: item.slowest,
          properties: item.properties
        })));
        
        setVacancyData(data.vacancy_analysis.map(item => ({
          propertyType: item.property_type,
          totalUnits: item.total_units,
          vacantUnits: item.vacant_units,
          vacancyRate: item.vacancy_rate,
          avgVacancyTime: item.avg_vacancy_time,
          rentLoss: item.rent_loss
        })));
        
        setPerformanceRadar(data.performance_radar.map(item => ({
          metric: item.metric,
          score: item.score,
          maxScore: item.max_score
        })));
        
      } catch (error) {
        console.error('Failed to load KPI data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadKPIData();
  }, [selectedTimeframe]);

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

  const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.teal, COLORS.warning];

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'days':
        return `${Math.round(value)} Tage`;
      case 'euro':
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0
        }).format(value);
      case 'count':
        return value.toString();
      default:
        return value.toString();
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (current: number, target: number, unit: string) => {
    const diff = unit === 'percentage' || unit === 'days' ? 
      (current - target) / target : 
      (target - current) / target;
      
    if (Math.abs(diff) < 0.05) return 'text-gray-600';
    return diff > 0 && (unit === 'percentage' || unit === 'count') ? 'text-green-600' : 
           diff < 0 && unit === 'days' ? 'text-green-600' : 'text-red-600';
  };

  const filteredKPIs = selectedCategory === 'all' ? kpiData : 
    kpiData.filter(kpi => {
      switch (selectedCategory) {
        case 'conversion': return kpi.metric.includes('Conversion') || kpi.metric.includes('to');
        case 'timing': return kpi.metric.includes('Time') || kpi.metric.includes('dauer');
        case 'vacancy': return kpi.metric.includes('Leerstand');
        default: return true;
      }
    });

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Lade KPI-Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Eleganter Header mit Breadcrumb und Navigation */}
      <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Side: Title & Breadcrumb */}
          <div className="flex items-center gap-4">
            {/* Zurück Button - Apple Style */}
            <button
              onClick={() => navigate('/cim')}
              className="group flex items-center justify-center w-10 h-10 rounded-xl
                bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm
                border border-white/50 dark:border-slate-600/50
                shadow-lg hover:shadow-xl
                hover:bg-white dark:hover:bg-slate-600
                transition-all duration-200"
              title="Zurück zu CIM Overview"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            </button>

            {/* Title & Breadcrumb */}
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                <Home className="w-4 h-4" />
                <span>CIM Analytics</span>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-200 font-medium">KPI Dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-pink-800 dark:from-slate-100 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                    KPI Dashboard
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Live-Daten aus Ihrer Datenbank
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Filters */}
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-4 py-2.5 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm 
                border border-white/50 dark:border-slate-600/50 rounded-xl 
                text-sm font-medium text-slate-900 dark:text-slate-100 
                shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-slate-600
                transition-all duration-200 
                focus:outline-none focus:ring-2 focus:ring-purple-500/50
                cursor-pointer"
            >
              <option value="all">📊 Alle KPIs</option>
              <option value="conversion">🎯 Conversion</option>
              <option value="timing">⏱️ Zeitanalysen</option>
              <option value="vacancy">🏢 Leerstand</option>
            </select>

            {/* Timeframe Selector - Apple Style Pills */}
            <div className="flex bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl p-1 shadow-lg">
              {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedTimeframe(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedTimeframe === period
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-600/50'
                  }`}
                >
                  {period === 'week' ? 'Woche' : 
                   period === 'month' ? 'Monat' : 
                   period === 'quarter' ? 'Quartal' : 'Jahr'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards - Apple Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredKPIs.map((kpi, index) => {
          const progress = Math.min((kpi.current / kpi.target) * 100, 100);
          const isGood = kpi.current >= kpi.target;
          const isOk = kpi.current >= kpi.target * 0.8;
          
          return (
            <div 
              key={index} 
              className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-5 
                shadow-lg hover:shadow-2xl 
                border border-white/50 dark:border-slate-700/50 
                hover:border-purple-300 dark:hover:border-purple-500/50
                transition-all duration-300 hover:-translate-y-1"
            >
              {/* Gradient Accent Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
                isGood ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                isOk ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                'bg-gradient-to-r from-red-400 to-rose-500'
              }`}></div>

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    {kpi.metric}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                      {formatValue(kpi.current, kpi.unit)}
                    </span>
                    <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${
                      kpi.trend === 'up' ? 'bg-green-100 dark:bg-green-900/30' :
                      kpi.trend === 'down' ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-gray-100 dark:bg-gray-700/30'
                    }`}>
                      {getTrendIcon(kpi.trend)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Ziel</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatValue(kpi.target, kpi.unit)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Vorperiode</span>
                  <span className={`font-semibold ${getTrendColor(kpi.current, kpi.previous, kpi.unit)}`}>
                    {formatValue(kpi.previous, kpi.unit)}
                  </span>
                </div>
              </div>
              
              {/* Progress Bar - Apple Style */}
              <div className="space-y-2">
                <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      isGood ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      isOk ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                      'bg-gradient-to-r from-red-400 to-rose-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Zielerreichung
                  </span>
                  <span className={`text-xs font-bold ${
                    isGood ? 'text-green-600 dark:text-green-400' :
                    isOk ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {progress.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isGood ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                isOk ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {isGood ? '✓ Ziel erreicht' : isOk ? '⚡ Auf Kurs' : '⚠ Unter Ziel'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Conversion Funnel</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Target className="w-4 h-4" />
              <span>Letzter Monat</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {conversionFunnel.map((stage, index) => {
              const isFirst = index === 0;
              const maxWidth = conversionFunnel[0].count;
              const widthPercentage = (stage.count / maxWidth) * 100;
              
              return (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium`}
                           style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{stage.stage}</h4>
                        {!isFirst && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {stage.conversionRate.toFixed(1)}% Conversion • {stage.dropoff.toFixed(1)}% Absprung
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {stage.count.toLocaleString()}
                      </div>
                      {!isFirst && (
                        <div className={`text-sm ${
                          stage.conversionRate > 50 ? 'text-green-600' : 
                          stage.conversionRate > 30 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {stage.conversionRate > 50 ? '✓' : stage.conversionRate > 30 ? '⚠' : '✗'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4 mb-1">
                    <div 
                      className="h-4 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${widthPercentage}%`,
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Radar */}
        <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Performance Radar</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Activity className="w-4 h-4" />
              <span>Aktueller Stand</span>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceRadar}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <PolarRadiusAxis 
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <Radar
                  name="Performance"
                  dataKey="score"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}/100`, 'Score']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Time-to-Close Analysis */}
      <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Time-to-Close Analyse</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-300">Durchschnitt</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-300">Ziel</span>
            </div>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeToCloseData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${Math.round(value)} Tage`, 
                  name === 'avgDays' ? 'Durchschnitt' : 
                  name === 'target' ? 'Ziel' : 
                  name === 'fastest' ? 'Schnellster' : 'Langsamster'
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Legend />
              
              {/* Area for range (fastest to slowest) */}
              <Bar dataKey="slowest" fill="#e5e7eb" name="Max Zeit" />
              <Bar dataKey="fastest" fill="#f3f4f6" name="Min Zeit" />
              
              {/* Average line */}
              <Line 
                type="monotone" 
                dataKey="avgDays" 
                stroke={COLORS.primary} 
                strokeWidth={3}
                name="Durchschnitt"
              />
              
              {/* Target line */}
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke={COLORS.danger} 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Ziel"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vacancy Analysis */}
      <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leerstandsanalyse</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <Building2 className="w-4 h-4" />
            <span>Nach Immobilientyp</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vacancy Rate Chart */}
          <div className="h-64">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Leerstandsquote</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vacancyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="propertyType" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  className="text-xs" 
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Leerstandsquote']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar 
                  dataKey="vacancyRate" 
                  fill={COLORS.warning}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Vacancy Details Table */}
          <div className="h-64 overflow-y-auto">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Detailanalyse</h4>
            <div className="space-y-3">
              {vacancyData.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">{item.propertyType}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.vacancyRate < 3 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                      item.vacancyRate < 5 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {item.vacancyRate.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Leerstände:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                        {item.vacantUnits}/{item.totalUnits}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Ø Dauer:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                        {item.avgVacancyTime} Tage
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-300">Mietausfall:</span>
                      <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                        {formatValue(item.rentLoss, 'euro')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Total Vacancy Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {vacancyData.reduce((sum, item) => sum + item.vacantUnits, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Gesamt Leerstände</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {(vacancyData.reduce((sum, item) => sum + (item.vacancyRate * item.totalUnits), 0) / 
                vacancyData.reduce((sum, item) => sum + item.totalUnits, 0)).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Ø Leerstandsquote</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(vacancyData.reduce((sum, item) => sum + item.avgVacancyTime, 0) / vacancyData.length)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Ø Leerstandsdauer (Tage)</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatValue(vacancyData.reduce((sum, item) => sum + item.rentLoss, 0), 'euro')}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Gesamter Mietausfall</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIModule;
