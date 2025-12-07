import React from 'react';
import { DollarSign, CheckCircle, Clock, FileText } from 'lucide-react';
import { GlassCard, GlassButton, Badge, EmptyState } from '../GlassUI';
import { 
  usePayrollRuns, 
  useApprovePayrollRun, 
  useMarkPayrollPaid,
  useCreatePayrollRun,
  PayrollRun 
} from '../../../api/adminHooks';

const PayrollTab: React.FC = () => {
  const { data: payrollRuns = [], isLoading, error } = usePayrollRuns();
  const approvePayrollMutation = useApprovePayrollRun();
  const markPaidMutation = useMarkPayrollPaid();
  const createPayrollMutation = useCreatePayrollRun();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1 inline" />Ausgezahlt</Badge>;
      case 'approved':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1 inline" />Genehmigt</Badge>;
      case 'draft':
        return <Badge variant="default"><FileText className="w-3 h-3 mr-1 inline" />Entwurf</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleApprove = (runId: string) => {
    approvePayrollMutation.mutate(runId);
  };

  const handleMarkPaid = (runId: string) => {
    markPaidMutation.mutate(runId);
  };

  const handleCreatePayroll = () => {
    const currentDate = new Date();
    const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    createPayrollMutation.mutate(period);
  };

  if (isLoading) {
    return (
      <GlassCard className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-8">
        <EmptyState
          icon={DollarSign}
          title="Fehler beim Laden der Lohnabrechnungen"
          description="Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        />
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Lohnabrechnung
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Verwalten Sie Gehaltsabrechnungen und Lohnzahlungen
            </p>
          </div>
          <GlassButton onClick={handleCreatePayroll} variant="primary" icon={DollarSign}>
            Neue Abrechnung
          </GlassButton>
        </div>
      </GlassCard>

      {/* Payroll Runs */}
      <GlassCard className="overflow-hidden">
        {payrollRuns.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Keine Lohnabrechnungen gefunden"
            description="Erstellen Sie Ihre erste Lohnabrechnung, um zu beginnen."
            action={{ label: 'Neue Abrechnung erstellen', onClick: handleCreatePayroll }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Mitarbeiter
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Brutto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Netto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Erstellt
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payrollRuns.map((run: PayrollRun) => (
                  <tr
                    key={run.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {run.period}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(run.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {run.employee_count}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {formatCurrency(run.total_gross)}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {formatCurrency(run.total_net)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(run.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {run.status === 'draft' && (
                          <GlassButton
                            onClick={() => handleApprove(run.id)}
                            variant="warning"
                            size="sm"
                          >
                            Genehmigen
                          </GlassButton>
                        )}
                        {run.status === 'approved' && (
                          <GlassButton
                            onClick={() => handleMarkPaid(run.id)}
                            variant="success"
                            size="sm"
                          >
                            Als bezahlt markieren
                          </GlassButton>
                        )}
                        <GlassButton variant="secondary" size="sm">
                          Details
                        </GlassButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default PayrollTab;