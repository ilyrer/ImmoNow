import React, { useState } from 'react';
import { Upload, X, Star, Trash2, GripVertical, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUploadPropertyMedia, useDeletePropertyMedia, useSetPrimaryMedia } from '../../hooks/useProperties';

interface MediaManagerProps {
  propertyId: string;
  images: any[];
  documents?: any[];
  onRefresh?: () => void;
}

const MediaManager: React.FC<MediaManagerProps> = ({ propertyId, images: initialImages, documents: initialDocuments, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'images' | 'documents'>('images');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const uploadMutation = useUploadPropertyMedia(propertyId);
  const deleteMutation = useDeletePropertyMedia(propertyId);
  const setPrimaryMutation = useSetPrimaryMedia(propertyId);

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const maxSize = 15 * 1024 * 1024; // 15MB

    // Validate files
    for (const file of fileArray) {
      if (file.size > maxSize) {
        toast.error(`${file.name} ist zu groß (max. 15 MB)`);
        return;
      }
    }

    try {
      await uploadMutation.mutateAsync({ 
        files: fileArray,
        onProgress: (progress) => {
          // Progress feedback could be shown here
        }
      });
      toast.success(`${fileArray.length} Datei(en) erfolgreich hochgeladen`);
      onRefresh?.();
    } catch (error) {
      toast.error('Fehler beim Hochladen');
    }
  };

  // Handle delete
  const handleDelete = async (mediaId: string) => {
    if (!window.confirm('Möchten Sie diese Datei wirklich löschen?')) return;

    try {
      await deleteMutation.mutateAsync(mediaId);
      toast.success('Datei gelöscht');
      onRefresh?.();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  // Handle set primary
  const handleSetPrimary = async (mediaId: string) => {
    try {
      await setPrimaryMutation.mutateAsync(mediaId);
      toast.success('Hauptbild gesetzt');
      onRefresh?.();
    } catch (error) {
      toast.error('Fehler beim Setzen des Hauptbildes');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // Implement reordering logic here
    // This would require a backend endpoint to update image order
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Medien-Verwaltung
        </h3>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'images'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Bilder ({initialImages.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'documents'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Dokumente ({initialDocuments?.length || 0})
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-all">
        <input
          type="file"
          multiple
          accept={activeTab === 'images' ? 'image/*' : '.pdf,.doc,.docx'}
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {activeTab === 'images' 
              ? 'Ziehen Sie Bilder hierher oder klicken Sie zum Auswählen'
              : 'Ziehen Sie Dokumente hierher oder klicken Sie zum Auswählen'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {activeTab === 'images' 
              ? 'JPG, PNG, WEBP • Max. 15 MB pro Datei'
              : 'PDF, DOC, DOCX • Max. 15 MB pro Datei'}
          </p>
        </label>
      </div>

      {/* Images Grid */}
      {activeTab === 'images' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {initialImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  image.is_primary 
                    ? 'border-yellow-400 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                } ${
                  dragOverIndex === index ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                  <img
                    src={image.url}
                    alt={image.alt_text || 'Property image'}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {/* Set Primary */}
                  <button
                    onClick={() => handleSetPrimary(image.id)}
                    className={`p-2 rounded-lg transition-all ${
                      image.is_primary
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white/90 hover:bg-white text-gray-900'
                    }`}
                    title="Als Hauptbild setzen"
                  >
                    <Star className={`w-4 h-4 ${image.is_primary ? 'fill-current' : ''}`} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Hauptbild
                  </div>
                )}

                {/* Drag Handle */}
                <div className="absolute top-2 right-2 p-1 bg-white/90 dark:bg-gray-800/90 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Documents List */}
      {activeTab === 'documents' && (
        <div className="space-y-3">
          <AnimatePresence>
            {initialDocuments && initialDocuments.length > 0 ? (
              initialDocuments.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {doc.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.document_type} • {(doc.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-all"
                    >
                      Öffnen
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Keine Dokumente vorhanden
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {activeTab === 'images' && initialImages.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Keine Bilder vorhanden</p>
          <p className="text-sm mt-2">Laden Sie Bilder hoch, um sie hier zu sehen</p>
        </div>
      )}
    </div>
  );
};

export default MediaManager;

