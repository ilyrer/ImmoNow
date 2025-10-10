import React from 'react';
import { DollarSign, CheckCircle, Clock, FileText } from 'lucide-react';
// TODO: Implement real API hooks
import { GlassCard, GlassButton, Badge, EmptyState } from '../GlassUI';

// Mock hook for backward compatibility
const usePayrollMock = () => {
  const payrollRuns = [
    {
      id: '1',
      period: '2024-01',
      month: '2024-01',
      status: 'paid',
      totalAmount: 50000,
      totalGross: 50000,
      totalNet: 40000,
      employeeCount: 10,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString()
    }
  ];

  const approvePayroll = async (id: string) => {
    console.warn('Mock approvePayroll called');
    return { success: true };
  };

  const markAsPaid = async (id: string) => {
    console.warn('Mock markAsPaid called');
    return { success: true };
  };

  return {
    payrollRuns,
    approvePayroll,
    markAsPaid
  };
};

const PayrollTab: React.FC = () => {
  const { payrollRuns, approvePayroll, markAsPaid } = usePayrollMock();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1 inline" />Ausgezahlt</Badge>;
      case 'approved':
        return <Badge variant="info">Freigegeben</Badge>;
      case 'draft':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1 inline" />Entwurf</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Gesamt Brutto</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(payrollRuns.reduce((sum, r) => sum + r.totalGross, 0))}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lohnläufe</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {payrollRuns.length}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ausstehend</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {payrollRuns.filter(r => r.status !== 'paid').length}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Payroll Runs */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lohnläufe</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Monat</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Mitarbeiter</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Brutto</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Netto</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payrollRuns.map(run => (
                <tr key={run.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {new Date(run.month + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(run.status)}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{run.employeeCount}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(run.totalGross)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                    {formatCurrency(run.totalNet)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {run.status === 'draft' && (
                        <GlassButton size="sm" variant="primary" onClick={() => approvePayroll(run.id)}>
                          Freigeben
                        </GlassButton>
                      )}
                      {run.status === 'approved' && (
                        <GlassButton size="sm" variant="success" onClick={() => markAsPaid(run.id)}>
                          Als bezahlt markieren
                        </GlassButton>
                      )}
                      <GlassButton size="sm" variant="secondary">Export</GlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default PayrollTab;
