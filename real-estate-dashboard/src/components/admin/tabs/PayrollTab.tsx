import React, { useState } from 'react';
import { DollarSign, CheckCircle, Clock, FileText, Plus, Download, Eye, Calendar, Users, TrendingUp } from 'lucide-react';
import { GlassCard, GlassButton, Badge, EmptyState, LoadingSpinner } from '../GlassUI';
import { 
  usePayrollRuns, 
  usePayrollStats,
  useApprovePayrollRun, 
  useMarkPayrollRunPaid,
  useCreatePayrollRun,
  useDeletePayrollRun,
  PayrollRun,
  PayrollRunCreate,
  PayrollStats
} from '../../../api/adminHooks';

const PayrollTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved' | 'paid'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // API Hooks
  const { data: payrollData, isLoading, error } = usePayrollRuns({ 
    status: statusFilter === 'all' ? undefined : statusFilter 
  });
  const { data: stats } = usePayrollStats();
  const approvePayrollMutation = useApprovePayrollRun();
  const markPaidMutation = useMarkPayrollRunPaid();
  const createPayrollMutation = useCreatePayrollRun();
  const deletePayrollMutation = useDeletePayrollRun();

  const payrollRuns = payrollData?.payroll_runs || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">
          <CheckCircle className="w-3 h-3 mr-1 inline" />Ausgezahlt
        </Badge>;
      case 'approved':
        return <Badge variant="warning">
          <Clock className="w-3 h-3 mr-1 inline" />Genehmigt
        </Badge>;
      case 'draft':
        return <Badge variant="info">
          <FileText className="w-3 h-3 mr-1 inline" />Entwurf
        </Badge>;
      case 'cancelled':
        return <Badge variant="danger">
          <FileText className="w-3 h-3 mr-1 inline" />Storniert
        </Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleApprove = async (runId: string) => {
    try {
      await approvePayrollMutation.mutateAsync(runId);
    } catch (error) {
      console.error('Error approving payroll:', error);
    }
  };

  const handleMarkPaid = async (runId: string) => {
    try {
      await markPaidMutation.mutateAsync(runId);
    } catch (error) {
      console.error('Error marking payroll as paid:', error);
    }
  };

  const handleDeletePayroll = async (runId: string) => {
    if (window.confirm('Möchten Sie diese Lohnabrechnung wirklich löschen?')) {
      try {
        await deletePayrollMutation.mutateAsync(runId);
      } catch (error) {
        console.error('Error deleting payroll:', error);
      }
    }
  };

  const handleCreatePayroll = async (formData: PayrollRunCreate) => {
    try {
      await createPayrollMutation.mutateAsync(formData);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating payroll:', error);
    }
  };

  const handleExportPDF = (runId: string) => {
    // TODO: Implement PDF export
    console.log('Export PDF for payroll run:', runId);
  };

  if (isLoading) {
    return (
      <GlassCard className="p-8">
        <LoadingSpinner size="lg" />
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
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Brutto</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.total_gross_amount)}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Netto</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.total_net_amount)}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Abrechnungen</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_runs}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ausstehend</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.draft_runs}
                </p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

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
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            >
              <option value="all">Alle Status</option>
              <option value="draft">Entwurf</option>
              <option value="approved">Genehmigt</option>
              <option value="paid">Ausgezahlt</option>
            </select>
            <GlassButton onClick={() => setCreateDialogOpen(true)} variant="primary" icon={Plus}>
              Neue Abrechnung
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Payroll Runs */}
      <GlassCard className="overflow-hidden">
        {payrollRuns.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Keine Lohnabrechnungen gefunden"
            description="Erstellen Sie Ihre erste Lohnabrechnung, um zu beginnen."
            action={{ label: 'Neue Abrechnung erstellen', onClick: () => setCreateDialogOpen(true) }}
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
                      {formatDate(run.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleExportPDF(run.id)}
                          className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                          title="PDF exportieren"
                        >
                          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        <button
                          onClick={() => {/* TODO: Open details modal */}}
                          className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                          title="Details anzeigen"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        {run.status === 'draft' && (
                          <button
                            onClick={() => handleApprove(run.id)}
                            disabled={approvePayrollMutation.isPending}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm"
                            title="Genehmigen"
                          >
                            {approvePayrollMutation.isPending ? '...' : 'Genehmigen'}
                          </button>
                        )}
                        
                        {run.status === 'approved' && (
                          <button
                            onClick={() => handleMarkPaid(run.id)}
                            disabled={markPaidMutation.isPending}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
                            title="Als bezahlt markieren"
                          >
                            {markPaidMutation.isPending ? '...' : 'Bezahlt'}
                          </button>
                        )}
                        
                        {run.status === 'draft' && (
                          <button
                            onClick={() => handleDeletePayroll(run.id)}
                            disabled={deletePayrollMutation.isPending}
                            className="p-2 rounded-lg hover:bg-red-200/50 dark:hover:bg-red-700/50 transition-colors"
                            title="Löschen"
                          >
                            <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Create Payroll Dialog */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Neue Lohnabrechnung erstellen</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const createData: PayrollRunCreate = {
                period: formData.get('period') as string,
                period_start: formData.get('period_start') as string,
                period_end: formData.get('period_end') as string,
                notes: formData.get('notes') as string,
              };
              handleCreatePayroll(createData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Periode</label>
                  <input
                    type="text"
                    name="period"
                    required
                    placeholder="z.B. 2024-01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Von</label>
                    <input
                      type="date"
                      name="period_start"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bis</label>
                    <input
                      type="date"
                      name="period_end"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notizen (optional)</label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setCreateDialogOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={createPayrollMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createPayrollMutation.isPending ? 'Wird erstellt...' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollTab;