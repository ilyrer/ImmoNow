import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLabels, useSprints, useEmployees } from '../../../hooks/useTasks';

interface FilterPreset {
  id: string;
  name: string;
  filters: TaskFilters;
  isDefault?: boolean;
}

interface TaskFilters {
  search?: string;
  status?: string[];
  priority?: string[];
  assignee?: string[];
  labels?: string[];
  sprints?: string[];
  dueDate?: {
    type: 'overdue' | 'today' | 'thisWeek' | 'thisMonth' | 'custom';
    startDate?: string;
    endDate?: string;
  };
  storyPoints?: {
    min?: number;
    max?: number;
  };
  createdDate?: {
    type: 'today' | 'thisWeek' | 'thisMonth' | 'custom';
    startDate?: string;
    endDate?: string;
  };
}

interface AdvancedFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onClose: () => void;
  isOpen: boolean;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose,
  isOpen
}) => {
  const [localFilters, setLocalFilters] = useState<TaskFilters>(filters);
  const [activeTab, setActiveTab] = useState<'filters' | 'presets'>('filters');
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Data hooks
  const { data: labels = [] } = useLabels();
  const { data: sprints = [] } = useSprints();
  const { data: employees = [] } = useEmployees();

  // Load presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('kanban-filter-presets');
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    } else {
      // Default presets
      const defaultPresets: FilterPreset[] = [
        {
          id: 'my-tasks',
          name: 'Meine Tasks',
          filters: { assignee: [] },
          isDefault: true
        },
        {
          id: 'overdue',
          name: 'Überfällige Tasks',
          filters: { dueDate: { type: 'overdue' } },
          isDefault: true
        },
        {
          id: 'high-priority',
          name: 'Hohe Priorität',
          filters: { priority: ['highest', 'high'] },
          isDefault: true
        },
        {
          id: 'blocked',
          name: 'Blockierte Tasks',
          filters: { status: ['blocked'] },
          isDefault: true
        }
      ];
      setPresets(defaultPresets);
    }
  }, []);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayFilterChange = (key: keyof TaskFilters, value: string, checked: boolean) => {
    setLocalFilters(prev => {
      const currentArray = (prev[key] as string[]) || [];
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);
      
      return {
        ...prev,
        [key]: newArray.length > 0 ? newArray : undefined
      };
    });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  const savePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName,
      filters: localFilters
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('kanban-filter-presets', JSON.stringify(updatedPresets));
    setNewPresetName('');
    setShowSavePreset(false);
  };

  const loadPreset = (preset: FilterPreset) => {
    setLocalFilters(preset.filters);
    onFiltersChange(preset.filters);
  };

  const deletePreset = (presetId: string) => {
    if (presets.find(p => p.id === presetId)?.isDefault) return;
    
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem('kanban-filter-presets', JSON.stringify(updatedPresets));
  };

  const quickFilters = [
    {
      id: 'my-tasks',
      label: 'Meine Tasks',
      icon: 'ri-user-line',
      filter: { assignee: [localStorage.getItem('currentUserId') || ''] } as TaskFilters
    },
    {
      id: 'overdue',
      label: 'Überfällig',
      icon: 'ri-time-line',
      filter: { dueDate: { type: 'overdue' as const } } as TaskFilters
    },
    {
      id: 'high-priority',
      label: 'Hohe Priorität',
      icon: 'ri-flag-line',
      filter: { priority: ['highest', 'high'] } as TaskFilters
    },
    {
      id: 'blocked',
      label: 'Blockiert',
      icon: 'ri-error-warning-line',
      filter: { status: ['blocked'] } as TaskFilters
    },
    {
      id: 'no-assignee',
      label: 'Nicht zugewiesen',
      icon: 'ri-user-unfollow-line',
      filter: { assignee: [] } as TaskFilters
    }
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Erweiterte Filter
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Filtere Tasks nach verschiedenen Kriterien
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4">
            <button
              onClick={() => setActiveTab('filters')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'filters'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <i className="ri-filter-line mr-2"></i>
              Filter
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'presets'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <i className="ri-bookmark-line mr-2"></i>
              Presets
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'filters' && (
            <div className="space-y-6">
              {/* Quick Filters */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Schnellfilter
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {quickFilters.map((quickFilter) => (
                    <button
                      key={quickFilter.id}
                      onClick={() => {
                        setLocalFilters(quickFilter.filter);
                        onFiltersChange(quickFilter.filter);
                      }}
                      className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <i className={`${quickFilter.icon} mr-2`}></i>
                      {quickFilter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suche
                </label>
                <input
                  type="text"
                  value={localFilters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Nach Titel, Beschreibung oder ID suchen..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'backlog', label: 'Backlog', color: 'bg-gray-100 text-gray-800' },
                    { value: 'todo', label: 'To Do', color: 'bg-blue-100 text-blue-800' },
                    { value: 'inProgress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
                    { value: 'review', label: 'Review', color: 'bg-purple-100 text-purple-800' },
                    { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' },
                    { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800' },
                    { value: 'onHold', label: 'On Hold', color: 'bg-orange-100 text-orange-800' },
                    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
                  ].map((status) => (
                    <label key={status.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.status?.includes(status.value) || false}
                        onChange={(e) => handleArrayFilterChange('status', status.value, e.target.checked)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priorität
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'highest', label: 'Höchste', color: 'text-red-500' },
                    { value: 'high', label: 'Hoch', color: 'text-orange-500' },
                    { value: 'medium', label: 'Mittel', color: 'text-yellow-500' },
                    { value: 'low', label: 'Niedrig', color: 'text-blue-500' },
                    { value: 'lowest', label: 'Niedrigste', color: 'text-gray-500' }
                  ].map((priority) => (
                    <label key={priority.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.priority?.includes(priority.value) || false}
                        onChange={(e) => handleArrayFilterChange('priority', priority.value, e.target.checked)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={priority.color}>{priority.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zugewiesen an
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {employees.map((employee) => (
                    <label key={employee.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.assignee?.includes(employee.id) || false}
                        onChange={(e) => handleArrayFilterChange('assignee', employee.id, e.target.checked)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <img
                        src={employee.avatar}
                        alt={employee.name}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      {employee.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Labels
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {labels.map((label) => (
                    <label key={label.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.labels?.includes(label.id) || false}
                        onChange={(e) => handleArrayFilterChange('labels', label.id, e.target.checked)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Sprints */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sprints
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {sprints.map((sprint) => (
                    <label key={sprint.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.sprints?.includes(sprint.id) || false}
                        onChange={(e) => handleArrayFilterChange('sprints', sprint.id, e.target.checked)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      {sprint.name} ({sprint.status})
                    </label>
                  ))}
                </div>
              </div>

              {/* Story Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Story Points
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Minimum
                    </label>
                    <input
                      type="number"
                      value={localFilters.storyPoints?.min || ''}
                      onChange={(e) => handleFilterChange('storyPoints', {
                        ...localFilters.storyPoints,
                        min: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Min"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Maximum
                    </label>
                    <input
                      type="number"
                      value={localFilters.storyPoints?.max || ''}
                      onChange={(e) => handleFilterChange('storyPoints', {
                        ...localFilters.storyPoints,
                        max: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Gespeicherte Filter
                </h3>
                <button
                  onClick={() => setShowSavePreset(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <i className="ri-add-line mr-2"></i>
                  Preset speichern
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {preset.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {Object.keys(preset.filters).length} Filter aktiv
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadPreset(preset)}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Laden"
                        >
                          <i className="ri-play-line"></i>
                        </button>
                        {!preset.isDefault && (
                          <button
                            onClick={() => deletePreset(preset.id)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Löschen"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <i className="ri-refresh-line mr-2"></i>
              Filter zurücksetzen
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Filter anwenden
              </button>
            </div>
          </div>
        </div>

        {/* Save Preset Modal */}
        <AnimatePresence>
          {showSavePreset && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preset speichern
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preset Name
                  </label>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="z.B. Meine wichtigen Tasks"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={savePreset}
                    disabled={!newPresetName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => setShowSavePreset(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AdvancedFilters;
