import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface PayrollData {
  lastRun: {
    id: string;
    status: string;
    period: string;
    totalAmount: number;
    employeeCount: number;
    createdAt: string;
  };
  nextRun: string;
  monthlyTotal: number;
  pendingRuns: number;
}

const PayrollSummaryWidget: React.FC = () => {
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch payroll runs
        const response = await fetch('/api/v1/admin/payroll/runs?size=1');
        const data = await response.json();

        console.log('📊 Payroll Data Response:', data);

        const runs = data.payroll_runs || [];
        const lastRun = runs[0] || null;

        setPayrollData({
          lastRun: lastRun ? {
            id: lastRun.id || '',
            status: lastRun.status || 'draft',
            period: lastRun.period || 'Unbekannt',
            totalAmount: lastRun.total_amount || 0,
            employeeCount: lastRun.employee_count || 0,
            createdAt: lastRun.created_at || new Date().toISOString()
          } : null,
          nextRun: '2024-02-01', // Mock data
          monthlyTotal: data.monthly_total || 0,
          pendingRuns: data.pending_runs || 0
        });

      } catch (error) {
        console.error('❌ Error fetching payroll data:', error);
        // Fallback data
        setPayrollData({
          lastRun: null,
          nextRun: '2024-02-01',
          monthlyTotal: 0,
          pendingRuns: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayrollData();
    
    // Refresh every 15 minutes
    const interval = setInterval(fetchPayrollData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt Gehaltsdaten...</p>
        </div>
      </div>
    );
  }

  if (!payrollData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Keine Gehaltsdaten verfügbar</p>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return { 
          color: 'text-green-600 dark:text-green-400', 
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          icon: <CheckCircle className="w-4 h-4 text-green-600" />
        };
      case 'paid':
        return { 
          color: 'text-blue-600 dark:text-blue-400', 
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          icon: <CheckCircle className="w-4 h-4 text-blue-600" />
        };
      case 'pending':
        return { 
          color: 'text-yellow-600 dark:text-yellow-400', 
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: <Clock className="w-4 h-4 text-yellow-600" />
        };
      default:
        return { 
          color: 'text-gray-600 dark:text-gray-400', 
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          icon: <AlertCircle className="w-4 h-4 text-gray-600" />
        };
    }
  };

  const statusInfo = payrollData.lastRun ? getStatusInfo(payrollData.lastRun.status) : null;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Gehaltsabrechnung
        </h3>
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Verwalten
        </button>
      </div>

      {/* Letzte Abrechnung */}
      {payrollData.lastRun ? (
        <div className={`p-4 rounded-lg mb-4 ${statusInfo?.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Letzte Abrechnung
            </span>
            <div className="flex items-center space-x-1">
              {statusInfo?.icon}
              <span className={`text-xs font-semibold ${statusInfo?.color}`}>
                {payrollData.lastRun.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              €{payrollData.lastRun.totalAmount.toLocaleString('de-DE')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {payrollData.lastRun.employeeCount} Mitarbeiter • {payrollData.lastRun.period}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(payrollData.lastRun.createdAt).toLocaleDateString('de-DE')}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
          <div className="text-center">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Keine Abrechnungen vorhanden</p>
          </div>
        </div>
      )}

      {/* Statistiken */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Monatssumme
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            €{payrollData.monthlyTotal.toLocaleString('de-DE')}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Ausstehend
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {payrollData.pendingRuns}
          </div>
        </div>
      </div>

      {/* Nächste Abrechnung */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Nächste Abrechnung
          </span>
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>
        <div className="text-sm text-gray-900 dark:text-white font-medium">
          {new Date(payrollData.nextRun).toLocaleDateString('de-DE')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {Math.ceil((new Date(payrollData.nextRun).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Tage
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
          <CreditCard className="w-3 h-3" />
          <span>Neue Abrechnung</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Calendar className="w-3 h-3" />
          <span>Zeitplan</span>
        </button>
      </div>
    </div>
  );
};

export default PayrollSummaryWidget;
