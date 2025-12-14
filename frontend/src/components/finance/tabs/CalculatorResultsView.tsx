/**
 * Calculator Results View
 * Displays amortization schedule, charts, and detailed breakdown
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
    LineChart,
    Line,
    BarChart,
    Bar,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Download, Info } from 'lucide-react';
import { FinancingResult, FinancingParameters } from '../../../types/finance';
import { formatCurrency, formatPercent } from '../PDFExportService';

interface CalculatorResultsViewProps {
    result: FinancingResult;
    parameters: FinancingParameters;
}

export const CalculatorResultsView: React.FC<CalculatorResultsViewProps> = ({ result, parameters }) => {
    const [activeChart, setActiveChart] = useState<'amortization' | 'breakdown' | 'comparison'>('amortization');
    const [yearRange, setYearRange] = useState(0); // For table pagination
    const YEARS_PER_PAGE = 10;

    // Chart data
    const amortizationData = result.chartData.map(d => ({
        Jahr: d.year,
        Restschuld: Math.round(d.remainingDebt),
        'Getilgt (kumulativ)': Math.round(d.cumulativePrincipal)
    }));

    const breakdownData = result.chartData.slice(0, Math.min(20, result.chartData.length)).map(d => ({
        Jahr: d.year,
        Zinsen: Math.round(d.yearlyInterest),
        Tilgung: Math.round(d.yearlyPrincipal)
    }));

    const pieData = [
        { name: 'Zinsen', value: result.totalInterest, color: '#ef4444' },
        { name: 'Tilgung', value: result.loanAmount, color: '#10b981' },
        { name: 'Gebühren', value: result.fees.total, color: '#f59e0b' }
    ];

    // Table pagination
    const startYear = yearRange * YEARS_PER_PAGE + 1;
    const endYear = Math.min((yearRange + 1) * YEARS_PER_PAGE, result.chartData.length);
    const displayedYears = result.chartData.slice(startYear - 1, endYear);
    const maxPages = Math.ceil(result.chartData.length / YEARS_PER_PAGE);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {/* Detailed Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Anfängliche Tilgung"
                    value={formatPercent(result.repaymentRate)}
                    color="text-green-600"
                />
                <MetricCard
                    label="Eigenkapitalquote"
                    value={formatPercent(result.equityRatio)}
                    color="text-blue-600"
                />
                <MetricCard
                    label="Beleihungsauslauf"
                    value={formatPercent(result.loanToValue)}
                    color="text-purple-600"
                />
                <MetricCard
                    label="Eff. Zinssatz"
                    value={formatPercent(result.effectiveInterestRate)}
                    color="text-orange-600"
                />
            </div>

            {/* Explanation Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
                        <p className="font-semibold mb-1">Berechnungsgrundlage:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Annuitätendarlehen mit konstanter Monatsrate über die Laufzeit</li>
                            <li>Zinsbindung: {result.fixedRatePeriod} Jahre, danach Restschuld: {formatCurrency(result.remainingDebtAfterFixedRate)}</li>
                            <li>Monatliche Rate (reine Finanzierung): {formatCurrency(result.baseMonthlyPayment)}</li>
                            {parameters.includeInsurance && <li>+ Versicherung: {formatCurrency(result.monthlyInterest)}/Monat</li>}
                            <li>+ Instandhaltung: {formatCurrency(result.monthlyPrincipal)}/Monat</li>
                            {result.fees.total > 0 && <li>Gebühren gesamt: {formatCurrency(result.fees.total)}</li>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Visualisierungen</h3>

                    <div className="flex items-center space-x-2">
                        <ChartButton
                            active={activeChart === 'amortization'}
                            onClick={() => setActiveChart('amortization')}
                            label="Restschuldverlauf"
                        />
                        <ChartButton
                            active={activeChart === 'breakdown'}
                            onClick={() => setActiveChart('breakdown')}
                            label="Zins/Tilgung"
                        />
                        <ChartButton
                            active={activeChart === 'comparison'}
                            onClick={() => setActiveChart('comparison')}
                            label="Kostenverteilung"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                    {activeChart === 'amortization' && (
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={amortizationData}>
                                <defs>
                                    <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis dataKey="Jahr" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                                    labelStyle={{ color: '#fff' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="Restschuld" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDebt)" />
                                <Area type="monotone" dataKey="Getilgt (kumulativ)" stroke="#10b981" fillOpacity={1} fill="url(#colorPaid)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}

                    {activeChart === 'breakdown' && (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={breakdownData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis dataKey="Jahr" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                                    labelStyle={{ color: '#fff' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend />
                                <Bar dataKey="Zinsen" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Tilgung" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {activeChart === 'comparison' && (
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Amortization Table */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tilgungsplan (Jahresübersicht)</h3>

                    {/* Pagination */}
                    {maxPages > 1 && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setYearRange(Math.max(0, yearRange - 1))}
                                disabled={yearRange === 0}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                            >
                                ←
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Jahre {startYear}-{endYear} von {result.chartData.length}
                            </span>
                            <button
                                onClick={() => setYearRange(Math.min(maxPages - 1, yearRange + 1))}
                                disabled={yearRange >= maxPages - 1}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300">Jahr</th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">Monatsrate</th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">Zinsen/Jahr</th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">Tilgung/Jahr</th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">Restschuld</th>
                                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">Fortschritt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedYears.map((row) => (
                                <tr
                                    key={row.year}
                                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{row.year}</td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(result.baseMonthlyPayment)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-red-600 dark:text-red-400">
                                        {formatCurrency(row.yearlyInterest)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-green-600 dark:text-green-400">
                                        {formatCurrency(row.yearlyPrincipal)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-blue-600 dark:text-blue-400">
                                        {formatCurrency(row.remainingDebt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                                                    style={{ width: `${row.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                {row.progress.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

// Sub-components
const MetricCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
);

const ChartButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${active
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
    >
        {label}
    </button>
);
