import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/config';

type ReportTemplate = {
  id: number;
  name: string;
  description?: string;
  type: string;
  category_id: number;
  default_parameters?: Record<string, any> | null;
  available_formats?: string[];
};

type Report = {
  id: number;
  name: string;
  type: string;
  status: string;
  format: string;
  created_at: string;
};

type SalesAnalytics = {
  total_sales: number;
  deals_count: number;
  avg_time_to_close_days?: number;
  top_performers?: Array<{ name: string; value: number }>;
};

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

const ReportsPage: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [sales, setSales] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start: formatDate(start), end: formatDate(end) };
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tplRes, repRes] = await Promise.all([
        apiClient.get('/reports/templates'),
        apiClient.get('/reports', { params: { limit: 20, offset: 0 } }),
      ]);
      setTemplates((tplRes as any)?.data || []);
      setReports((repRes as any)?.data || []);
      // Sales analytics (optional: requires manager/admin)
      try {
        const sa = await apiClient.get('/reports/analytics/sales', { params: { start_date: range.start, end_date: range.end } });
        setSales((sa as any)?.data || null);
      } catch (e) {
        // ignore if not authorized
        setSales(null);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Fehler beim Laden der Reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleGenerate = async (tpl: ReportTemplate) => {
    try {
      setGeneratingId(tpl.id);
      const payload = {
        name: `${tpl.name} ${new Date().toLocaleDateString('de-DE')}`,
        description: tpl.description || '',
        template_id: tpl.id,
        type: tpl.type,
        category_id: tpl.category_id,
        format: (tpl.available_formats?.[0] || 'pdf').toLowerCase(),
        parameters: {
          start_date: range.start,
          end_date: range.end,
          ...(tpl.default_parameters || {}),
        },
        visibility: 'private',
        recipients: [],
        tags: [],
      };
      await apiClient.post('/reports/generate', payload);
      await loadAll();
    } catch (e) {
      // noop handled by interceptor
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownload = async (rep: Report) => {
    try {
      const url = `${import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000'}/reports/${rep.id}/download`;
      // trigger browser download
      window.open(url, '_blank');
    } catch {}
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Analyse & Reporting</h1>
          <p className="text-gray-600 dark:text-gray-400">Erstellen Sie Berichte aus echten Backend-Daten und laden Sie Ergebnisse herunter</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Analytics snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Zeitraum</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{range.start} – {range.end}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Umsatz (Sales)</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{sales ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(sales.total_sales || 0) : '—'}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Abschlüsse</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{sales?.deals_count ?? '—'}</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-lg p-3">{error}</div>
        )}

        {/* Templates and recent reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report-Templates</h2>
              <button onClick={loadAll} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">Aktualisieren</button>
            </div>
            <div className="space-y-3">
              {loading && !templates.length && (
                <div className="text-gray-500 dark:text-gray-400">Lade Templates…</div>
              )}
              {templates.map((tpl) => (
                <div key={tpl.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{tpl.name}</div>
                      {tpl.description && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tpl.description}</div>}
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Typ: {tpl.type} · Kategorie #{tpl.category_id}</div>
                    </div>
                    <button
                      disabled={generatingId === tpl.id}
                      onClick={() => handleGenerate(tpl)}
                      className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {generatingId === tpl.id ? 'Erstellt…' : 'Erstellen'}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && !templates.length && (
                <div className="text-gray-500 dark:text-gray-400">Keine Templates gefunden.</div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Zuletzt generierte Reports</h2>
            <div className="space-y-3">
              {loading && !reports.length && (
                <div className="text-gray-500 dark:text-gray-400">Lade Reports…</div>
              )}
              {reports.map((r) => (
                <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{r.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(r.created_at).toLocaleString('de-DE')} · Typ: {r.type.toUpperCase()} · Format: {r.format.toUpperCase()}</div>
                      <div className="mt-1 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : r.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' : r.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>{r.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(r)}
                        disabled={r.status !== 'completed'}
                        className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                        title={r.status === 'completed' ? 'Download' : 'Noch nicht verfügbar'}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && !reports.length && (
                <div className="text-gray-500 dark:text-gray-400">Keine Reports gefunden.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
