import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calculator,
  CreditCard,
  Banknote,
  Percent,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Download,
  RefreshCw
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

interface CashflowData {
  month: string;
  inflow: number;
  outflow: number;
  netCashflow: number;
  operationalCost: number;
  revenue: number;
  investments: number;
}

interface YieldMetric {
  property: string;
  propertyType: string;
  purchasePrice: number;
  currentValue: number;
  monthlyRent: number;
  annualRent: number;
  grossYield: number;
  netYield: number;
  roi: number;
  appreciation: number;
}

interface FinancingStatus {
  id: string;
  propertyName: string;
  loanAmount: number;
  remainingBalance: number;
  interestRate: number;
  monthlyPayment: number;
  remainingTerm: number;
  ltvRatio: number;
  status: 'active' | 'pending' | 'paid_off' | 'default';
  nextPaymentDue: string;
}

interface PortfolioMetrics {
  totalValue: number;
  totalInvestment: number;
  totalDebt: number;
  equity: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netIncome: number;
  portfolioYield: number;
  leverageRatio: number;
}

const FinancialModule: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedView, setSelectedView] = useState<'overview' | 'cashflow' | 'yields' | 'financing'>('overview');

  // Mock financial data
  const cashflowData: CashflowData[] = [
    { month: 'Jan', inflow: 185000, outflow: 142000, netCashflow: 43000, operationalCost: 28000, revenue: 185000, investments: 45000 },
    { month: 'Feb', inflow: 192000, outflow: 158000, netCashflow: 34000, operationalCost: 31000, revenue: 192000, investments: 62000 },
    { month: 'Mär', inflow: 178000, outflow: 134000, netCashflow: 44000, operationalCost: 26000, revenue: 178000, investments: 38000 },
    { month: 'Apr', inflow: 210000, outflow: 167000, netCashflow: 43000, operationalCost: 33000, revenue: 210000, investments: 58000 },
    { month: 'Mai', inflow: 225000, outflow: 182000, netCashflow: 43000, operationalCost: 35000, revenue: 225000, investments: 71000 },
    { month: 'Jun', inflow: 198000, outflow: 149000, netCashflow: 49000, operationalCost: 29000, revenue: 198000, investments: 48000 }
  ];

  const yieldMetrics: YieldMetric[] = [
    {
      property: 'Hamburg Altona Penthouse',
      propertyType: 'Wohnung',
      purchasePrice: 850000,
      currentValue: 920000,
      monthlyRent: 3200,
      annualRent: 38400,
      grossYield: 4.52,
      netYield: 3.8,
      roi: 12.3,
      appreciation: 8.2
    },
    {
      property: 'Berlin Mitte Loft',
      propertyType: 'Wohnung',
      purchasePrice: 680000,
      currentValue: 750000,
      monthlyRent: 2800,
      annualRent: 33600,
      grossYield: 4.94,
      netYield: 4.1,
      roi: 15.7,
      appreciation: 10.3
    },
    {
      property: 'München Schwabing Villa',
      propertyType: 'Haus',
      purchasePrice: 1200000,
      currentValue: 1350000,
      monthlyRent: 4500,
      annualRent: 54000,
      grossYield: 4.50,
      netYield: 3.7,
      roi: 18.2,
      appreciation: 12.5
    },
    {
      property: 'Frankfurt Bürokomplex',
      propertyType: 'Gewerbe',
      purchasePrice: 2300000,
      currentValue: 2450000,
      monthlyRent: 12000,
      annualRent: 144000,
      grossYield: 6.26,
      netYield: 5.2,
      roi: 11.8,
      appreciation: 6.5
    },
    {
      property: 'Köln Ehrenfeld Mehrfamilienhaus',
      propertyType: 'Mehrfamilienhaus',
      purchasePrice: 950000,
      currentValue: 1020000,
      monthlyRent: 4200,
      annualRent: 50400,
      grossYield: 5.31,
      netYield: 4.3,
      roi: 14.5,
      appreciation: 7.4
    }
  ];

  const financingStatus: FinancingStatus[] = [
    {
      id: '1',
      propertyName: 'Hamburg Altona Penthouse',
      loanAmount: 595000,
      remainingBalance: 532000,
      interestRate: 3.2,
      monthlyPayment: 2890,
      remainingTerm: 22,
      ltvRatio: 57.8,
      status: 'active',
      nextPaymentDue: '2024-02-01'
    },
    {
      id: '2',
      propertyName: 'Berlin Mitte Loft',
      loanAmount: 476000,
      remainingBalance: 445000,
      interestRate: 2.9,
      monthlyPayment: 2150,
      remainingTerm: 26,
      ltvRatio: 59.3,
      status: 'active',
      nextPaymentDue: '2024-02-01'
    },
    {
      id: '3',
      propertyName: 'München Schwabing Villa',
      loanAmount: 840000,
      remainingBalance: 798000,
      interestRate: 3.5,
      monthlyPayment: 4200,
      remainingTerm: 28,
      ltvRatio: 59.1,
      status: 'active',
      nextPaymentDue: '2024-02-01'
    },
    {
      id: '4',
      propertyName: 'Frankfurt Bürokomplex',
      loanAmount: 1610000,
      remainingBalance: 1520000,
      interestRate: 4.1,
      monthlyPayment: 8900,
      remainingTerm: 20,
      ltvRatio: 62.0,
      status: 'active',
      nextPaymentDue: '2024-02-01'
    },
    {
      id: '5',
      propertyName: 'Köln Ehrenfeld Mehrfamilienhaus',
      loanAmount: 665000,
      remainingBalance: 0,
      interestRate: 0,
      monthlyPayment: 0,
      remainingTerm: 0,
      ltvRatio: 0,
      status: 'paid_off',
      nextPaymentDue: '-'
    }
  ];

  // Calculate portfolio metrics
  const portfolioMetrics: PortfolioMetrics = {
    totalValue: yieldMetrics.reduce((sum, property) => sum + property.currentValue, 0),
    totalInvestment: yieldMetrics.reduce((sum, property) => sum + property.purchasePrice, 0),
    totalDebt: financingStatus.reduce((sum, loan) => sum + loan.remainingBalance, 0),
    equity: 0, // Will be calculated
    monthlyIncome: yieldMetrics.reduce((sum, property) => sum + property.monthlyRent, 0),
    monthlyExpenses: financingStatus.reduce((sum, loan) => sum + loan.monthlyPayment, 0),
    netIncome: 0, // Will be calculated
    portfolioYield: 0, // Will be calculated
    leverageRatio: 0 // Will be calculated
  };

  // Complete calculations
  portfolioMetrics.equity = portfolioMetrics.totalValue - portfolioMetrics.totalDebt;
  portfolioMetrics.netIncome = portfolioMetrics.monthlyIncome - portfolioMetrics.monthlyExpenses;
  portfolioMetrics.portfolioYield = (portfolioMetrics.monthlyIncome * 12 / portfolioMetrics.totalValue) * 100;
  portfolioMetrics.leverageRatio = (portfolioMetrics.totalDebt / portfolioMetrics.totalValue) * 100;

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'paid_off': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'default': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'paid_off': return <CheckCircle className="w-4 h-4" />;
      case 'default': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (current: number, benchmark: number) => {
    if (current > benchmark * 1.05) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (current < benchmark * 0.95) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span>Finanzdaten</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Cashflow, Renditekennzahlen und Finanzierungsstatus
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            {(['overview', 'cashflow', 'yields', 'financing'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedView === view
                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {view === 'overview' ? 'Übersicht' : 
                 view === 'cashflow' ? 'Cashflow' : 
                 view === 'yields' ? 'Renditen' : 'Finanzierung'}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
          >
            <option value="month">Monatlich</option>
            <option value="quarter">Quartalsweise</option>
            <option value="year">Jährlich</option>
          </select>

          {/* Export Button */}
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Portfolio-Wert</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(portfolioMetrics.totalValue)}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(portfolioMetrics.totalValue, portfolioMetrics.totalInvestment)}
                <span className="text-sm text-green-600 dark:text-green-400">
                  +{formatPercentage(((portfolioMetrics.totalValue - portfolioMetrics.totalInvestment) / portfolioMetrics.totalInvestment) * 100)}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Eigenkapital</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(portfolioMetrics.equity)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatPercentage((portfolioMetrics.equity / portfolioMetrics.totalValue) * 100)} vom Portfolio
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Banknote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Netto-Cashflow</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(portfolioMetrics.netIncome)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatCurrency(portfolioMetrics.netIncome * 12)} jährlich
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Portfolio-Rendite</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(portfolioMetrics.portfolioYield)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Leverage: {formatPercentage(portfolioMetrics.leverageRatio)}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Percent className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content based on selected view */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Portfolio Composition */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Portfolio-Zusammensetzung</h3>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Eigenkapital', value: portfolioMetrics.equity },
                      { name: 'Fremdkapital', value: portfolioMetrics.totalDebt }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    <Cell fill={COLORS.secondary} />
                    <Cell fill={COLORS.danger} />
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Wert']}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Income vs Expenses */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Monatliche Einnahmen vs. Ausgaben</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">Mieteinnahmen</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(portfolioMetrics.monthlyIncome)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">Darlehensraten</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(portfolioMetrics.monthlyExpenses)}
                </span>
              </div>
              
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Netto-Cashflow</span>
                  <span className={`text-xl font-bold ${
                    portfolioMetrics.netIncome > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(portfolioMetrics.netIncome)}
                  </span>
                </div>
              </div>
              
              {/* Visual bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Einnahmen</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ausgaben</span>
                    <span>{((portfolioMetrics.monthlyExpenses / portfolioMetrics.monthlyIncome) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full" 
                      style={{ width: `${(portfolioMetrics.monthlyExpenses / portfolioMetrics.monthlyIncome) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Properties */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Top Rendite-Objekte</h3>
            
            <div className="space-y-4">
              {yieldMetrics
                .sort((a, b) => b.netYield - a.netYield)
                .slice(0, 3)
                .map((property, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {property.property.length > 25 ? property.property.substring(0, 25) + '...' : property.property}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{property.propertyType}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatPercentage(property.netYield)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatCurrency(property.monthlyRent)}/Monat
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financing Overview */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Finanzierung im Überblick</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Aktive Darlehen:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {financingStatus.filter(f => f.status === 'active').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gesamtschuld:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(portfolioMetrics.totalDebt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Ø Zinssatz:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPercentage(
                    financingStatus
                      .filter(f => f.status === 'active')
                      .reduce((sum, f) => sum + f.interestRate, 0) / 
                    financingStatus.filter(f => f.status === 'active').length || 1
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Monatliche Raten:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(portfolioMetrics.monthlyExpenses)}
                </span>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">LTV-Ratio:</span>
                  <span className={`font-medium ${
                    portfolioMetrics.leverageRatio > 80 ? 'text-red-600 dark:text-red-400' :
                    portfolioMetrics.leverageRatio > 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {formatPercentage(portfolioMetrics.leverageRatio)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'cashflow' && (
        <div className="space-y-6">
          {/* Cashflow Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Cashflow-Entwicklung</h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="inflow" fill={COLORS.secondary} name="Einnahmen" />
                  <Bar dataKey="outflow" fill={COLORS.danger} name="Ausgaben" />
                  <Line 
                    type="monotone" 
                    dataKey="netCashflow" 
                    stroke={COLORS.primary} 
                    strokeWidth={3}
                    name="Netto-Cashflow"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cashflow Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Einnahmen-Struktur</h4>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Mieteinnahmen', value: 180000 },
                        { name: 'Verkaufserlöse', value: 85000 },
                        { name: 'Sonstige Einnahmen', value: 15000 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {PIE_COLORS.slice(0, 3).map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Betrag']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ausgaben-Struktur</h4>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Darlehensraten', value: 95000 },
                        { name: 'Betriebskosten', value: 35000 },
                        { name: 'Instandhaltung', value: 20000 },
                        { name: 'Verwaltung', value: 15000 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {PIE_COLORS.slice(3).map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Betrag']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'yields' && (
        <div className="space-y-6">
          {/* Yield Comparison Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Rendite-Vergleich</h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yieldMetrics}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="property" 
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                  />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatPercentage(value), 
                      name === 'grossYield' ? 'Brutto-Rendite' : 
                      name === 'netYield' ? 'Netto-Rendite' : 'ROI'
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="grossYield" fill={COLORS.primary} name="Brutto-Rendite" />
                  <Bar dataKey="netYield" fill={COLORS.secondary} name="Netto-Rendite" />
                  <Bar dataKey="roi" fill={COLORS.accent} name="ROI" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yield Details Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Detaillierte Rendite-Analyse</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Immobilie</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Kaufpreis</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Aktueller Wert</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Monatsmiete</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Brutto-Rendite</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Netto-Rendite</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Wertsteigerung</th>
                  </tr>
                </thead>
                <tbody>
                  {yieldMetrics.map((property, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {property.property.length > 20 ? property.property.substring(0, 20) + '...' : property.property}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{property.propertyType}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                        {formatCurrency(property.purchasePrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(property.currentValue)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                        {formatCurrency(property.monthlyRent)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-medium ${
                          property.grossYield > 5 ? 'text-green-600 dark:text-green-400' :
                          property.grossYield > 3.5 ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {formatPercentage(property.grossYield)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-medium ${
                          property.netYield > 4 ? 'text-green-600 dark:text-green-400' :
                          property.netYield > 3 ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {formatPercentage(property.netYield)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          +{formatPercentage(property.appreciation)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'financing' && (
        <div className="space-y-6">
          {/* Financing Status Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {financingStatus.map((loan, index) => (
              <div key={loan.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {loan.propertyName.length > 20 ? loan.propertyName.substring(0, 20) + '...' : loan.propertyName}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Darlehen #{loan.id}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(loan.status)}`}>
                    {getStatusIcon(loan.status)}
                    <span className="ml-1">
                      {loan.status === 'active' ? 'Aktiv' : 
                       loan.status === 'pending' ? 'Ausstehend' : 
                       loan.status === 'paid_off' ? 'Abbezahlt' : 'Säumig'}
                    </span>
                  </div>
                </div>
                
                {loan.status !== 'paid_off' && (
                  <>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Restschuld:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(loan.remainingBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Zinssatz:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatPercentage(loan.interestRate)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Monatliche Rate:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(loan.monthlyPayment)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Restlaufzeit:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {loan.remainingTerm} Jahre
                        </span>
                      </div>
                    </div>
                    
                    {/* Loan Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Getilgt</span>
                        <span>{((1 - (loan.remainingBalance / loan.loanAmount)) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(1 - (loan.remainingBalance / loan.loanAmount)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* LTV Ratio */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">LTV-Ratio:</span>
                      <span className={`font-medium ${
                        loan.ltvRatio > 80 ? 'text-red-600 dark:text-red-400' :
                        loan.ltvRatio > 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {formatPercentage(loan.ltvRatio)}
                      </span>
                    </div>
                  </>
                )}
                
                {loan.status === 'paid_off' && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Darlehen vollständig abbezahlt
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Ursprünglich: {formatCurrency(loan.loanAmount)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Financing Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Finanzierungs-Übersicht</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {financingStatus.filter(f => f.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Aktive Darlehen</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatCurrency(portfolioMetrics.totalDebt)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Gesamtschuld</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatCurrency(portfolioMetrics.monthlyExpenses)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Monatliche Raten</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  portfolioMetrics.leverageRatio > 80 ? 'text-red-600 dark:text-red-400' :
                  portfolioMetrics.leverageRatio > 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                  'text-green-600 dark:text-green-400'
                }`}>
                  {formatPercentage(portfolioMetrics.leverageRatio)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Portfolio LTV</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialModule;
