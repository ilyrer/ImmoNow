import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid, List, Upload, FolderPlus, MoreVertical, Eye, Download, Share, Trash2, Edit, Archive, Tag, Calendar, User, FileText, Image, Video, Music, Archive as ArchiveIcon, File } from 'lucide-react';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentDetailModal from './DocumentDetailModal';
import DocumentFolderTree from './DocumentFolderTree';
import DocumentGridView from './DocumentGridView';
import DocumentListView from './DocumentListView';
import DocumentAdvancedFilters from './DocumentAdvancedFilters';
import DocumentAnalyticsDashboard from './DocumentAnalyticsDashboard';
import { useDocuments, useDocumentFolders, useDocumentAnalytics } from '../../hooks/useDocuments';

// Mock interfaces to match the expected types
interface MockDocument {
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
  versions: any[];
}

interface MockDocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

interface MockDocumentAnalytics {
  totalDocuments: number;
  totalSize: number;
  documentsByType: Record<string, number>;
  recentDocuments: MockDocument[];
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

interface MockDocumentFilter {
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

interface ModernDocumentDashboardProps {
  showAnalytics?: boolean;
  className?: string;
}

const ModernDocumentDashboard: React.FC<ModernDocumentDashboardProps> = ({ 
  showAnalytics = false, 
  className = '' 
}) => {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'analytics'>('grid');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<MockDocument | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MockDocumentFilter>({});

  // API Hooks with proper parameters
  const { data: documents, isLoading: documentsLoading, error: documentsError } = useDocuments({ page: 1, size: 100 });
  const { data: folders, isLoading: foldersLoading, error: foldersError } = useDocumentFolders();
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useDocumentAnalytics();

  // Convert API data to mock types with proper handling
  const mockDocuments: MockDocument[] = Array.isArray(documents) ? documents.map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    size: doc.size,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    url: doc.url,
    folderId: doc.folderId,
    tags: doc.tags || [],
    description: doc.description,
    isPublic: doc.isPublic || false,
    permissions: doc.permissions || [],
    metadata: doc.metadata || {},
    originalName: doc.originalName || doc.title,
    versions: doc.versions || []
  })) : [];

  const mockFolders: MockDocumentFolder[] = (folders || []).map((folder: any) => ({
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    permissions: folder.permissions || []
  }));

  const mockAnalytics: MockDocumentAnalytics | null = analytics ? {
    totalDocuments: (analytics as any).total_documents || 0,
    totalSize: (analytics as any).total_size || 0,
    documentsByType: (analytics as any).documents_by_type || {},
    recentDocuments: ((analytics as any).recent_documents || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      size: doc.size,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      url: doc.url,
      folderId: doc.folderId,
      tags: doc.tags || [],
      description: doc.description,
      isPublic: doc.isPublic || false,
      permissions: doc.permissions || [],
      metadata: doc.metadata || {},
      originalName: doc.originalName || doc.title,
      versions: doc.versions || []
    })),
    mostViewedDocuments: (analytics as any).most_viewed_documents || [],
    storageUsage: {
      used: (analytics as any).storage_used || 0,
      total: (analytics as any).storage_total || 0,
      percentage: (analytics as any).storage_percentage || 0
    }
  } : null;

  // Filter documents based on current filters
  const filteredDocuments = useMemo(() => {
    if (!mockDocuments) return [];
    
    return mockDocuments.filter(doc => {
      // Search filter
      if (filters.search && !doc.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !doc.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filters.type && filters.type.length > 0 && !filters.type.includes(doc.type)) {
        return false;
      }
      
      // Folder filter
      if (filters.folderId && doc.folderId !== filters.folderId) {
        return false;
      }
      
      // Tags filter
      if (filters.tags && filters.tags.length > 0 &&
          !filters.tags.some(tag => doc.tags.includes(tag))) {
        return false;
      }
      
      // Public filter
      if (filters.isPublic !== undefined && doc.isPublic !== filters.isPublic) {
        return false;
      }
      
      return true;
    });
  }, [mockDocuments, filters]);

  // Event handlers
  const handleDocumentSelect = (documentId: string, selected: boolean) => {
    if (selected) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  };

  const handleDocumentOpen = (document: MockDocument) => {
    setSelectedDocument(document);
    setShowDetailModal(true);
  };

  const handleDocumentDelete = (documentId: string) => {
    console.log('Delete document:', documentId);
  };

  const handleDocumentShare = (documentId: string) => {
    console.log('Share document:', documentId);
  };

  const handleDocumentDownload = (documentId: string) => {
    console.log('Download document:', documentId);
  };

  const handleDocumentEdit = (documentId: string) => {
    console.log('Edit document:', documentId);
  };

  const handleDocumentArchive = (documentId: string) => {
    console.log('Archive document:', documentId);
  };

  const handleDocumentTag = (documentId: string) => {
    console.log('Tag document:', documentId);
  };

  const handleDocumentMove = (documentId: string) => {
    console.log('Move document:', documentId);
  };

  const handleDocumentCopy = (documentId: string) => {
    console.log('Copy document:', documentId);
  };

  const handleDocumentRename = (documentId: string) => {
    console.log('Rename document:', documentId);
  };

  const handleToggleFavorite = (documentId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    console.log('Toggle favorite:', documentId);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isExpired = (document: any): boolean => {
    return false; // Placeholder - implement expiration logic if needed
  };

  // All other placeholder handlers
  const handleDocumentLock = (documentId: string) => {
    console.log('Lock document:', documentId);
  };

  const handleDocumentUnlock = (documentId: string) => {
    console.log('Unlock document:', documentId);
  };

  const handleDocumentPublish = (documentId: string) => {
    console.log('Publish document:', documentId);
  };

  const handleDocumentUnpublish = (documentId: string) => {
    console.log('Unpublish document:', documentId);
  };

  const handleDocumentRestore = (documentId: string) => {
    console.log('Restore document:', documentId);
  };

  const handleDocumentVersion = (documentId: string) => {
    console.log('Version document:', documentId);
  };

  const handleDocumentComment = (documentId: string) => {
    console.log('Comment document:', documentId);
  };

  const handleDocumentActivity = (documentId: string) => {
    console.log('Activity document:', documentId);
  };

  const handleDocumentPreview = (documentId: string) => {
    console.log('Preview document:', documentId);
  };

  const handleDocumentDownloadVersion = (documentId: string) => {
    console.log('Download version document:', documentId);
  };

  const handleDocumentPreviewVersion = (documentId: string) => {
    console.log('Preview version document:', documentId);
  };

  const handleDocumentDeleteVersion = (documentId: string) => {
    console.log('Delete version document:', documentId);
  };

  const handleDocumentRestoreVersion = (documentId: string) => {
    console.log('Restore version document:', documentId);
  };

  const handleDocumentCreateVersion = (documentId: string) => {
    console.log('Create version document:', documentId);
  };

  const handleDocumentUpdateVersion = (documentId: string) => {
    console.log('Update version document:', documentId);
  };

  const handleDocumentListVersions = (documentId: string) => {
    console.log('List versions document:', documentId);
  };

  const handleDocumentGetVersion = (documentId: string) => {
    console.log('Get version document:', documentId);
  };

  const handleDocumentCreateVersionRequest = (documentId: string) => {
    console.log('Create version request document:', documentId);
  };

  const handleDocumentUpdateVersionRequest = (documentId: string) => {
    console.log('Update version request document:', documentId);
  };

  const handleDocumentDeleteVersionRequest = (documentId: string) => {
    console.log('Delete version request document:', documentId);
  };

  const handleDocumentRestoreVersionRequest = (documentId: string) => {
    console.log('Restore version request document:', documentId);
  };

  const handleDocumentDownloadVersionRequest = (documentId: string) => {
    console.log('Download version request document:', documentId);
  };

  const handleDocumentPreviewVersionRequest = (documentId: string) => {
    console.log('Preview version request document:', documentId);
  };

  const handleDocumentListVersionsRequest = (documentId: string) => {
    console.log('List versions request document:', documentId);
  };

  const handleDocumentGetVersionRequest = (documentId: string) => {
    console.log('Get version request document:', documentId);
  };

  const handleDocumentVersionResponse = (documentId: string) => {
    console.log('Version response document:', documentId);
  };

  const handleDocumentVersionListResponse = (documentId: string) => {
    console.log('Version list response document:', documentId);
  };

  const handleDocumentVersionCreateResponse = (documentId: string) => {
    console.log('Version create response document:', documentId);
  };

  const handleDocumentVersionUpdateResponse = (documentId: string) => {
    console.log('Version update response document:', documentId);
  };

  const handleDocumentVersionDeleteResponse = (documentId: string) => {
    console.log('Version delete response document:', documentId);
  };

  const handleDocumentVersionRestoreResponse = (documentId: string) => {
    console.log('Version restore response document:', documentId);
  };

  const handleDocumentVersionDownloadResponse = (documentId: string) => {
    console.log('Version download response document:', documentId);
  };

  const handleDocumentVersionPreviewResponse = (documentId: string) => {
    console.log('Version preview response document:', documentId);
  };

  const handleDocumentVersionGetResponse = (documentId: string) => {
    console.log('Version get response document:', documentId);
  };

  const handleFolderCreate = (name: string, parentId?: string) => {
    console.log('Create folder:', name, parentId);
  };

  const handleFolderRename = (folderId: string, newName: string) => {
    console.log('Rename folder:', folderId, newName);
  };

  const handleFiltersChange = (newFilters: MockDocumentFilter) => {
    setFilters(newFilters);
  };

  const canWrite = true; // Mock permission

  if (documentsLoading || foldersLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (documentsError || foldersError || analyticsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">Fehler beim Laden der Dokumente</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dokumente
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Verwalten Sie Ihre Dokumente und Dateien
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'analytics'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Hochladen
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="xl:col-span-3 space-y-6">
            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Dokumente durchsuchen..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Folder Tree */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ordner
                </h3>
                <button
                  onClick={() => handleFolderCreate('Neuer Ordner')}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>
              <DocumentFolderTree
                folders={mockFolders as any || []}
                selectedFolder={selectedFolder}
                onFolderSelect={setSelectedFolder}
              />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filter
                </h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
              {showFilters && (
                <div className="p-4">
                  <DocumentAdvancedFilters
                    filters={filters as any}
                    tags={[]}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-9 space-y-6">
            {viewMode === 'analytics' && mockAnalytics ? (
              <DocumentAnalyticsDashboard
                analytics={mockAnalytics as any}
                documents={mockDocuments as any || []}
              />
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <DocumentGridView
                    documents={mockDocuments as any}
                    selectedDocuments={selectedDocuments}
                    onDocumentSelect={(docId: string) => handleDocumentSelect(docId, !selectedDocuments.includes(docId))}
                    onDocumentOpen={handleDocumentOpen as any}
                    onToggleFavorite={(docId: string, e: React.MouseEvent) => handleToggleFavorite(docId, e)}
                    onDeleteDocument={handleDocumentDelete}
                    isLoading={documentsLoading}
                    formatFileSize={formatFileSize}
                    isExpired={isExpired}
                  />
                ) : (
                  <DocumentListView
                    documents={mockDocuments as any}
                    selectedDocuments={selectedDocuments}
                    onDocumentSelect={(docId: string) => handleDocumentSelect(docId, !selectedDocuments.includes(docId))}
                    onDocumentOpen={handleDocumentOpen as any}
                    onToggleFavorite={(docId: string, e: React.MouseEvent) => handleToggleFavorite(docId, e)}
                    onDeleteDocument={handleDocumentDelete}
                    isLoading={documentsLoading}
                    formatFileSize={formatFileSize}
                    isExpired={isExpired}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          folderId={selectedFolder || undefined}
        />

        <DocumentDetailModal
          document={selectedDocument as any}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDocument(null);
          }}
        />
      </div>
    </div>
  );
};

export default ModernDocumentDashboard;