import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  User, 
  Folder, 
  HardDrive, 
  X, 
  Plus, 
  Save, 
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, GlassBadge } from './GlassUI';

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
  uploadedBy?: string;
  isFavorite?: boolean;
}

interface FilterSet {
  id: string;
  name: string;
  filters: DocumentFilter;
  isDefault?: boolean;
}

interface DocumentAdvancedFiltersProps {
  filters: DocumentFilter;
  tags: string[];
  onFiltersChange: (filters: Partial<DocumentFilter>) => void;
  onSaveFilterSet?: (filterSet: FilterSet) => void;
  onLoadFilterSet?: (filterSetId: string) => void;
  onDeleteFilterSet?: (filterSetId: string) => void;
}

const DocumentAdvancedFilters: React.FC<DocumentAdvancedFiltersProps> = ({
  filters,
  tags,
  onFiltersChange,
  onSaveFilterSet,
  onLoadFilterSet,
  onDeleteFilterSet
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['search', 'type']));
  const [savedFilterSets, setSavedFilterSets] = useState<FilterSet[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFilterSetName, setNewFilterSetName] = useState('');

  const documentTypes = [
    'pdf', 'image', 'video', 'audio', 'text', 'spreadsheet', 'presentation', 'archive'
  ];

  const sizeOptions = [
    { label: 'Klein (< 1MB)', min: 0, max: 1024 * 1024 },
    { label: 'Mittel (1-10MB)', min: 1024 * 1024, max: 10 * 1024 * 1024 },
    { label: 'Groß (10-100MB)', min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 },
    { label: 'Sehr groß (> 100MB)', min: 100 * 1024 * 1024, max: Infinity }
  ];

  const datePresets = [
    { label: 'Heute', days: 0 },
    { label: 'Letzte 7 Tage', days: 7 },
    { label: 'Letzte 30 Tage', days: 30 },
    { label: 'Letzte 90 Tage', days: 90 },
    { label: 'Dieses Jahr', days: 365 }
  ];

  useEffect(() => {
    // Load saved filter sets from localStorage
    const saved = localStorage.getItem('documentFilterSets');
    if (saved) {
      setSavedFilterSets(JSON.parse(saved));
    }
  }, []);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleTypeToggle = (type: string) => {
    const currentTypes = filters.type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    onFiltersChange({ type: newTypes });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    onFiltersChange({ tags: newTags });
  };

  const handleDatePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    onFiltersChange({
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    });
  };

  const handleSizePreset = (min: number, max: number) => {
    onFiltersChange({
      sizeRange: { min, max }
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      type: [],
      folderId: '',
      tags: [],
      dateRange: undefined,
      sizeRange: undefined,
      isPublic: undefined,
      uploadedBy: '',
      isFavorite: undefined
    });
  };

  const saveFilterSet = () => {
    if (!newFilterSetName.trim()) return;

    const newFilterSet: FilterSet = {
      id: Date.now().toString(),
      name: newFilterSetName,
      filters: { ...filters }
    };

    const updatedSets = [...savedFilterSets, newFilterSet];
    setSavedFilterSets(updatedSets);
    localStorage.setItem('documentFilterSets', JSON.stringify(updatedSets));
    
    onSaveFilterSet?.(newFilterSet);
    setShowSaveDialog(false);
    setNewFilterSetName('');
  };

  const loadFilterSet = (filterSet: FilterSet) => {
    onFiltersChange(filterSet.filters);
    onLoadFilterSet?.(filterSet.id);
  };

  const deleteFilterSet = (filterSetId: string) => {
    const updatedSets = savedFilterSets.filter(set => set.id !== filterSetId);
    setSavedFilterSets(updatedSets);
    localStorage.setItem('documentFilterSets', JSON.stringify(updatedSets));
    onDeleteFilterSet?.(filterSetId);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type && filters.type.length > 0) count++;
    if (filters.folderId) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.dateRange) count++;
    if (filters.sizeRange) count++;
    if (filters.isPublic !== undefined) count++;
    if (filters.uploadedBy) count++;
    if (filters.isFavorite !== undefined) count++;
    return count;
  };

  const renderSection = (id: string, title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <div>
      <button
        onClick={() => toggleSection(id)}
        className="flex items-center justify-between w-full p-4 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </h3>
        {expandedSections.has(id) ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      <AnimatePresence>
        {expandedSections.has(id) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Filter className="w-6 h-6 mr-2 text-purple-500" />
            Erweiterte Filter
          </h2>
          {getActiveFiltersCount() > 0 && (
            <GlassBadge variant="info" size="sm">
              {getActiveFiltersCount()} aktiv
            </GlassBadge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <GlassButton
            onClick={() => setShowSaveDialog(true)}
            size="sm"
            icon={<Save className="w-4 h-4" />}
          >
            Speichern
          </GlassButton>
          <GlassButton
            onClick={clearFilters}
            size="sm"
            icon={<X className="w-4 h-4" />}
            variant="secondary"
          >
            Zurücksetzen
          </GlassButton>
        </div>
      </div>

      {/* Search */}
      {renderSection('search', 'Suche', <Search className="w-5 h-5 text-blue-500" />, (
        <GlassInput
          value={filters.search || ''}
          onChange={(value) => onFiltersChange({ search: value })}
          placeholder="Dokumente durchsuchen..."
          icon={<Search className="w-4 h-4" />}
        />
      ))}

      {/* Document Types */}
      {renderSection('type', 'Dokumenttypen', <FileText className="w-5 h-5 text-green-500" />, (
        <div className="grid grid-cols-2 gap-2">
          {documentTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeToggle(type)}
              className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-colors ${
                filters.type?.includes(type)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                filters.type?.includes(type) ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
              <span className="capitalize">{type}</span>
            </button>
          ))}
        </div>
      ))}

      {/* Tags */}
      {renderSection('tags', 'Tags', <Tag className="w-5 h-5 text-purple-500" />, (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filters.tags?.includes(tag)
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
          <GlassInput
            value=""
            placeholder="Neuen Tag hinzufügen..."
            onChange={() => {}} // TODO: Implement tag creation
            icon={<Plus className="w-4 h-4" />}
          />
        </div>
      ))}

      {/* Date Range */}
      {renderSection('date', 'Zeitraum', <Calendar className="w-5 h-5 text-orange-500" />, (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {datePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleDatePreset(preset.days)}
                className="p-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Von
              </label>
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => onFiltersChange({
                  dateRange: {
                    start: e.target.value,
                    end: filters.dateRange?.end || ''
                  }
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bis
              </label>
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => onFiltersChange({
                  dateRange: {
                    start: filters.dateRange?.start || '',
                    end: e.target.value
                  }
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      ))}

      {/* File Size */}
      {renderSection('size', 'Dateigröße', <HardDrive className="w-5 h-5 text-indigo-500" />, (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {sizeOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => handleSizePreset(option.min, option.max)}
                className="p-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left"
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min. Größe (MB)
              </label>
              <input
                type="number"
                value={filters.sizeRange?.min ? Math.round(filters.sizeRange.min / (1024 * 1024)) : ''}
                onChange={(e) => onFiltersChange({
                  sizeRange: {
                    min: e.target.value ? parseInt(e.target.value) * 1024 * 1024 : 0,
                    max: filters.sizeRange?.max || Infinity
                  }
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max. Größe (MB)
              </label>
              <input
                type="number"
                value={filters.sizeRange?.max && filters.sizeRange.max !== Infinity ? Math.round(filters.sizeRange.max / (1024 * 1024)) : ''}
                onChange={(e) => onFiltersChange({
                  sizeRange: {
                    min: filters.sizeRange?.min || 0,
                    max: e.target.value ? parseInt(e.target.value) * 1024 * 1024 : Infinity
                  }
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Additional Filters */}
      {renderSection('additional', 'Weitere Filter', <User className="w-5 h-5 text-pink-500" />, (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hochgeladen von
            </label>
            <GlassInput
              value={filters.uploadedBy || ''}
              onChange={(value) => onFiltersChange({ uploadedBy: value })}
              placeholder="Benutzername eingeben..."
              icon={<User className="w-4 h-4" />}
            />
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={filters.isFavorite || false}
                onChange={(e) => onFiltersChange({ isFavorite: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Nur Favoriten</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={filters.isPublic || false}
                onChange={(e) => onFiltersChange({ isPublic: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Nur öffentliche Dokumente</span>
            </label>
          </div>
        </div>
      ))}

      {/* Saved Filter Sets */}
      {savedFilterSets.length > 0 && renderSection('saved', 'Gespeicherte Filter', <Save className="w-5 h-5 text-teal-500" />, (
        <div className="space-y-2">
          {savedFilterSets.map((filterSet) => (
            <div key={filterSet.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <button
                onClick={() => loadFilterSet(filterSet)}
                className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {filterSet.name}
              </button>
              <button
                onClick={() => deleteFilterSet(filterSet.id)}
                className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ))}

      {/* Save Filter Set Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filter-Set speichern
              </h3>
              <GlassInput
                value={newFilterSetName}
                onChange={setNewFilterSetName}
                placeholder="Name für das Filter-Set..."
              />
              <div className="flex justify-end space-x-3 mt-6">
                <GlassButton
                  onClick={() => setShowSaveDialog(false)}
                  variant="secondary"
                >
                  Abbrechen
                </GlassButton>
                <GlassButton
                  onClick={saveFilterSet}
                  disabled={!newFilterSetName.trim()}
                >
                  Speichern
                </GlassButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentAdvancedFilters;