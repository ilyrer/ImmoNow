import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FileText, Upload, Eye, Download } from 'lucide-react';

interface DocumentData {
  totalDocuments: number;
  documentsByType: Array<{
    type: string;
    count: number;
    color: string;
  }>;
  recentUploads: Array<{
    name: string;
    type: string;
    size: string;
    uploadedAt: string;
  }>;
}

const DocumentAnalyticsWidget: React.FC = () => {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocumentData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch document analytics
        const response = await fetch('/api/v1/documents/analytics');
        const data = await response.json();

        console.log('📊 Document Analytics Response:', data);

        // Berechne Dokument-Typen mit Farben
        const typeColors = {
          'contract': '#3b82f6',
          'expose': '#10b981',
          'energy_certificate': '#f59e0b',
          'floor_plan': '#ef4444',
          'photo': '#8b5cf6',
          'video': '#06b6d4',
          'document': '#6b7280',
          'other': '#9ca3af'
        };

        const documentsByType = Object.entries(data.documents_by_type || {}).map(([type, count]) => ({
          type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count: count as number,
          color: typeColors[type as keyof typeof typeColors] || typeColors.other
        }));

        setDocumentData({
          totalDocuments: data.total_documents || 0,
          documentsByType,
          recentUploads: (data.recent_uploads || []).map((upload: any) => ({
            name: upload.name || 'Unbekannt',
            type: upload.type || 'document',
            size: upload.size ? `${(upload.size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
            uploadedAt: upload.created_at ? new Date(upload.created_at).toLocaleDateString('de-DE') : 'Unbekannt'
          }))
        });

      } catch (error) {
        console.error('❌ Error fetching document data:', error);
        // Fallback data
        setDocumentData({
          totalDocuments: 0,
          documentsByType: [],
          recentUploads: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchDocumentData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt Dokument-Daten...</p>
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Keine Dokument-Daten verfügbar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Dokumente
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {documentData.totalDocuments}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Gesamt
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      {documentData.documentsByType.length > 0 && (
        <div className="h-32 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={documentData.documentsByType}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="count"
              >
                {documentData.documentsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}`, 'Dokumente']}
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dokument-Typen Liste */}
      <div className="space-y-2 mb-4">
        {documentData.documentsByType.slice(0, 4).map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{item.type}</span>
            </div>
            <span className="text-gray-900 dark:text-white font-medium">
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {/* Neueste Uploads */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
            <Upload className="w-4 h-4 mr-1" />
            Neueste Uploads
          </h4>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Alle anzeigen
          </button>
        </div>
        
        <div className="space-y-2">
          {documentData.recentUploads.slice(0, 3).map((upload, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {upload.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {upload.type} • {upload.size}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {upload.uploadedAt}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Upload className="w-3 h-3" />
          <span>Upload</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Eye className="w-3 h-3" />
          <span>Alle</span>
        </button>
      </div>
    </div>
  );
};

export default DocumentAnalyticsWidget;
