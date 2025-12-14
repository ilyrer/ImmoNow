import React, { useMemo } from 'react';
import { useTasks } from '../../../../api/hooks';
import { useAppointments } from '../../../../hooks/useAppointments';
import { Calendar, Clock } from 'lucide-react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

const LoadingState = () => (
  <div className="p-6 h-full flex flex-col space-y-4">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="glass p-4 rounded-xl animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
  </div>
);

const OpsTodayWidget: React.FC = () => {
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ page: 1, size: 50, sort_by: 'due_date', sort_order: 'asc' });
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments();

  const tasks = tasksData?.items ?? [];
  const isLoading = tasksLoading || appointmentsLoading;

  const metrics = useMemo(() => {
    const today = startOfDay(new Date());
    const dueToday = tasks.filter((t) => t.due_date && isToday(new Date(t.due_date))).length;
    const overdue = tasks.filter((t) => t.due_date && isBefore(new Date(t.due_date), today) && t.status !== 'done').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    return { dueToday, overdue, done };
  }, [tasks]);

  const todayAppointments = useMemo(
    () => (appointments || []).filter((a) => (a.start_datetime || a.start_date) && isToday(new Date(a.start_datetime || a.start_date))),
    [appointments]
  );

  if (isLoading) return <LoadingState />;

  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Heute & Fälliges</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tasks & Termine in Echtzeit</p>
          </div>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
          Live aktualisiert
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fällig heute</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.dueToday}</div>
          <div className="text-xs text-blue-500 dark:text-blue-300">Priorisieren</div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Überfällig</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.overdue}</div>
          <div className="w-full bg-gray-200/60 dark:bg-gray-700/60 rounded-full h-2 mt-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
              style={{ width: `${Math.min(100, (metrics.overdue / Math.max(1, tasks.length)) * 100)}%` }}
            />
          </div>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Abgeschlossen</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.done}</div>
          <div className="text-xs text-green-500 dark:text-green-300">Team Output</div>
        </div>
      </div>

      <div className="glass rounded-xl p-4 flex-1 min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Termine heute</p>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{todayAppointments.length} Einträge</span>
        </div>
        {todayAppointments.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">Keine Termine für heute</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {todayAppointments.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/40 dark:bg-gray-800/60 border border-white/30 dark:border-gray-700/50">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{appt.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(appt.start_datetime || appt.start_date), 'HH:mm', { locale: de })} • {appt.location || 'Ort folgt'}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
                  {appt.status || 'geplant'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpsTodayWidget;

