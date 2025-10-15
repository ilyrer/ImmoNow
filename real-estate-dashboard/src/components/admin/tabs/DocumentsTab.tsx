import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { GlassCard, GlassButton, Badge, EmptyState } from '../GlassUI';
import { 
  useEmployeeDocuments, 
  useDocumentTypes,
  useUploadEmployeeDocument,
  useSignDocument,
  useDeleteEmployeeDocument,
  EmployeeDocument 
} from '../../../api/adminHooks';

const DocumentsTab: React.FC = () => {
  const { data: documents = [], isLoading, error } = useEmployeeDocuments();
  const { data: documentTypes = [] } = useDocumentTypes();
  const uploadDocumentMutation = useUploadEmployeeDocument();
  const signDocumentMutation = useSignDocument();
  const deleteDocumentMutation = useDeleteEmployeeDocument();
  
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const getSignStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1 inline" />Signiert</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1 inline" />Ausstehend</Badge>;
      case 'expired':
        return <Badge variant="danger"><AlertCircle className="w-3 h-3 mr-1 inline" />Abgelaufen</Badge>;
      case 'rejected':
        return <Badge variant="danger"><AlertCircle className="w-3 h-3 mr-1 inline" />Abgelehnt</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getDocTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.id === type);
    return docType?.name || type;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocumentMutation.mutate({
        file,
        data: {
          document_type: 'contract',
          title: file.name,
        }
      });
    }
  };

  const handleSignDocument = (documentId: string) => {
    signDocumentMutation.mutate(documentId);
  };

  const handleDeleteDocument = (documentId: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Dokument löschen möchten?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || doc.sign_status === selectedStatus;
    return matchesType && matchesStatus;
  });

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
        <EmptyState
          icon={FileText}
          title="Fehler beim Laden der Dokumente"
          description="Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        />
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
              Mitarbeiterdokumente
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Verwalten Sie Verträge, Zertifikate und andere Mitarbeiterdokumente
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
            <GlassButton 
              variant="primary" 
              icon={Upload}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Dokument hochladen
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex gap-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
          >
            <option value="all">Alle Typen</option>
            {documentTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
          >
            <option value="all">Alle Status</option>
            <option value="pending">Ausstehend</option>
            <option value="signed">Signiert</option>
            <option value="expired">Abgelaufen</option>
            <option value="rejected">Abgelehnt</option>
          </select>
        </div>
      </GlassCard>

      {/* Documents Table */}
      <GlassCard className="overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Keine Dokumente gefunden"
            description="Es wurden keine Dokumente mit den aktuellen Filtern gefunden."
            action={{ label: 'Filter zurücksetzen', onClick: () => { setSelectedType('all'); setSelectedStatus('all'); } }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Dokument
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Mitarbeiter
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Gültig bis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Hochgeladen
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.map((doc: EmployeeDocument) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {doc.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {doc.file_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {doc.employee_name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info">{getDocTypeLabel(doc.type)}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {getSignStatusBadge(doc.sign_status)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {doc.valid_until ? new Date(doc.valid_until).toLocaleDateString('de-DE') : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(doc.uploaded_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {doc.sign_status === 'pending' && (
                          <GlassButton
                            onClick={() => handleSignDocument(doc.id)}
                            variant="success"
                            size="sm"
                          >
                            Signieren
                          </GlassButton>
                        )}
                        <GlassButton variant="secondary" size="sm">
                          Anzeigen
                        </GlassButton>
                        <GlassButton
                          onClick={() => handleDeleteDocument(doc.id)}
                          variant="danger"
                          size="sm"
                        >
                          Löschen
                        </GlassButton>
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