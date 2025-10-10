import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Mock interfaces
interface Document {
  id: string;
  title: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  folderId?: string;
  tags: string[];
  description?: string;
  isPublic: boolean;
  permissions: string[];
  metadata: any;
  originalName: string;
  versions: DocumentVersion[];
}

interface DocumentVersion {
  id: string;
  version: string;
  createdAt: string;
  url: string;
  size: number;
}

interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

interface DocumentAnalytics {
  totalDocuments: number;
  totalSize: number;
  documentsByType: Record<string, number>;
  recentDocuments: Document[];
  mostViewedDocuments: Array<{
    id: string;
    title: string;
    type: string;
    views: number;
  }>;
  storageUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

interface DocumentFilter {
  search?: string;
  type?: string[];
  folderId?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  isPublic?: boolean;
  permissions?: string[];
}

interface DocumentType {
  pdf: string;
  doc: string;
  docx: string;
  xls: string;
  xlsx: string;
  ppt: string;
  pptx: string;
  txt: string;
  image: string;
  video: string;
  audio: string;
  archive: string;
  other: string;
}

interface DocumentPermission {
  read: string;
  write: string;
  delete: string;
  share: string;
  admin: string;
}

interface DocumentTag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface DocumentComment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: any;
}

interface DocumentShare {
  id: string;
  documentId: string;
  userId: string;
  permission: string;
  createdAt: string;
  expiresAt?: string;
}

interface DocumentDownload {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

interface DocumentPreview {
  id: string;
  documentId: string;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
}

interface DocumentUpload {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  size: number;
  fileName: string;
}

interface DocumentDelete {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  reason?: string;
}

interface DocumentUpdate {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  changes: any;
}

interface DocumentCreate {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  fileName: string;
  size: number;
}

interface DocumentMove {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  fromFolderId: string;
  toFolderId: string;
}

interface DocumentCopy {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  newDocumentId: string;
}

interface DocumentRename {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  oldName: string;
  newName: string;
}

interface DocumentArchive {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
}

interface DocumentRestore {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
}

interface DocumentPublish {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
}

interface DocumentUnpublish {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
}

interface DocumentLock {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
}

interface DocumentUnlock {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
}

interface DocumentVersionCreate {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  version: string;
}

interface DocumentVersionDelete {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  version: string;
}

interface DocumentVersionRestore {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  version: string;
}

interface DocumentVersionDownload {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  version: string;
}

interface DocumentVersionPreview {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  version: string;
}

interface DocumentVersionUpdate {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  version: string;
}

interface DocumentVersionList {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
}

interface DocumentVersionGet {
  id: string;
  documentId: string;
  userId: string;
  timestamp: string;
  version: string;
}

interface DocumentVersionCreateRequest {
  documentId: string;
  file: File;
  description?: string;
}

interface DocumentVersionUpdateRequest {
  documentId: string;
  version: string;
  description?: string;
}

interface DocumentVersionDeleteRequest {
  documentId: string;
  version: string;
}

interface DocumentVersionRestoreRequest {
  documentId: string;
  version: string;
}

interface DocumentVersionDownloadRequest {
  documentId: string;
  version: string;
}

interface DocumentVersionPreviewRequest {
  documentId: string;
  version: string;
}

interface DocumentVersionListRequest {
  documentId: string;
}

interface DocumentVersionGetRequest {
  documentId: string;
  version: string;
}

interface DocumentVersionResponse {
  id: string;
  version: string;
  createdAt: string;
  url: string;
  size: number;
  description?: string;
}

interface DocumentVersionListResponse {
  versions: DocumentVersionResponse[];
  total: number;
}

interface DocumentVersionCreateResponse {
  version: DocumentVersionResponse;
}

interface DocumentVersionUpdateResponse {
  version: DocumentVersionResponse;
}

interface DocumentVersionDeleteResponse {
  success: boolean;
}

interface DocumentVersionRestoreResponse {
  version: DocumentVersionResponse;
}

interface DocumentVersionDownloadResponse {
  url: string;
  expiresAt: string;
}

interface DocumentVersionPreviewResponse {
  url: string;
  thumbnailUrl: string;
}

interface DocumentVersionGetResponse {
  version: DocumentVersionResponse;
}

// Mock hooks
const useUpdateDocument = () => {
  return {
    mutateAsync: async (data: any) => {
      console.log('Mock update document:', data);
      return Promise.resolve();
    }
  };
};

const useDeleteDocument = () => {
  return {
    mutateAsync: async (id: string) => {
      console.log('Mock delete document:', id);
      return Promise.resolve();
    }
  };
};

interface DocumentDetailModalProps {
  document: Document;
  onClose: () => void;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ document, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState<Partial<Document>>(document);
  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'comments' | 'activity'>('details');
  
  const updateDocumentMutation = useUpdateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  const handleSave = async () => {
    try {
      await updateDocumentMutation.mutateAsync({
        id: document.id,
        ...editedDocument
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Dokument löschen möchten?')) {
      try {
        await deleteDocumentMutation.mutateAsync(document.id);
        onClose();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      pdf: 'ri-file-pdf-line',
      doc: 'ri-file-word-line',
      docx: 'ri-file-word-line',
      xls: 'ri-file-excel-line',
      xlsx: 'ri-file-excel-line',
      ppt: 'ri-file-ppt-line',
      pptx: 'ri-file-ppt-line',
      txt: 'ri-file-text-line',
      image: 'ri-image-line',
      video: 'ri-video-line',
      audio: 'ri-music-line',
      archive: 'ri-file-zip-line',
      other: 'ri-file-line'
    };
    return iconMap[type] || iconMap.other;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <i className={`${getFileIcon(document.type)} text-2xl text-blue-600 dark:text-blue-400`}></i>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedDocument.title || ''}
                    onChange={(e) => setEditedDocument(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-transparent border-b border-gray-300 dark:border-gray-600 text-xl font-semibold text-gray-900 dark:text-white"
                  />
                ) : (
                  document.title
                )}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatFileSize(document.size)} • {document.type.toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedDocument(document);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Abbrechen
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                >
                  Löschen
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'details', label: 'Details', icon: 'ri-information-line' },
            { id: 'versions', label: 'Versionen', icon: 'ri-history-line' },
            { id: 'comments', label: 'Kommentare', icon: 'ri-chat-3-line' },
            { id: 'activity', label: 'Aktivität', icon: 'ri-time-line' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Beschreibung
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedDocument.description || ''}
                      onChange={(e) => setEditedDocument(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-24 resize-none"
                      placeholder="Beschreibung eingeben"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {document.description || 'Keine Beschreibung verfügbar'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Erstellt
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(document.createdAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zuletzt geändert
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(document.updatedAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Öffentlich
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {document.isPublic ? 'Ja' : 'Nein'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              {document.versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <i className="ri-file-line text-gray-400"></i>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Version {version.version}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatFileSize(version.size)} • {new Date(version.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors">
                      Herunterladen
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                      Vorschau
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Kommentar hinzufügen..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Hinzufügen
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Max Mustermann</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date().toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Dieses Dokument ist sehr hilfreich für unser Projekt.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <i className="ri-upload-line text-blue-600 dark:text-blue-400"></i>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      Dokument hochgeladen
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Max Mustermann • {new Date().toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <i className="ri-edit-line text-green-600 dark:text-green-400"></i>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      Dokument bearbeitet
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Anna Schmidt • {new Date().toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <i className="ri-download-line"></i>
              <span>Herunterladen</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <i className="ri-share-line"></i>
              <span>Teilen</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link
              to={`/documents/${document.id}`}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Vollbild öffnen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailModal;