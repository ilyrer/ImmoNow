import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Share2, 
  Edit, 
  Trash2, 
  Star, 
  Copy, 
  Move, 
  Tag, 
  Archive, 
  Lock, 
  Unlock, 
  Eye, 
  Calendar, 
  User, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive as ArchiveIcon, 
  File,
  Clock,
  Users,
  Globe,
  ExternalLink,
  MoreVertical,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { GlassCard, GlassButton, GlassBadge } from './GlassUI';
import DocumentPreview from './DocumentPreview';
import { DocumentResponse } from '../../api/types.gen';

interface DocumentDetailModalProps {
  document: DocumentResponse | null;
  onClose: () => void;
  onEdit?: (document: DocumentResponse) => void;
  onDelete?: (document: DocumentResponse) => void;
  onToggleFavorite?: (document: DocumentResponse) => void;
  onMove?: (document: DocumentResponse) => void;
  onShare?: (document: DocumentResponse) => void;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onMove,
  onShare
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'details' | 'activity' | 'comments'>('preview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'metadata']));
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (document) {
      setActiveTab('preview');
      setExpandedSections(new Set(['basic', 'metadata']));
    }
  }, [document]);

  if (!document) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-6 h-6 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-6 h-6 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6 text-green-500" />;
    if (type.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const tabs = [
    { id: 'preview', label: 'Vorschau', icon: Eye },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'activity', label: 'Aktivität', icon: Clock },
    { id: 'comments', label: 'Kommentare', icon: Users }
  ];

  const renderPreviewTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Dokumentvorschau
        </h3>
        <div className="flex items-center space-x-2">
          <GlassButton
            onClick={() => setShowPreview(!showPreview)}
            size="sm"
            icon={<Eye className="w-4 h-4" />}
          >
            {showPreview ? 'Ausblenden' : 'Anzeigen'}
          </GlassButton>
        </div>
      </div>
      
      {showPreview && (
        <DocumentPreview
          file={document.file_url}
          fileName={document.title}
          fileType={document.document_type}
          className="w-full"
        />
      )}
    </div>
  );

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <button
          onClick={() => toggleSection('basic')}
          className="flex items-center justify-between w-full p-4 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-500" />
            Grundinformationen
          </h3>
          {expandedSections.has('basic') ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        <AnimatePresence>
          {expandedSections.has('basic') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Titel
                    </label>
                    <p className="text-gray-900 dark:text-white">{document.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Dateiname
                    </label>
                    <p className="text-gray-900 dark:text-white">{document.file_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Typ
                    </label>
                    <div className="flex items-center space-x-2">
                      {getFileIcon(document.document_type)}
                      <GlassBadge variant="info" size="sm">
                        {document.document_type}
                      </GlassBadge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Größe
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatFileSize(document.file_size)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </label>
                    <GlassBadge 
                      variant={document.status === 'active' ? 'success' : 'default'} 
                      size="sm"
                    >
                      {document.status}
                    </GlassBadge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Hochgeladen von
                    </label>
                    <p className="text-gray-900 dark:text-white flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {document.uploaded_by || 'Unbekannt'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Metadata */}
      <div>
        <button
          onClick={() => toggleSection('metadata')}
          className="flex items-center justify-between w-full p-4 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Tag className="w-5 h-5 mr-2 text-purple-500" />
            Metadaten
          </h3>
          {expandedSections.has('metadata') ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        <AnimatePresence>
          {expandedSections.has('metadata') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Erstellt am
                    </label>
                    <p className="text-gray-900 dark:text-white flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(document.uploaded_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Zuletzt geändert
                    </label>
                    <p className="text-gray-900 dark:text-white flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(document.updated_at)}
                    </p>
                  </div>
                  {document.property_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Immobilie
                      </label>
                      <p className="text-gray-900 dark:text-white flex items-center">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        ID: {document.property_id}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Favorit
                    </label>
                    <div className="flex items-center">
                      <Star className={`w-4 h-4 mr-1 ${document.is_favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                      <span className="text-gray-900 dark:text-white">
                        {document.is_favorite ? 'Ja' : 'Nein'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {document.metadata && Object.keys(document.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                      Zusätzliche Metadaten
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {JSON.stringify(document.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
        <Clock className="w-5 h-5 mr-2 text-orange-500" />
        Aktivitätsverlauf
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Dokument hochgeladen
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(document.uploaded_at)} von {document.uploaded_by}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Dokument geöffnet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Heute um 14:30
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommentsTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
        <Users className="w-5 h-5 mr-2 text-indigo-500" />
        Kommentare
      </h3>
      
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Noch keine Kommentare vorhanden
        </p>
        <GlassButton className="mt-4" size="sm">
          Ersten Kommentar hinzufügen
        </GlassButton>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preview':
        return renderPreviewTab();
      case 'details':
        return renderDetailsTab();
      case 'activity':
        return renderActivityTab();
      case 'comments':
        return renderCommentsTab();
      default:
        return renderPreviewTab();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-gray-700/30">
              <div className="flex items-center space-x-4">
                {getFileIcon(document.document_type)}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {document.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {document.file_name} • {formatFileSize(document.file_size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <GlassButton
                  onClick={() => onToggleFavorite?.(document)}
                  size="sm"
                  icon={<Star className={`w-4 h-4 ${document.is_favorite ? 'text-yellow-500 fill-current' : ''}`} />}
                >
                  <span className="sr-only">Favorit</span>
                </GlassButton>
                <GlassButton
                  onClick={() => onShare?.(document)}
                  size="sm"
                  icon={<Share2 className="w-4 h-4" />}
                >
                  <span className="sr-only">Teilen</span>
                </GlassButton>
                <GlassButton
                  onClick={() => onEdit?.(document)}
                  size="sm"
                  icon={<Edit className="w-4 h-4" />}
                >
                  <span className="sr-only">Bearbeiten</span>
                </GlassButton>
                <GlassButton
                  onClick={() => onMove?.(document)}
                  size="sm"
                  icon={<Move className="w-4 h-4" />}
                >
                  <span className="sr-only">Verschieben</span>
                </GlassButton>
                <GlassButton
                  onClick={() => onDelete?.(document)}
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  variant="danger"
                >
                  <span className="sr-only">Löschen</span>
                </GlassButton>
                <GlassButton
                  onClick={onClose}
                  size="sm"
                  icon={<X className="w-4 h-4" />}
                >
                  <span className="sr-only">Schließen</span>
                </GlassButton>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/20 dark:border-gray-700/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {renderTabContent()}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentDetailModal;