import React, { useState } from 'react';
import { Activity, Filter, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { GlassCard, GlassButton, Badge } from '../GlassUI';
import { 
  useAdminAuditLogs,
  AdminAuditLog 
} from '../../../api/adminHooks';

const AuditTab: React.FC = () => {
  const [filters, setFilters] = useState({
    resource_type: '',
    user_id: '',
    page: 1,
    size: 20
  });

  const { data: auditData, isLoading, error } = useAdminAuditLogs({
    page: filters.page,
    size: filters.size,
    resource_type: filters.resource_type || undefined,
    user_id: filters.user_id || undefined
  });

  const logs = auditData?.items || [];
  const total = auditData?.total || 0;

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'ok':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1 inline" />OK</Badge>;
      case 'error':
        return <Badge variant="danger"><AlertCircle className="w-3 h-3 mr-1 inline" />Fehler</Badge>;
      case 'warning':
        return <Badge variant="warning"><AlertTriangle className="w-3 h-3 mr-1 inline" />Warnung</Badge>;
      default:
        return <Badge variant="default">{result}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE');
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
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
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Fehler beim Laden der Audit-Logs
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.
          </p>
        </div>
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
              Audit-Protokolle
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Überwachen Sie alle Systemaktivitäten und Benutzeraktionen
            </p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {total} Einträge gefunden
          </div>
        </div>
      </GlassCard>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ressourcentyp
            </label>
            <input
              type="text"
              placeholder="z.B. user, property, document"
              value={filters.resource_type}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Benutzer-ID
            </label>
            <input
              type="text"
              placeholder="Benutzer-ID eingeben"
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            />
          </div>
        </div>
      </GlassCard>

      {/* Audit Logs Table */}
      <GlassCard className="overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Keine Audit-Logs gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Es wurden keine Aktivitäten mit den aktuellen Filtern gefunden.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Zeitstempel
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Benutzer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Aktion
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Ressource
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    IP-Adresse
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Beschreibung
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log: AdminAuditLog) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {log.user_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {log.user_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {log.action}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700 dark:text-gray-300">
                        {log.resource_type}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {log.resource_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getResultBadge('ok')} {/* Mock result - would come from backend */}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {log.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Pagination */}
      {total > filters.size && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Seite {filters.page} von {Math.ceil(total / filters.size)}
            </div>
            <div className="flex gap-2">
              <GlassButton
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
                variant="secondary"
                size="sm"
              >
                Zurück
              </GlassButton>
              <GlassButton
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= Math.ceil(total / filters.size)}
                variant="secondary"
                size="sm"
              >
                Weiter
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default AuditTab;