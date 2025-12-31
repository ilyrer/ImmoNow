import React, { useMemo } from 'react';
import { useTasks } from '../../../../api/hooks';
import { useAppointments } from '../../../../hooks/useAppointments';
import { Calendar, Clock } from 'lucide-react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const LoadingState = () => (
  <Card className="h-full">
    <CardHeader>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-32 mt-2" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="p-4 rounded-xl space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </CardContent>
  </Card>
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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Heute & Fälliges</CardTitle>
              <CardDescription>Tasks & Termine in Echtzeit</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20">
            Live aktualisiert
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

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
      </CardContent>
    </Card>
  );
};

export default OpsTodayWidget;

