/**
 * EmployeeDocumentsTab
 * Dokumentenverwaltung für Mitarbeiter
 */

import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  File,
  Image,
  Archive,
  Shield,
  Clock
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, LoadingSpinner } from '../admin/GlassUI';
import { 
  useEmployeeDocuments, 
  useUploadDocument, 
  useDownloadDocument 
} from '../../api/hrHooks';
import type { 
  EmployeeDocumentCreate, 
  EmployeeDocumentResponse
} from '../../types/hr';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '../../types/hr';

interface EmployeeDocumentsTabProps {
  employeeId: string;
}

const EmployeeDocumentsTab: React.FC<EmployeeDocumentsTabProps> = ({ employeeId }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<EmployeeDocumentResponse | null>(null);
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [filterConfidential, setFilterConfidential] = useState<boolean | 'all'>('all');
  const [filterExpired, setFilterExpired] = useState<boolean | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formular-Daten
  const [formData, setFormData] = useState({
    title: '',
    document_type: DocumentType.OTHER,
    description: '',
    expires_at: '',
    is_confidential: false,
    file_url: ''
  });

  const { 
    data: documentsData, 
    isLoading, 
    error 
  } = useEmployeeDocuments(employeeId, {
    document_type: filterType === 'all' ? undefined : filterType,
    is_confidential: filterConfidential === 'all' ? undefined : filterConfidential,
    is_expired: filterExpired === 'all' ? undefined : filterExpired
  });

  const uploadDocumentMutation = useUploadDocument();
  const downloadDocumentMutation = useDownloadDocument();

  const documents = documentsData?.items || [];

  const handleUploadDocument = async () => {
    if (!formData.title || !formData.document_type) return;

    const documentData: EmployeeDocumentCreate = {
      title: formData.title,
      document_type: formData.document_type,
      description: formData.description || undefined,
      expires_at: formData.expires_at || undefined,
      is_confidential: formData.is_confidential,
      file_url: formData.file_url
    };

    try {
      await uploadDocumentMutation.mutateAsync({
        employeeId,
        documentData
      });
      setShowUploadModal(false);
      resetForm();
    } catch (error) {
      console.error('Fehler beim Hochladen des Dokuments:', error);
    }
  };

  const handleEditDocument = async () => {
    if (!editingDocument) return;

    // TODO: Implement update document mutation
    console.log('Edit document:', editingDocument.id, formData);
    setShowEditModal(false);
    setEditingDocument(null);
    resetForm();
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const blob = await downloadDocumentMutation.mutateAsync(documentId);
      
      // Erstelle Download-Link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document_${documentId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Fehler beim Download:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement file upload to server
      // For now, just set a placeholder URL
      setFormData(prev => ({ ...prev, file_url: `uploaded_${file.name}` }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      document_type: DocumentType.OTHER,
      description: '',
      expires_at: '',
      is_confidential: false,
      file_url: ''
    });
  };

  const openEditModal = (document: EmployeeDocumentResponse) => {
    setEditingDocument(document);
    setFormData({
      title: document.title,
      document_type: document.document_type,
      description: document.description || '',
      expires_at: document.expires_at || '',
      is_confidential: document.is_confidential,
      file_url: document.file_url
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getDocumentIcon = (documentType: DocumentType) => {
    switch (documentType) {
      case DocumentType.CONTRACT:
        return <FileText className="w-5 h-5 text-blue-500" />;
      case DocumentType.CERTIFICATE:
        return <FileText className="w-5 h-5 text-red-500" />;
      case DocumentType.ID_CARD:
      case DocumentType.PASSPORT:
        return <Image className="w-5 h-5 text-green-500" />;
      case DocumentType.PAYSLIP:
        return <FileText className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (document: EmployeeDocumentResponse) => {
    if (isExpired(document.expires_at)) {
      return <Badge variant="danger">Abgelaufen</Badge>;
    } else if (document.is_confidential) {
      return <Badge variant="warning">Vertraulich</Badge>;
    } else {
      return <Badge variant="success">Aktiv</Badge>;
    }
  };

  const getDocumentsByType = () => {
    const typeCounts: Record<string, number> = {};
    documents.forEach(doc => {
      typeCounts[doc.document_type] = (typeCounts[doc.document_type] || 0) + 1;
    });
    return typeCounts;
  };

  const getExpiredDocuments = () => {
    return documents.filter(doc => isExpired(doc.expires_at)).length;
  };

  const getConfidentialDocuments = () => {
    return documents.filter(doc => doc.is_confidential).length;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Fehler beim Laden der Dokumente
        </h3>
        <p className="text-gray-600">
          Die Dokumente konnten nicht geladen werden. Bitte versuchen Sie es später erneut.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Dokumentenverwaltung
          </h2>
          <p className="text-gray-600 mt-1">
            Mitarbeiterdokumente verwalten und hochladen
          </p>
        </div>
        
        <GlassButton 
          variant="primary" 
          className="flex items-center"
          onClick={() => setShowUploadModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Dokument hochladen
        </GlassButton>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gesamt Dokumente</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vertrauliche Dokumente</p>
              <p className="text-2xl font-bold text-gray-900">
                {getConfidentialDocuments()}
              </p>
            </div>
            <Shield className="w-8 h-8 text-yellow-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Abgelaufene Dokumente</p>
              <p className="text-2xl font-bold text-gray-900">
                {getExpiredDocuments()}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Letztes Update</p>
              <p className="text-lg font-semibold text-gray-900">
                {documents.length > 0 
                  ? formatDate(documents[0].updated_at)
                  : 'Keine'
                }
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </GlassCard>
      </div>

      {/* Dokumenttypen-Übersicht */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Archive className="w-5 h-5 mr-2" />
          Dokumente nach Typ
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(getDocumentsByType()).map(([type, count]) => (
            <div key={type} className="text-center">
              <div className="flex justify-center mb-2">
                {getDocumentIcon(type as DocumentType)}
              </div>
              <p className="text-sm text-gray-600">{DOCUMENT_TYPE_LABELS[type as DocumentType]}</p>
              <p className="text-lg font-semibold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Filter und Suche */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Dokumente durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as DocumentType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle Typen</option>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={filterConfidential === 'all' ? 'all' : filterConfidential.toString()}
              onChange={(e) => setFilterConfidential(e.target.value === 'all' ? 'all' : e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle</option>
              <option value="false">Öffentlich</option>
              <option value="true">Vertraulich</option>
            </select>
            <select
              value={filterExpired === 'all' ? 'all' : filterExpired.toString()}
              onChange={(e) => setFilterExpired(e.target.value === 'all' ? 'all' : e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle</option>
              <option value="false">Aktiv</option>
              <option value="true">Abgelaufen</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Dokumentenliste */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dokument
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ablaufdatum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getDocumentIcon(document.document_type)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {document.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(document.uploaded_at)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {DOCUMENT_TYPE_LABELS[document.document_type]}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {document.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {document.expires_at ? formatDate(document.expires_at) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(document)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(document.file_url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </GlassButton>
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadDocument(document.id)}
                        disabled={downloadDocumentMutation.isPending}
                      >
                        <Download className="w-4 h-4" />
                      </GlassButton>
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(document)}
                      >
                        <Edit className="w-4 h-4" />
                      </GlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leerer Zustand */}
        {documents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Dokumente gefunden
            </h3>
            <p className="text-gray-600">
              Es wurden noch keine Dokumente für diesen Mitarbeiter hochgeladen.
            </p>
          </div>
        )}
      </GlassCard>

      {/* Dokument hochladen Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dokument hochladen
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dokumenttitel..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dokumenttyp
                </label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value as DocumentType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Beschreibung des Dokuments..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ablaufdatum (optional)
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_confidential"
                  checked={formData.is_confidential}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_confidential: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_confidential" className="ml-2 block text-sm text-gray-900">
                  Vertrauliches Dokument
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datei hochladen
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <GlassButton
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Datei auswählen
                  </GlassButton>
                  {formData.file_url && (
                    <span className="text-sm text-gray-600 truncate max-w-32">
                      {formData.file_url}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
              >
                Abbrechen
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleUploadDocument}
                disabled={!formData.title || !formData.document_type || !formData.file_url || uploadDocumentMutation.isPending}
              >
                {uploadDocumentMutation.isPending ? 'Wird hochgeladen...' : 'Hochladen'}
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Dokument bearbeiten Modal */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dokument bearbeiten
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dokumenttyp
                </label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value as DocumentType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ablaufdatum
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_confidential"
                  checked={formData.is_confidential}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_confidential: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit_is_confidential" className="ml-2 block text-sm text-gray-900">
                  Vertrauliches Dokument
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDocument(null);
                  resetForm();
                }}
              >
                Abbrechen
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleEditDocument}
                disabled={!formData.title || !formData.document_type}
              >
                Speichern
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDocumentsTab;
