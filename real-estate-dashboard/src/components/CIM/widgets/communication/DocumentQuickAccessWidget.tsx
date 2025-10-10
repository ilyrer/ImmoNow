import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../../../services/api.service';

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'expose' | 'energy_certificate' | 'floor_plan' | 'photo' | 'other';
  propertyId?: string;
  propertyTitle?: string;
  size: number;
  lastModified: string;
  status: 'draft' | 'final' | 'signed' | 'expired';
  category: 'verkauf' | 'vermietung' | 'verwaltung' | 'marketing';
  urgent?: boolean;
}

interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  color: string;
}

const DocumentQuickAccessWidget: React.FC = () => {
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'templates' | 'urgent'>('recent');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const docsResp = await apiService.getDocuments({});
        if (!mounted) return;
        const docs = (docsResp || []).slice(0, 5).map((d: any) => ({
          id: String(d.id),
          name: d.title,
          type: (d.document_type || 'other') as any,
          propertyId: d.property_id ? String(d.property_id) : undefined,
          propertyTitle: d.property?.title,
          size: (d.file_size || 0) / (1024 * 1024),
          lastModified: d.updated_at || d.created_at,
          status: (d.status || 'final') as any,
          category: 'marketing' as any,
          urgent: false,
        })) as Document[];
        setRecentDocuments(docs);
      } catch (e) {
        console.warn('Dokumentenliste konnte nicht geladen werden:', e);
        setRecentDocuments([]);
      }
      try {
        const folders = await apiService.getDocumentFolders();
        if (!mounted) return;
        const tpl = Array.isArray(folders) ? folders.slice(0, 6).map((f: any) => ({
          id: String(f.id || f.name),
          name: f.name || 'Vorlage',
          type: 'other',
          description: (f.description || '') as string,
          icon: 'ri-file-line',
          color: 'blue',
        })) : [];
        setTemplates(tpl as DocumentTemplate[]);
      } catch (e) {
        setTemplates([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'contract': return 'ri-file-text-line';
      case 'expose': return 'ri-image-line';
      case 'energy_certificate': return 'ri-leaf-line';
      case 'floor_plan': return 'ri-layout-line';
      case 'photo': return 'ri-camera-line';
      default: return 'ri-file-line';
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'contract': return 'text-blue-600 dark:text-blue-400';
      case 'expose': return 'text-purple-600 dark:text-purple-400';
      case 'energy_certificate': return 'text-green-600 dark:text-green-400';
      case 'floor_plan': return 'text-orange-600 dark:text-orange-400';
      case 'photo': return 'text-pink-600 dark:text-pink-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'signed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'final': return 'Final';
      case 'signed': return 'Unterzeichnet';
      case 'draft': return 'Entwurf';
      case 'expired': return 'Abgelaufen';
      default: return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1) return `${Math.round(bytes * 1000)} KB`;
    return `${bytes.toFixed(1)} MB`;
  };

  const getTemplateColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    };
    return colors[color] || colors.blue;
  };

  const urgentDocuments = recentDocuments.filter(doc => doc.urgent);
  const recentCount = recentDocuments.length;
  const urgentCount = urgentDocuments.length;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <i className="ri-folder-line mr-2 text-blue-600 dark:text-blue-400"></i>
          Dokumente
          {urgentCount > 0 && (
            <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">
              {urgentCount}
            </span>
          )}
        </h3>
        <Link
          to="/documents"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Alle anzeigen
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { key: 'recent', label: 'Aktuell', count: recentCount },
          { key: 'urgent', label: 'Dringend', count: urgentCount },
          { key: 'templates', label: 'Vorlagen', count: templates.length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                tab.key === 'urgent' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activeTab === 'recent' && (
          <>
            {recentDocuments.slice(0, 6).map((doc) => (
              <div
                key={doc.id}
                className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                  doc.urgent 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
                    : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    doc.urgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <i className={`${getDocumentIcon(doc.type)} ${getDocumentColor(doc.type)} text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {doc.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                        {getStatusText(doc.status)}
                      </span>
                    </div>
                    {doc.propertyTitle && (
                      <Link
                        to={`/immobilien/${doc.propertyId}`}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline block mb-1"
                      >
                        <i className="ri-home-4-line mr-1"></i>
                        {doc.propertyTitle}
                      </Link>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>{new Date(doc.lastModified).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'urgent' && (
          <>
            {urgentDocuments.length === 0 ? (
              <div className="text-center py-8">
                <i className="ri-check-double-line text-4xl text-green-500 dark:text-green-400 mb-4"></i>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Keine dringenden Dokumente
                </h4>
                <p className="text-gray-500 dark:text-gray-400">
                  Alle Dokumente sind aktuell.
                </p>
              </div>
            ) : (
              urgentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <i className={`${getDocumentIcon(doc.type)} ${getDocumentColor(doc.type)} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {doc.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                          {getStatusText(doc.status)}
                        </span>
                      </div>
                      {doc.propertyTitle && (
                        <Link
                          to={`/immobilien/${doc.propertyId}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline block mb-1"
                        >
                          <i className="ri-home-4-line mr-1"></i>
                          {doc.propertyTitle}
                        </Link>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          <i className="ri-alert-line mr-1"></i>
                          {doc.status === 'expired' ? 'Abgelaufen' : 'Entwurf ausstehend'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {new Date(doc.lastModified).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTemplateColorClass(template.color)}`}>
                    <i className={`${template.icon} text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {template.name}
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center">
            <i className="ri-upload-line mr-1"></i>
            Upload
          </button>
          <button className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors flex items-center justify-center">
            <i className="ri-add-line mr-1"></i>
            Neu erstellen
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentQuickAccessWidget; 
