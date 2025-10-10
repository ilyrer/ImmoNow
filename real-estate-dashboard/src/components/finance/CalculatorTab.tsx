/**
 * Calculator Tab Components for Professional Financing Calculator
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Calendar,
  Shield,
  Wrench,
  Home,
  PiggyBank
} from 'lucide-react';
import { FinancingResult, FinancingParameters } from '../../types/finance';
import { formatCurrency, formatPercent } from '../finance/PDFExportService';

interface CalculatorTabProps {
  parameters: FinancingParameters;
  setParameters: (params: FinancingParameters) => void;
  results: FinancingResult | null;
  activeChart: 'amortization' | 'breakdown' | 'cashflow';
  setActiveChart: (chart: 'amortization' | 'breakdown' | 'cashflow') => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  parameters,
  setParameters,
  results,
  activeChart,
  setActiveChart
}) => {
  // State for amortization table pagination
  const [yearRange, setYearRange] = useState<number>(0); // 0 = Jahre 1-10, 1 = Jahre 11-20, etc.
  const YEARS_PER_PAGE = 10;

  const updateParameter = <K extends keyof FinancingParameters>(
    key: K,
    value: FinancingParameters[K]
  ) => {
    setParameters({ ...parameters, [key]: value });
  };

  return (
    <motion.div
      key="calculator"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* ========== INPUT SECTION ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Home className="w-6 h-6 mr-3 text-blue-600" />
          Finanzierungsparameter
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Property Price */}
          <InputField
            label="Kaufpreis"
            value={parameters.propertyPrice}
            onChange={(v) => updateParameter('propertyPrice', v)}
            icon={<Home className="w-5 h-5" />}
            suffix="€"
            step={10000}
          />

          {/* Equity */}
          <InputField
            label="Eigenkapital"
            value={parameters.equity}
            onChange={(v) => updateParameter('equity', v)}
            icon={<PiggyBank className="w-5 h-5" />}
            suffix="€"
            step={5000}
            info={`${((parameters.equity / parameters.propertyPrice) * 100).toFixed(1)}% Eigenkapitalquote`}
          />

          {/* Interest Rate */}
          <InputField
            label="Zinssatz p.a."
            value={parameters.interestRate}
            onChange={(v) => updateParameter('interestRate', v)}
            icon={<Percent className="w-5 h-5" />}
            suffix="%"
            step={0.05}
            decimals={2}
          />

          {/* Loan Term */}
          <InputField
            label="Laufzeit"
            value={parameters.loanTerm}
            onChange={(v) => updateParameter('loanTerm', v)}
            icon={<Calendar className="w-5 h-5" />}
            suffix="Jahre"
            step={1}
          />

          {/* Additional Costs */}
          <InputField
            label="Kaufnebenkosten"
            value={parameters.additionalCosts}
            onChange={(v) => updateParameter('additionalCosts', v)}
            icon={<DollarSign className="w-5 h-5" />}
            suffix="€"
            step={1000}
            info="Notar, Grunderwerbsteuer, Makler"
          />

          {/* Maintenance Rate */}
          <InputField
            label="Instandhaltung p.a."
            value={parameters.maintenanceRate}
            onChange={(v) => updateParameter('maintenanceRate', v)}
            icon={<Wrench className="w-5 h-5" />}
            suffix="%"
            step={0.1}
            decimals={1}
            info={`${formatCurrency((parameters.maintenanceRate / 100) * parameters.propertyPrice / 12)}/Monat`}
          />
        </div>

        {/* Advanced Options */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Insurance Toggle */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={parameters.includeInsurance}
                onChange={(e) => updateParameter('includeInsurance', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Gebäudeversicherung</span>
            </label>
            
            {parameters.includeInsurance && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <InputField
                  label="Versicherungssatz p.a."
                  value={parameters.insuranceRate}
                  onChange={(v) => updateParameter('insuranceRate', v)}
                  suffix="%"
                  step={0.01}
                  decimals={2}
                  info={`${formatCurrency((parameters.insuranceRate / 100) * parameters.propertyPrice / 12)}/Monat`}
                />
              </motion.div>
            )}
          </div>

          {/* Special Repayment Toggle */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={parameters.includeRepayment}
                onChange={(e) => updateParameter('includeRepayment', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Sondertilgung</span>
            </label>
            
            {parameters.includeRepayment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <InputField
                  label="Betrag pro Jahr"
                  value={parameters.repaymentAmount}
                  onChange={(v) => updateParameter('repaymentAmount', v)}
                  suffix="€"
                  step={1000}
                  info="Reduziert Laufzeit erheblich"
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ========== KEY METRICS ========== */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={<DollarSign className="w-8 h-8" />}
            label="Monatliche Rate"
            value={formatCurrency(results.monthlyPayment)}
            subtitle="inkl. aller Nebenkosten"
            gradient="from-blue-500 to-blue-600"
          />
          
          <MetricCard
            icon={<Home className="w-8 h-8" />}
            label="Darlehenssumme"
            value={formatCurrency(results.loanAmount)}
            subtitle={`${formatPercent(results.loanToValue)} Beleihung`}
            gradient="from-indigo-500 to-indigo-600"
          />
          
          <MetricCard
            icon={<TrendingDown className="w-8 h-8" />}
            label="Gesamtzinsen"
            value={formatCurrency(results.totalInterest)}
            subtitle={`über ${parameters.loanTerm} Jahre`}
            gradient="from-red-500 to-red-600"
          />
          
          <MetricCard
            icon={<Calendar className="w-8 h-8" />}
            label="Gesamtkosten"
            value={formatCurrency(results.totalCost)}
            subtitle={`eff. Zins ${formatPercent(results.effectiveInterestRate)}`}
            gradient="from-purple-500 to-purple-600"
          />
        </div>
      )}

      {/* ========== CHARTS SECTION ========== */}
      {results && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {/* Chart Toggle */}
          <div className="flex flex-wrap gap-3 mb-8">
            <ChartToggle
              active={activeChart === 'amortization'}
              onClick={() => setActiveChart('amortization')}
              label="Tilgungsverlauf"
            />
            <ChartToggle
              active={activeChart === 'breakdown'}
              onClick={() => setActiveChart('breakdown')}
              label="Kostenaufteilung"
            />
            <ChartToggle
              active={activeChart === 'cashflow'}
              onClick={() => setActiveChart('cashflow')}
              label="Monatliche Belastung"
            />
          </div>

          {/* Chart Content */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
            {activeChart === 'amortization' && <AmortizationChart data={results.chartData} />}
            {activeChart === 'breakdown' && (
              <BreakdownChart
                equity={parameters.equity}
                loanAmount={results.loanAmount}
                totalInterest={results.totalInterest}
                additionalCosts={parameters.additionalCosts}
              />
            )}
            {activeChart === 'cashflow' && (
              <CashflowChart
                monthlyPayment={results.monthlyPayment}
                monthlyInsurance={results.monthlyInterest}
                monthlyMaintenance={results.monthlyPrincipal}
              />
            )}
          </div>
        </div>
      )}

      {/* ========== AMORTIZATION TABLE ========== */}
      {results && results.chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Tilgungsplan (Jahresübersicht)</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Zeige Jahre {yearRange * YEARS_PER_PAGE + 1} - {Math.min((yearRange + 1) * YEARS_PER_PAGE, results.chartData.length)}
            </div>
          </div>

          {/* Slider for year range */}
          {results.chartData.length > YEARS_PER_PAGE && (
            <div className="mb-6 px-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Jahre:
                </span>
                <input
                  type="range"
                  min="0"
                  max={Math.floor((results.chartData.length - 1) / YEARS_PER_PAGE)}
                  value={yearRange}
                  onChange={(e) => setYearRange(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                    [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-indigo-600 
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                    [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-blue-500 
                    [&::-moz-range-thumb]:to-indigo-600 [&::-moz-range-thumb]:cursor-pointer 
                    [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-0"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => setYearRange(Math.max(0, yearRange - 1))}
                    disabled={yearRange === 0}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-semibold 
                      disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600
                      transition-colors text-gray-700 dark:text-gray-300"
                  >
                    ← Zurück
                  </button>
                  <button
                    onClick={() => setYearRange(Math.min(Math.floor((results.chartData.length - 1) / YEARS_PER_PAGE), yearRange + 1))}
                    disabled={yearRange >= Math.floor((results.chartData.length - 1) / YEARS_PER_PAGE)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-semibold 
                      disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600
                      transition-colors text-gray-700 dark:text-gray-300"
                  >
                    Weiter →
                  </button>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Jahr 1</span>
                <span>Jahr {results.chartData.length}</span>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Jahr</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Zinsen</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Tilgung</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Restschuld</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Fortschritt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.chartData
                  .slice(yearRange * YEARS_PER_PAGE, (yearRange + 1) * YEARS_PER_PAGE)
                  .map((row) => (
                  <tr key={row.year} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{row.year}</td>
                    <td className="px-6 py-4 text-sm text-right text-red-600 dark:text-red-400 font-mono">
                      {formatCurrency(row.yearlyInterest)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-green-600 dark:text-green-400 font-mono">
                      {formatCurrency(row.yearlyPrincipal)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-blue-600 dark:text-blue-400 font-mono">
                      {formatCurrency(row.remainingDebt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min(row.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 font-semibold w-12">
                          {row.progress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary info */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-semibold">Gesamt:</span> {results.chartData.length} Jahre • 
              <span className="ml-2 font-semibold">Seite:</span> {yearRange + 1} von {Math.ceil(results.chartData.length / YEARS_PER_PAGE)}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ==================== SUB-COMPONENTS ====================

const InputField: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
  suffix?: string;
  step?: number;
  decimals?: number;
  info?: string;
}> = ({ label, value, onChange, icon, suffix, step = 1, decimals = 0, info }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
      {icon && <span className="mr-2 text-blue-600">{icon}</span>}
      {label}
    </label>
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        step={step}
        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white text-right pr-12 font-mono font-semibold"
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
          {suffix}
        </span>
      )}
    </div>
    {info && (
      <p className="text-xs text-gray-500 dark:text-gray-400">{info}</p>
    )}
  </div>
);

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  gradient: string;
}> = ({ icon, label, value, subtitle, gradient }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-xl`}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium opacity-90">{label}</span>
      <div className="opacity-75">{icon}</div>
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm opacity-75">{subtitle}</div>
  </motion.div>
);

const ChartToggle: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
}> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
      active
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
    }`}
  >
    {label}
  </button>
);

const AmortizationChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={400}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
      <Tooltip
        formatter={(value: any, name: string) => [
          formatCurrency(value),
          name === 'remainingDebt' ? 'Restschuld' : name
        ]}
        labelFormatter={(label) => `Jahr ${label}`}
        contentStyle={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          border: 'none',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}
      />
      <Area
        type="monotone"
        dataKey="remainingDebt"
        stroke="#3B82F6"
        fill="url(#colorDebt)"
        strokeWidth={3}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const BreakdownChart: React.FC<{
  equity: number;
  loanAmount: number;
  totalInterest: number;
  additionalCosts: number;
}> = ({ equity, loanAmount, totalInterest, additionalCosts }) => {
  const pieData = [
    { name: 'Eigenkapital', value: equity, color: '#22c55e' },
    { name: 'Darlehen', value: loanAmount, color: '#3b82f6' },
    { name: 'Zinsen', value: totalInterest, color: '#ef4444' },
    { name: 'Nebenkosten', value: additionalCosts, color: '#f59e0b' }
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={140}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => formatCurrency(value)} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const CashflowChart: React.FC<{
  monthlyPayment: number;
  monthlyInsurance: number;
  monthlyMaintenance: number;
}> = ({ monthlyPayment, monthlyInsurance, monthlyMaintenance }) => {
  const data = [
    { name: 'Tilgung & Zinsen', value: monthlyPayment - monthlyInsurance - monthlyMaintenance },
    { name: 'Versicherung', value: monthlyInsurance },
    { name: 'Instandhaltung', value: monthlyMaintenance }
  ].filter(item => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `€${value.toFixed(0)}`} />
        <Tooltip formatter={(value: any) => formatCurrency(value)} />
        <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
