import React from 'react';
import { FileText, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
// TODO: Implement real API hooks
import { GlassCard, GlassButton, Badge, EmptyState } from '../GlassUI';

// Mock hook for backward compatibility
const useEmployeeDocsMock = () => {
  const documents = [
    {
      id: '1',
      name: 'Arbeitsvertrag.pdf',
      title: 'Arbeitsvertrag.pdf',
      type: 'contract',
      status: 'signed',
      signStatus: 'signed',
      version: '1.0',
      uploadedAt: new Date().toISOString(),
      signedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const uploadDocument = async (file: File) => {
    console.warn('Mock uploadDocument called');
    return { success: true };
  };

  return {
    documents,
    uploadDocument
  };
};

const DocumentsTab: React.FC = () => {
  const { documents, uploadDocument } = useEmployeeDocsMock();

  const getSignStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1 inline" />Signiert</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1 inline" />Ausstehend</Badge>;
      case 'expired':
        return <Badge variant="danger"><AlertCircle className="w-3 h-3 mr-1 inline" />Abgelaufen</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contract: 'Arbeitsvertrag',
      nda: 'NDA',
      certificate: 'Zertifikat',
      id_document: 'Ausweisdokument',
      other: 'Sonstiges',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Dokumente & Verträge</h3>
            <p className="text-gray-600 dark:text-gray-400">Verwaltung von Arbeitsverträgen, NDAs und Nachweisen</p>
          </div>
          <GlassButton variant="primary" icon={Upload}>Dokument hochladen</GlassButton>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Keine Dokumente vorhanden"
            description="Laden Sie Arbeitsverträge, NDAs oder andere Dokumente hoch."
            action={{ label: 'Dokument hochladen', onClick: () => console.log('Upload') }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Titel</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Typ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Version</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Signatur-Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Gültig bis</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{doc.title}</td>
                    <td className="px-6 py-4">
                      <Badge variant="info">{getDocTypeLabel(doc.type)}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{doc.version}</td>
                    <td className="px-6 py-4">{getSignStatusBadge(doc.signStatus)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {doc.validUntil ? new Date(doc.validUntil).toLocaleDateString('de-DE') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <GlassButton size="sm" variant="secondary">Vorschau</GlassButton>
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

export default DocumentsTab;
