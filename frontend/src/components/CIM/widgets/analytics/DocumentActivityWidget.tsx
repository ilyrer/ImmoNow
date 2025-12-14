import React from 'react';
import { useDocumentAnalytics } from '../../../../api/hooks';
import { FileText, Upload } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const LoadingState = () => (
  <div className="p-6 h-full flex flex-col space-y-4">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="glass p-4 rounded-xl animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
  </div>
);

const DocumentActivityWidget: React.FC = () => {
  const { data: analytics, isLoading } = useDocumentAnalytics();

  if (isLoading || !analytics) return <LoadingState />;

  const byType = Object.entries(analytics.documents_by_type ?? {}).map(([name, value]) => ({ name, value }));
  const totalDocs = analytics.total_documents ?? byType.reduce((sum, item) => sum + (item.value as number), 0);
  const recentUploads = (analytics.recent_uploads ?? []).filter((u) => u.uploaded_at);

  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dokument-Aktivität</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Uploads, Typen & Status</p>
          </div>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          {totalDocs} Dateien
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gesamt</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalDocs}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">im Bestand</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Neu (30d)</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.recent_uploads?.length ?? 0}</div>
          <div className="text-xs text-blue-500 dark:text-blue-300">Aktiv</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ø Größe</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(analytics.average_size || 0)} KB</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Durchschnitt</div>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Upload className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Uploads nach Typ</p>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Letzte 30 Tage</span>
        </div>
        {byType.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">Keine Uploads gefunden</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byType} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgba(249,115,22,0.05)' }} />
              <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {recentUploads.length > 0 && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Neueste Uploads</p>
            <span className="text-xs text-gray-500 dark:text-gray-400">{recentUploads.length} Dateien</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {recentUploads.slice(0, 5).map((upload) => (
              <div key={upload.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/40 dark:bg-gray-800/60 border border-white/30 dark:border-gray-700/50 text-xs">
                <span className="text-gray-900 dark:text-white truncate">{upload.title || upload.file_name}</span>
                <span className="text-gray-500 dark:text-gray-400">{new Date(upload.uploaded_at).toLocaleDateString('de-DE')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {recentUploads.length === 0 && (
        <div className="glass rounded-xl p-4 text-xs text-gray-500 dark:text-gray-400">
          Keine gültigen Uploads mit Zeitstempel gefunden.
        </div>
      )}
    </div>
  );
};

export default DocumentActivityWidget;

