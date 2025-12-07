/**
 * Investment Analysis Tab - ROI, Cashflow, and rental property analysis
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Percent,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { formatCurrency, formatPercent } from '../finance/PDFExportService';

interface InvestmentTabProps {
  metrics: {
    grossYield: number;
    netYield: number;
    cashflow: number;
    cashOnCashReturn: number;
    capRate: number;
  };
  monthlyRent: number;
  setMonthlyRent: (value: number) => void;
  vacancyRate: number;
  setVacancyRate: (value: number) => void;
  propertyPrice: number;
  equity: number;
}

export const InvestmentTab: React.FC<InvestmentTabProps> = ({
  metrics,
  monthlyRent,
  setMonthlyRent,
  vacancyRate,
  setVacancyRate,
  propertyPrice,
  equity
}) => {
  // Calculate projected returns over time
  const projectedReturns = Array.from({ length: 20 }, (_, i) => {
    const year = i + 1;
    const cumulativeCashflow = metrics.cashflow * year;
    const appreciationRate = 0.02; // 2% per year assumption
    const propertyValue = propertyPrice * Math.pow(1 + appreciationRate, year);
    const totalReturn = cumulativeCashflow + (propertyValue - propertyPrice);
    const roiPercent = (totalReturn / equity) * 100;
    
    return {
      year,
      cashflow: cumulativeCashflow,
      propertyValue,
      totalReturn,
      roi: roiPercent
    };
  });

  // Investment quality score (0-100)
  const calculateInvestmentScore = (): number => {
    let score = 0;
    
    // Cashflow score (40 points max)
    if (metrics.cashflow > 0) score += 40;
    else if (metrics.cashflow > -200) score += 20;
    
    // Cash-on-cash return score (30 points max)
    if (metrics.cashOnCashReturn > 8) score += 30;
    else if (metrics.cashOnCashReturn > 5) score += 20;
    else if (metrics.cashOnCashReturn > 3) score += 10;
    
    // Cap rate score (20 points max)
    if (metrics.capRate > 5) score += 20;
    else if (metrics.capRate > 3) score += 10;
    
    // Gross yield score (10 points max)
    if (metrics.grossYield > 4) score += 10;
    else if (metrics.grossYield > 3) score += 5;
    
    return score;
  };

  const investmentScore = calculateInvestmentScore();
  
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-indigo-600';
    if (score >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Exzellente Investition';
    if (score >= 60) return 'Gute Investition';
    if (score >= 40) return 'Akzeptable Investition';
    return 'Risikoreiche Investition';
  };

  return (
    <motion.div
      key="investment"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* ========== INVESTMENT SCORE CARD ========== */}
      <div className={`bg-gradient-to-br ${getScoreColor(investmentScore)} rounded-2xl shadow-2xl p-8 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-75 mb-2">Investment-Bewertung</div>
            <h2 className="text-4xl font-bold mb-4">{getScoreLabel(investmentScore)}</h2>
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-sm opacity-75">Bewertungsscore</div>
                <div className="text-3xl font-bold">{investmentScore}/100</div>
              </div>
              <div className="w-48 bg-white/20 rounded-full h-4">
                <motion.div
                  className="bg-white rounded-full h-4"
                  initial={{ width: 0 }}
                  animate={{ width: `${investmentScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
            <Target className="w-16 h-16" />
          </div>
        </div>
      </div>

      {/* ========== RENTAL PARAMETERS ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Home className="w-6 h-6 mr-3 text-blue-600" />
          Vermietungsparameter
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Monatliche Kaltmiete
            </label>
            <div className="relative">
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value) || 0)}
                step={50}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white text-right pr-12 font-mono font-semibold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                €
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(monthlyRent * 12)} pro Jahr
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Leerstandsrate
            </label>
            <div className="relative">
              <input
                type="number"
                value={vacancyRate}
                onChange={(e) => setVacancyRate(Number(e.target.value) || 0)}
                step={1}
                min={0}
                max={50}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white text-right pr-12 font-mono font-semibold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                %
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Typisch: 3-7% pro Jahr
            </p>
          </div>
        </div>
      </div>

      {/* ========== KEY METRICS GRID ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InvestmentMetricCard
          icon={<Percent className="w-8 h-8" />}
          label="Bruttomietrendite"
          value={formatPercent(metrics.grossYield)}
          gradient="from-blue-500 to-blue-600"
          isPositive={metrics.grossYield > 3}
          subtitle={metrics.grossYield > 4 ? 'Sehr gut' : metrics.grossYield > 3 ? 'Gut' : 'Schwach'}
        />

        <InvestmentMetricCard
          icon={<TrendingUp className="w-8 h-8" />}
          label="Nettomietrendite"
          value={formatPercent(metrics.netYield)}
          gradient="from-indigo-500 to-indigo-600"
          isPositive={metrics.netYield > 2}
          subtitle={metrics.netYield > 3 ? 'Exzellent' : metrics.netYield > 2 ? 'Solide' : 'Niedrig'}
        />

        <InvestmentMetricCard
          icon={<DollarSign className="w-8 h-8" />}
          label="Cap Rate"
          value={formatPercent(metrics.capRate)}
          gradient="from-purple-500 to-purple-600"
          isPositive={metrics.capRate > 3}
          subtitle="Kapitalisierungsrate"
        />

        <InvestmentMetricCard
          icon={metrics.cashflow >= 0 ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownRight className="w-8 h-8" />}
          label="Jährlicher Cashflow"
          value={formatCurrency(metrics.cashflow)}
          gradient={metrics.cashflow >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-red-600'}
          isPositive={metrics.cashflow >= 0}
          subtitle={metrics.cashflow >= 0 ? 'Positiver Cashflow' : 'Negativer Cashflow'}
        />

        <InvestmentMetricCard
          icon={<Target className="w-8 h-8" />}
          label="Cash-on-Cash Return"
          value={formatPercent(metrics.cashOnCashReturn)}
          gradient="from-yellow-500 to-orange-600"
          isPositive={metrics.cashOnCashReturn > 5}
          subtitle="Rendite auf Eigenkapital"
        />

        <InvestmentMetricCard
          icon={<Calendar className="w-8 h-8" />}
          label="Eigenkapital-Multiplikator"
          value={`${((propertyPrice / equity)).toFixed(2)}x`}
          gradient="from-teal-500 to-cyan-600"
          isPositive={true}
          subtitle="Hebel-Effekt"
        />
      </div>

      {/* ========== PROJECTED RETURNS CHART ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Projizierte Rendite-Entwicklung (20 Jahre)
        </h3>
        
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projectedReturns}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} label={{ value: 'Jahre', position: 'insideBottom', offset: -5 }} />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                label={{ value: 'Gesamtertrag', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: any, name: string) => [
                  formatCurrency(value),
                  name === 'totalReturn' ? 'Gesamtertrag' : name === 'cashflow' ? 'Kumulierter Cashflow' : name
                ]}
                labelFormatter={(label) => `Jahr ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="totalReturn"
                stroke="#22c55e"
                strokeWidth={3}
                dot={false}
                name="Gesamtertrag"
              />
              <Line
                type="monotone"
                dataKey="cashflow"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Kumulierter Cashflow"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Projection Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nach 10 Jahren</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(projectedReturns[9].totalReturn)}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              ROI: {formatPercent(projectedReturns[9].roi)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nach 15 Jahren</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(projectedReturns[14].totalReturn)}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              ROI: {formatPercent(projectedReturns[14].roi)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nach 20 Jahren</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(projectedReturns[19].totalReturn)}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              ROI: {formatPercent(projectedReturns[19].roi)}
            </div>
          </div>
        </div>
      </div>

      {/* ========== INVESTMENT INSIGHTS ========== */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          {metrics.cashflow >= 0 ? (
            <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 mr-3 text-yellow-600" />
          )}
          Investment-Analyse
        </h3>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          {/* Cashflow Analysis */}
          <div className="flex items-start space-x-3">
            <div className={`mt-1 ${metrics.cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.cashflow >= 0 ? '✓' : '✗'}
            </div>
            <div>
              <p className="font-semibold">Cashflow-Situation:</p>
              <p>
                {metrics.cashflow >= 0
                  ? `Positiver monatlicher Cashflow von ${formatCurrency(metrics.cashflow / 12)}. Die Immobilie finanziert sich selbst und generiert Überschuss.`
                  : `Negativer monatlicher Cashflow von ${formatCurrency(Math.abs(metrics.cashflow / 12))}. Sie müssen monatlich zusätzliches Kapital einbringen.`}
              </p>
            </div>
          </div>

          {/* Yield Analysis */}
          <div className="flex items-start space-x-3">
            <div className={`mt-1 ${metrics.grossYield > 3 ? 'text-green-600' : 'text-yellow-600'}`}>
              {metrics.grossYield > 3 ? '✓' : '!'}
            </div>
            <div>
              <p className="font-semibold">Rendite-Bewertung:</p>
              <p>
                {metrics.grossYield > 4
                  ? `Exzellente Bruttomietrendite von ${formatPercent(metrics.grossYield)}. Überdurchschnittlich für den deutschen Markt.`
                  : metrics.grossYield > 3
                  ? `Solide Bruttomietrendite von ${formatPercent(metrics.grossYield)}. Entspricht dem Marktdurchschnitt.`
                  : `Niedrige Bruttomietrendite von ${formatPercent(metrics.grossYield)}. Fokus liegt auf Wertsteigerung.`}
              </p>
            </div>
          </div>

          {/* ROI Analysis */}
          <div className="flex items-start space-x-3">
            <div className={`mt-1 ${metrics.cashOnCashReturn > 5 ? 'text-green-600' : 'text-yellow-600'}`}>
              {metrics.cashOnCashReturn > 5 ? '✓' : '!'}
            </div>
            <div>
              <p className="font-semibold">Eigenkapital-Rendite:</p>
              <p>
                {metrics.cashOnCashReturn > 8
                  ? `Hervorragende Cash-on-Cash Return von ${formatPercent(metrics.cashOnCashReturn)}. Ihr eingesetztes Eigenkapital arbeitet sehr effizient.`
                  : metrics.cashOnCashReturn > 5
                  ? `Gute Cash-on-Cash Return von ${formatPercent(metrics.cashOnCashReturn)}. Solide Rendite auf Ihr Eigenkapital.`
                  : `Moderate Cash-on-Cash Return von ${formatPercent(metrics.cashOnCashReturn)}. Alternative Anlagen könnten attraktiver sein.`}
              </p>
            </div>
          </div>

          {/* Long-term Perspective */}
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 mt-1">ℹ</div>
            <div>
              <p className="font-semibold">Langfrist-Perspektive:</p>
              <p>
                Bei einer angenommenen Wertsteigerung von 2% p.a. und unter Berücksichtigung des Cashflows 
                erzielen Sie nach 20 Jahren einen Gesamtertrag von {formatCurrency(projectedReturns[19].totalReturn)}.
                Dies entspricht einer ROI von {formatPercent(projectedReturns[19].roi)} auf Ihr eingesetztes Eigenkapital.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Hinweis:</strong> Diese Analyse basiert auf Annahmen und dient der Orientierung. 
            Tatsächliche Renditen können durch Marktentwicklung, Leerstand, Instandhaltungskosten und Steuereffekte abweichen.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== SUB-COMPONENTS ====================

const InvestmentMetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  isPositive: boolean;
  subtitle: string;
}> = ({ icon, label, value, gradient, isPositive, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-xl`}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium opacity-90">{label}</span>
      <div className="opacity-75">{icon}</div>
    </div>
    <div className="text-3xl font-bold mb-1 flex items-center">
      {value}
      {isPositive ? (
        <TrendingUp className="w-6 h-6 ml-2 opacity-75" />
      ) : (
        <TrendingDown className="w-6 h-6 ml-2 opacity-75" />
      )}
    </div>
    <div className="text-sm opacity-75">{subtitle}</div>
  </motion.div>
);
