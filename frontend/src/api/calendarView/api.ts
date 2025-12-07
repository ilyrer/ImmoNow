// Uses getDeadlines/getTasks that already call unified apiClient
import {
  CalendarEntry,
  CalendarFilterParams,
  CalendarEntriesResponse
} from './types';

// Importiere Typen und Funktionen aus anderen API-Modulen, um sie zu kombinieren
import { getDeadlines } from '../upcomingDeadlines/api';
import { getTasks } from '../tasksBoard/api';
import { Deadline } from '../upcomingDeadlines/types';
import { Task } from '../tasksBoard/types';

// No direct HTTP calls here; composition of other APIs

/**
 * Holt Kalender-Einträge basierend auf den angegebenen Filterparametern
 */
export const getCalendarEntries = async (params: CalendarFilterParams = {}): Promise<CalendarEntriesResponse> => {
  try {
    // In einer echten API-Implementierung würde dies direkt vom Server kommen
    // Hier verwenden wir einen Client-seitigen Ansatz, der die Daten aus anderen API-Endpunkten kombiniert
    
    // Abhängig vom Filterparameter entscheiden, welche Datentypen geholt werden sollen
    const entryType = params.entryType || 'all';
    
    let deadlines: Deadline[] = [];
    let tasks: Task[] = [];
    
    // Hole Termine, wenn 'all' oder 'deadline' ausgewählt ist
    if (entryType === 'all' || entryType === 'deadline') {
      const deadlinesResponse = await getDeadlines({
        timeRange: params.timeRange,
        fromDate: params.fromDate,
        toDate: params.toDate,
        teamId: params.teamId,
        assigneeId: params.assigneeId,
        searchTerm: params.searchTerm
      });
      deadlines = deadlinesResponse.items;
    }
    
    // Hole Aufgaben, wenn 'all' oder 'task' ausgewählt ist
    if (entryType === 'all' || entryType === 'task') {
      const tasksResponse = await getTasks({
        dateRange: params.timeRange === 'week' ? 'week' : 
                  params.timeRange === 'month' ? 'month' : 'all',
        searchTerm: params.searchTerm
      });
      
      // Flache Liste aus allen Aufgaben aller Status-Kategorien erstellen
      tasks = Object.values(tasksResponse).flat();
    }
    
    // Konvertiere zu einheitlichem CalendarEntry-Format
    const entries: CalendarEntry[] = [
      ...deadlines.map(convertDeadlineToCalendarEntry),
      ...tasks.map(convertTaskToCalendarEntry)
    ];
    
    // Gruppiere nach Datum
    const entriesByDate: { [date: string]: CalendarEntry[] } = {};
    entries.forEach(entry => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = [];
      }
      entriesByDate[entry.date].push(entry);
    });
    
    return {
      entries,
      entriesByDate,
      totalEntries: entries.length
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Kalendereinträge:', error);
    throw error;
  }
};

/**
 * Konvertiert eine Deadline zu einem CalendarEntry
 */
const convertDeadlineToCalendarEntry = (deadline: Deadline): CalendarEntry => {
  // Konvertieren des Datums von DD.MM.YYYY zu YYYY-MM-DD
  const dateParts = deadline.date.split('.');
  const formattedDate = dateParts.length === 3 
    ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
    : new Date().toISOString().split('T')[0];
  
  return {
    id: deadline.id,
    title: deadline.title,
    date: formattedDate,
    time: deadline.time,
    type: deadline.type,
    priority: deadline.priority,
    team: deadline.team,
    assignees: deadline.assignees,
    status: deadline.status,
    entryType: 'deadline'
  };
};

/**
 * Konvertiert eine Task zu einem CalendarEntry
 */
const convertTaskToCalendarEntry = (task: Task): CalendarEntry => {
  // Konvertieren des Datums von DD.MM.YYYY zu YYYY-MM-DD
  const dateParts = task.dueDate.split('.');
  const formattedDate = dateParts.length === 3 
    ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
    : new Date().toISOString().split('T')[0];
  
  return {
    id: task.id,
    title: task.title,
    date: formattedDate,
    type: 'task',
    priority: task.priority,
    assignees: [task.assignee],
    status: task.status,
    description: task.description,
    entryType: 'task'
  };
}; 
