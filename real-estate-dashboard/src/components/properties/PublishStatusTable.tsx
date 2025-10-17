import React from 'react';
import { RefreshCw, Trash2, Edit, Clock, CheckCircle, XCircle, Loader, Calendar, ExternalLink } from 'lucide-react';
import { PublishJobData } from '../../services/publishing';

interface PublishStatusTableProps {
  jobs: PublishJobData[];
  onRetry: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  getJobStatusColor: (status: string) => string;
  getJobStatusText: (status: string) => string;
}

const PublishStatusTable: React.FC<PublishStatusTableProps> = ({ 
  jobs, 
  onRetry, 
  onDelete, 
  getJobStatusColor, 
  getJobStatusText 
}) => {
  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getJobStatusColor(status)}`}>
        {status === 'published' && <CheckCircle className="h-3 w-3" />}
        {status === 'publishing' && <Loader className="h-3 w-3 animate-spin" />}
        {status === 'failed' && <XCircle className="h-3 w-3" />}
        {status === 'pending' && <Clock className="h-3 w-3" />}
        {status === 'unpublished' && <Edit className="h-3 w-3" />}
        {getJobStatusText(status)}
      </span>
    );
  };

  const getPortalName = (portal: string) => {
    const names: Record<string, string> = {
      immoscout24: 'ImmoScout24',
      immowelt: 'Immowelt',
      'wg-gesucht': 'WG-Gesucht'
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
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Fehler</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Datum</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getPortalName(job.portal)}
                    </span>
                    {job.portal_url && (
                      <a
                        href={job.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        title="Auf Portal öffnen"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 dark:text-white font-mono">
                    {job.portal_property_id || '—'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {job.error_message ? (
                    <div className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate" title={job.error_message}>
                      {job.error_message}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>Erstellt: {formatDate(job.created_at)}</div>
                    {job.published_at && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Veröffentlicht: {formatDate(job.published_at)}
                      </div>
                    )}
                    {job.unpublished_at && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Entfernt: {formatDate(job.unpublished_at)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {job.status === 'failed' && (
                      <button
                        onClick={() => onRetry(job.id)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-all"
                        title="Wiederholen"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    {job.status === 'published' && (
                      <button
                        onClick={() => onDelete(job.id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                        title="Veröffentlichung entfernen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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
