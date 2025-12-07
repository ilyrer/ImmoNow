import React, { useState, useEffect, ReactElement } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { 
  CalendarEntry, 
  CalendarFilterParams, 
  CalendarTimeRange, 
  getCalendarEntries 
} from '../../../api';

// Definiere Typen für die Eingabedaten, die nur in der Komponente verwendet werden
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'hoch' | 'mittel' | 'niedrig';
  assignee: {
    name: string;
    avatar: string;
  };
  dueDate: string;
  comments?: number;
}

interface TaskBoard {
  [key: string]: Task[];
}

interface Deadline {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'task' | 'meeting' | 'milestone' | 'other';
  priority: 'high' | 'medium' | 'low';
  team: string;
  assignees: {
    name: string;
    avatar: string;
  }[];
  status: 'upcoming' | 'today' | 'overdue' | 'completed';
}

interface CalendarViewProps {
  timeRange: CalendarTimeRange;
  teamFilter?: string;
  onDayDoubleClick?: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  timeRange,
  teamFilter,
  onDayDoubleClick
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [entriesByDate, setEntriesByDate] = useState<{[date: string]: CalendarEntry[]}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Animation-Varianten
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };
  
  // Daten aus der API abrufen
  useEffect(() => {
    const fetchCalendarEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: CalendarFilterParams = {
          timeRange,
          viewMode,
          ...(teamFilter && { teamId: teamFilter })
        };
        
        // API-Aufruf
        const response = await getCalendarEntries(params);
        
        // Daten in State speichern
        setCalendarEntries(response.entries);
        setEntriesByDate(response.entriesByDate);
      } catch (err) {
        console.error('Fehler beim Abrufen der Kalendereinträge:', err);
        setError('Fehler beim Laden der Kalendereinträge. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarEntries();
  }, [timeRange, teamFilter, viewMode]);

  // Hilfsfunktionen für die Kalenderberechnung
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigationshelfer
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToPreviousWeek = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Hilfsfunktion für die Prioritätsfarbgebung
  const getPriorityColor = (priority: string) => {
    if (priority === 'high' || priority === 'hoch') {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
    } else if (priority === 'medium' || priority === 'mittel') {
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    } else {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  // Hilfsfunktion für die Typicons
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return 'ri-task-line';
      case 'meeting':
        return 'ri-team-line';
      case 'milestone':
        return 'ri-flag-line';
      default:
        return 'ri-calendar-event-line';
    }
  };

  // Hilfsfunktion zur Formatierung des Datums
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('de-DE', options);
  };

  // Hilfsfunktion zum Konvertieren des Datumsformats
  const convertDateFormat = (dateString: string, toFormat: 'display' | 'iso'): string => {
    if (toFormat === 'display') {
      // Konvertiere von ISO (YYYY-MM-DD) zu Display (DD.MM.YYYY)
      const [year, month, day] = dateString.split('-');
      return `${day}.${month}.${year}`;
    } else {
      // Konvertiere von Display (DD.MM.YYYY) zu ISO (YYYY-MM-DD)
      const [day, month, year] = dateString.split('.');
      return `${year}-${month}-${day}`;
    }
  };

  // Funktion zum Rendern eines Kalendereintrags
  const renderCalendarEntry = (entry: CalendarEntry) => {
    return (
      <div 
        key={entry.id}
        className={`p-1 my-1 rounded-md text-xs border-l-2 ${getPriorityColor(entry.priority)} hover:shadow-md transition-shadow cursor-pointer`}
        onClick={() => {
          // Hier können wir später eine Detailansicht hinzufügen
          console.log('Entry clicked:', entry);
        }}
      >
        <div className="flex items-center gap-1">
          <i className={`${getTypeIcon(entry.type)} text-xs`}></i>
          <span className="font-medium truncate">{entry.title}</span>
        </div>
        {entry.time && (
          <div className="text-gray-500 dark:text-gray-400 text-xs flex items-center mt-0.5">
            <i className="ri-time-line mr-1 text-xs"></i>
            {entry.time}
          </div>
        )}
      </div>
    );
  };

  // Monatskalender rendern
  const renderMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Tage der Woche (angepasst für deutsche Lokalisierung, Montag als erster Tag)
    const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    // Erstelle das Raster für den Kalender
    const calendarGrid: ReactElement[] = [];
    
    // Füge Kopfzeile mit Wochentagen hinzu
    calendarGrid.push(
      <div key="header" className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700/30 rounded-t-lg">
        {weekdays.map(day => (
          <div 
            key={day} 
            className="text-center p-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {day}
          </div>
        ))}
      </div>
    );
    
    // Erstelle die Tage für das Kalenderraster
    let days: ReactElement[] = [];
    let dayCount = 1;
    
    // Anpassung für europäischen Kalender (Montag ist erster Tag, d.h. 0)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // Leere Zellen für Tage vor Monatsbeginn
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          className="p-1 min-h-[80px] bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-700"
        ></div>
      );
    }
    
    // Fülle Tage des Monats
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const dateString = dayDate.toISOString().split('T')[0];
      
      // Filtere Einträge für diesen Tag
      const entriesForDay = calendarEntries.filter(entry => entry.date === dateString);
      
      // Bestimme, ob dies der heutige Tag ist
      const isToday = 
        dayDate.getDate() === new Date().getDate() && 
        dayDate.getMonth() === new Date().getMonth() && 
        dayDate.getFullYear() === new Date().getFullYear();
      
      days.push(
        <div 
          key={`day-${i}`} 
          className={`min-h-[80px] p-1 border border-gray-100 dark:border-gray-700 ${
            isToday ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 
            'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30'
          } cursor-pointer`}
          onDoubleClick={() => handleDayDoubleClick(dayDate)}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-indigo-800 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
              {i}
            </span>
            {entriesForDay.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 rounded-full">
                {entriesForDay.length}
              </span>
            )}
          </div>
          <div className="overflow-y-auto max-h-[60px]">
            {entriesForDay.slice(0, 3).map(entry => renderCalendarEntry(entry))}
            {entriesForDay.length > 3 && (
              <div className="text-xs text-indigo-600 dark:text-indigo-400 text-center mt-1">
                + {entriesForDay.length - 3} weitere
              </div>
            )}
          </div>
        </div>
      );
      
      dayCount++;
    }
    
    // Leere Zellen für Tage nach Monatsende
    const totalCells = Math.ceil((adjustedFirstDay + daysInMonth) / 7) * 7;
    for (let i = days.length; i < totalCells; i++) {
      days.push(
        <div 
          key={`empty-end-${i}`} 
          className="p-1 min-h-[80px] bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-700"
        ></div>
      );
    }
    
    // Teile die Tage in Wochen auf
    const weeks: ReactElement[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(
        <div key={`week-${i}`} className="grid grid-cols-7">
          {days.slice(i, i + 7)}
        </div>
      );
    }
    
    calendarGrid.push(...weeks);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        {calendarGrid}
      </div>
    );
  };

  // Wochenkalender rendern
  const renderWeekCalendar = () => {
    // Berechne den aktuellen Wochenanfang (Montag)
    const currentDay = currentDate.getDay();
    const diff = currentDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1);
    const monday = new Date(currentDate);
    monday.setDate(diff);
    
    const weekDays: ReactElement[] = [];
    const weekDaysFull = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    
    // Für jeden Tag der Woche
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      
      // Formatiertes Datum für Eintragsfilterung
      const dateString = day.toISOString().split('T')[0];
      
      // Einträge für diesen Tag
      const entriesForDay = calendarEntries.filter(entry => entry.date === dateString);
      
      // Überprüfen, ob dies der heutige Tag ist
      const isToday = 
        day.getDate() === new Date().getDate() && 
        day.getMonth() === new Date().getMonth() && 
        day.getFullYear() === new Date().getFullYear();
      
      weekDays.push(
        <div 
          key={`weekday-${i}`} 
          className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
            isToday ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''
          } cursor-pointer`}
          onDoubleClick={() => handleDayDoubleClick(day)}
        >
          <div className={`p-3 ${
            isToday 
              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300' 
              : 'bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300'
          }`}>
            <h3 className="font-medium">{weekDaysFull[i]}</h3>
            <div className="flex items-center text-sm">
              <span className="font-semibold">{day.getDate()}.</span>
              <span className="ml-1">{day.toLocaleDateString('de-DE', { month: 'long' })}</span>
            </div>
          </div>
          
          <div className="p-2 space-y-1 min-h-[150px] max-h-[300px] overflow-y-auto">
            {entriesForDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-400 dark:text-gray-500">
                <i className="ri-calendar-line text-2xl mb-2"></i>
                <p className="text-xs">Keine Einträge</p>
                <p className="text-xs mt-1">Doppelklick zum Erstellen</p>
              </div>
            ) : (
              entriesForDay.map(entry => renderCalendarEntry(entry))
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays}
      </div>
    );
  };

  // Handler für Doppelklick auf einen Tag
  const handleDayDoubleClick = (date: Date) => {
    if (onDayDoubleClick) {
      onDayDoubleClick(date);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Kalenderansicht
        </h2>
        <div className="flex items-center space-x-4">
          {/* Monat/Woche Umschalter */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'month' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setViewMode('month')}
            >
              Monat
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setViewMode('week')}
            >
              Woche
            </button>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={viewMode === 'month' ? goToPreviousMonth : goToPreviousWeek}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <i className="ri-arrow-left-s-line text-xl"></i>
            </button>
            <button 
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
            >
              Heute
            </button>
            <button 
              onClick={viewMode === 'month' ? goToNextMonth : goToNextWeek}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <i className="ri-arrow-right-s-line text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Kalenderansicht */}
      <div className="mt-4">
        {viewMode === 'month' ? renderMonthCalendar() : renderWeekCalendar()}
      </div>
    </motion.div>
  );
};

export default CalendarView; 
