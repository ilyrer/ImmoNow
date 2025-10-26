import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download, 
  Eye, 
  Trash2, 
  Plus,
  File,
  Calendar,
  User,
  Filter
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, EmptyState, LoadingSpinner } from '../GlassUI';
import { 
  useEmployeeDocuments, 
  useDocumentTypes,
  useDocumentStats,
  useUploadEmployeeDocument,
  useSignEmployeeDocument,
  useDeleteEmployeeDocument,
  EmployeeDocument,
  DocumentType,
  DocumentStats
} from '../../../api/adminHooks';
import { adminApi } from '../../../api/adminHooks';

const DocumentsTab: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [documentDescription, setDocumentDescription] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  
  // API Hooks
  const { data: documentsData, isLoading, error } = useEmployeeDocuments({
    document_type_id: selectedType === 'all' ? undefined : selectedType,
    sign_status: selectedStatus === 'all' ? undefined : selectedStatus,
  });
  const { data: documentTypes = [] } = useDocumentTypes();
  const { data: stats } = useDocumentStats();
  const uploadDocumentMutation = useUploadEmployeeDocument();
  const signDocumentMutation = useSignEmployeeDocument();
  const deleteDocumentMutation = useDeleteEmployeeDocument();

  const documents = documentsData?.documents || [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getSignStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge variant="success">
          <CheckCircle className="w-3 h-3 mr-1 inline" />Signiert
        </Badge>;
      case 'pending':
        return <Badge variant="warning">
          <Clock className="w-3 h-3 mr-1 inline" />Ausstehend
        </Badge>;
      case 'expired':
        return <Badge variant="danger">
          <AlertCircle className="w-3 h-3 mr-1 inline" />Abgelaufen
        </Badge>;
      case 'rejected':
        return <Badge variant="danger">
          <AlertCircle className="w-3 h-3 mr-1 inline" />Abgelehnt
        </Badge>;
      case 'cancelled':
        return <Badge variant="default">
          <AlertCircle className="w-3 h-3 mr-1 inline" />Storniert
        </Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getDocTypeLabel = (typeId: string) => {
    const docType = documentTypes.find(dt => dt.id === typeId);
    return docType?.name || typeId;
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !selectedDocumentType) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type_id', selectedDocumentType);
    formData.append('title', documentTitle || file.name);
    formData.append('description', documentDescription);
    if (validUntil) {
      formData.append('valid_until', validUntil);
    }
    if (selectedEmployee) {
      formData.append('employee_id', selectedEmployee);
    }

    try {
      await uploadDocumentMutation.mutateAsync(formData);
      setUploadDialogOpen(false);
      resetUploadForm();
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const resetUploadForm = () => {
    setSelectedEmployee('');
    setSelectedDocumentType('');
    setDocumentTitle('');
    setDocumentDescription('');
    setValidUntil('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSignDocument = async (documentId: string) => {
    try {
      await signDocumentMutation.mutateAsync({ 
        id: documentId, 
        signatureData: { 
          signature: 'digital_signature_placeholder',
          timestamp: new Date().toISOString()
        } 
      });
    } catch (error) {
      console.error('Error signing document:', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      try {
        await deleteDocumentMutation.mutateAsync(documentId);
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const blob = await adminApi.downloadEmployeeDocument(documentId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      
      // Get filename from document or use default
      const doc = documents.find(doc => doc.id === documentId);
      const filename = doc?.file_name || `document_${documentId}`;
      
      link.download = filename;
      window.document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Fehler beim Herunterladen des Dokuments');
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-8">
        <LoadingSpinner size="lg" />
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
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Dokumente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_documents}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ausstehende Signaturen</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pending_signatures}
                </p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Signierte Dokumente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.signed_documents}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Abgelaufene Dokumente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.expired_documents}
                </p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Mitarbeiterdokumente
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Verwalten Sie Dokumente und Signaturen
            </p>
          </div>
          <div className="flex gap-3">
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
            <GlassButton onClick={() => setUploadDialogOpen(true)} variant="primary" icon={Plus}>
              Dokument hochladen
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Documents Table */}
      <GlassCard className="overflow-hidden">
        {documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Keine Dokumente gefunden"
            description="Laden Sie Ihr erstes Dokument hoch, um zu beginnen."
            action={{ label: 'Dokument hochladen', onClick: () => setUploadDialogOpen(true) }}
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
                    Größe
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Gültig bis
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {documents.map((doc: EmployeeDocument) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <File className="w-5 h-5 text-blue-500" />
                        </div>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {doc.employee_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info">
                        {getDocTypeLabel(doc.document_type_id)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {getSignStatusBadge(doc.sign_status)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {doc.valid_until ? formatDate(doc.valid_until) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadDocument(doc.id)}
                          className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        <button
                          onClick={() => {/* TODO: Open preview modal */}}
                          className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                          title="Vorschau"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        {doc.sign_status === 'pending' && (
                          <button
                            onClick={() => handleSignDocument(doc.id)}
                            disabled={signDocumentMutation.isPending}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
                            title="Signieren"
                          >
                            {signDocumentMutation.isPending ? '...' : 'Signieren'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={deleteDocumentMutation.isPending}
                          className="p-2 rounded-lg hover:bg-red-200/50 dark:hover:bg-red-700/50 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Upload Dialog */}
      {uploadDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Dokument hochladen</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const file = fileInputRef.current?.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Datei *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Dokumenttyp *</label>
                  <select
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">Typ wählen...</option>
                    {documentTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Titel</label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Dokumenttitel..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Beschreibung</label>
                  <textarea
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Beschreibung..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Gültig bis (optional)</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setUploadDialogOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={uploadDocumentMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadDocumentMutation.isPending ? 'Wird hochgeladen...' : 'Hochladen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;