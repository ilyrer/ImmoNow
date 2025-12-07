/**
 * Advanced Document Filters
 * Erweiterte Filteroptionen für Dokumente
 */

import React, { useState, useEffect } from 'react';
import { 
  DocumentFilter,
  DocumentTag,
  DocumentType,
  DocumentCategory,
  DocumentStatus,
  DocumentVisibility,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_VISIBILITY_LABELS
} from '../../types/document';

interface DocumentAdvancedFiltersProps {
  filters: DocumentFilter;
  tags: DocumentTag[];
  onFiltersChange: (filters: DocumentFilter) => void;
}

const DocumentAdvancedFilters: React.FC<DocumentAdvancedFiltersProps> = ({
  filters,
  tags,
  onFiltersChange,
}) => {
  const [localFilters, setLocalFilters] = useState<DocumentFilter>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof DocumentFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleArrayFilterChange = (key: keyof DocumentFilter, value: string, checked: boolean) => {
    const currentArray = (localFilters[key] as string[]) || [];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const clearAllFilters = () => {
    const emptyFilters: DocumentFilter = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (localFilters.type?.length) count++;
    if (localFilters.category?.length) count++;
    if (localFilters.status?.length) count++;
    if (localFilters.visibility?.length) count++;
    if (localFilters.tags?.length) count++;
    if (localFilters.dateRange) count++;
    if (localFilters.hasExpiry) count++;
    if (localFilters.isExpired) count++;
    return count;
  };

  const documentTypes: { key: DocumentType; label: string }[] = [
    { key: 'contract', label: 'Vertrag' },
    { key: 'expose', label: 'Exposé' },
    { key: 'energy_certificate', label: 'Energieausweis' },
    { key: 'floor_plan', label: 'Grundriss' },
    { key: 'photo', label: 'Foto' },
    { key: 'video', label: 'Video' },
    { key: 'document', label: 'Dokument' },
    { key: 'presentation', label: 'Präsentation' },
    { key: 'spreadsheet', label: 'Tabelle' },
    { key: 'pdf', label: 'PDF' },
    { key: 'other', label: 'Sonstiges' },
  ];

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Aktive Filter:
          </span>
          {getActiveFilterCount() > 0 ? (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
              {getActiveFilterCount()}
            </span>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">Keine</span>
          )}
        </div>
        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            Alle löschen
          </button>
        )}
      </div>

      {/* Document Types */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Dokumenttyp
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {documentTypes.map(({ key, label }) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.type?.includes(key) || false}
                onChange={(e) => handleArrayFilterChange('type', key, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Kategorie
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.category?.includes(key as DocumentCategory) || false}
                onChange={(e) => handleArrayFilterChange('category', key, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Status
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(DOCUMENT_STATUS_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.status?.includes(key as DocumentStatus) || false}
                onChange={(e) => handleArrayFilterChange('status', key, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Sichtbarkeit
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(DOCUMENT_VISIBILITY_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.visibility?.includes(key as DocumentVisibility) || false}
                onChange={(e) => handleArrayFilterChange('visibility', key, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Tags
          </h4>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.tags?.includes(tag.name) || false}
                  onChange={(e) => handleArrayFilterChange('tags', tag.name, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  ></span>
                  {tag.name}
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    ({tag.usageCount})
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Date Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Zeitraum
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Von
            </label>
            <input
              type="date"
              value={localFilters.dateRange?.start || ''}
              onChange={(e) => handleFilterChange('dateRange', {
                ...localFilters.dateRange,
                start: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Bis
            </label>
            <input
              type="date"
              value={localFilters.dateRange?.end || ''}
              onChange={(e) => handleFilterChange('dateRange', {
                ...localFilters.dateRange,
                end: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Special Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Besondere Filter
        </h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.hasExpiry || false}
              onChange={(e) => handleFilterChange('hasExpiry', e.target.checked ? true : undefined)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
              Hat Ablaufdatum
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.isExpired || false}
              onChange={(e) => handleFilterChange('isExpired', e.target.checked ? true : undefined)}
              className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500 focus:ring-2"
            />
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
              Abgelaufen
            </span>
          </label>
        </div>
      </div>

      {/* Property ID Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Immobilien-ID
        </h4>
        <input
          type="text"
          value={localFilters.propertyId || ''}
          onChange={(e) => handleFilterChange('propertyId', e.target.value || undefined)}
          placeholder="Immobilien-ID eingeben..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Contact ID Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Kontakt-ID
        </h4>
        <input
          type="text"
          value={localFilters.contactId || ''}
          onChange={(e) => handleFilterChange('contactId', e.target.value || undefined)}
          placeholder="Kontakt-ID eingeben..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Uploader Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Hochgeladen von
        </h4>
        <input
          type="text"
          value={localFilters.uploadedBy || ''}
          onChange={(e) => handleFilterChange('uploadedBy', e.target.value || undefined)}
          placeholder="Benutzername eingeben..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default DocumentAdvancedFilters;
