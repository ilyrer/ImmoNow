/**
 * PROFESSIONAL FINANCING CALCULATOR V2.0
 * Enterprise-Grade Banking Application
 * 
 * Architecture:
 * - Left Panel: Collapsible Input Sections (Accordion)
 * - Right Panel: Sticky KPI Summary + Results Tabs
 * - Pure calculation logic separated in lib/finance/calculations.ts
 * - State management via custom hook
 * - Banking-grade UX with Glasmorphism design
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator,
    Download,
    Save,
    Building2,
    TrendingUp,
    Landmark,
    BarChart3,
    FileText,
    ChevronDown,
    ChevronUp,
    Home,
    DollarSign,
    Percent,
    Calendar,
    Shield,
    Wrench,
    PiggyBank,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';

// Hooks and utilities
import { useFinancingCalculator, useInvestmentAnalysis } from '../../hooks/useFinancingCalculator';
import { applyPreset, SCENARIO_PRESETS } from '../../lib/finance/scenarios';

// UI Components
import { MoneyInput, ToggleCard, SectionCard, KPIStatCard, Tooltip } from './ui/InputComponents';
import { PresetSelector, ScenarioList } from './ui/ScenarioComponents';

// Export services
import { generateFinancingWord } from './WordExportService';
import { formatCurrency, formatPercent } from './PDFExportService';
import { generateProfessionalPDF, downloadHTMLReport, exportFinancingJSON, exportToCSV } from './ProfessionalPDFService';

// Tabs
import { CalculatorResultsView } from './tabs/CalculatorResultsView';
import { BankComparisonView } from './tabs/BankComparisonView';
import { InvestmentAnalysisView } from './tabs/InvestmentAnalysisView';

type TabType = 'results' | 'banks' | 'investment' | 'scenarios';

const ProfessionalFinancingCalculatorV2: React.FC = () => {
    // ==================== STATE MANAGEMENT ====================
    const calculator = useFinancingCalculator(undefined, {
        autoCalculate: true,
        validateOnChange: true
    });

    const { parameters, result, validationErrors, hasErrors, hasWarnings, updateParameter, saveCurrentScenario, currentScenario } = calculator;

    // UI State
    const [activeTab, setActiveTab] = useState<TabType>('results');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basis', 'kosten']));
    const [exportLoading, setExportLoading] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Investment parameters (for Investment Tab)
    const [monthlyRent, setMonthlyRent] = useState(2000);
    const [vacancyRate, setVacancyRate] = useState(5);

    const investmentMetrics = useInvestmentAnalysis(result, monthlyRent, vacancyRate);

    // ==================== SECTION MANAGEMENT ====================
    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }
            return next;
        });
    };

    // ==================== EXPORT ====================
    const handleWordExport = async () => {
        if (!result) return;

        setExportLoading(true);
        try {
            await generateFinancingWord({
                results: result,
                propertyPrice: parameters.propertyPrice,
                equity: parameters.equity,
                interestRate: parameters.interestRate,
                loanTerm: parameters.loanTerm,
                additionalCosts: parameters.additionalCosts,
                includeInsurance: parameters.includeInsurance,
                insuranceRate: parameters.insuranceRate,
                includeRepayment: parameters.includeRepayment,
                repaymentAmount: parameters.repaymentAmount,
                maintenanceRate: parameters.maintenanceRate,
                customerName: 'Kunde',
                propertyAddress: 'Immobilienadresse',
                bankName: 'ImmoNow Finanzberatung'
            });

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setExportLoading(false);
        }
    };

    // ==================== SAVE SCENARIO ====================
    const handleSaveScenario = () => {
        if (!result) return;

        const name = prompt('Szenario-Name:', currentScenario?.name || `Finanzierung ${new Date().toLocaleDateString('de-DE')}`);
        if (!name) return;

        const description = prompt('Beschreibung (optional):', currentScenario?.description || '');

        const saved = saveCurrentScenario(name, description || '');
        if (saved) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    // ==================== RENDER ====================
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/30 relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.15, 0.25, 0.15],
                        x: [0, 100, 0],
                        y: [0, 50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-400/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.1, 0.2, 0.1],
                        x: [0, -50, 0],
                        y: [0, 100, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-400/10 rounded-full blur-3xl"
                />
            </div>

            {/* Success Toast */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -100, scale: 0.8 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-white/20"
                    >
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-semibold">Erfolgreich gespeichert!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-[1920px] mx-auto p-6 relative z-10">
                {/* ========== HEADER ========== */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/50 p-8 mb-6 relative overflow-hidden"
                >
                    {/* Header Gradient Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                    <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
                        {/* Logo & Title */}
                        <div className="flex items-center space-x-4">
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl p-4 shadow-xl relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                                <Calculator className="w-10 h-10 text-white relative z-10" />
                            </motion.div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                                    Finanzierungsrechner Professional
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
                                    <span className="text-blue-600 dark:text-blue-400">Banking-Grade</span> Analyse •
                                    <span className="text-indigo-600 dark:text-indigo-400"> Enterprise UX</span> •
                                    <span className="text-purple-600 dark:text-purple-400"> Scenario Management</span>
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-3 flex-wrap">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSaveScenario}
                                disabled={!result}
                                className="group flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl border border-white/20"
                            >
                                <Save className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                                <span>Speichern</span>
                            </motion.button>

                            {/* PDF Export (Premium) */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                    if (!result) return;
                                    setExportLoading(true);
                                    try {
                                        await generateProfessionalPDF({
                                            result,
                                            parameters,
                                            customerName: 'Kunde',
                                            propertyAddress: 'Immobilienadresse',
                                            advisorName: 'Finanzberater',
                                            companyName: 'ImmoNow Finanzberatung'
                                        });
                                        setShowSuccess(true);
                                        setTimeout(() => setShowSuccess(false), 3000);
                                    } catch (error) {
                                        console.error('PDF export error:', error);
                                    } finally {
                                        setExportLoading(false);
                                    }
                                }}
                                disabled={!result || exportLoading}
                                className="group flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl border border-white/20"
                            >
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                                <span>{exportLoading ? 'Exportiere...' : 'PDF Report'}</span>
                            </motion.button>

                            {/* Dropdown for more export options */}
                            <div className="relative group">
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    className="flex items-center space-x-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl border border-white/20"
                                    disabled={!result}
                                >
                                    <FileText className="w-5 h-5" />
                                    <ChevronDown className="w-4 h-4" />
                                </motion.button>

                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                    <div className="py-2">
                                        <button
                                            onClick={() => result && exportFinancingJSON({ result, parameters })}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center space-x-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>JSON Export</span>
                                        </button>
                                        <button
                                            onClick={() => result && exportToCSV({ result, parameters })}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center space-x-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>CSV Export (Excel)</span>
                                        </button>
                                        <button
                                            onClick={() => result && downloadHTMLReport({ result, parameters })}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center space-x-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>HTML Report</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Validation Status */}
                    {(hasErrors || hasWarnings) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex items-start space-x-2">
                                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${hasErrors ? 'text-red-500' : 'text-yellow-500'}`} />
                                <div className="flex-1">
                                    <h4 className={`font-semibold ${hasErrors ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                        {hasErrors ? 'Validierungsfehler' : 'Warnungen'}
                                    </h4>
                                    <ul className="mt-2 space-y-1 text-sm">
                                        {validationErrors.map((error, i) => (
                                            <li key={i} className={error.severity === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}>
                                                • {error.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* ========== PRESETS ========== */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 mb-6"
                >
                    <PresetSelector
                        currentParameters={parameters}
                        onApplyPreset={(preset) => {
                            const newParams = applyPreset(preset, parameters);
                            calculator.setParameters(newParams);
                        }}
                    />
                </motion.div>

                {/* ========== MAIN LAYOUT: 2 COLUMNS ========== */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                    {/* LEFT COLUMN: INPUT ACCORDION */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="xl:col-span-5 space-y-4"
                    >
                        {/* Basis Daten */}
                        <InputSection
                            title="Basis-Daten"
                            icon={<Home className="w-5 h-5" />}
                            isExpanded={expandedSections.has('basis')}
                            onToggle={() => toggleSection('basis')}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <MoneyInput
                                    label="Kaufpreis"
                                    value={parameters.propertyPrice}
                                    onChange={(v) => updateParameter('propertyPrice', v)}
                                    icon={<Home className="w-4 h-4" />}
                                    step={10000}
                                    min={1000}
                                    info="Kaufpreis der Immobilie"
                                />

                                <MoneyInput
                                    label="Eigenkapital"
                                    value={parameters.equity}
                                    onChange={(v) => updateParameter('equity', v)}
                                    icon={<PiggyBank className="w-4 h-4" />}
                                    step={5000}
                                    min={0}
                                    info={`${((parameters.equity / parameters.propertyPrice) * 100).toFixed(1)}% EK-Quote`}
                                />

                                <MoneyInput
                                    label="Zinssatz p.a."
                                    value={parameters.interestRate}
                                    onChange={(v) => updateParameter('interestRate', v)}
                                    icon={<Percent className="w-4 h-4" />}
                                    suffix="%"
                                    step={0.05}
                                    decimals={2}
                                    min={0}
                                    max={20}
                                />

                                <MoneyInput
                                    label="Laufzeit"
                                    value={parameters.loanTerm}
                                    onChange={(v) => updateParameter('loanTerm', v)}
                                    icon={<Calendar className="w-4 h-4" />}
                                    suffix="Jahre"
                                    step={1}
                                    min={1}
                                    max={50}
                                />

                                <MoneyInput
                                    label="Zinsbindung"
                                    value={parameters.fixedRatePeriod || parameters.loanTerm}
                                    onChange={(v) => updateParameter('fixedRatePeriod', v)}
                                    icon={<Calendar className="w-4 h-4" />}
                                    suffix="Jahre"
                                    step={1}
                                    min={1}
                                    max={parameters.loanTerm}
                                    info="Zeitraum der Zinsfestschreibung"
                                />
                            </div>
                        </InputSection>

                        {/* Kosten & Gebühren */}
                        <InputSection
                            title="Kosten & Gebühren"
                            icon={<DollarSign className="w-5 h-5" />}
                            isExpanded={expandedSections.has('kosten')}
                            onToggle={() => toggleSection('kosten')}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <MoneyInput
                                    label="Kaufnebenkosten"
                                    value={parameters.additionalCosts}
                                    onChange={(v) => updateParameter('additionalCosts', v)}
                                    icon={<FileText className="w-4 h-4" />}
                                    step={1000}
                                    info="Notar, Grunderwerbsteuer, Makler"
                                />

                                <MoneyInput
                                    label="Instandhaltung p.a."
                                    value={parameters.maintenanceRate}
                                    onChange={(v) => updateParameter('maintenanceRate', v)}
                                    icon={<Wrench className="w-4 h-4" />}
                                    suffix="%"
                                    step={0.1}
                                    decimals={1}
                                    info={`${formatCurrency((parameters.maintenanceRate / 100) * parameters.propertyPrice / 12)}/Monat`}
                                />

                                <MoneyInput
                                    label="Bearbeitungsgebühr"
                                    value={parameters.fees?.processingFee || 0}
                                    onChange={(v) => updateParameter('fees', { ...parameters.fees, processingFee: v, appraisalFee: parameters.fees?.appraisalFee || 0, brokerFee: parameters.fees?.brokerFee || 0 })}
                                    icon={<FileText className="w-4 h-4" />}
                                    step={100}
                                />

                                <MoneyInput
                                    label="Schätzgebühr"
                                    value={parameters.fees?.appraisalFee || 0}
                                    onChange={(v) => updateParameter('fees', { ...parameters.fees, appraisalFee: v, processingFee: parameters.fees?.processingFee || 0, brokerFee: parameters.fees?.brokerFee || 0 })}
                                    icon={<FileText className="w-4 h-4" />}
                                    step={100}
                                />
                            </div>
                        </InputSection>

                        {/* Versicherung & Sondertilgung */}
                        <InputSection
                            title="Zusatzoptionen"
                            icon={<Shield className="w-5 h-5" />}
                            isExpanded={expandedSections.has('extras')}
                            onToggle={() => toggleSection('extras')}
                        >
                            <div className="space-y-4">
                                <ToggleCard
                                    label="Gebäudeversicherung"
                                    description="Monatliche Versicherungsprämie einbeziehen"
                                    icon={<Shield className="w-5 h-5" />}
                                    checked={parameters.includeInsurance}
                                    onChange={(v) => updateParameter('includeInsurance', v)}
                                    gradient="from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                                >
                                    <MoneyInput
                                        label="Versicherungssatz p.a."
                                        value={parameters.insuranceRate}
                                        onChange={(v) => updateParameter('insuranceRate', v)}
                                        suffix="%"
                                        step={0.01}
                                        decimals={2}
                                        info={`${formatCurrency((parameters.insuranceRate / 100) * parameters.propertyPrice / 12)}/Monat`}
                                    />
                                </ToggleCard>

                                <ToggleCard
                                    label="Sondertilgung"
                                    description="Jährliche Sondertilgung zur schnelleren Entschuldung"
                                    icon={<TrendingUp className="w-5 h-5" />}
                                    checked={parameters.includeRepayment}
                                    onChange={(v) => updateParameter('includeRepayment', v)}
                                    gradient="from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                                >
                                    <MoneyInput
                                        label="Betrag pro Jahr"
                                        value={parameters.repaymentAmount}
                                        onChange={(v) => updateParameter('repaymentAmount', v)}
                                        step={1000}
                                        info="Reduziert Laufzeit und Gesamtkosten erheblich"
                                    />
                                </ToggleCard>
                            </div>
                        </InputSection>
                    </motion.div>

                    {/* RIGHT COLUMN: STICKY KPI + RESULTS */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="xl:col-span-7 space-y-6"
                    >
                        {/* STICKY KPI SUMMARY */}
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="sticky top-6 z-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
                            >
                                {/* Animated background elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-2xl" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl" />

                                <div className="relative z-10">
                                    <h2 className="text-2xl font-bold mb-6 flex items-center">
                                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl mr-3">
                                            <BarChart3 className="w-6 h-6" />
                                        </div>
                                        KPI Summary
                                    </h2>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <KPISummaryItem
                                            label="Monatsrate"
                                            value={formatCurrency(result.monthlyPayment)}
                                            subtitle="inkl. Nebenkosten"
                                        />
                                        <KPISummaryItem
                                            label="Darlehenssumme"
                                            value={formatCurrency(result.loanAmount)}
                                            subtitle={`${result.loanToValue.toFixed(1)}% LTV`}
                                        />
                                        <KPISummaryItem
                                            label="Zinsen gesamt"
                                            value={formatCurrency(result.totalInterest)}
                                            subtitle={`Eff. ${result.effectiveInterestRate.toFixed(2)}%`}
                                        />
                                        <KPISummaryItem
                                            label="Restschuld"
                                            value={formatCurrency(result.remainingDebtAfterFixedRate)}
                                            subtitle={`nach ${result.fixedRatePeriod} J.`}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB NAVIGATION */}
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                            {/* Tabs Header */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700">
                                <TabButton
                                    active={activeTab === 'results'}
                                    onClick={() => setActiveTab('results')}
                                    icon={<Calculator className="w-5 h-5" />}
                                    label="Ergebnisse"
                                />
                                <TabButton
                                    active={activeTab === 'banks'}
                                    onClick={() => setActiveTab('banks')}
                                    icon={<Landmark className="w-5 h-5" />}
                                    label="Banken"
                                />
                                <TabButton
                                    active={activeTab === 'investment'}
                                    onClick={() => setActiveTab('investment')}
                                    icon={<TrendingUp className="w-5 h-5" />}
                                    label="Investment"
                                />
                                <TabButton
                                    active={activeTab === 'scenarios'}
                                    onClick={() => setActiveTab('scenarios')}
                                    icon={<FileText className="w-5 h-5" />}
                                    label="Szenarien"
                                />
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'results' && result && (
                                        <motion.div
                                            key="results"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <CalculatorResultsView result={result} parameters={parameters} />
                                        </motion.div>
                                    )}
                                    {activeTab === 'banks' && (
                                        <motion.div
                                            key="banks"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <BankComparisonView
                                                loanAmount={result?.loanAmount}
                                                loanTerm={parameters.loanTerm}
                                            />
                                        </motion.div>
                                    )}
                                    {activeTab === 'investment' && investmentMetrics && (
                                        <motion.div
                                            key="investment"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <InvestmentAnalysisView
                                                metrics={investmentMetrics}
                                                monthlyRent={monthlyRent}
                                                setMonthlyRent={setMonthlyRent}
                                                vacancyRate={vacancyRate}
                                                setVacancyRate={setVacancyRate}
                                                propertyPrice={parameters.propertyPrice}
                                                equity={parameters.equity}
                                            />
                                        </motion.div>
                                    )}
                                    {activeTab === 'scenarios' && (
                                        <motion.div
                                            key="scenarios"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <ScenarioList
                                                scenarios={calculator.scenarios}
                                                currentScenarioId={currentScenario?.id}
                                                onLoadScenario={calculator.loadScenario}
                                                onDeleteScenario={calculator.deleteScenarioById}
                                                onDuplicateScenario={(id) => calculator.duplicateScenarioById(id)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

// ==================== SUB-COMPONENTS ====================

interface InputSectionProps {
    title: string;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const InputSection: React.FC<InputSectionProps> = ({ title, icon, isExpanded, onToggle, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/40 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-shadow"
    >
        <button
            onClick={onToggle}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all group"
        >
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                </h3>
            </div>
            <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            >
                <ChevronDown className="w-6 h-6" />
            </motion.div>
        </button>

        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="px-6 pb-6 pt-2 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/50">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
    <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-semibold transition-all ${active
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700/50 dark:hover:to-gray-800/50'
            }`}
    >
        {active && (
            <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        )}
        <span className="relative z-10 flex items-center space-x-2">
            {icon}
            <span>{label}</span>
        </span>
    </motion.button>
);

interface KPISummaryItemProps {
    label: string;
    value: string;
    subtitle: string;
}

const KPISummaryItem: React.FC<KPISummaryItemProps> = ({ label, value, subtitle }) => (
    <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all cursor-default"
    >
        <div className="text-sm opacity-90 mb-2 font-medium">{label}</div>
        <div className="text-2xl font-bold mb-1 text-white">{value}</div>
        <div className="text-xs opacity-75 bg-white/10 rounded-full px-2 py-1 inline-block">{subtitle}</div>
    </motion.div>
);

interface EmptyStateMessageProps {
    icon: React.ReactNode;
    title: string;
    message: string;
}

const EmptyStateMessage: React.FC<EmptyStateMessageProps> = ({ icon, title, message }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex flex-col items-center justify-center py-16 text-center"
    >
        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full p-6 mb-6">
            <div className="text-blue-600 dark:text-blue-400">
                {icon}
            </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {message}
        </p>
    </motion.div>
);

export default ProfessionalFinancingCalculatorV2;
