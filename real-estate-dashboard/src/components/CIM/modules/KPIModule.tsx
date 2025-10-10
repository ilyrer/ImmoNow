import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Mock KPI data
  const kpiData: KPIData[] = [
    {
      metric: 'Lead-to-Customer Conversion',
      current: 24.8,
      previous: 22.3,
      target: 25.0,
      trend: 'up',
      unit: 'percentage'
    },
    {
      metric: 'Besichtigung-to-Angebot',
      current: 68.5,
      previous: 65.2,
      target: 70.0,
      trend: 'up',
      unit: 'percentage'
    },
    {
      metric: 'Angebot-to-Vertragsabschluss',
      current: 42.3,
      previous: 44.1,
      target: 45.0,
      trend: 'down',
      unit: 'percentage'
    },
    {
      metric: 'Time-to-Close (Verkauf)',
      current: 35,
      previous: 38,
      target: 30,
      trend: 'up',
      unit: 'days'
    },
    {
      metric: 'Time-to-Close (Vermietung)',
      current: 18,
      previous: 20,
      target: 15,
      trend: 'up',
      unit: 'days'
    },
    {
      metric: 'Durchschnittliche Leerstandsquote',
      current: 3.2,
      previous: 3.8,
      target: 2.5,
      trend: 'up',
      unit: 'percentage'
    },
    {
      metric: 'Leerstandsdauer',
      current: 45,
      previous: 52,
      target: 30,
      trend: 'up',
      unit: 'days'
    }
  ];

  const conversionFunnel: ConversionFunnel[] = [
    { stage: 'Website Besucher', count: 10000, conversionRate: 100, dropoff: 0 },
    { stage: 'Anfragen', count: 1250, conversionRate: 12.5, dropoff: 87.5 },
    { stage: 'Qualifizierte Leads', count: 875, conversionRate: 70.0, dropoff: 30.0 },
    { stage: 'Besichtigungen', count: 420, conversionRate: 48.0, dropoff: 52.0 },
    { stage: 'Angebote', count: 168, conversionRate: 40.0, dropoff: 60.0 },
    { stage: 'Verträge', count: 94, conversionRate: 56.0, dropoff: 44.0 }
  ];

  const timeToCloseData: TimeToCloseData[] = [
    { month: 'Jan', avgDays: 42, target: 30, fastest: 18, slowest: 67, properties: 23 },
    { month: 'Feb', avgDays: 38, target: 30, fastest: 15, slowest: 58, properties: 28 },
    { month: 'Mär', avgDays: 35, target: 30, fastest: 12, slowest: 52, properties: 31 },
    { month: 'Apr', avgDays: 33, target: 30, fastest: 14, slowest: 48, properties: 27 },
    { month: 'Mai', avgDays: 29, target: 30, fastest: 11, slowest: 44, properties: 35 },
    { month: 'Jun', avgDays: 31, target: 30, fastest: 13, slowest: 47, properties: 32 }
  ];

  const vacancyData: VacancyData[] = [
    { propertyType: 'Wohnungen', totalUnits: 450, vacantUnits: 14, vacancyRate: 3.1, avgVacancyTime: 38, rentLoss: 28500 },
    { propertyType: 'Häuser', totalUnits: 180, vacantUnits: 7, vacancyRate: 3.9, avgVacancyTime: 52, rentLoss: 34200 },
    { propertyType: 'Gewerbe', totalUnits: 85, vacantUnits: 5, vacancyRate: 5.9, avgVacancyTime: 68, rentLoss: 15800 },
    { propertyType: 'Büros', totalUnits: 125, vacantUnits: 3, vacancyRate: 2.4, avgVacancyTime: 29, rentLoss: 12400 }
  ];

  const performanceRadar: PerformanceRadar[] = [
    { metric: 'Lead Conversion', score: 85, maxScore: 100 },
    { metric: 'Verkaufsgeschwindigkeit', score: 72, maxScore: 100 },
    { metric: 'Kundenzufriedenheit', score: 91, maxScore: 100 },
    { metric: 'Vermarktungseffizienz', score: 78, maxScore: 100 },
    { metric: 'Preis-Performance', score: 83, maxScore: 100 },
    { metric: 'Service-Qualität', score: 88, maxScore: 100 }
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
          <span className="text-gray-900 dark:text-gray-200 font-medium">KPI Dashboard</span>
        </div>
      </div>

      {/* Glasmorphism Header */}
      <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-glass p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-glass">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 dark:from-gray-100 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                  KPI Dashboard
                </h2>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  Conversion-Raten, Time-to-Close und Leerstandsanalysen
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-4 py-3 bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 shadow-glass-sm hover:bg-white/30 dark:hover:bg-gray-700/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="all">Alle KPIs</option>
              <option value="conversion">Conversion</option>
              <option value="timing">Zeitanalysen</option>
              <option value="vacancy">Leerstand</option>
            </select>

            {/* Timeframe Selector */}
            <div className="flex bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl p-1.5 shadow-glass-sm">
              {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedTimeframe(period)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedTimeframe === period
                      ? 'bg-white/60 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 shadow-glass-sm border border-white/30 dark:border-gray-600/40'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/30 dark:hover:bg-gray-700/30'
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

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredKPIs.map((kpi, index) => (
          <div key={index} className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {kpi.metric}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatValue(kpi.current, kpi.unit)}
                  </span>
                  {getTrendIcon(kpi.trend)}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Ziel:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatValue(kpi.target, kpi.unit)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Vormonat:</span>
                <span className={`font-medium ${getTrendColor(kpi.current, kpi.previous, kpi.unit)}`}>
                  {formatValue(kpi.previous, kpi.unit)}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    kpi.current >= kpi.target ? 'bg-green-500' : 
                    kpi.current >= kpi.target * 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Zielerreichung</span>
                <span>{((kpi.current / kpi.target) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
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
