import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useUpdateTask, useMoveTask, useLabels, useSprints, useEmployees,
  useAddWatcher, useRemoveWatcher
} from '../../../hooks/useTasks';
import { TaskStatus, TaskPriority } from '../../../lib/api/types';

interface BulkActionsProps {
  selectedTasks: string[];
  onClose: () => void;
  onTasksUpdated: () => void;
}

interface BulkUpdateData {
  status?: string;
  priority?: string;
  assignee_id?: string;
  sprint_id?: string;
  label_ids?: string[];
  watcher_ids?: string[];
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedTasks,
  onClose,
  onTasksUpdated
}) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [bulkData, setBulkData] = useState<BulkUpdateData>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Hooks for data fetching
  const { data: labels = [] } = useLabels();
  const { data: sprints = [] } = useSprints();
  const { data: employees = [] } = useEmployees();

  // Mutation hooks
  const updateTaskMutation = useUpdateTask();
  const moveTaskMutation = useMoveTask();
  const addWatcherMutation = useAddWatcher();
  const removeWatcherMutation = useRemoveWatcher();

  const statusOptions = [
    { value: 'backlog', label: 'Backlog', color: 'bg-gray-100 text-gray-800' },
    { value: 'todo', label: 'To Do', color: 'bg-blue-100 text-blue-800' },
    { value: 'inProgress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'review', label: 'Review', color: 'bg-purple-100 text-purple-800' },
    { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' },
    { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800' },
    { value: 'onHold', label: 'On Hold', color: 'bg-orange-100 text-orange-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
  ];

  const priorityOptions = [
    { value: 'highest', label: 'Höchste', color: 'text-red-500' },
    { value: 'high', label: 'Hoch', color: 'text-orange-500' },
    { value: 'medium', label: 'Mittel', color: 'text-yellow-500' },
    { value: 'low', label: 'Niedrig', color: 'text-blue-500' },
    { value: 'lowest', label: 'Niedrigste', color: 'text-gray-500' }
  ];

  const handleBulkUpdate = async () => {
    if (selectedTasks.length === 0) return;

    setIsProcessing(true);
    
    try {
      const promises = selectedTasks.map(taskId => {
        // Ignore temporary tasks
        if (String(taskId).startsWith('TEMP-')) {
          console.log('Ignoring bulk action for temporary task:', taskId);
          return Promise.resolve();
        }
        
        if (activeAction === 'status' && bulkData.status) {
          return moveTaskMutation.mutateAsync({
            id: taskId,
            payload: {
              task_id: taskId,
              target_status: bulkData.status as TaskStatus
            }
          });
        } else if (activeAction === 'assignee' && bulkData.assignee_id) {
          return updateTaskMutation.mutateAsync({
            id: taskId,
            data: { assignee_id: bulkData.assignee_id }
          });
        } else if (activeAction === 'priority' && bulkData.priority) {
          return updateTaskMutation.mutateAsync({
            id: taskId,
            data: { priority: bulkData.priority as any }
          });
        } else if (activeAction === 'sprint' && bulkData.sprint_id) {
          return updateTaskMutation.mutateAsync({
            id: taskId,
            data: { sprint_id: bulkData.sprint_id }
          });
        } else if (activeAction === 'labels' && bulkData.label_ids) {
          return updateTaskMutation.mutateAsync({
            id: taskId,
            data: { label_ids: bulkData.label_ids }
          });
        } else if (activeAction === 'watchers' && bulkData.watcher_ids) {
          // Add watchers
          const addPromises = bulkData.watcher_ids.map(userId =>
            addWatcherMutation.mutateAsync({ taskId, userId })
          );
          return Promise.all(addPromises);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      onTasksUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating tasks:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLabelToggle = (labelId: string) => {
    setBulkData(prev => ({
      ...prev,
      label_ids: prev.label_ids?.includes(labelId)
        ? prev.label_ids.filter(id => id !== labelId)
        : [...(prev.label_ids || []), labelId]
    }));
  };

  const handleWatcherToggle = (userId: string) => {
    setBulkData(prev => ({
      ...prev,
      watcher_ids: prev.watcher_ids?.includes(userId)
        ? prev.watcher_ids.filter(id => id !== userId)
        : [...(prev.watcher_ids || []), userId]
    }));
  };

  const actionButtons = [
    {
      id: 'status',
      label: 'Status ändern',
      icon: 'ri-arrow-right-line',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'assignee',
      label: 'Zuweisen',
      icon: 'ri-user-add-line',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'priority',
      label: 'Priorität',
      icon: 'ri-flag-line',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      id: 'sprint',
      label: 'Sprint',
      icon: 'ri-sprint-line',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'labels',
      label: 'Labels',
      icon: 'ri-price-tag-3-line',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      id: 'watchers',
      label: 'Watcher',
      icon: 'ri-eye-line',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <i className="ri-checkbox-multiple-line text-blue-600 dark:text-blue-400"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Bulk-Aktionen
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTasks.length} Tasks ausgewählt
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {actionButtons.map((action) => (
            <button
              key={action.id}
              onClick={() => setActiveAction(activeAction === action.id ? null : action.id)}
              className={`p-2 rounded-lg text-white text-sm font-medium transition-colors ${
                activeAction === action.id ? action.color : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              <i className={`${action.icon} mr-1`}></i>
              {action.label}
            </button>
          ))}
        </div>

        {/* Action Content */}
        <AnimatePresence>
          {activeAction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 dark:border-gray-700 pt-4"
            >
              {/* Status Change */}
              {activeAction === 'status' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Neuer Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setBulkData(prev => ({ ...prev, status: status.value }))}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                          bulkData.status === status.value
                            ? status.color + ' border-2 border-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignee Change */}
              {activeAction === 'assignee' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zuweisen an
                  </label>
                  <select
                    value={bulkData.assignee_id || ''}
                    onChange={(e) => setBulkData(prev => ({ ...prev, assignee_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Nicht zugewiesen</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority Change */}
              {activeAction === 'priority' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priorität
                  </label>
                  <div className="space-y-2">
                    {priorityOptions.map((priority) => (
                      <button
                        key={priority.value}
                        onClick={() => setBulkData(prev => ({ ...prev, priority: priority.value }))}
                        className={`w-full p-2 rounded-lg text-sm font-medium transition-colors ${
                          bulkData.priority === priority.value
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-2 border-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className={priority.color}>{priority.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sprint Change */}
              {activeAction === 'sprint' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sprint
                  </label>
                  <select
                    value={bulkData.sprint_id || ''}
                    onChange={(e) => setBulkData(prev => ({ ...prev, sprint_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Kein Sprint</option>
                    {sprints.map((sprint) => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name} ({sprint.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Labels */}
              {activeAction === 'labels' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Labels hinzufügen
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {labels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => handleLabelToggle(label.id)}
                        className={`w-full p-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          bulkData.label_ids?.includes(label.id)
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-2 border-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Watchers */}
              {activeAction === 'watchers' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Watcher hinzufügen
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {employees.map((employee) => (
                      <button
                        key={employee.id}
                        onClick={() => handleWatcherToggle(employee.id)}
                        className={`w-full p-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          bulkData.watcher_ids?.includes(employee.id)
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-2 border-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <img
                          src={employee.avatar}
                          alt={employee.name}
                          className="w-6 h-6 rounded-full"
                        />
                        {employee.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleBulkUpdate}
                  disabled={isProcessing || !bulkData[activeAction as keyof BulkUpdateData]}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verarbeitung...
                    </div>
                  ) : (
                    'Anwenden'
                  )}
                </button>
                <button
                  onClick={() => setActiveAction(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default BulkActions;
