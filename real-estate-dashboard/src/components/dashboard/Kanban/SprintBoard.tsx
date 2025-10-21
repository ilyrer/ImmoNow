import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useSprints, useCreateSprint, useUpdateSprint, useDeleteSprint,
  useTasks, useMoveTask, useUpdateTask
} from '../../../hooks/useTasks';
import TaskCard from './TaskCard';

interface Sprint {
  id: string;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed';
  created_at: string;
}

interface SprintBoardProps {
  currentUserId?: string;
  onTaskClick?: (task: any) => void;
  onCreateTask?: (sprintId?: string) => void;
}

const SprintBoard: React.FC<SprintBoardProps> = ({
  currentUserId,
  onTaskClick,
  onCreateTask
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'planning' | 'completed'>('active');
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [showSprintDetails, setShowSprintDetails] = useState<string | null>(null);

  // Sprint management hooks
  const { data: sprints = [], isLoading: sprintsLoading } = useSprints();
  const createSprintMutation = useCreateSprint();
  const updateSprintMutation = useUpdateSprint();
  const deleteSprintMutation = useDeleteSprint();

  // Task management hooks
  const { data: tasksData } = useTasks({ page: 1, size: 1000 });
  const moveTaskMutation = useMoveTask();
  const updateTaskMutation = useUpdateTask();

  // Sprint creation form state
  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    start_date: '',
    end_date: ''
  });

  // Filter sprints by status
  const filteredSprints = useMemo(() => {
    return sprints.filter(sprint => {
      if (activeTab === 'active') return sprint.status === 'active';
      if (activeTab === 'planning') return sprint.status === 'planning';
      if (activeTab === 'completed') return sprint.status === 'completed';
      return true;
    });
  }, [sprints, activeTab]);

  // Get tasks for each sprint
  const sprintTasks = useMemo(() => {
    const tasks = (Array.isArray(tasksData) ? tasksData : (tasksData as any)?.items) || [];
    return filteredSprints.reduce((acc, sprint) => {
      acc[sprint.id] = tasks.filter(task => (task as any)?.sprint?.id === sprint.id);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredSprints, tasksData]);

  // Calculate sprint metrics
  const sprintMetrics = useMemo(() => {
    return filteredSprints.map(sprint => {
      const tasks = sprintTasks[sprint.id] || [];
      const completedTasks = tasks.filter(task => task.status === 'done').length;
      const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
      const completedStoryPoints = tasks
        .filter(task => task.status === 'done')
        .reduce((sum, task) => sum + (task.storyPoints || 0), 0);
      
      const progress = totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0;
      
      return {
        ...sprint,
        totalTasks: tasks.length,
        completedTasks,
        totalStoryPoints,
        completedStoryPoints,
        progress
      };
    });
  }, [filteredSprints, sprintTasks]);

  const handleCreateSprint = async () => {
    if (!newSprint.name || !newSprint.start_date || !newSprint.end_date) return;

    try {
      await createSprintMutation.mutateAsync({
        name: newSprint.name,
        goal: newSprint.goal,
        start_date: newSprint.start_date,
        end_date: newSprint.end_date
      });
      
      setNewSprint({ name: '', goal: '', start_date: '', end_date: '' });
      setShowCreateSprint(false);
    } catch (error) {
      console.error('Error creating sprint:', error);
    }
  };

  const handleUpdateSprint = async (sprintId: string, updates: Partial<Sprint>) => {
    try {
      await updateSprintMutation.mutateAsync({
        id: sprintId,
        payload: updates
      });
    } catch (error) {
      console.error('Error updating sprint:', error);
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!confirm('Sprint wirklich löschen? Alle zugehörigen Tasks werden zurück ins Backlog verschoben.')) return;

    try {
      await deleteSprintMutation.mutateAsync(sprintId);
    } catch (error) {
      console.error('Error deleting sprint:', error);
    }
  };

  const handleMoveTaskToSprint = async (taskId: string, sprintId: string) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { sprint_id: sprintId }
      });
    } catch (error) {
      console.error('Error moving task to sprint:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sprint Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Verwalte deine Sprints und plane deine Arbeit
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateSprint(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <i className="ri-add-line mr-2"></i>
              Neuer Sprint
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-6">
          {[
            { id: 'active', label: 'Aktive Sprints', count: sprints.filter(s => s.status === 'active').length },
            { id: 'planning', label: 'Geplant', count: sprints.filter(s => s.status === 'planning').length },
            { id: 'completed', label: 'Abgeschlossen', count: sprints.filter(s => s.status === 'completed').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {sprintsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sprintMetrics.map((sprint) => (
              <motion.div
                key={sprint.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Sprint Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {sprint.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        sprint.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        sprint.status === 'planning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {sprint.status === 'active' && 'Aktiv'}
                        {sprint.status === 'planning' && 'Geplant'}
                        {sprint.status === 'completed' && 'Abgeschlossen'}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowSprintDetails(showSprintDetails === sprint.id ? null : sprint.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <i className="ri-settings-3-line"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteSprint(sprint.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sprint Goal */}
                  {sprint.goal && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {sprint.goal}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Fortschritt</span>
                      <span>{Math.round(sprint.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sprint.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sprint Metrics */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sprint.totalTasks}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tasks
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sprint.totalStoryPoints}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Story Points
                      </div>
                    </div>
                  </div>

                  {/* Days Remaining */}
                  {sprint.status === 'active' && (
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${
                        getDaysRemaining(sprint.end_date) < 0 ? 'text-red-600' :
                        getDaysRemaining(sprint.end_date) < 3 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {getDaysRemaining(sprint.end_date) < 0 ? 'Überfällig' :
                         getDaysRemaining(sprint.end_date) === 0 ? 'Heute' :
                         `${getDaysRemaining(sprint.end_date)} Tage`}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        verbleibend
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => onCreateTask?.(sprint.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <i className="ri-add-line mr-1"></i>
                      Task hinzufügen
                    </button>
                    <button
                      onClick={() => setShowSprintDetails(sprint.id)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                  </div>
                </div>

                {/* Sprint Details */}
                <AnimatePresence>
                  {showSprintDetails === sprint.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Tasks in diesem Sprint
                        </h4>
                        
                        <div className="space-y-2">
                          {sprintTasks[sprint.id]?.length > 0 ? (
                            sprintTasks[sprint.id].map((task) => (
                              <div
                                key={task.id}
                                className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={() => onTaskClick?.(task)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                                      {task.title}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {task.storyPoints ? `${task.storyPoints} SP` : 'Keine SP'}
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                    task.status === 'inProgress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                  }`}>
                                    {task.status}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                              Keine Tasks in diesem Sprint
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!sprintsLoading && filteredSprints.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <i className="ri-sprint-line text-4xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine Sprints gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Erstelle deinen ersten Sprint, um mit der Planung zu beginnen.
            </p>
            <button
              onClick={() => setShowCreateSprint(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Sprint erstellen
            </button>
          </div>
        )}
      </div>

      {/* Create Sprint Modal */}
      <AnimatePresence>
        {showCreateSprint && (
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
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Neuen Sprint erstellen
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sprint Name
                  </label>
                  <input
                    type="text"
                    value={newSprint.name}
                    onChange={(e) => setNewSprint(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="z.B. Sprint 1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sprint Goal
                  </label>
                  <textarea
                    value={newSprint.goal}
                    onChange={(e) => setNewSprint(prev => ({ ...prev, goal: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Was soll in diesem Sprint erreicht werden?"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Datum
                    </label>
                    <input
                      type="date"
                      value={newSprint.start_date}
                      onChange={(e) => setNewSprint(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Datum
                    </label>
                    <input
                      type="date"
                      value={newSprint.end_date}
                      onChange={(e) => setNewSprint(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateSprint}
                  disabled={!newSprint.name || !newSprint.start_date || !newSprint.end_date}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  Sprint erstellen
                </button>
                <button
                  onClick={() => setShowCreateSprint(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SprintBoard;
