import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUpdateTask } from '../../../hooks/useTasks';

interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  description: string;
  timeSpent: number; // in minutes
  date: string;
  createdAt: string;
}

interface TimeTrackingProps {
  task: {
    id: string;
    title: string;
    estimatedHours: number;
    actualHours: number;
    workLogs?: WorkLog[];
  };
  currentUser: {
    id: string;
    name: string;
    avatar: string;
  };
  onClose: () => void;
  isOpen: boolean;
}

const TimeTracking: React.FC<TimeTrackingProps> = ({
  task,
  currentUser,
  onClose,
  isOpen
}) => {
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');
  const [timeSpent, setTimeSpent] = useState({ hours: 0, minutes: 0 });
  const [description, setDescription] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(task.workLogs || []);

  const updateTaskMutation = useUpdateTask();

  // Calculate total time spent
  const totalTimeSpent = workLogs.reduce((sum, log) => sum + log.timeSpent, 0);
  const totalHoursSpent = Math.floor(totalTimeSpent / 60);
  const totalMinutesSpent = totalTimeSpent % 60;

  // Calculate remaining time
  const estimatedMinutes = task.estimatedHours * 60;
  const remainingMinutes = Math.max(0, estimatedMinutes - totalTimeSpent);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMinutesOnly = remainingMinutes % 60;

  // Calculate progress percentage
  const progressPercentage = estimatedMinutes > 0 ? (totalTimeSpent / estimatedMinutes) * 100 : 0;

  const handleLogWork = async () => {
    if (timeSpent.hours === 0 && timeSpent.minutes === 0) return;
    if (!description.trim()) return;

    setIsLogging(true);

    try {
      const totalMinutes = timeSpent.hours * 60 + timeSpent.minutes;
      
      // Create new work log
      const newWorkLog: WorkLog = {
        id: `worklog-${Date.now()}`,
        taskId: task.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        description: description.trim(),
        timeSpent: totalMinutes,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      // Update work logs
      const updatedWorkLogs = [...workLogs, newWorkLog];
      setWorkLogs(updatedWorkLogs);

      // Update task with new actual hours
      const newActualHours = (totalTimeSpent + totalMinutes) / 60;
      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: { actual_hours: newActualHours } as any
      });

      // Reset form
      setTimeSpent({ hours: 0, minutes: 0 });
      setDescription('');
    } catch (error) {
      console.error('Error logging work:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Zeit-Tracking
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {task.title}
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
              onClick={() => setActiveTab('log')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'log'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <i className="ri-time-line mr-2"></i>
              Zeit erfassen
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <i className="ri-history-line mr-2"></i>
              Verlauf ({workLogs.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'log' && (
            <div className="space-y-6">
              {/* Time Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Zeitübersicht
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {task.estimatedHours}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Geschätzt
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {totalHoursSpent}h {totalMinutesSpent}m
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Verbraucht
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      remainingMinutes < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {remainingHours}h {remainingMinutesOnly}m
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Verbleibend
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(progressPercentage)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Fortschritt
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progressPercentage > 100 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Log Work Form */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Arbeit erfassen
                </h3>
                
                <div className="space-y-4">
                  {/* Time Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Zeitaufwand
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Stunden
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={timeSpent.hours}
                          onChange={(e) => setTimeSpent(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Minuten
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={timeSpent.minutes}
                          onChange={(e) => setTimeSpent(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Beschreibung
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      rows={3}
                      placeholder="Was wurde gemacht?"
                    />
                  </div>

                  {/* Quick Time Buttons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Schnellauswahl
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: '15m', hours: 0, minutes: 15 },
                        { label: '30m', hours: 0, minutes: 30 },
                        { label: '1h', hours: 1, minutes: 0 },
                        { label: '2h', hours: 2, minutes: 0 }
                      ].map((quick) => (
                        <button
                          key={quick.label}
                          onClick={() => setTimeSpent({ hours: quick.hours, minutes: quick.minutes })}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          {quick.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Log Button */}
                  <button
                    onClick={handleLogWork}
                    disabled={isLogging || (timeSpent.hours === 0 && timeSpent.minutes === 0) || !description.trim()}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {isLogging ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Erfasse...
                      </div>
                    ) : (
                      'Zeit erfassen'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Arbeitsverlauf
              </h3>
              
              {workLogs.length > 0 ? (
                <div className="space-y-3">
                  {workLogs
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((log) => (
                      <div
                        key={log.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <img
                              src={log.userAvatar}
                              alt={log.userName}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {log.userName}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDateTime(log.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                {log.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <i className="ri-time-line"></i>
                                  {formatTime(log.timeSpent)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <i className="ri-calendar-line"></i>
                                  {formatDate(log.date)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-600 mb-4">
                    <i className="ri-time-line text-4xl"></i>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Keine Arbeitszeit erfasst
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Beginne mit der Erfassung deiner Arbeitszeit für diese Task.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Gesamt: {formatTime(totalTimeSpent)} von {task.estimatedHours}h geschätzt
            </div>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TimeTracking;
