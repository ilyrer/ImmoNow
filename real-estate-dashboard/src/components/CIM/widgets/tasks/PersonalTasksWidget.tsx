import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../../../contexts/UserContext';
import apiService from '../../../../services/api.service';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  type: 'besichtigung' | 'anruf' | 'dokument' | 'follow_up' | 'cim_measure';
  propertyId?: string;
  propertyTitle?: string;
}

const PersonalTasksWidget: React.FC = () => {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue'>('all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const params: any = {};
        if (filter === 'overdue') params.is_overdue = true;
        if (filter === 'today') {
          params.due_date_from = todayStr;
          params.due_date_to = todayStr;
        }
        const res = await apiService.getTasks(params);
        if (!mounted) return;
        const items = Array.isArray(res?.tasks) ? res.tasks : Array.isArray(res) ? res : [];
        const mapped = items.map((t: any) => {
          const raw = t.due_date || t.deadline;
          // Normalize to YYYY-MM-DD
          let deadline = todayStr;
          if (raw) {
            try {
              const d = new Date(raw);
              if (!Number.isNaN(d.getTime())) {
                deadline = d.toISOString().split('T')[0];
              }
            } catch {}
          }
          // Map backend statuses to widget statuses
          const rawStatus = (t.status || '').toString();
          const status: Task['status'] = rawStatus === 'done' ? 'completed' : (rawStatus === 'in_progress' ? 'in_progress' : 'pending');
          return {
            id: String(t.id),
            title: t.title || t.name || 'Aufgabe',
            description: t.description || '',
            priority: (t.priority === 'urgent' ? 'high' : (t.priority || 'medium')) as Task['priority'],
            deadline,
            status,
            type: 'follow_up' as Task['type'],
            propertyId: t.related_property || t.property_id ? String(t.related_property || t.property_id) : undefined,
            propertyTitle: t.related_property_title || t.property?.title,
          } as Task;
        });
        setTasks(mapped);
      } catch (e) {
        setTasks([]);
      }
    })();
    return () => { mounted = false; };
  }, [filter]);

  const getFilteredTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        return tasks.filter(task => task.deadline === today && task.status !== 'completed');
      case 'overdue':
        return tasks.filter(task => task.deadline < today && task.status !== 'completed');
      default:
        return tasks.filter(task => task.status !== 'completed');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'besichtigung': return 'ri-home-4-line';
      case 'anruf': return 'ri-phone-line';
      case 'dokument': return 'ri-file-text-line';
      case 'follow_up': return 'ri-mail-line';
      case 'cim_measure': return 'ri-refresh-line';
      default: return 'ri-task-line';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'besichtigung': return 'text-blue-600 dark:text-blue-400';
      case 'anruf': return 'text-green-600 dark:text-green-400';
      case 'dokument': return 'text-purple-600 dark:text-purple-400';
      case 'follow_up': return 'text-orange-600 dark:text-orange-400';
      case 'cim_measure': return 'text-indigo-600 dark:text-indigo-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const markAsCompleted = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'completed' as const } : task
    ));
  };

  const filteredTasks = getFilteredTasks();
  const overdueCount = tasks.filter(t => t.deadline < new Date().toISOString().split('T')[0] && t.status !== 'completed').length;
  const todayCount = tasks.filter(t => t.deadline === new Date().toISOString().split('T')[0] && t.status !== 'completed').length;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <i className="ri-task-line mr-2 text-blue-600 dark:text-blue-400"></i>
          Meine Aufgaben
          {overdueCount > 0 && (
            <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">
              {overdueCount}
            </span>
          )}
        </h3>
        <Link
          to="/aufgaben"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Alle anzeigen
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { key: 'all', label: 'Alle', count: tasks.filter(t => t.status !== 'completed').length },
          { key: 'today', label: 'Heute', count: todayCount },
          { key: 'overdue', label: 'Überfällig', count: overdueCount }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              filter === tab.key
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                tab.key === 'overdue' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-check-double-line text-4xl text-green-500 dark:text-green-400 mb-4"></i>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Alle Aufgaben erledigt!
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'today' ? 'Keine Aufgaben für heute.' : 
               filter === 'overdue' ? 'Keine überfälligen Aufgaben.' : 
               'Keine offenen Aufgaben vorhanden.'}
            </p>
          </div>
        ) : (
          filteredTasks.slice(0, 5).map((task) => {
            const isOverdue = task.deadline < new Date().toISOString().split('T')[0];
            const isToday = task.deadline === new Date().toISOString().split('T')[0];
            
            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                  isOverdue 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
                    : isToday
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50'
                    : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isOverdue ? 'bg-red-100 dark:bg-red-900/30' :
                      isToday ? 'bg-blue-100 dark:bg-blue-900/30' :
                      'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <i className={`${getTypeIcon(task.type)} ${getTypeColor(task.type)} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {task.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {task.description}
                      </p>
                      {task.propertyTitle && (
                        <Link
                          to={`/immobilien/${task.propertyId}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                        >
                          <i className="ri-home-4-line mr-1"></i>
                          {task.propertyTitle}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                    <button
                      onClick={() => markAsCompleted(task.id)}
                      className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      title="Als erledigt markieren"
                    >
                      <i className="ri-check-line text-xs"></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className={`font-medium ${
                    isOverdue ? 'text-red-600 dark:text-red-400' :
                    isToday ? 'text-blue-600 dark:text-blue-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    <i className="ri-calendar-line mr-1"></i>
                    {isOverdue ? 'Überfällig' : isToday ? 'Heute' : new Date(task.deadline).toLocaleDateString('de-DE')}
                  </span>
                  <span className="capitalize">
                    {task.status === 'in_progress' ? 'In Bearbeitung' : 'Offen'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {filteredTasks.length > 5 && (
        <div className="mt-4 text-center">
          <Link
            to="/aufgaben"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {filteredTasks.length - 5} weitere Aufgaben anzeigen
          </Link>
        </div>
      )}
    </div>
  );
};

export default PersonalTasksWidget; 
