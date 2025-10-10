import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from './PremiumKanbanBoard';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  availableAssignees?: Array<{
    id: string;
    name: string;
    avatar: string;
    role?: string;
  }>;
  mode?: 'view' | 'edit';
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  availableAssignees = [],
  mode: initialMode = 'view'
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity' | 'documents'>('details');
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  React.useEffect(() => {
    if (task) {
      setEditedTask(task);
      setMode(initialMode);
    }
  }, [task, initialMode]);

  if (!task || !editedTask) return null;

  const priorityOptions = [
    { value: 'critical', label: 'Kritisch', icon: '🔴', color: 'red' },
    { value: 'high', label: 'Hoch', icon: '🟠', color: 'orange' },
    { value: 'medium', label: 'Mittel', icon: '🟡', color: 'yellow' },
    { value: 'low', label: 'Niedrig', icon: '🟢', color: 'green' }
  ];

  const statusOptions = [
    { value: 'backlog', label: 'Backlog', icon: '📝', color: 'gray' },
    { value: 'todo', label: 'Zu erledigen', icon: '📋', color: 'gray' },
    { value: 'inProgress', label: 'In Arbeit', icon: '⚡', color: 'blue' },
    { value: 'review', label: 'Überprüfung', icon: '👁️', color: 'orange' },
    { value: 'done', label: 'Abgeschlossen', icon: '✅', color: 'green' },
    { value: 'blocked', label: 'Blockiert', icon: '🚫', color: 'red' }
  ];

  const handleSave = () => {
    if (editedTask) {
      onSave(editedTask);
      setMode('view');
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
      onDelete?.(task.id);
      onClose();
    }
  };

  const addComment = () => {
    if (newComment.trim() && editedTask) {
      const comment = {
        id: Date.now().toString(),
        author: 'Aktueller Benutzer',
        avatar: 'https://ui-avatars.com/api/?name=User&background=0A84FF&color=fff',
        text: newComment,
        timestamp: new Date().toISOString()
      };
      setEditedTask({
        ...editedTask,
        comments: [...editedTask.comments, comment]
      });
      setNewComment('');
    }
  };

  const addSubtask = () => {
    if (newSubtask.trim() && editedTask) {
      const subtask = {
        id: Date.now().toString(),
        title: newSubtask,
        completed: false
      };
      setEditedTask({
        ...editedTask,
        subtasks: [...editedTask.subtasks, subtask]
      });
      setNewSubtask('');
    }
  };

  const toggleSubtask = (subtaskId: string) => {
    if (editedTask) {
      setEditedTask({
        ...editedTask,
        subtasks: editedTask.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white/40 dark:bg-gray-900/40 
              backdrop-blur-3xl rounded-3xl border border-white/20 dark:border-white/10 
              shadow-glass-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl 
                  flex items-center justify-center shadow-glass">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400 
                    bg-white/50 dark:bg-white/10 px-2 py-1 rounded-lg">
                    {task.id}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    Task Details
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mode === 'view' ? (
                  <>
                    <button
                      onClick={() => setMode('edit')}
                      className="px-4 py-2 bg-blue-500/80 hover:bg-blue-600/80 text-white rounded-xl 
                        font-semibold text-sm transition-all shadow-glass"
                    >
                      ✏️ Bearbeiten
                    </button>
                    {onDelete && (
                      <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-500/80 hover:bg-red-600/80 text-white rounded-xl 
                          font-semibold text-sm transition-all shadow-glass"
                      >
                        🗑️ Löschen
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-500/80 hover:bg-green-600/80 text-white rounded-xl 
                        font-semibold text-sm transition-all shadow-glass"
                    >
                      💾 Speichern
                    </button>
                    <button
                      onClick={() => {
                        setEditedTask(task);
                        setMode('view');
                      }}
                      className="px-4 py-2 bg-gray-500/80 hover:bg-gray-600/80 text-white rounded-xl 
                        font-semibold text-sm transition-all shadow-glass"
                    >
                      ✕ Abbrechen
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/40 
                    dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/15 transition-all"
                >
                  <span className="text-xl text-gray-700 dark:text-gray-300">×</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/20 dark:border-white/10">
              {[
                { id: 'details', label: 'Details', icon: '📝' },
                { id: 'comments', label: 'Kommentare', icon: '💬', badge: task.comments.length },
                { id: 'activity', label: 'Aktivität', icon: '📊' },
                { id: 'documents', label: 'Dokumente', icon: '📎', badge: task.attachments.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`relative px-4 py-3 font-semibold text-sm transition-all rounded-t-xl
                    ${activeTab === tab.id
                      ? 'bg-white/40 dark:bg-white/10 text-gray-900 dark:text-white border-t border-x border-white/20 dark:border-white/10'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5'
                    }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Titel
                    </label>
                    {mode === 'edit' ? (
                      <input
                        type="text"
                        value={editedTask.title}
                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                        className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                          border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
                          dark:text-white focus:ring-2 focus:ring-blue-500/50"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Beschreibung
                    </label>
                    {mode === 'edit' ? (
                      <textarea
                        value={editedTask.description}
                        onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                          border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
                          dark:text-white focus:ring-2 focus:ring-blue-500/50 resize-none"
                      />
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300">{task.description || 'Keine Beschreibung'}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Priorität
                      </label>
                      {mode === 'edit' ? (
                        <select
                          value={editedTask.priority}
                          onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as Task['priority'] })}
                          className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                            border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
                            dark:text-white focus:ring-2 focus:ring-blue-500/50"
                        >
                          {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {priorityOptions.find(p => p.value === task.priority)?.icon}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {priorityOptions.find(p => p.value === task.priority)?.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      {mode === 'edit' ? (
                        <select
                          value={editedTask.status}
                          onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as Task['status'] })}
                          className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                            border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
                            dark:text-white focus:ring-2 focus:ring-blue-500/50"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {statusOptions.find(s => s.value === task.status)?.icon}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {statusOptions.find(s => s.value === task.status)?.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Assignee */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Zugewiesen an
                      </label>
                      {mode === 'edit' && availableAssignees.length > 0 ? (
                        <select
                          value={editedTask.assignee.id}
                          onChange={(e) => {
                            const assignee = availableAssignees.find(a => a.id === e.target.value);
                            if (assignee) setEditedTask({ ...editedTask, assignee });
                          }}
                          className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                            border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
                            dark:text-white focus:ring-2 focus:ring-blue-500/50"
                        >
                          {availableAssignees.map(assignee => (
                            <option key={assignee.id} value={assignee.id}>
                              {assignee.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-3">
                          <img
                            src={task.assignee.avatar}
                            alt={task.assignee.name}
                            className="w-10 h-10 rounded-full border-2 border-white/50"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{task.assignee.name}</p>
                            {task.assignee.role && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">{task.assignee.role}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Fälligkeitsdatum
                      </label>
                      {mode === 'edit' ? (
                        <input
                          type="date"
                          value={editedTask.dueDate}
                          onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                          className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                            border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
                            dark:text-white focus:ring-2 focus:ring-blue-500/50"
                        />
                      ) : (
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(task.dueDate).toLocaleDateString('de-DE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>

                    {/* Estimated Hours */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Geschätzte Stunden
                      </label>
                      {mode === 'edit' ? (
                        <input
                          type="number"
                          value={editedTask.estimatedHours}
                          onChange={(e) => setEditedTask({ ...editedTask, estimatedHours: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                            border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
                            dark:text-white focus:ring-2 focus:ring-blue-500/50"
                        />
                      ) : (
                        <p className="font-medium text-gray-900 dark:text-white">{task.estimatedHours}h</p>
                      )}
                    </div>

                    {/* Progress */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Fortschritt
                      </label>
                      {mode === 'edit' ? (
                        <div className="space-y-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editedTask.progress}
                            onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{editedTask.progress}%</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-full h-3 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{task.progress}%</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Info */}
                  {(task.location || task.price) && (
                    <div className="p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 
                      dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl border border-white/30 
                      dark:border-white/10">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Immobilien-Info</h4>
                      <div className="space-y-2">
                        {task.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-blue-500">📍</span>
                            <span className="text-gray-700 dark:text-gray-300">{task.location}</span>
                          </div>
                        )}
                        {task.price && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-500">💶</span>
                            <span className="font-bold text-green-600 dark:text-green-400">
                              {new Intl.NumberFormat('de-DE', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0,
                              }).format(task.price)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subtasks */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Teilaufgaben ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                    </h4>
                    <div className="space-y-2 mb-3">
                      {editedTask.subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-3 p-3 bg-white/40 dark:bg-white/10 
                            rounded-xl border border-white/20 dark:border-white/10"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(subtask.id)}
                            disabled={mode === 'view'}
                            className="w-5 h-5 rounded border-gray-300"
                          />
                          <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                    {mode === 'edit' && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSubtask}
                          onChange={(e) => setNewSubtask(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                          placeholder="Neue Teilaufgabe hinzufügen..."
                          className="flex-1 px-4 py-2 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                            border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
                            dark:text-white focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button
                          onClick={addSubtask}
                          className="px-4 py-2 bg-blue-500/80 hover:bg-blue-600/80 text-white 
                            rounded-xl font-semibold text-sm transition-all"
                        >
                          Hinzufügen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {/* Add Comment */}
                  <div className="flex gap-3">
                    <img
                      src="https://ui-avatars.com/api/?name=User&background=0A84FF&color=fff"
                      alt="User"
                      className="w-10 h-10 rounded-full border-2 border-white/50"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Kommentar hinzufügen..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                          border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
                          dark:text-white focus:ring-2 focus:ring-blue-500/50 resize-none mb-2"
                      />
                      <button
                        onClick={addComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-500/80 hover:bg-blue-600/80 text-white 
                          rounded-xl font-semibold text-sm transition-all disabled:opacity-50 
                          disabled:cursor-not-allowed"
                      >
                        Kommentieren
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {editedTask.comments.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-4xl mb-2">💬</p>
                        <p>Noch keine Kommentare</p>
                      </div>
                    ) : (
                      editedTask.comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <img
                            src={comment.avatar}
                            alt={comment.author}
                            className="w-10 h-10 rounded-full border-2 border-white/50"
                          />
                          <div className="flex-1 p-4 bg-white/40 dark:bg-white/10 rounded-xl 
                            border border-white/20 dark:border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {comment.author}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(comment.timestamp).toLocaleDateString('de-DE')}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-4xl mb-2">📊</p>
                    <p>Aktivitätsverlauf wird hier angezeigt</p>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  {task.attachments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <p className="text-4xl mb-2">📎</p>
                      <p>Keine Dokumente angehängt</p>
                      <button className="mt-4 px-4 py-2 bg-blue-500/80 hover:bg-blue-600/80 
                        text-white rounded-xl font-semibold text-sm transition-all">
                        Dokument hinzufügen
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {task.attachments.map((attachment: any) => (
                        <div
                          key={attachment.id}
                          className="p-4 bg-white/40 dark:bg-white/10 rounded-xl border 
                            border-white/20 dark:border-white/10 hover:bg-white/60 
                            dark:hover:bg-white/15 transition-all cursor-pointer"
                        >
                          <p className="font-semibold text-gray-900 dark:text-white mb-1">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {attachment.size}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TaskDetailModal;
