/**
 * Investment Analysis View
 * ROI calculations, cashflow analysis, and stress tests
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    DollarSign,
    PiggyBank,
    Home,
    Percent,
    Calculator,
    BarChart3
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { MoneyInput } from '../ui/InputComponents';
import { formatCurrency, formatPercent } from '../PDFExportService';

interface InvestmentAnalysisViewProps {
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

export const InvestmentAnalysisView: React.FC<InvestmentAnalysisViewProps> = ({
    metrics,
    monthlyRent,
    setMonthlyRent,
    vacancyRate,
    setVacancyRate,
    propertyPrice,
    equity
}) => {
    // Simple investment score
    const calculateScore = (): number => {
        let score = 50;
        if (metrics.cashflow > 0) score += 30;
        if (metrics.grossYield > 4) score += 20;
        return Math.min(100, score);
    };

    const score = calculateScore();
    const getScoreColor = () => {
        if (score >= 80) return 'from-green-500 to-emerald-600';
        if (score >= 60) return 'from-blue-500 to-indigo-600';
        if (score >= 40) return 'from-yellow-500 to-orange-600';
        return 'from-red-500 to-red-600';
    };

    // Cashflow projection over 10 years
    const cashflowProjection = useMemo(() => {
        const years = [];
        const yearlyRent = monthlyRent * 12 * (1 - vacancyRate / 100);
        const rentIncrease = 0.02; // 2% annual increase

        for (let year = 1; year <= 10; year++) {
            const adjustedRent = yearlyRent * Math.pow(1 + rentIncrease, year - 1);
            const netCashflow = metrics.cashflow * 12 * Math.pow(1 + rentIncrease, year - 1);
            const cumulativeCashflow = netCashflow * year;

            years.push({
                year: `Jahr ${year}`,
                mieteinnahmen: Math.round(adjustedRent),
                cashflow: Math.round(netCashflow),
                kumuliert: Math.round(cumulativeCashflow)
            });
        }
        return years;
    }, [monthlyRent, vacancyRate, metrics.cashflow]);

    // Cost breakdown pie chart
    const costBreakdown = useMemo(() => {
        const yearlyRent = monthlyRent * 12 * (1 - vacancyRate / 100);
        const maintenanceCost = propertyPrice * 0.015; // 1.5% maintenance
        const managementFee = yearlyRent * 0.03; // 3% property management
        const insurance = 500; // Annual insurance
        const propertyTax = propertyPrice * 0.0035; // 0.35% property tax (Grundsteuer)

        return [
            { name: 'Instandhaltung', value: Math.round(maintenanceCost), color: '#3b82f6' },
            { name: 'Verwaltung', value: Math.round(managementFee), color: '#8b5cf6' },
            { name: 'Versicherung', value: insurance, color: '#06b6d4' },
            { name: 'Grundsteuer', value: Math.round(propertyTax), color: '#10b981' }
        ];
    }, [propertyPrice, monthlyRent, vacancyRate]);

    const totalAnnualCosts = costBreakdown.reduce((sum, item) => sum + item.value, 0);

    // Calculate additional metrics
    const netRentYield = useMemo(() => {
        const yearlyRent = monthlyRent * 12 * (1 - vacancyRate / 100);
        return ((yearlyRent - totalAnnualCosts) / propertyPrice) * 100;
    }, [monthlyRent, vacancyRate, propertyPrice, totalAnnualCosts]);

    const breakevenYears = useMemo(() => {
        if (metrics.cashflow <= 0) return null;
        const annualCashflow = metrics.cashflow * 12;
        return Math.ceil(equity / annualCashflow);
    }, [metrics.cashflow, equity]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {/* Investment Score */}
            <div className={`bg-gradient-to-br ${getScoreColor()} rounded-2xl p-6 text-white`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">
                            Investment-Bewertung
                        </h3>
                        <div className="text-4xl font-bold">{score}/100</div>
                    </div>
                    <TrendingUp className="w-16 h-16 opacity-50" />
                </div>
                <div className="mt-4 w-full bg-white/20 rounded-full h-3">
                    <div
                        className="bg-white rounded-full h-3 transition-all duration-1000"
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            {/* Input Parameters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                    Vermietungsparameter
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MoneyInput
                        label="Monatliche Kaltmiete"
                        value={monthlyRent}
                        onChange={setMonthlyRent}
                        step={100}
                        info="Erwartete monatliche Mieteinnahmen"
                    />

                    <MoneyInput
                        label="Leerstandsquote"
                        value={vacancyRate}
                        onChange={setVacancyRate}
                        suffix="%"
                        step={1}
                        decimals={0}
                        info="Erwarteter Leerstand pro Jahr"
                    />
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InvestmentMetricCard
                    icon={<Percent className="w-6 h-6" />}
                    label="Bruttomietrendite"
                    value={formatPercent(metrics.grossYield)}
                    positive={metrics.grossYield > 3}
                />
                <InvestmentMetricCard
                    icon={<DollarSign className="w-6 h-6" />}
                    label="Cashflow (monatlich)"
                    value={formatCurrency(metrics.cashflow)}
                    positive={metrics.cashflow > 0}
                />
                <InvestmentMetricCard
                    icon={<TrendingUp className="w-6 h-6" />}
                    label="Cash-on-Cash Return"
                    value={formatPercent(metrics.cashOnCashReturn)}
                    positive={metrics.cashOnCashReturn > 5}
                />
                <InvestmentMetricCard
                    icon={<Home className="w-6 h-6" />}
                    label="Nettomietrendite"
                    value={formatPercent(netRentYield)}
                    positive={netRentYield > 2.5}
                />
            </div>

            {/* Breakeven Analysis */}
            {breakevenYears && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <Calculator className="w-6 h-6" />
                                <span className="text-sm font-semibold uppercase tracking-wide">Break-Even Analyse</span>
                            </div>
                            <div className="text-4xl font-bold mb-2">{breakevenYears} Jahre</div>
                            <p className="text-white/90">bis zur Amortisation des Eigenkapitals durch Cashflow</p>
                        </div>
                        <PiggyBank className="w-20 h-20 opacity-30" />
                    </div>
                </motion.div>
            )}

            {/* Cashflow Projection Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Cashflow-Projektion (10 Jahre)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={cashflowProjection}>
                        <defs>
                            <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <RechartsTooltip
                            formatter={(value: any) => formatCurrency(value)}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="cashflow"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorCashflow)"
                            name="Jährlicher Cashflow"
                        />
                        <Area
                            type="monotone"
                            dataKey="kumuliert"
                            stroke="#10b981"
                            fillOpacity={0.3}
                            fill="#10b981"
                            name="Kumulierter Cashflow"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Cost Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Jährliche Kostenverteilung
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={costBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {costBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Kostenübersicht (jährlich)
                    </h3>
                    <div className="space-y-3">
                        {costBreakdown.map((cost, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cost.color }} />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{cost.name}</span>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {formatCurrency(cost.value)}
                                </span>
                            </div>
                        ))}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <span className="font-bold text-gray-900 dark:text-white">Gesamt</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(totalAnnualCosts)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warnings */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-semibold mb-2">Hinweise zur Investment-Analyse:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Dies ist eine vereinfachte Berechnung für erste Einschätzungen</li>
                            <li>Berücksichtigen Sie auch: Steuern, nicht umlegbare Kosten, Verwaltung</li>
                            <li>Vollständige ROI-Analyse mit IRR/NPV in Entwicklung</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Detaillierte Aufschlüsselung
                </h3>

                <div className="space-y-3 text-sm">
                    <BreakdownRow label="Jahresmiete (brutto)" value={formatCurrency(monthlyRent * 12)} />
                    <BreakdownRow label="Leerstand (-)" value={formatCurrency(monthlyRent * 12 * (vacancyRate / 100))} />
                    <BreakdownRow label="Jahresmiete (netto)" value={formatCurrency(monthlyRent * 12 * (1 - vacancyRate / 100))} bold />
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                    <BreakdownRow label="Kaufpreis" value={formatCurrency(propertyPrice)} />
                    <BreakdownRow label="Eigenkapital" value={formatCurrency(equity)} />
                    <BreakdownRow label="Bruttomietrendite" value={formatPercent(metrics.grossYield)} bold />
                </div>
            </div>
        </motion.div>
    );
};

// Sub-components
const InvestmentMetricCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    positive: boolean
}> = ({ icon, label, value, positive }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        className={`bg-gradient-to-br ${positive
                ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                : 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
            } rounded-xl p-5 border-2 transition-all`}
    >
        <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${positive ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                {icon}
            </div>
            {positive ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</div>
        <div className={`text-2xl font-bold ${positive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {value}
        </div>
    </motion.div>
);

const BreakdownRow: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold = false }) => (
    <div className={`flex justify-between ${bold ? 'font-bold' : ''}`}>
        <span className="text-gray-600 dark:text-gray-400">{label}:</span>
        <span className="text-gray-900 dark:text-white">{value}</span>
    </div>
);
