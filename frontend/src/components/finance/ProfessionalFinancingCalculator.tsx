/**
 * Professional Banking-Grade Financing Calculator
 * Enterprise-level design with advanced features
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  Building2,
  Calculator,
  PieChart,
  BarChart3,
  ArrowUpRight,
  Check,
  AlertCircle,
  Info,
  Percent,
  Calendar,
  Landmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { FinancingResult, FinancingParameters } from '../../types/finance';
import { formatCurrency, formatPercent } from './PDFExportService';
// TODO: Implement real bank offers API
import { generateFinancingWord } from './WordExportService';
import { CalculatorTab } from './CalculatorTab';
import { BankComparisonTab } from './BankComparisonTab';
import { InvestmentTab } from './InvestmentTab';

const ProfessionalFinancingCalculator: React.FC = () => {
  // ==================== STATE MANAGEMENT ====================
  const [parameters, setParameters] = useState<FinancingParameters>({
    propertyPrice: 500000,
    equity: 100000,
    interestRate: 3.45,
    loanTerm: 25,
    additionalCosts: 35000,
    includeInsurance: true,
    insuranceRate: 0.18,
    includeRepayment: false,
    repaymentAmount: 0,
    maintenanceRate: 1.2
  });

  const [activeTab, setActiveTab] = useState<'calculator' | 'banks' | 'investment'>('calculator');
  const [activeChart, setActiveChart] = useState<'amortization' | 'breakdown' | 'cashflow'>('amortization');
  const [results, setResults] = useState<FinancingResult | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Investment parameters
  const [monthlyRent, setMonthlyRent] = useState<number>(2000);
  const [vacancyRate, setVacancyRate] = useState<number>(5);

  // ==================== CALCULATIONS ====================
  const calculateFinancing = useMemo((): FinancingResult => {
    const loanAmount = parameters.propertyPrice - parameters.equity + parameters.additionalCosts;
    const monthlyInterestRate = parameters.interestRate / 100 / 12;
    const numberOfPayments = parameters.loanTerm * 12;

    // Monthly payment calculation (Annuity)
    const monthlyPayment = loanAmount *
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    // Additional monthly costs
    const monthlyInsurance = parameters.includeInsurance
      ? (parameters.insuranceRate / 100) * parameters.propertyPrice / 12
      : 0;
    const monthlyMaintenance = (parameters.maintenanceRate / 100) * parameters.propertyPrice / 12;

    // Amortization schedule
    const schedule = [];
    const chartData = [];
    let remainingDebt = loanAmount;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;

    for (let month = 1; month <= numberOfPayments && remainingDebt > 0; month++) {
      const interestPayment = remainingDebt * monthlyInterestRate;
      let principalPayment = monthlyPayment - interestPayment;

      // Special repayment (yearly in December)
      let extraPayment = 0;
      if (parameters.includeRepayment && month % 12 === 0 && remainingDebt > 0) {
        extraPayment = Math.min(parameters.repaymentAmount, remainingDebt - principalPayment);
      }

      const totalPrincipal = principalPayment + extraPayment;

      if (remainingDebt < totalPrincipal) {
        principalPayment = remainingDebt;
        extraPayment = 0;
      }

      remainingDebt = Math.max(0, remainingDebt - (principalPayment + extraPayment));
      cumulativeInterest += interestPayment;
      cumulativePrincipal += (principalPayment + extraPayment);

      schedule.push({
        month,
        year: Math.ceil(month / 12),
        monthlyPayment: monthlyPayment + extraPayment,
        interest: interestPayment,
        principal: principalPayment + extraPayment,
        remainingDebt,
        cumulativeInterest,
        cumulativePrincipal
      });

      // Yearly data for charts
      if (month % 12 === 0 || remainingDebt <= 0) {
        const prevData = chartData[chartData.length - 1];
        const yearlyInterest: number = month >= 12 && prevData
          ? cumulativeInterest - prevData.cumulativeInterest
          : cumulativeInterest;
        const yearlyPrincipal: number = month >= 12 && prevData
          ? cumulativePrincipal - prevData.cumulativePrincipal
          : cumulativePrincipal;

        chartData.push({
          year: Math.ceil(month / 12),
          remainingDebt,
          cumulativeInterest,
          cumulativePrincipal,
          yearlyInterest,
          yearlyPrincipal,
          progress: ((loanAmount - remainingDebt) / loanAmount) * 100
        });
      }
    }

    const totalMonthlyPayment = monthlyPayment + monthlyInsurance + monthlyMaintenance;
    const totalCost = loanAmount + cumulativeInterest +
      (monthlyInsurance + monthlyMaintenance) * schedule.length;
    const effectiveInterestRate = (cumulativeInterest / loanAmount / parameters.loanTerm) * 100;
    const loanToValue = (loanAmount / parameters.propertyPrice) * 100;
    const repaymentRate = ((monthlyPayment * 12 / loanAmount) - (parameters.interestRate / 100)) * 100;
    const equityRatio = (parameters.equity / parameters.propertyPrice) * 100;

    return {
      monthlyPayment: totalMonthlyPayment,
      baseMonthlyPayment: monthlyPayment,
      totalInterest: cumulativeInterest,
      totalCost,
      loanAmount,
      monthlyInterest: monthlyInsurance,
      monthlyPrincipal: monthlyMaintenance,
      amortizationSchedule: schedule,
      chartData,
      effectiveInterestRate,
      loanToValue,
      repaymentRate,
      equityRatio,
      fixedRatePeriod: parameters.loanTerm,
      remainingDebtAfterFixedRate: 0,
      fees: {
        processing: 0,
        appraisal: 0,
        broker: 0,
        total: 0
      }
    };
  }, [parameters]);

  useEffect(() => {
    setResults(calculateFinancing);
  }, [calculateFinancing]);

  // Bank comparison
  const bankComparison = useMemo(() => {
    if (!results) return null;
    // TODO: Implement real bank offers API
    return null;
  }, [results, parameters.equity, parameters.propertyPrice, parameters.loanTerm]);

  // Investment analysis
  const investmentMetrics = useMemo(() => {
    if (!results) return null;
    // TODO: Implement real investment metrics API
    return null;
  }, [parameters.propertyPrice, parameters.equity, monthlyRent, results, vacancyRate]);

  // ==================== EXPORT FUNCTIONS ====================
  const handleWordExport = async () => {
    if (!results) return;

    setExportLoading(true);
    try {
      await generateFinancingWord({
        results,
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
        bankName: 'ImmoNow Finanzberatung',
        bankComparison: bankComparison || undefined
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Word export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ========== HEADER ========== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
        <Card className="p-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl">
                    Finanzierungsrechner Professional
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Banking-Grade Analyse • Erweiterte Berechnungen • Bankenvergleich
                  </p>
                </div>
              </div>

              <Button
                onClick={handleWordExport}
                disabled={exportLoading || !results}
              >
                <Download className="w-5 h-5 mr-2" />
                {exportLoading ? 'Erstelle Word...' : 'Word Export'}
              </Button>
            </div>
          </CardHeader>
        </Card>
        </motion.div>

        {/* ========== SUCCESS MESSAGE ========== */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-6 right-6 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3"
            >
              <Check className="w-6 h-6" />
              <span className="font-semibold">Finanzierungsangebot erfolgreich erstellt!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========== MAIN TABS ========== */}
        <Card>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'calculator' | 'banks' | 'investment')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calculator" className="flex items-center space-x-2">
                <Calculator className="w-5 h-5" />
                <span>Rechner</span>
              </TabsTrigger>
              <TabsTrigger value="banks" className="flex items-center space-x-2">
                <Landmark className="w-5 h-5" />
                <span>Bankenvergleich</span>
              </TabsTrigger>
              <TabsTrigger value="investment" className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Investment-Analyse</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {/* ========== TAB CONTENT ========== */}
        <AnimatePresence mode="wait">
          {activeTab === 'calculator' && (
            <CalculatorTab
              parameters={parameters}
              setParameters={setParameters}
              results={results}
              activeChart={activeChart}
              setActiveChart={setActiveChart}
            />
          )}

          {activeTab === 'banks' && bankComparison && (
            <BankComparisonTab comparison={bankComparison} />
          )}

          {activeTab === 'investment' && investmentMetrics && (
            <InvestmentTab
              metrics={investmentMetrics}
              monthlyRent={monthlyRent}
              setMonthlyRent={setMonthlyRent}
              vacancyRate={vacancyRate}
              setVacancyRate={setVacancyRate}
              propertyPrice={parameters.propertyPrice}
              equity={parameters.equity}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};


export default ProfessionalFinancingCalculator;
