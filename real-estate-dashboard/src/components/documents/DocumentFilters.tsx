import React, { useState } from 'react';
import { 
  DocumentFilter, 
  DocumentSort, 
  DocumentType, 
  DocumentCategory, 
  DocumentStatus,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS
} from '../../types/document';

interface DocumentFiltersProps {
  filter: DocumentFilter;
  onFilterChange: (filter: DocumentFilter) => void;
  sort: DocumentSort;
  onSortChange: (sort: DocumentSort) => void;
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  filter,
  onFilterChange,
  sort,
  onSortChange
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const documentTypes: { value: DocumentType; label: string }[] = [
    { value: 'contract', label: 'Verträge' },
    { value: 'expose', label: 'Exposés' },
    { value: 'energy_certificate', label: 'Energieausweise' },
    { value: 'floor_plan', label: 'Grundrisse' },
    { value: 'photo', label: 'Fotos' },
    { value: 'video', label: 'Videos' },
    { value: 'document', label: 'Dokumente' },
    { value: 'presentation', label: 'Präsentationen' },
    { value: 'spreadsheet', label: 'Tabellen' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'other', label: 'Sonstige' }
  ];

  const sortOptions = [
    { field: 'name', label: 'Name' },
    { field: 'uploadedAt', label: 'Upload-Datum' },
    { field: 'lastModified', label: 'Zuletzt geändert' },
    { field: 'size', label: 'Dateigröße' },
    { field: 'type', label: 'Typ' },
    { field: 'status', label: 'Status' }
  ];

  const handleTypeChange = (type: DocumentType, checked: boolean) => {
    const currentTypes = filter.type || [];
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    
    onFilterChange({ ...filter, type: newTypes.length > 0 ? newTypes : undefined });
  };

  const handleCategoryChange = (category: DocumentCategory, checked: boolean) => {
    const currentCategories = filter.category || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter(c => c !== category);
    
    onFilterChange({ ...filter, category: newCategories.length > 0 ? newCategories : undefined });
  };

  const handleStatusChange = (status: DocumentStatus, checked: boolean) => {
    const currentStatuses = filter.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onFilterChange({ ...filter, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const activeFilterCount = [
    filter.type?.length || 0,
    filter.category?.length || 0,
    filter.status?.length || 0,
    filter.propertyId ? 1 : 0,
    filter.contactId ? 1 : 0,
    filter.uploadedBy ? 1 : 0,
    filter.dateFrom ? 1 : 0,
    filter.dateTo ? 1 : 0,
    filter.tags?.length || 0,
    filter.hasExpiry ? 1 : 0,
    filter.isExpired ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={`${sort.field}-${sort.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              onSortChange({ field: field as any, direction: direction as 'asc' | 'desc' });
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map(option => (
              <React.Fragment key={option.field}>
                <option value={`${option.field}-desc`}>
                  {option.label} (Z-A)
                </option>
                <option value={`${option.field}-asc`}>
                  {option.label} (A-Z)
                </option>
              </React.Fragment>
            ))}
          </select>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center ${
            activeFilterCount > 0 ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <i className="ri-filter-line mr-2"></i>
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowFilters(false)}
          ></div>

          {/* Filter Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Filter
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Alle löschen
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Document Types */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Dokumenttyp
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {documentTypes.map(type => (
                    <label key={type.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filter.type?.includes(type.value) || false}
                        onChange={(e) => handleTypeChange(type.value, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {type.label}
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
                <div className="space-y-2">
                  {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filter.category?.includes(key as DocumentCategory) || false}
                        onChange={(e) => handleCategoryChange(key as DocumentCategory, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
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
                <div className="space-y-2">
                  {Object.entries(DOCUMENT_STATUS_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filter.status?.includes(key as DocumentStatus) || false}
                        onChange={(e) => handleStatusChange(key as DocumentStatus, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Zeitraum
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Von
                    </label>
                    <input
                      type="date"
                      value={filter.dateFrom || ''}
                      onChange={(e) => onFilterChange({ ...filter, dateFrom: e.target.value || undefined })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Bis
                    </label>
                    <input
                      type="date"
                      value={filter.dateTo || ''}
                      onChange={(e) => onFilterChange({ ...filter, dateTo: e.target.value || undefined })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Special Filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Spezielle Filter
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filter.hasExpiry || false}
                      onChange={(e) => onFilterChange({ ...filter, hasExpiry: e.target.checked || undefined })}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Hat Ablaufdatum
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filter.isExpired || false}
                      onChange={(e) => onFilterChange({ ...filter, isExpired: e.target.checked || undefined })}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Abgelaufen
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentFilters; 
