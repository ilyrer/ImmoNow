/**
 * Reports View - Investor Module
 * Automatic report generation and export functionality
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Plus,
  X
} from 'lucide-react';
// TODO: Implement real API hooks

// Mock hook for investor reports
const useInvestorReportsMock = () => {
  const reports: any[] = [];
  const loading = false;
  const error = null;
  
  const generateNewReport = () => {
    console.log('Generating new report');
    return Promise.resolve();
  };
  
  return { reports, loading, error, generateNewReport };
};

const ReportsView: React.FC = () => {
  const { reports, loading, error, generateNewReport } = useInvestorReportsMock();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await generateNewReport();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel', reportId: string) => {
    // Mock export - just show notification
    alert(`Export als ${format.toUpperCase()} wird vorbereitet (Mock-Funktion)`);
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Berichte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Renditeberichte
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automatisch generierte monatliche Übersichten
          </p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Wird generiert...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Neuen Bericht generieren
            </>
          )}
        </button>
      </motion.div>

      {/* Success Notification */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3"
        >
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-200 font-medium">
            Bericht erfolgreich generiert!
          </span>
        </motion.div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow"
          >
            {/* Report Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {report.month} {report.year}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(report.generatedAt)}
                  </p>
                </div>
              </div>
              
              {/* Export Dropdown */}
              <div className="relative group">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleExport('pdf', report.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-xl text-gray-700 dark:text-gray-300"
                  >
                    Als PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel', report.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    Als Excel
                  </button>
                  <button
                    onClick={() => handleExport('csv', report.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors last:rounded-b-xl text-gray-700 dark:text-gray-300"
                  >
                    Als CSV
                  </button>
                </div>
              </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">ROI</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {report.roi.toFixed(2)}%
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">Cashflow</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(report.cashflow)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Leerstand</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {report.vacancy.toFixed(1)}%
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Assets</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {report.assetCount}
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Einnahmen</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(report.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Ausgaben</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -{formatCurrency(report.totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Netto-Einkommen</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                  {formatCurrency(report.netIncome)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {reports.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-12 border border-white/20 dark:border-gray-700/50 shadow-lg text-center"
        >
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Noch keine Berichte
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstellen Sie Ihren ersten automatischen Renditebericht
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Ersten Bericht generieren
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ReportsView;
