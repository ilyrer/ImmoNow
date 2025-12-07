import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskAssignee {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

interface RealEstateTask {
  id: string;
  title: string;
  description: string;
  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
  assignee: {
    name: string;
    avatar: string;
    id: string;
    role: string;
  };
  dueDate: string;
  status: 'backlog' | 'todo' | 'inProgress' | 'review' | 'done' | 'blocked' | 'onHold' | 'cancelled';
  progress: number;
  tags: string[];
  estimatedHours: number;
  actualHours: number;
  propertyType?: 'apartment' | 'house' | 'commercial' | 'land';
  location?: string;
  price?: number;
  labels: { id: string; name: string; color: string; }[];
  attachments: any[];
  comments: any[];
  subtasks: any[];
  createdAt: string;
  updatedAt: string;
  reporter: string;
  watchers: TaskAssignee[] | string[];
  issueType: 'listing' | 'viewing' | 'contract' | 'maintenance' | 'marketing';
  clientId?: string;
  propertyId?: string;
  complexity: 'trivial' | 'easy' | 'medium' | 'hard' | 'epic';
  impactScore: number;
  effortScore: number;
  dependencies: string[];
  blockedBy?: string;
  blocking: string[];
  customFields: Record<string, any>;
}

interface TaskModalProps {
  isOpen: boolean;
  task: RealEstateTask | null;
  mode: 'view' | 'edit' | 'create';
  onClose: () => void;
  onSave: (task: RealEstateTask) => void;
  teamMembers: Array<{
    id: string;
    name: string;
    avatar: string;
    role: string;
  }>;
  availableLabels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  mode,
  onClose,
  onSave,
  teamMembers,
  availableLabels
}) => {
  const [editedTask, setEditedTask] = useState<RealEstateTask | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments' | 'history'>('details');
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      // Automatisch in Bearbeitungsmodus wenn neue Aufgabe erstellt wird
      setIsEditing(mode === 'create' || mode === 'edit');
    }
  }, [task, mode]);

  if (!isOpen || !editedTask) return null;

  const handleSave = () => {
    if (editedTask) {
      editedTask.updatedAt = new Date().toISOString();
      onSave(editedTask);
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (mode === 'create') {
      onClose();
    } else {
      setEditedTask({ ...task! });
      setIsEditing(false);
    }
  };

  const addComment = () => {
    if (newComment.trim() && editedTask) {
      const comment = {
        id: `comment-${Date.now()}`,
        user: 'Current User',
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
    if (editedTask) {
      const subtask = {
        id: `subtask-${Date.now()}`,
        title: 'Neue Unteraufgabe',
        completed: false
      };
      setEditedTask({
        ...editedTask,
        subtasks: [...editedTask.subtasks, subtask]
      });
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

  const priorityColors = {
    highest: 'text-red-500',
    high: 'text-orange-500',
    medium: 'text-yellow-500',
    low: 'text-blue-500',
    lowest: 'text-gray-500'
  };

  const statusColors = {
    backlog: 'bg-gray-600',
    todo: 'bg-blue-600',
    inProgress: 'bg-yellow-600',
    review: 'bg-purple-600',
    done: 'bg-green-600',
    blocked: 'bg-red-600'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Enhanced Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Enhanced Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl max-h-[95vh] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50"
        >
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">
                      {editedTask.issueType === 'listing' && '🏠'}
                      {editedTask.issueType === 'viewing' && '👁️'}
                      {editedTask.issueType === 'contract' && '📄'}
                      {editedTask.issueType === 'maintenance' && '🔧'}
                      {editedTask.issueType === 'marketing' && '📢'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {mode === 'create' ? 'Neue Aufgabe erstellen' : editedTask.title}
                    </h2>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg">{editedTask.id}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        editedTask.priority === 'highest' ? 'bg-red-500/20 text-red-400' :
                        editedTask.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        editedTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        editedTask.priority === 'low' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {editedTask.priority === 'highest' && '🔺 Höchste'}
                        {editedTask.priority === 'high' && '🔴 Hoch'}
                        {editedTask.priority === 'medium' && '🟡 Mittel'}
                        {editedTask.priority === 'low' && '🔽 Niedrig'}
                        {editedTask.priority === 'lowest' && '⬇️ Niedrigste'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {!isEditing && mode !== 'create' && (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
                  >
                    <i className="ri-edit-line"></i>
                    Bearbeiten
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
                    >
                      <i className="ri-save-line"></i>
                      Speichern
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all duration-200"
                    >
                      Abbrechen
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-[calc(95vh-100px)]">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Enhanced Tabs */}
              <div className="bg-gray-800/50 border-b border-gray-700/50">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'details', label: 'Details', icon: 'ri-file-text-line' },
                    { id: 'comments', label: `Kommentare (${editedTask.comments.length})`, icon: 'ri-chat-3-line' },
                    { id: 'attachments', label: `Anhänge (${editedTask.attachments.length})`, icon: 'ri-attachment-line' },
                    { id: 'history', label: 'Verlauf', icon: 'ri-history-line' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <i className={`${tab.icon} mr-2`}></i>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Enhanced Tab Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Enhanced Title */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Titel *
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedTask.title}
                          onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Aufgabentitel eingeben..."
                        />
                      ) : (
                        <div className="p-4 bg-gray-700/30 rounded-xl">
                          <p className="text-white text-lg font-medium">{editedTask.title}</p>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Beschreibung
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editedTask.description}
                          onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Beschreibung eingeben..."
                        />
                      ) : (
                        <div className="p-4 bg-gray-700/30 rounded-xl">
                          <p className="text-gray-300 leading-relaxed">{editedTask.description || 'Keine Beschreibung'}</p>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Property Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">
                          Objekttyp
                        </label>
                        {isEditing ? (
                          <select
                            value={editedTask.propertyType || ''}
                            onChange={(e) => setEditedTask({ ...editedTask, propertyType: e.target.value as any })}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          >
                            <option value="">Objekttyp wählen</option>
                            <option value="apartment">🏢 Wohnung</option>
                            <option value="house">🏡 Haus</option>
                            <option value="commercial">🏬 Gewerbe</option>
                            <option value="land">🌍 Grundstück</option>
                          </select>
                        ) : (
                          <div className="p-4 bg-gray-700/30 rounded-xl">
                            <p className="text-gray-300">
                              {editedTask.propertyType === 'apartment' && '🏢 Wohnung'}
                              {editedTask.propertyType === 'house' && '🏡 Haus'}
                              {editedTask.propertyType === 'commercial' && '🏬 Gewerbe'}
                              {editedTask.propertyType === 'land' && '🌍 Grundstück'}
                              {!editedTask.propertyType && 'Nicht angegeben'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">
                          Standort
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedTask.location || ''}
                            onChange={(e) => setEditedTask({ ...editedTask, location: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="z.B. München, Schwabing"
                          />
                        ) : (
                          <div className="p-4 bg-gray-700/30 rounded-xl">
                            <p className="text-gray-300">{editedTask.location || 'Nicht angegeben'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Price */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Preis (EUR)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedTask.price || ''}
                          onChange={(e) => setEditedTask({ ...editedTask, price: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Preis eingeben..."
                        />
                      ) : (
                        <div className="p-4 bg-gray-700/30 rounded-xl">
                          <p className="text-gray-300 font-medium">
                            {editedTask.price 
                              ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(editedTask.price)
                              : 'Nicht angegeben'
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Subtasks */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-semibold text-gray-300">
                          Unteraufgaben ({editedTask.subtasks.filter(st => st.completed).length}/{editedTask.subtasks.length})
                        </label>
                        {isEditing && (
                          <button
                            onClick={addSubtask}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                          >
                            <i className="ri-add-line"></i>
                            Hinzufügen
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {editedTask.subtasks.map(subtask => (
                          <div key={subtask.id} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-xl">
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtask(subtask.id)}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                            />
                            {isEditing ? (
                              <input
                                type="text"
                                value={subtask.title}
                                onChange={(e) => {
                                  const updatedSubtasks = editedTask.subtasks.map(st =>
                                    st.id === subtask.id ? { ...st, title: e.target.value } : st
                                  );
                                  setEditedTask({ ...editedTask, subtasks: updatedSubtasks });
                                }}
                                className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm transition-all"
                              />
                            ) : (
                              <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                                {subtask.title}
                              </span>
                            )}
                          </div>
                        ))}
                        {editedTask.subtasks.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <i className="ri-list-check text-4xl mb-2"></i>
                            <p>Keine Unteraufgaben</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Progress */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Fortschritt: {editedTask.progress}%
                      </label>
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editedTask.progress}
                            onChange={(e) => setEditedTask({ ...editedTask, progress: Number(e.target.value) })}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${editedTask.progress}%` }}
                              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-sm text-gray-400">{editedTask.progress}% erledigt</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Comments Tab */}
                {activeTab === 'comments' && (
                  <div className="space-y-6">
                    {/* Add Comment */}
                    <div className="bg-gray-700/30 rounded-xl p-4">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Kommentar hinzufügen..."
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3 transition-all"
                      />
                      <button
                        onClick={addComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
                      >
                        <i className="ri-send-plane-line"></i>
                        Kommentar hinzufügen
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {editedTask.comments.map(comment => (
                        <motion.div 
                          key={comment.id} 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-700/30 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-white">{comment.user}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.timestamp).toLocaleString('de-DE')}
                            </span>
                          </div>
                          <p className="text-gray-300 leading-relaxed">{comment.text}</p>
                        </motion.div>
                      ))}
                      {editedTask.comments.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <i className="ri-chat-3-line text-6xl mb-4 opacity-50"></i>
                          <p className="text-lg font-medium">Noch keine Kommentare</p>
                          <p className="text-sm">Sei der erste, der einen Kommentar hinterlässt</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Attachments Tab */}
                {activeTab === 'attachments' && (
                  <div className="space-y-6">
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-gray-600/50 rounded-xl p-12 text-center bg-gray-700/20 hover:bg-gray-700/30 transition-all">
                      <i className="ri-upload-cloud-line text-6xl text-gray-400 mb-4"></i>
                      <p className="text-gray-400 mb-4 text-lg">Dateien hier ablegen oder</p>
                      <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 mx-auto">
                        <i className="ri-folder-open-line"></i>
                        Dateien auswählen
                      </button>
                    </div>

                    {/* Attachments List */}
                    <div className="space-y-3">
                      {editedTask.attachments.map(attachment => (
                        <div key={attachment.id} className="flex items-center justify-between bg-gray-700/30 rounded-xl p-4">
                          <div className="flex items-center space-x-4">
                            <i className="ri-file-line text-2xl text-gray-400"></i>
                            <div>
                              <span className="text-white font-medium">{attachment.name}</span>
                              <p className="text-xs text-gray-400">{attachment.type?.toUpperCase()}</p>
                            </div>
                          </div>
                          <button className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-all">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      ))}
                      {editedTask.attachments.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <i className="ri-attachment-line text-6xl mb-4 opacity-50"></i>
                          <p className="text-lg font-medium">Keine Anhänge</p>
                          <p className="text-sm">Lade Dateien hoch, um sie hier zu sehen</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gray-700/30 rounded-xl p-4"
                    >
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <i className="ri-add-circle-line text-green-400"></i>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-white">Aufgabe erstellt</span>
                          <p className="text-xs text-gray-400">
                            {new Date(editedTask.createdAt).toLocaleString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm ml-12">von {editedTask.reporter}</p>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gray-700/30 rounded-xl p-4"
                    >
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <i className="ri-edit-line text-blue-400"></i>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-white">Zuletzt bearbeitet</span>
                          <p className="text-xs text-gray-400">
                            {new Date(editedTask.updatedAt).toLocaleString('de-DE')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="w-80 bg-gray-900/50 border-l border-gray-700/50 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Status</label>
                  {isEditing ? (
                    <select
                      value={editedTask.status}
                      onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as any })}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="backlog">📋 Backlog</option>
                      <option value="todo">📝 Zu erledigen</option>
                      <option value="inProgress">⚡ In Bearbeitung</option>
                      <option value="review">👁️ Überprüfung</option>
                      <option value="done">✅ Erledigt</option>
                      <option value="blocked">🔴 Blockiert</option>
                    </select>
                  ) : (
                    <div className={`p-3 rounded-xl text-center font-medium ${statusColors[editedTask.status]}`}>
                      {editedTask.status === 'backlog' && '📋 Backlog'}
                      {editedTask.status === 'todo' && '📝 Zu erledigen'}
                      {editedTask.status === 'inProgress' && '⚡ In Bearbeitung'}
                      {editedTask.status === 'review' && '👁️ Überprüfung'}
                      {editedTask.status === 'done' && '✅ Erledigt'}
                      {editedTask.status === 'blocked' && '🔴 Blockiert'}
                    </div>
                  )}
                </div>

                {/* Enhanced Assignee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Zugewiesen an</label>
                  {isEditing ? (
                    <select
                      value={editedTask.assignee.id}
                      onChange={(e) => {
                        const member = teamMembers.find(m => m.id === e.target.value);
                        if (member) {
                          setEditedTask({ ...editedTask, assignee: member });
                        }
                      }}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-xl">
                      <img
                        src={editedTask.assignee.avatar}
                        alt={editedTask.assignee.name}
                        className="w-10 h-10 rounded-full border-2 border-gray-600"
                      />
                      <div>
                        <p className="text-white font-semibold">{editedTask.assignee.name}</p>
                        <p className="text-xs text-gray-400">{editedTask.assignee.role}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Priority */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Priorität</label>
                  {isEditing ? (
                    <select
                      value={editedTask.priority}
                      onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as any })}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="highest">🔺 Höchste</option>
                      <option value="high">🔴 Hoch</option>
                      <option value="medium">🟡 Mittel</option>
                      <option value="low">🔽 Niedrig</option>
                      <option value="lowest">⬇️ Niedrigste</option>
                    </select>
                  ) : (
                    <div className={`p-3 rounded-xl text-center font-medium ${
                      editedTask.priority === 'highest' ? 'bg-red-500/20 text-red-400' :
                      editedTask.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      editedTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      editedTask.priority === 'low' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {editedTask.priority === 'highest' && '🔺 Höchste'}
                      {editedTask.priority === 'high' && '🔴 Hoch'}
                      {editedTask.priority === 'medium' && '🟡 Mittel'}
                      {editedTask.priority === 'low' && '🔽 Niedrig'}
                      {editedTask.priority === 'lowest' && '⬇️ Niedrigste'}
                    </div>
                  )}
                </div>

                {/* Enhanced Due Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Fälligkeitsdatum</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedTask.dueDate}
                      onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  ) : (
                    <div className="p-3 bg-gray-700/30 rounded-xl text-center">
                      <p className="text-gray-300 font-medium">
                        {new Date(editedTask.dueDate).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhanced Estimated Hours */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Geschätzte Stunden</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedTask.estimatedHours}
                      onChange={(e) => setEditedTask({ ...editedTask, estimatedHours: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  ) : (
                    <div className="p-3 bg-gray-700/30 rounded-xl text-center">
                      <p className="text-gray-300 font-medium">{editedTask.estimatedHours}h</p>
                    </div>
                  )}
                </div>

                {/* Enhanced Actual Hours */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Tatsächliche Stunden</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedTask.actualHours}
                      onChange={(e) => setEditedTask({ ...editedTask, actualHours: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  ) : (
                    <div className="p-3 bg-gray-700/30 rounded-xl text-center">
                      <p className="text-gray-300 font-medium">{editedTask.actualHours}h</p>
                    </div>
                  )}
                </div>

                {/* Enhanced Labels */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Labels</label>
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Current Labels */}
                      <div className="space-y-2">
                        {editedTask.labels.map(label => (
                          <div key={label.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                            <span
                              className="px-3 py-1 text-xs font-medium rounded-lg text-white"
                              style={{ backgroundColor: label.color }}
                            >
                              {label.name}
                            </span>
                            <button
                              onClick={() => {
                                setEditedTask({
                                  ...editedTask,
                                  labels: editedTask.labels.filter(l => l.id !== label.id)
                                });
                              }}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all"
                            >
                              <i className="ri-close-line text-sm"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Available Labels to Add */}
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Verfügbare Labels:</p>
                        <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                          {availableLabels
                            .filter(label => !editedTask.labels.some(l => l.id === label.id))
                            .map(label => (
                              <button
                                key={label.id}
                                onClick={() => {
                                  setEditedTask({
                                    ...editedTask,
                                    labels: [...editedTask.labels, label]
                                  });
                                }}
                                className="flex items-center space-x-2 p-2 text-left hover:bg-gray-700/50 rounded-lg transition-all"
                              >
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: label.color }}
                                ></span>
                                <span className="text-xs text-gray-300">{label.name}</span>
                                <i className="ri-add-line text-xs text-gray-400 ml-auto"></i>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editedTask.labels.map(label => (
                        <span
                          key={label.id}
                          className="inline-block px-3 py-2 text-xs font-medium rounded-lg text-white mr-2 mb-2"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </span>
                      ))}
                      {editedTask.labels.length === 0 && (
                        <div className="p-3 bg-gray-700/30 rounded-xl text-center">
                          <p className="text-gray-500 text-sm">Keine Labels</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskModal; 
