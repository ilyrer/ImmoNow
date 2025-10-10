import React, { useState, useEffect } from 'react';
import apiClient from '../../../../lib/api/client';

interface CalendarEvent {
  id: number;
  title: string;
  start_date: string;
  end_date?: string;
  type?: string;
  color?: string;
}

const CalendarWidget: React.FC = () => {
  const [currentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        
        // Calculate date range (current month)
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Try to fetch calendar entries or appointments
        try {
          const response = await apiClient.get('/calendar/entries', {
            params: {
              start_date: startOfMonth.toISOString().split('T')[0],
              end_date: endOfMonth.toISOString().split('T')[0]
            }
          });
          
          const entriesData = response.data?.entries || response.data || [];
          setEvents(Array.isArray(entriesData) ? entriesData : []);
        } catch (calendarErr) {
          // Fallback to appointments endpoint
          const appointmentsRes = await apiClient.get('/appointments');
          const appointmentsData = appointmentsRes.data?.appointments || appointmentsRes.data || [];
          setEvents(Array.isArray(appointmentsData) ? appointmentsData : []);
        }
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentDate]);
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getEventColor = (event: CalendarEvent): string => {
    if (event.color) return event.color;
    
    const type = event.type?.toLowerCase() || '';
    if (type.includes('besichtigung') || type.includes('viewing')) return 'blue';
    if (type.includes('meeting') || type.includes('besprechung')) return 'green';
    if (type.includes('deadline') || type.includes('frist')) return 'red';
    if (type.includes('appointment') || type.includes('termin')) return 'purple';
    return 'blue';
  };

  const hasEvent = (day: number) => {
    return events.find(event => {
      const eventDate = new Date(event.start_date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const upcomingEvents = events
    .filter(event => new Date(event.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 2);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <i className="ri-calendar-line mr-2 text-blue-600 dark:text-blue-400"></i>
          Kalender
        </h3>
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Vollansicht
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white text-center">
              {formatMonth(currentDate)}
            </h4>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-xs text-center text-gray-500 dark:text-gray-400 py-2 font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="h-8"></div>
            ))}
            {days.map((day) => {
              const event = hasEvent(day);
              const today = isToday(day);
              const eventColor = event ? getEventColor(event) : 'blue';
              
              return (
                <div
                  key={day}
                  className={`
                    h-8 flex items-center justify-center text-xs rounded cursor-pointer transition-colors
                    ${today 
                      ? 'bg-blue-600 text-white font-bold' 
                      : event
                        ? `bg-${eventColor}-100 dark:bg-${eventColor}-900/30 text-${eventColor}-600 dark:text-${eventColor}-400 font-medium`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  title={event ? event.title : ''}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {upcomingEvents.length > 0 && (
            <div className="mt-4 space-y-2">
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Anstehende Termine:</h5>
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.start_date);
                const color = getEventColor(event);
                
                return (
                  <div key={event.id} className="flex items-center space-x-2 text-xs">
                    <div className={`w-2 h-2 rounded-full bg-${color}-500`}></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {eventDate.getDate()}. - {event.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Live Status */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live-Daten</span>
              </div>
              <span>{events.length} Termine</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarWidget;
