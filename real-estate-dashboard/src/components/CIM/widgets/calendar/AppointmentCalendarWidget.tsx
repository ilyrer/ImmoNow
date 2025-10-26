import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, MapPin, User } from 'lucide-react';

interface AppointmentData {
  todayAppointments: Array<{
    id: string;
    title: string;
    time: string;
    type: string;
    location?: string;
    attendees: number;
  }>;
  upcomingAppointments: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    type: string;
  }>;
  totalToday: number;
  totalUpcoming: number;
}

const AppointmentCalendarWidget: React.FC = () => {
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch appointments
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/v1/appointments?start_date=${today}&size=10`);
        const data = await response.json();

        console.log('📊 Appointments Response:', data);

        const appointments = data.appointments || [];
        const todayAppointments = appointments.filter((apt: any) => 
          apt.start_datetime && apt.start_datetime.startsWith(today)
        );
        const upcomingAppointments = appointments.filter((apt: any) => 
          apt.start_datetime && !apt.start_datetime.startsWith(today)
        );

        setAppointmentData({
          todayAppointments: todayAppointments.map((apt: any) => ({
            id: apt.id || '',
            title: apt.title || 'Unbekannter Termin',
            time: apt.start_datetime ? new Date(apt.start_datetime).toLocaleTimeString('de-DE', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : 'Unbekannt',
            type: apt.type || 'meeting',
            location: apt.location,
            attendees: apt.attendees?.length || 0
          })),
          upcomingAppointments: upcomingAppointments.slice(0, 5).map((apt: any) => ({
            id: apt.id || '',
            title: apt.title || 'Unbekannter Termin',
            date: apt.start_datetime ? new Date(apt.start_datetime).toLocaleDateString('de-DE') : 'Unbekannt',
            time: apt.start_datetime ? new Date(apt.start_datetime).toLocaleTimeString('de-DE', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : 'Unbekannt',
            type: apt.type || 'meeting'
          })),
          totalToday: todayAppointments.length,
          totalUpcoming: upcomingAppointments.length
        });

      } catch (error) {
        console.error('❌ Error fetching appointment data:', error);
        // Fallback data
        setAppointmentData({
          todayAppointments: [],
          upcomingAppointments: [],
          totalToday: 0,
          totalUpcoming: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointmentData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAppointmentData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt Termine...</p>
        </div>
      </div>
    );
  }

  if (!appointmentData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Keine Termine verfügbar</p>
        </div>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'besichtigung':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      case 'meeting':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200';
      case 'termin':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'besichtigung':
        return <MapPin className="w-3 h-3" />;
      case 'meeting':
        return <User className="w-3 h-3" />;
      default:
        return <Calendar className="w-3 h-3" />;
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Termine
        </h3>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {appointmentData.totalToday} heute
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {appointmentData.totalUpcoming} kommende
          </div>
        </div>
      </div>

      {/* Heutige Termine */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Heute
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('de-DE')}
          </span>
        </div>
        
        <div className="space-y-2">
          {appointmentData.todayAppointments.length > 0 ? (
            appointmentData.todayAppointments.slice(0, 3).map((appointment, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}>
                      {getTypeIcon(appointment.type)}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {appointment.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {appointment.time}
                  </span>
                </div>
                {appointment.location && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{appointment.location}</span>
                  </div>
                )}
                {appointment.attendees > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{appointment.attendees} Teilnehmer</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Keine Termine heute</p>
            </div>
          )}
        </div>
      </div>

      {/* Kommende Termine */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Kommende Termine
          </h4>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Alle anzeigen
          </button>
        </div>
        
        <div className="space-y-2">
          {appointmentData.upcomingAppointments.length > 0 ? (
            appointmentData.upcomingAppointments.map((appointment, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}>
                    {getTypeIcon(appointment.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {appointment.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {appointment.date} • {appointment.time}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Keine kommenden Termine</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Plus className="w-3 h-3" />
          <span>Neuer Termin</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Calendar className="w-3 h-3" />
          <span>Kalender</span>
        </button>
      </div>
    </div>
  );
};

export default AppointmentCalendarWidget;
