import React from 'react';
import { RefreshCw, Trash2, Edit, Clock, CheckCircle, XCircle, Loader, Calendar } from 'lucide-react';
import { PublishJob, PublishJobStatus } from '../../types/publish';

interface PublishStatusTableProps {
  jobs: PublishJob[];
  onRetry: (jobId: string) => void;
  onDelete: (jobId: string) => void;
}

const PublishStatusTable: React.FC<PublishStatusTableProps> = ({ jobs, onRetry, onDelete }) => {
  const getStatusBadge = (status: PublishJobStatus) => {
    const styles: Record<PublishJobStatus, { bg: string; icon: JSX.Element; text: string }> = {
      draft: { bg: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', icon: <Edit className="h-3 w-3" />, text: 'Entwurf' },
      scheduled: { bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: <Clock className="h-3 w-3" />, text: 'Geplant' },
      sent: { bg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', icon: <Loader className="h-3 w-3 animate-spin" />, text: 'Gesendet' },
      live: { bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: <CheckCircle className="h-3 w-3" />, text: 'Live' },
      error: { bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: <XCircle className="h-3 w-3" />, text: 'Fehler' }
    };
    const style = styles[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg}`}>
        {style.icon}
        {style.text}
      </span>
    );
  };

  const getPortalName = (portal: string) => {
    const names: Record<string, string> = {
      scout24: 'ImmoScout24',
      immowelt: 'Immowelt',
      ebay: 'eBay Kleinanzeigen'
    };
    return names[portal] || portal;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Keine Publishing-Jobs</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Starten Sie Ihre erste Veröffentlichung, um sie hier zu sehen.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Veröffentlichungs-Status</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Portal</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Externe ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Log</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Datum</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {job.portals.map(portal => (
                      <span key={portal} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {getPortalName(portal)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 dark:text-white font-mono">
                    {job.externalId || '—'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {job.lastLog || '—'}
                  </span>
                  {job.errorDetails && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">{job.errorDetails}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(job.createdAt)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {job.status === 'error' && (
                      <button
                        onClick={() => onRetry(job.id)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-all"
                        title="Wiederholen"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm('Job wirklich löschen?')) {
                          onDelete(job.id);
                        }
                      }}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PublishStatusTable;
