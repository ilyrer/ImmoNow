import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  BarChart, 
  Bar 
} from 'recharts';
import { generateFinancingPDF, FinancingResult, formatCurrency, formatPercent, PDFExportParams } from './PDFExportService';
import { generateFinancingExcel, ExcelExportParams } from './ExcelExportService';

const FinancingCalculator: React.FC = () => {
  // Eingabedaten
  const [propertyPrice, setPropertyPrice] = useState<number>(500000);
  const [equity, setEquity] = useState<number>(100000);
  const [interestRate, setInterestRate] = useState<number>(3.5);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [additionalCosts, setAdditionalCosts] = useState<number>(25000);
  
  // Erweiterte Optionen
  const [includeInsurance, setIncludeInsurance] = useState<boolean>(true);
  const [insuranceRate, setInsuranceRate] = useState<number>(0.2);
  const [includeRepayment, setIncludeRepayment] = useState<boolean>(false);
  const [repaymentAmount, setRepaymentAmount] = useState<number>(5000);
  const [maintenanceRate, setMaintenanceRate] = useState<number>(1.0);
  
  // UI State
  const [activeChart, setActiveChart] = useState<'amortization' | 'breakdown' | 'comparison'>('amortization');
  const [results, setResults] = useState<FinancingResult | null>(null);
  const [exportLoading, setExportLoading] = useState<'pdf' | 'excel' | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  
  // Präzise Finanzierungsberechnung
  const calculateFinancing = (): FinancingResult => {
    const loanAmount = propertyPrice - equity + additionalCosts;
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Annuitätsformel für monatliche Rate
    const monthlyPayment = loanAmount * 
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    
    // Zusatzkosten pro Monat
    const monthlyInsurance = includeInsurance ? (insuranceRate / 100) * propertyPrice / 12 : 0;
    const monthlyMaintenance = (maintenanceRate / 100) * propertyPrice / 12;
    
    // Tilgungsplan erstellen
    const schedule = [];
    const chartData = [];
    let remainingDebt = loanAmount;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    
    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = remainingDebt * monthlyInterestRate;
      let principalPayment = monthlyPayment - interestPayment;
      
      // Sondertilgung jährlich (nur Dezember)
      let extraPayment = 0;
      if (includeRepayment && month % 12 === 0 && remainingDebt > 0) {
        extraPayment = Math.min(repaymentAmount, remainingDebt - principalPayment);
      }
      
      const totalPrincipal = principalPayment + extraPayment;
      
      // Korrektur für letzten Monat
      if (remainingDebt < totalPrincipal) {
        const finalPayment = remainingDebt;
        principalPayment = finalPayment;
        extraPayment = 0;
      }
      
      remainingDebt -= (principalPayment + extraPayment);
      cumulativeInterest += interestPayment;
      cumulativePrincipal += (principalPayment + extraPayment);
      
      schedule.push({
        month,
        year: Math.ceil(month / 12),
        monthlyPayment: monthlyPayment + extraPayment,
        interest: interestPayment,
        principal: principalPayment + extraPayment,
        remainingDebt: Math.max(0, remainingDebt),
        cumulativeInterest,
        cumulativePrincipal
      });
      
      // Chart Data (jährlich)
      if (month % 12 === 0 || remainingDebt <= 0) {
        chartData.push({
          year: Math.ceil(month / 12),
          remainingDebt: Math.max(0, remainingDebt),
          cumulativeInterest,
          cumulativePrincipal
        });
      }
      
      if (remainingDebt <= 0) break;
    }
    
    const result = {
      monthlyPayment: monthlyPayment + monthlyInsurance + monthlyMaintenance,
      totalInterest: cumulativeInterest,
      totalCost: loanAmount + cumulativeInterest + (monthlyInsurance + monthlyMaintenance) * schedule.length,
      loanAmount,
      monthlyInterest: monthlyInsurance,
      monthlyPrincipal: monthlyMaintenance,
      amortizationSchedule: schedule,
      chartData
    };
    
    setResults(result);
    return result;
  };
  
  // Berechnungen beim Laden und bei Änderungen
  useEffect(() => {
    calculateFinancing();
  }, [propertyPrice, equity, interestRate, loanTerm, additionalCosts, includeInsurance, insuranceRate, includeRepayment, repaymentAmount, maintenanceRate]);
  
  // Export-Funktionen
  const exportToPDF = async () => {
    if (!results) return;
    
    setExportLoading('pdf');
    
    try {
      const pdfParams: PDFExportParams = {
        results,
        propertyPrice,
        equity,
        interestRate,
        loanTerm,
        additionalCosts
      };
      
      await generateFinancingPDF(pdfParams);
      
      setShowSuccessMessage('📄 Professionelles PDF erfolgreich erstellt!');
      setTimeout(() => setShowSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      setShowSuccessMessage('❌ Fehler beim PDF-Export');
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } finally {
      setExportLoading(null);
    }
  };
  
  const exportToExcel = async () => {
    if (!results) return;
    
    setExportLoading('excel');
    
    try {
      const excelParams: ExcelExportParams = {
        results,
        propertyPrice,
        equity,
        interestRate,
        loanTerm,
        additionalCosts,
        includeInsurance,
        insuranceRate,
        includeRepayment,
        repaymentAmount,
        maintenanceRate
      };
      
      await generateFinancingExcel(excelParams);
      
      setShowSuccessMessage('📊 Excel-Datei erfolgreich heruntergeladen!');
      setTimeout(() => setShowSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Fehler beim Excel-Export:', error);
      setShowSuccessMessage('❌ Fehler beim Excel-Export');
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } finally {
      setExportLoading(null);
    }
  };
  
  // Chart Komponenten
  const AmortizationChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={results?.chartData}>
        <defs>
          <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="year" 
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          className="text-gray-600 dark:text-gray-400"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
          className="text-gray-600 dark:text-gray-400"
        />
        <Tooltip 
          formatter={(value: number, name: string) => [
            `€${value.toLocaleString('de-DE')}`, 
            name === 'remainingDebt' ? 'Restschuld' : 
            name === 'cumulativeInterest' ? 'Zinsen kumuliert' : 
            name === 'cumulativePrincipal' ? 'Getilgte Summe' : name
          ]}
          labelFormatter={(label) => `Jahr ${label}`}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 9999
          }}
          wrapperStyle={{ zIndex: 9999 }}
        />
        <Area 
          type="monotone" 
          dataKey="remainingDebt" 
          stroke="#3B82F6" 
          fill="url(#colorPrincipal)"
          strokeWidth={2}
          name="Restschuld"
        />
        <Area 
          type="monotone" 
          dataKey="cumulativeInterest" 
          stroke="#EF4444" 
          fill="url(#colorInterest)"
          strokeWidth={2}
          name="Zinsen kumuliert"
        />
        <Area 
          type="monotone" 
          dataKey="cumulativePrincipal" 
          stroke="#22c55e" 
          fill="#22c55e"
          fillOpacity={0.6}
          strokeWidth={2}
          name="Getilgte Summe"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
  
  const BreakdownChart = () => {
    const pieData = [
      { name: 'Eigenkapital', value: equity, color: '#22c55e' },
      { name: 'Darlehen', value: results?.loanAmount || 0, color: '#3b82f6' },
      { name: 'Zinsen', value: results?.totalInterest || 0, color: '#ef4444' },
      { name: 'Nebenkosten', value: additionalCosts, color: '#f59e0b' }
    ];
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
            labelLine={false}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => formatCurrency(value)} 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              zIndex: 9999
            }}
            wrapperStyle={{ zIndex: 9999 }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };
  
  const MonthlyBreakdownChart = () => {
    const monthlyData = [
      { 
        name: 'Tilgung & Zinsen', 
        value: results ? results.monthlyPayment - results.monthlyInterest - results.monthlyPrincipal : 0, 
        color: '#4F46E5',
        gradient: 'from-indigo-500 to-purple-600',
        icon: '💳',
        description: 'Monatliche Darlehensrate'
      },
      { 
        name: 'Versicherung', 
        value: results?.monthlyInterest || 0, 
        color: '#F59E0B',
        gradient: 'from-amber-500 to-orange-600',
        icon: '🛡️',
        description: 'Gebäudeversicherung'
      },
      { 
        name: 'Instandhaltung', 
        value: results?.monthlyPrincipal || 0, 
        color: '#10B981',
        gradient: 'from-emerald-500 to-teal-600',
        icon: '🔧',
        description: 'Wartung & Reparaturen'
      }
    ].filter(item => item.value > 0);
    
    const totalValue = monthlyData.reduce((sum, item) => sum + item.value, 0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    
    return (
      <div className="space-y-8">
        {/* Premium Header */}
        <motion.div 
          className="text-center space-y-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-3 rounded-full border border-blue-200 dark:border-blue-800">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-2">
              <i className="ri-pie-chart-line text-white text-lg"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Monatliche Kostenverteilung
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Detaillierte Aufschlüsselung Ihrer monatlichen Immobilienkosten mit interaktiver Visualisierung
          </p>
        </motion.div>

        {/* Premium Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {monthlyData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.15, duration: 0.6, type: "spring", stiffness: 100 }}
              whileHover={{ 
                scale: 1.05, 
                y: -8,
                transition: { duration: 0.3 }
              }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              className={`relative group cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-1 shadow-xl hover:shadow-2xl transition-all duration-500`}
            >
              {/* Glasmorphism Inner Container */}
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl p-6 h-full border border-white/20 dark:border-gray-700/30">
                
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <div className="absolute inset-0" 
                       style={{
                         backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='37' cy='37' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                       }} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className={`text-3xl p-3 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="filter drop-shadow-sm">{item.icon}</span>
                    </motion.div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Value Display */}
                <div className="space-y-4">
                  <div className="text-right">
                    <motion.div 
                      className="text-3xl font-bold text-gray-900 dark:text-white"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.5, type: "spring", stiffness: 200 }}
                    >
                      {formatCurrency(item.value)}
                    </motion.div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {((item.value / totalValue) * 100).toFixed(1)}% der Gesamtkosten
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Anteil</span>
                      <span>{((item.value / totalValue) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${item.gradient} shadow-sm relative overflow-hidden`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / totalValue) * 100}%` }}
                        transition={{ duration: 1.5, delay: index * 0.2 + 0.8, ease: "easeOut" }}
                      >
                        {/* Shimmer Effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ 
                            duration: 2, 
                            delay: index * 0.3 + 1.5,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <motion.div 
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredIndex === index ? 1 : 0.7 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Pro Jahr:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.value * 12)}
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Hover Glow Effect */}
                <motion.div
                  className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`}
                  initial={false}
                />
              </div>

              {/* Corner Decoration */}
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>

        {/* Interactive Donut Chart */}
        <motion.div 
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/60 dark:border-gray-700/30 shadow-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="text-center mb-6">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Interaktive Kostenverteilung
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Bewegen Sie die Maus über die Segmente für Details
            </p>
          </div>

          <div className="relative">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <defs>
                  {monthlyData.map((item, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={item.color} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={item.color} stopOpacity={1}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={monthlyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={4}
                  dataKey="value"
                  onMouseEnter={(_, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${index})`}
                      stroke={hoveredIndex === index ? entry.color : 'transparent'}
                      strokeWidth={hoveredIndex === index ? 3 : 0}
                      style={{
                        filter: hoveredIndex === index ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' : 'none',
                        transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <motion.div 
                          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-gray-200/60 dark:border-gray-700/30 z-[9999] relative"
                          style={{ zIndex: 9999 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{data.icon}</span>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{data.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{data.description}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Monatlich:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(data.value)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Jährlich:</span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(data.value * 12)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Anteil:</span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{((data.value / totalValue) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                    return null;
                  }}
                  wrapperStyle={{ zIndex: 9999 }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Total Display */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <div className="text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-6 border border-gray-200/60 dark:border-gray-700/30 shadow-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Gesamt</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalValue)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">pro Monat</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Premium Summary Card */}
        <motion.div 
          className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" 
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpolygon points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E")`
                 }} />
          </div>

          <div className="relative flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="bg-white/20 backdrop-blur-sm rounded-full p-4"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ duration: 0.3 }}
              >
                <i className="ri-calculator-line text-3xl text-white"></i>
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold">Gesamte monatliche Belastung</h3>
                <p className="text-blue-100 opacity-90">
                  Alle Kosten zusammengefasst für Ihre Finanzplanung
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <motion.div 
                className="text-4xl md:text-5xl font-bold"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.3, type: "spring", stiffness: 200 }}
              >
                {formatCurrency(totalValue)}
              </motion.div>
              <div className="text-blue-100 text-lg font-medium">pro Monat</div>
              <div className="text-blue-200 text-sm opacity-75 mt-1">
                {formatCurrency(totalValue * 12)} pro Jahr
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <motion.div
            className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.6, 0.3, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />
        </motion.div>
      </div>
    );
  };
  
  return (
    <motion.div 
      className="max-w-7xl mx-auto bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 space-y-8 border border-gray-100 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1 
          className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          💰 Finanzierungsrechner
        </motion.h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Präzise Berechnung Ihrer Immobilienfinanzierung mit interaktiven Charts
        </p>
      </div>
      
      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div 
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            <i className="ri-check-circle-line text-xl"></i>
            <span className="font-medium">{showSuccessMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Eingabebereich */}
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📊 Eingaben</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Kaufpreis */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              🏠 Kaufpreis
            </label>
            <div className="relative">
              <input
                type="number"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(Number(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right pr-12 font-mono"
                step="1000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
            </div>
          </div>
          
          {/* Eigenkapital */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              💳 Eigenkapital
            </label>
            <div className="relative">
              <input
                type="number"
                value={equity}
                onChange={(e) => setEquity(Number(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right pr-12 font-mono"
                step="1000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
            </div>
            <div className="text-sm text-gray-500">
              {propertyPrice > 0 && `${((equity / propertyPrice) * 100).toFixed(1)}% des Kaufpreises`}
            </div>
          </div>
          
          {/* Zinssatz */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              📈 Zinssatz
            </label>
            <div className="relative">
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right pr-12 font-mono"
                step="0.1"
                min="0"
                max="15"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
            </div>
          </div>
          
          {/* Laufzeit */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              ⏱️ Laufzeit
            </label>
            <div className="relative">
              <input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right pr-16 font-mono"
                min="1"
                max="40"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Jahre</span>
            </div>
          </div>
          
          {/* Nebenkosten */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              📋 Nebenkosten
            </label>
            <div className="relative">
              <input
                type="number"
                value={additionalCosts}
                onChange={(e) => setAdditionalCosts(Number(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right pr-12 font-mono"
                step="1000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
            </div>
            <div className="text-sm text-gray-500">
              Notar, Grunderwerbsteuer, Makler
            </div>
          </div>
          
          {/* Instandhaltung */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              🔧 Instandhaltung
            </label>
            <div className="relative">
              <input
                type="number"
                value={maintenanceRate}
                onChange={(e) => setMaintenanceRate(Number(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right pr-12 font-mono"
                step="0.1"
                min="0"
                max="5"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
            </div>
            <div className="text-sm text-gray-500">
              Pro Jahr vom Kaufpreis
            </div>
          </div>
        </div>
        
        {/* Erweiterte Optionen */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Versicherung */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeInsurance}
                  onChange={(e) => setIncludeInsurance(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  🛡️ Gebäudeversicherung
                </span>
              </label>
            </div>
            
            {includeInsurance && (
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400">Rate pro Jahr</label>
                <div className="relative">
                  <input
                    type="number"
                    value={insuranceRate}
                    onChange={(e) => setInsuranceRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white text-right pr-10 font-mono text-sm"
                    step="0.01"
                    min="0"
                    max="2"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                </div>
                <div className="text-xs text-gray-500">
                  ≈ {formatCurrency((insuranceRate / 100) * propertyPrice / 12)}/Monat
                </div>
              </div>
            )}
          </div>
          
          {/* Sondertilgung */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeRepayment}
                  onChange={(e) => setIncludeRepayment(e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  ⚡ Sondertilgung
                </span>
              </label>
            </div>
            
            {includeRepayment && (
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400">Betrag pro Jahr</label>
                <div className="relative">
                  <input
                    type="number"
                    value={repaymentAmount}
                    onChange={(e) => setRepaymentAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white text-right pr-10 font-mono text-sm"
                    step="1000"
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                </div>
                <div className="text-xs text-gray-500">
                  Reduziert die Laufzeit erheblich
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Ergebnisse - Hauptmetriken */}
      {results && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Monatliche Rate</span>
              <i className="ri-money-euro-circle-line text-2xl opacity-75"></i>
            </div>
            <div className="text-3xl font-bold">{formatCurrency(results.monthlyPayment)}</div>
            <div className="text-sm opacity-75 mt-1">
              Inkl. aller Nebenkosten
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Darlehenssumme</span>
              <i className="ri-bank-line text-2xl opacity-75"></i>
            </div>
            <div className="text-3xl font-bold">{formatCurrency(results.loanAmount)}</div>
            <div className="text-sm opacity-75 mt-1">
              {formatPercent((results.loanAmount / propertyPrice) * 100)} Finanzierung
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Gesamtzinsen</span>
              <i className="ri-percent-line text-2xl opacity-75"></i>
            </div>
            <div className="text-3xl font-bold">{formatCurrency(results.totalInterest)}</div>
            <div className="text-sm opacity-75 mt-1">
              Über {loanTerm} Jahre
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Gesamtkosten</span>
              <i className="ri-calculator-line text-2xl opacity-75"></i>
            </div>
            <div className="text-3xl font-bold">{formatCurrency(results.totalCost)}</div>
            <div className="text-sm opacity-75 mt-1">
              Inkl. aller Kosten
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Chart Navigation */}
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setActiveChart('amortization')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeChart === 'amortization'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📈 Tilgungsverlauf
          </button>
          <button
            onClick={() => setActiveChart('breakdown')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeChart === 'breakdown'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🥧 Kostenaufteilung
          </button>
          <button
            onClick={() => setActiveChart('comparison')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeChart === 'comparison'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📊 Monatliche Kosten
          </button>
        </div>
        
        {/* Chart Container */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
          {activeChart === 'amortization' && <AmortizationChart />}
          {activeChart === 'breakdown' && <BreakdownChart />}
          {activeChart === 'comparison' && <MonthlyBreakdownChart />}
        </div>
      </motion.div>
      
      {/* Detaillierte Aufschlüsselung */}
      {results && (
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📋 Detaillierte Aufschlüsselung</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Finanzierungsdetails */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                💰 Finanzierung
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Kaufpreis:</span>
                  <span className="font-semibold">{formatCurrency(propertyPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Eigenkapital:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(equity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nebenkosten:</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(additionalCosts)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">Darlehensbetrag:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(results.loanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Eigenkapitalquote:</span>
                  <span className="font-semibold">{formatPercent((equity / propertyPrice) * 100)}</span>
                </div>
              </div>
            </div>
            
            {/* Monatliche Kosten */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                📅 Monatliche Kosten
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tilgung + Zinsen:</span>
                  <span className="font-semibold">{formatCurrency(results.monthlyPayment - results.monthlyInterest - results.monthlyPrincipal)}</span>
                </div>
                {includeInsurance && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Versicherung:</span>
                    <span className="font-semibold text-yellow-600">{formatCurrency(results.monthlyInterest)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Instandhaltung:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(results.monthlyPrincipal)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">Gesamt monatlich:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(results.monthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pro Jahr:</span>
                  <span className="font-semibold">{formatCurrency(results.monthlyPayment * 12)}</span>
                </div>
              </div>
            </div>
            
            {/* Langzeitperspektive */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                🔮 Langzeitanalyse
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Laufzeit:</span>
                  <span className="font-semibold">{loanTerm} Jahre</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gesamtzinsen:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(results.totalInterest)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Zinsanteil:</span>
                  <span className="font-semibold">{formatPercent((results.totalInterest / results.totalCost) * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Eff. Zinssatz:</span>
                  <span className="font-semibold">{formatPercent(interestRate)}</span>
                </div>
                {includeRepayment && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sondertilgung/Jahr:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(repaymentAmount)}</span>
                  </div>
                )}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-3">
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1">💡 Tipp:</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {results.loanAmount > 0 && results.amortizationSchedule.length > 0 && 
                      `Das Darlehen ist nach ${results.amortizationSchedule[results.amortizationSchedule.length - 1].year} Jahren vollständig getilgt.`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Tilgungsplan Tabelle */}
      {results && results.amortizationSchedule.length > 0 && (
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">📋 Tilgungsplan</h3>
            <div className="flex items-center space-x-2">
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  exportLoading === 'pdf' 
                    ? 'bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-300 cursor-not-allowed' 
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
                onClick={exportToPDF}
                disabled={exportLoading === 'pdf'}
              >
                {exportLoading === 'pdf' ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Erstelle PDF...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-download-line"></i>
                    <span>PDF Export</span>
                  </>
                )}
              </button>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  exportLoading === 'excel' 
                    ? 'bg-green-200 dark:bg-green-800 text-green-600 dark:text-green-300 cursor-not-allowed' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                }`}
                onClick={exportToExcel}
                disabled={exportLoading === 'excel'}
              >
                {exportLoading === 'excel' ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                    <span>Erstelle Excel...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-file-excel-line"></i>
                    <span>Excel Export</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Jahr
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Monatliche Rate
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Zinsen (Jahr)
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Tilgung (Jahr)
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Restschuld
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Fortschritt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {results.chartData.map((row, index) => {
                    const yearlyInterest = index === 0 ? 0 : (results.chartData[index].cumulativeInterest - (results.chartData[index - 1]?.cumulativeInterest || 0));
                    const yearlyPrincipal = index === 0 ? 0 : (results.chartData[index].cumulativePrincipal - (results.chartData[index - 1]?.cumulativePrincipal || 0));
                    const progressPercent = ((results.loanAmount - row.remainingDebt) / results.loanAmount) * 100;
                    
                    return (
                      <tr key={row.year} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : 'bg-white dark:bg-gray-800'} hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-bold text-gray-900 dark:text-white bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                              {row.year}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-mono">
                          {formatCurrency(results.monthlyPayment)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 text-right font-mono">
                          {formatCurrency(yearlyInterest)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 text-right font-mono">
                          {formatCurrency(yearlyPrincipal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 text-right font-mono">
                          {formatCurrency(row.remainingDebt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-12">
                              {progressPercent.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Zinsen</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tilgung</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Restschuld</span>
                </div>
              </div>
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                💡 Alle Angaben ohne Gewähr. Sprechen Sie mit Ihrem Bankberater für eine verbindliche Beratung.
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FinancingCalculator; 
