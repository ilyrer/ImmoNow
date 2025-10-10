import React, { useState } from 'react';
import { Activity, Filter, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
// TODO: Implement real API hooks
import { GlassCard, GlassButton, Badge } from '../GlassUI';

// Mock hook for backward compatibility
const useAuditLogMock = () => {
  const [filters, setFilters] = useState({
    dateRange: 'all',
    result: 'all',
    user: 'all',
    module: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const logs = [
    {
      id: '1',
      user: 'admin@example.com',
      ipAddress: '192.168.1.1',
      module: 'auth',
      action: 'login',
      result: 'ok',
      timestamp: new Date().toISOString(),
      details: 'Successful login'
    }
  ];

  return {
    logs,
    filters,
    setFilters
  };
};

const AuditTab: React.FC = () => {
  const { logs, filters, setFilters } = useAuditLogMock();

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
    return new Date(timestamp).toLocaleString('de-DE');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Benutzer
            </label>
            <input
              type="text"
              placeholder="Suchen..."
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modul
            </label>
            <select
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
            >
              <option value="">Alle Module</option>
              <option value="properties">Properties</option>
              <option value="contacts">Contacts</option>
              <option value="admin">Admin</option>
              <option value="documents">Documents</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Von Datum
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bis Datum
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
            />
          </div>
        </div>
      </GlassCard>

      {/* Audit Logs */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Aktivitätsprotokolle</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{logs.length} Einträge</p>
          </div>
          <GlassButton variant="secondary" icon={Filter}>
            Export
          </GlassButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Benutzer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Aktion</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Modul</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Zeitstempel</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Ergebnis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{log.user}</div>
                    {log.ipAddress && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{log.ipAddress}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono text-sm">{log.action}</td>
                  <td className="px-6 py-4">
                    <Badge variant="info">{log.module}</Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm max-w-xs truncate">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4">{getResultBadge(log.result)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default AuditTab;
