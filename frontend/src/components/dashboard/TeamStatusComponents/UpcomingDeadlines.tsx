import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { format, isBefore, parseISO, isToday } from 'date-fns';
import de from 'date-fns/locale/de';

// Mock interfaces
interface Deadline {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'task' | 'deadline' | 'event';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  team: string;
  assignees: Person[];
  description: string;
}

interface Person {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

type DeadlineTimeRange = 'today' | 'week' | 'month' | 'all';
type DeadlineStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type DeadlinePriority = 'low' | 'medium' | 'high' | 'urgent';
type DeadlineType = 'meeting' | 'task' | 'deadline' | 'event';

interface DeadlinesFilterParams {
  timeRange: DeadlineTimeRange;
  status?: DeadlineStatus;
  type?: DeadlineType;
  search?: string;
}

// Mock functions
const getDeadlines = async (params: DeadlinesFilterParams): Promise<Deadline[]> => {
  return [];
};

const createDeadline = async (deadline: Partial<Deadline>): Promise<Deadline> => {
  return {
    id: '1',
    title: deadline.title || '',
    date: deadline.date || '',
    time: deadline.time || '',
    type: deadline.type || 'task',
    priority: deadline.priority || 'medium',
    status: 'pending',
    team: deadline.team || '',
    assignees: deadline.assignees || [],
    description: deadline.description || ''
  };
};

const updateDeadlineStatus = async (id: string, status: DeadlineStatus): Promise<void> => {
  // Mock implementation
};

const deleteDeadline = async (id: string): Promise<void> => {
  // Mock implementation
};

const getTeamMembers = async (): Promise<Person[]> => {
  return [];
};

// Definiere die öffentliche Schnittstelle für forwardRef
export interface DeadlinesRefHandle {
  getDeadlines: () => Deadline[];
  openNewDeadlineModal: (date?: Date) => void;
}

interface UpcomingDeadlinesProps {
  timeRange: DeadlineTimeRange;
}

const UpcomingDeadlines = forwardRef<DeadlinesRefHandle, UpcomingDeadlinesProps>(({ timeRange }, ref) => {
  // State für Daten und UI
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<DeadlineStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<DeadlineType | ''>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<Person[]>([]);
  
  // State für neue Deadline
  const [newDeadline, setNewDeadline] = useState<{
    title: string;
    date: string;
    time: string;
    type: DeadlineType;
    priority: DeadlinePriority;
    team: string;
    assignees: Person[];
    description: string;
  }>({
    title: '',
    date: '',
    time: '',
    type: 'task',
    priority: 'medium',
    team: '',
    assignees: [],
    description: ''
  });

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getDeadlines: () => deadlines,
    openNewDeadlineModal: (date?: Date) => {
      if (date) {
        setNewDeadline(prev => ({
          ...prev,
          date: format(date, 'yyyy-MM-dd')
        }));
      }
      setShowAddModal(true);
    }
  }));

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [deadlinesData, membersData] = await Promise.all([
          getDeadlines({ timeRange }),
          getTeamMembers()
        ]);
        
        setDeadlines(deadlinesData);
        setTeamMembers(membersData);
        setError(null);
      } catch (err) {
        setError('Fehler beim Laden der Daten');
        console.error('Error loading deadlines:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  // Filter deadlines based on search and filters
  const filteredDeadlines = deadlines.filter(deadline => {
    const matchesSearch = !searchTerm || 
      deadline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deadline.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || deadline.status === statusFilter;
    const matchesType = !typeFilter || deadline.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Sort deadlines by date and priority
  const sortedDeadlines = filteredDeadlines.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const handleCreateDeadline = async () => {
    if (!newDeadline.title || !newDeadline.date) return;
    
    try {
      const createdDeadline = await createDeadline(newDeadline);
      setDeadlines(prev => [...prev, createdDeadline]);
      setShowAddModal(false);
      setNewDeadline({
        title: '',
        date: '',
        time: '',
        type: 'task',
        priority: 'medium',
        team: '',
        assignees: [],
        description: ''
      });
    } catch (err) {
      console.error('Error creating deadline:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: DeadlineStatus) => {
    try {
      await updateDeadlineStatus(id, newStatus);
      setDeadlines(prev => prev.map(deadline => 
        deadline.id === id ? { ...deadline, status: newStatus } : deadline
      ));
    } catch (err) {
      console.error('Error updating deadline status:', err);
    }
  };

  const handleDeleteDeadline = async (id: string) => {
    try {
      await deleteDeadline(id);
      setDeadlines(prev => prev.filter(deadline => deadline.id !== id));
    } catch (err) {
      console.error('Error deleting deadline:', err);
    }
  };

  const getPriorityColor = (priority: DeadlinePriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: DeadlineStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Anstehende Termine
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {timeRange} Übersicht
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Termin hinzufügen
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Termine durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DeadlineStatus | '')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Alle Status</option>
          <option value="pending">Ausstehend</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="completed">Abgeschlossen</option>
          <option value="cancelled">Storniert</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as DeadlineType | '')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Alle Typen</option>
          <option value="meeting">Meeting</option>
          <option value="task">Aufgabe</option>
          <option value="deadline">Deadline</option>
          <option value="event">Event</option>
        </select>
      </div>

      {/* Deadlines List */}
      <div className="space-y-4">
        {sortedDeadlines.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Keine Termine gefunden
          </div>
        ) : (
          sortedDeadlines.map((deadline) => (
            <motion.div
              key={deadline.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {deadline.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(deadline.priority)}`}>
                      {deadline.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deadline.status)}`}>
                      {deadline.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {deadline.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <i className="ri-calendar-line"></i>
                      <span>{format(parseISO(deadline.date), 'dd.MM.yyyy', { locale: de })}</span>
                    </div>
                    {deadline.time && (
                      <div className="flex items-center space-x-1">
                        <i className="ri-time-line"></i>
                        <span>{deadline.time}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <i className="ri-team-line"></i>
                      <span>{deadline.team}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex -space-x-2">
                      {deadline.assignees.slice(0, 3).map((person: Person, index: number) => (
                        <div
                          key={index}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-red-600 text-white flex items-center justify-center text-xs border-2 border-[#0f172a]"
                        >
                          {person.avatar ? (
                            <img src={person.avatar} alt={person.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            person.name.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                      {deadline.assignees.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs border-2 border-[#0f172a]">
                          +{deadline.assignees.length - 3}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={deadline.status}
                        onChange={(e) => handleStatusChange(deadline.id, e.target.value as DeadlineStatus)}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="pending">Ausstehend</option>
                        <option value="in_progress">In Bearbeitung</option>
                        <option value="completed">Abgeschlossen</option>
                        <option value="cancelled">Storniert</option>
                      </select>
                      <button
                        onClick={() => handleDeleteDeadline(deadline.id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Deadline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Neuen Termin hinzufügen
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titel
                </label>
                <input
                  type="text"
                  value={newDeadline.title}
                  onChange={(e) => setNewDeadline(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Termin-Titel eingeben"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={newDeadline.date}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zeit
                  </label>
                  <input
                    type="time"
                    value={newDeadline.time}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Typ
                  </label>
                  <select
                    value={newDeadline.type}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, type: e.target.value as DeadlineType }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="task">Aufgabe</option>
                    <option value="deadline">Deadline</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priorität
                  </label>
                  <select
                    value={newDeadline.priority}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, priority: e.target.value as DeadlinePriority }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                    <option value="urgent">Dringend</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team
                </label>
                <input
                  type="text"
                  value={newDeadline.team}
                  onChange={(e) => setNewDeadline(prev => ({ ...prev, team: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Team eingeben"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={newDeadline.description}
                  onChange={(e) => setNewDeadline(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-24 resize-none"
                  placeholder="Beschreibung eingeben"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateDeadline}
                disabled={!newDeadline.title || !newDeadline.date}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

UpcomingDeadlines.displayName = 'UpcomingDeadlines';

export default UpcomingDeadlines;