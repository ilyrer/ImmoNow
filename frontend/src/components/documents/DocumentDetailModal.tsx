import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api/client';
import { toast } from 'react-hot-toast';

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

interface DocumentDetailModalProps {
  document: Document;
  onClose: () => void;
  onUpdate?: () => void;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ document, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState<Partial<Document>>(document || {});
  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'comments' | 'activity'>('details');
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activities, setActivities] = useState<DocumentActivity[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Log view when modal opens
  React.useEffect(() => {
    if (!document?.id) return;

    const logView = async () => {
      try {
        await apiClient.post(`/api/v1/documents/${document.id}/view`);
      } catch (error) {
        console.error('Failed to log view:', error);
      }
    };
    logView();
  }, [document?.id]);

  // Load comments when comments tab is active
  React.useEffect(() => {
    if (activeTab === 'comments' && comments.length === 0) {
      loadComments();
    }
  }, [activeTab]);

  // Load activities when activity tab is active
  React.useEffect(() => {
    if (activeTab === 'activity' && activities.length === 0) {
      loadActivities();
    }
  }, [activeTab]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const response = await apiClient.get(`/api/v1/documents/${document.id}/comments`);
      // Map backend response to frontend format
      const mappedComments = (response.data || []).map((c: any) => ({
        id: c.id,
        text: c.text,
        author: c.author,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }));
      setComments(mappedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      // Set empty array if endpoint doesn't exist yet
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const response = await apiClient.get(`/api/v1/documents/${document.id}/activity`);
      setActivities(response.data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      // Set empty array if endpoint doesn't exist yet
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Bitte geben Sie einen Kommentar ein');
      return;
    }

    if (!document?.id) {
      toast.error('Dokument nicht gefunden');
      return;
    }

    try {
      const response = await apiClient.post(`/api/v1/documents/${document.id}/comments`, {
        text: newComment
      });

      // Fallback: wenn Server läuft aber keine Daten zurückgibt, erstelle lokalen Kommentar
      const commentData = response?.data || {
        id: Date.now().toString(),
        text: newComment,
        author: 'Sie',
        created_at: new Date().toISOString(),
        updated_at: null
      };

      // Map backend response to frontend format
      const newCommentData: DocumentComment = {
        id: commentData.id || Date.now().toString(),
        text: commentData.text || newComment,
        author: commentData.author || 'Sie',
        createdAt: commentData.created_at || new Date().toISOString(),
        updatedAt: commentData.updated_at || ''
      };

      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
      toast.success('Kommentar hinzugefügt');

      // Refresh activities to show the commented action
      try {
        loadActivities();
      } catch (actError) {
        console.log('Could not load activities:', actError);
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
      console.log('Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message
      });

      if (error?.response?.status === 404) {
        toast.error('Backend-Server nicht erreichbar. Bitte Terminal "python" öffnen und "uvicorn app.main:app --reload" ausführen.');
      } else if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
        toast.error('Backend-Server läuft nicht. Bitte starten Sie den Server in backend/');
      } else {
        toast.error('Fehler beim Hinzufügen des Kommentars. Server-Antwort fehlt.');
      }
    }
  };

  const handleSave = async () => {
    if (!document?.id) {
      toast.error('Dokument nicht gefunden');
      return;
    }

    try {
      // Send only the fields that can be updated
      const updateData = {
        title: editedDocument.title,
        description: editedDocument.description,
        tags: editedDocument.tags
      };

      await apiClient.put(`/api/v1/documents/${document.id}`, updateData);
      toast.success('Dokument aktualisiert');
      setIsEditing(false);

      // Update the local document object
      Object.assign(document, editedDocument);

      onUpdate?.();
    } catch (error: any) {
      console.error('Error updating document:', error);
      if (error?.response?.status === 404) {
        toast.error('Backend-Server nicht erreichbar. Bitte starten Sie den Server.');
      } else {
        toast.error('Fehler beim Aktualisieren des Dokuments');
      }
    }
  };

  const handleDelete = async () => {
    if (!document?.id) {
      toast.error('Dokument nicht gefunden');
      return;
    }

    if (!window.confirm('Sind Sie sicher, dass Sie dieses Dokument löschen möchten?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/documents/${document.id}`);
      toast.success('Dokument gelöscht');
      onUpdate?.();
      onClose();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      if (error?.response?.status === 404) {
        toast.error('Dokument nicht gefunden oder bereits gelöscht');
        onUpdate?.();
        onClose();
      } else {
        toast.error('Fehler beim Löschen des Dokuments');
      }
    }
  };

  const handleDownload = async () => {
    if (!document?.url) {
      toast.error('Dokument-URL nicht verfügbar');
      return;
    }

    window.open(document.url, '_blank');
    toast.success('Download gestartet');

    // Log download activity
    try {
      await apiClient.post(`/api/v1/documents/${document.id}/download`);
    } catch (error) {
      console.error('Failed to log download:', error);
    }
  };

  const handleShare = async () => {
    if (!document?.url) {
      toast.error('Dokument-URL nicht verfügbar');
      return;
    }

    try {
      await navigator.clipboard.writeText(document.url);
      toast.success('Link kopiert');

      // Log share activity
      await apiClient.post(`/api/v1/documents/${document.id}/share`);
    } catch (error) {
      console.error('Failed to copy or log share:', error);
      toast.error('Fehler beim Kopieren des Links');
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
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

  // Null check
  if (!document) {
    return null;
  }

  return (
    <>
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
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
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
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Hinzufügen
                  </button>
                </div>

                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">{comment.author}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i className="ri-message-3-line text-4xl mb-2"></i>
                    <p>Noch keine Kommentare vorhanden</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {loadingActivities ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const getActivityIcon = (action: string) => {
                        switch (action) {
                          case 'uploaded': return 'ri-upload-line text-blue-600';
                          case 'edited': return 'ri-edit-line text-green-600';
                          case 'deleted': return 'ri-delete-bin-line text-red-600';
                          case 'downloaded': return 'ri-download-line text-purple-600';
                          case 'viewed': return 'ri-eye-line text-indigo-600';
                          case 'shared': return 'ri-share-line text-cyan-600';
                          case 'commented': return 'ri-chat-3-line text-yellow-600';
                          case 'moved': return 'ri-folder-transfer-line text-orange-600';
                          case 'renamed': return 'ri-edit-2-line text-teal-600';
                          default: return 'ri-file-line text-gray-600';
                        }
                      };

                      const getActivityLabel = (action: string) => {
                        switch (action) {
                          case 'uploaded': return 'Dokument hochgeladen';
                          case 'edited': return 'Dokument bearbeitet';
                          case 'deleted': return 'Dokument gelöscht';
                          case 'downloaded': return 'Dokument heruntergeladen';
                          case 'viewed': return 'Dokument angesehen';
                          case 'shared': return 'Dokument geteilt';
                          case 'commented': return 'Kommentar hinzugefügt';
                          case 'moved': return 'Dokument verschoben';
                          case 'renamed': return 'Dokument umbenannt';
                          default: return action;
                        }
                      };

                      return (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <i className={`${getActivityIcon(activity.action)} dark:text-opacity-80`}></i>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {getActivityLabel(activity.action)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {activity.user} • {new Date(activity.timestamp).toLocaleDateString('de-DE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i className="ri-history-line text-4xl mb-2"></i>
                    <p>Keine Aktivitäten verfügbar</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <i className="ri-arrow-left-line"></i>
                <span>Zurück</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="ri-download-line"></i>
                <span>Herunterladen</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <i className="ri-share-line"></i>
                <span>Teilen</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleFullscreen}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Vollbild öffnen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
            <h3 className="text-white text-lg font-semibold">{document.title}</h3>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            {document.type === 'photo' || document.type === 'image' || document.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={document.url}
                alt={document.title}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : document.type === 'pdf' || document.url?.endsWith('.pdf') ? (
              <iframe
                src={document.url}
                className="w-full h-full bg-white"
                title={document.title}
              />
            ) : document.type === 'video' || document.url?.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                src={document.url}
                controls
                className="max-w-full max-h-full"
              />
            ) : (
              <div className="text-center text-white">
                <i className="ri-file-line text-6xl mb-4"></i>
                <p className="mb-4">Vorschau nicht verfügbar</p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dokument herunterladen
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentDetailModal;