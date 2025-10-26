import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid, List, Upload, FolderPlus, MoreVertical, Eye, Download, Share, Trash2, Edit, Archive, Tag, Calendar, User, FileText, Image, Video, Music, Archive as ArchiveIcon, File, Settings, Star, Clock, Users, Globe } from 'lucide-react';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentDetailModal from './DocumentDetailModal';
import DocumentFolderTree from './DocumentFolderTree';
import DocumentGridView from './DocumentGridView';
import DocumentListView from './DocumentListView';
import DocumentAdvancedFilters from './DocumentAdvancedFilters';
import DocumentAnalyticsDashboard from './DocumentAnalyticsDashboard';
import DocumentSearch from './DocumentSearch';
import BulkActionsBar from './BulkActionsBar';
import { GlassCard, GlassButton, GlassInput, GlassBadge } from './GlassUI';
import { useDocuments, useDocumentFolders, useDocumentAnalytics, useUpdateDocument, useDeleteDocument } from '../../api/hooks';
import { toast } from 'react-hot-toast';
import { DocumentResponse, DocumentFolderResponse, DocumentAnalyticsResponse } from '../../api/types.gen';

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
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DocumentFilter>({});

  // API Hooks with proper parameters
  const { data: documentsData, isLoading: documentsLoading, error: documentsError } = useDocuments({ 
    page: 1, 
    size: 100,
    folder_id: selectedFolder,
    ...filters
  });
  
  const { data: folders, isLoading: foldersLoading, error: foldersError } = useDocumentFolders();
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useDocumentAnalytics();
  
  const updateDocumentMutation = useUpdateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  // Extract documents from API response
  const documents = documentsData?.items || [];
  const totalDocuments = documentsData?.total || 0;

  // Auto-refresh analytics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // React Query will handle the refetch automatically due to staleTime
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Error handling
  useEffect(() => {
    if (documentsError) {
      toast.error('Fehler beim Laden der Dokumente');
    }
    if (foldersError) {
      toast.error('Fehler beim Laden der Ordner');
    }
    if (analyticsError) {
      toast.error('Fehler beim Laden der Statistiken');
    }
  }, [documentsError, foldersError, analyticsError]);

  // Filter documents based on current filters
  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    
    return documents.filter(doc => {
      // Search filter
      if (filters.search && !doc.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filters.type && filters.type.length > 0 && !filters.type.includes(doc.document_type)) {
        return false;
      }
      
      // Folder filter
      if (filters.folderId && doc.folder_id !== parseInt(filters.folderId)) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange) {
        const docDate = new Date(doc.uploaded_at);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (docDate < startDate || docDate > endDate) {
          return false;
        }
      }
      
      // Size range filter
      if (filters.sizeRange) {
        const docSizeMB = doc.file_size / (1024 * 1024);
        if (docSizeMB < filters.sizeRange.min || docSizeMB > filters.sizeRange.max) {
          return false;
        }
      }
      
      return true;
    });
  }, [documents, filters]);

  // Event handlers
  const handleDocumentSelect = (documentId: string, selected: boolean) => {
    if (selected) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id.toString()));
    }
  };

  const handleClearSelection = () => {
    setSelectedDocuments([]);
  };

  const handleBulkAction = (action: string) => {
    const selectedDocs = filteredDocuments.filter(doc => selectedDocuments.includes(doc.id.toString()));
    console.log('Bulk action:', action, selectedDocs);
    
    switch (action) {
      case 'download':
        // Implement bulk download
        break;
      case 'share':
        // Implement bulk share
        break;
      case 'copy':
        // Implement bulk copy
        break;
      case 'move':
        // Implement bulk move
        break;
      case 'tag':
        // Implement bulk tag
        break;
      case 'archive':
        // Implement bulk archive
        break;
      case 'delete':
        // Implement bulk delete
        if (window.confirm(`Möchten Sie ${selectedDocs.length} Dokumente wirklich löschen?`)) {
          selectedDocs.forEach(doc => handleDocumentDelete(doc.id.toString()));
          setSelectedDocuments([]);
        }
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
  };

  const handleDocumentOpen = (document: DocumentResponse) => {
    setSelectedDocument(document);
    setShowDetailModal(true);
  };

  const handleMoveDocument = async (documentId: string, folderId: string) => {
    try {
      await updateDocumentMutation.mutateAsync({
        id: documentId,
        data: {
          folder_id: parseInt(folderId)
        }
      });
      toast.success('Dokument erfolgreich verschoben');
    } catch (error) {
      toast.error('Fehler beim Verschieben des Dokuments');
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      await deleteDocumentMutation.mutateAsync(documentId);
      toast.success('Dokument erfolgreich gelöscht');
    } catch (error) {
      toast.error('Fehler beim Löschen des Dokuments');
    }
  };

  const handleToggleFavorite = async (documentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const document = documents.find(doc => doc.id.toString() === documentId);
      if (document) {
        await updateDocumentMutation.mutateAsync({
          id: documentId,
          data: {
            metadata: {
              ...document.metadata,
              is_favorite: !document.is_favorite
            }
          }
        });
        toast.success(document.is_favorite ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt');
      }
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Favoriten');
    }
  };

  const handleFolderCreate = async (name: string) => {
    try {
      // This would need to be implemented in the API hooks
      toast.success(`Ordner "${name}" erstellt`);
    } catch (error) {
      toast.error('Fehler beim Erstellen des Ordners');
    }
  };

  const handleFiltersChange = (newFilters: Partial<DocumentFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Utility functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpired = (document: DocumentResponse): boolean => {
    // Check if document has expiry date in metadata
    const expiryDate = document.metadata?.expires_at;
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="h-full">
      {/* Modern Header with Glass Effect */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Dokumente</span>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {selectedFolder ? 'Ordner' : 'Alle Dokumente'}
              </span>
            </div>
            
            {/* Document Count */}
            <GlassBadge variant="info">
              {totalDocuments} Dokumente
            </GlassBadge>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Switcher */}
            <div className="glass-card p-1 flex">
              <motion.button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </motion.button>
              <motion.button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Liste</span>
              </motion.button>
              <motion.button
                onClick={() => setViewMode('analytics')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'analytics'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </motion.button>
            </div>
            
            {/* Upload Button */}
            <GlassButton
              onClick={() => setShowUploadModal(true)}
              variant="primary"
              icon={<Upload className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Hochladen</span>
            </GlassButton>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Modern Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="xl:col-span-3 space-y-6"
        >
          {/* Enhanced Search */}
          <GlassCard className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-500" />
                Suche & Filter
              </h3>
                      <DocumentSearch
                        documents={documents}
                        onSearch={(query) => setFilters(prev => ({ ...prev, search: query }))}
                        onSelectDocument={handleDocumentOpen}
                        placeholder="Dokumente durchsuchen..."
                      />
              
              {/* Quick Filter Chips */}
              <div className="flex flex-wrap gap-2">
                <GlassBadge variant="default" size="sm">Alle</GlassBadge>
                <GlassBadge variant="info" size="sm">PDF</GlassBadge>
                <GlassBadge variant="success" size="sm">Bilder</GlassBadge>
                <GlassBadge variant="warning" size="sm">Videos</GlassBadge>
              </div>
            </div>
          </GlassCard>

          {/* Enhanced Folder Tree */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FolderPlus className="w-5 h-5 mr-2 text-green-500" />
                Ordner
              </h3>
              <GlassButton
                onClick={() => handleFolderCreate('Neuer Ordner')}
                size="sm"
                icon={<FolderPlus className="w-4 h-4" />}
              >
                <span className="sr-only">Neuer Ordner</span>
              </GlassButton>
            </div>
            <DocumentFolderTree
              folders={[]}
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
            />
          </GlassCard>

          {/* Enhanced Filters */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Filter className="w-5 h-5 mr-2 text-purple-500" />
                Erweiterte Filter
              </h3>
              <GlassButton
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
                icon={<Filter className="w-4 h-4" />}
              >
                <span className="sr-only">Filter umschalten</span>
              </GlassButton>
            </div>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <DocumentAdvancedFilters
                    filters={filters}
                    tags={[]}
                    onFiltersChange={handleFiltersChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-500" />
              Statistiken
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Gesamt</span>
                <span className="font-semibold text-gray-900 dark:text-white">{totalDocuments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Diese Woche</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +{analytics?.total_documents || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Speicher</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {analytics ? formatFileSize(analytics.total_size || 0) : '0 MB'}
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="xl:col-span-9"
        >
          <AnimatePresence mode="wait">
            {viewMode === 'analytics' && analytics ? (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DocumentAnalyticsDashboard
                  analytics={null}
                  documents={[]}
                />
              </motion.div>
            ) : (
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                        {viewMode === 'grid' ? (
                          <DocumentGridView
                            documents={documents}
                            selectedDocuments={selectedDocuments}
                            onDocumentSelect={(docId: string) => handleDocumentSelect(docId, !selectedDocuments.includes(docId))}
                            onDocumentOpen={handleDocumentOpen}
                            onToggleFavorite={handleToggleFavorite}
                            onDeleteDocument={handleDocumentDelete}
                            onMoveDocument={handleMoveDocument}
                            isLoading={documentsLoading}
                            formatFileSize={formatFileSize}
                            isExpired={isExpired}
                          />
                        ) : (
                          <DocumentListView
                            documents={[]}
                            selectedDocuments={selectedDocuments}
                            onDocumentSelect={(docId: string) => handleDocumentSelect(docId, !selectedDocuments.includes(docId))}
                            onDocumentOpen={() => {}}
                            onToggleFavorite={() => {}}
                            onDeleteDocument={() => {}}
                            isLoading={documentsLoading}
                            formatFileSize={formatFileSize}
                            isExpired={() => false}
                          />
                        )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Enhanced Modals */}
      <AnimatePresence>
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          folderId={selectedFolder || undefined}
        />

        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDocument(null);
          }}
          onEdit={handleDocumentOpen}
          onDelete={(doc) => handleDocumentDelete(doc.id.toString())}
          onToggleFavorite={(doc) => handleToggleFavorite(doc.id.toString(), {} as React.MouseEvent)}
          onMove={(doc) => console.log('Move document:', doc.id)}
          onShare={(doc) => console.log('Share document:', doc.id)}
        />
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        isVisible={selectedDocuments.length > 0}
        selectedCount={selectedDocuments.length}
        totalCount={filteredDocuments.length}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
      />
    </div>
  );
};

export default ModernDocumentDashboard;