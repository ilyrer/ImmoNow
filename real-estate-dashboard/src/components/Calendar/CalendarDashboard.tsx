import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Filter,
  Search,
  MapPin,
  Users,
  Eye,
  Phone,
  Video,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { 
  useAppointments, 
  useCreateAppointment, 
  useUpdateAppointment,
  useDeleteAppointment 
} from '../../hooks/useAppointments';
import { AppointmentResponse } from '../../lib/api/types';

const CalendarDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get date range based on view mode
  const getDateRange = () => {
    const today = new Date();
    let startDate = new Date(today);
    let endDate = new Date(today);

    if (viewMode === 'week') {
      const dayOfWeek = today.getDay();
      startDate.setDate(today.getDate() - dayOfWeek);
      endDate.setDate(startDate.getDate() + 6);
    } else if (viewMode === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };
  };

  // API Hooks
  const { data: appointments, isLoading: appointmentsLoading, error: appointmentsError } = useAppointments(getDateRange());
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();

  // Filter and search appointments
  const filteredAppointments = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) {
      return [];
    }

    return appointments.filter(appointment => {
      // Filter by type
      if (filterType !== 'all' && appointment.type !== filterType) {
        return false;
      }

      // Filter by search term
      if (searchTerm && !appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !appointment.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !appointment.location?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [appointments, filterType, searchTerm]);

  // Get today's appointments
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = filteredAppointments.filter(apt => 
    (apt.start_datetime || '').startsWith(today)
  );

  // Calculate stats
  const totalAppointments = appointments?.length || 0;
  const confirmedAppointments = appointments?.filter(apt => apt.status === 'confirmed').length || 0;
  const pendingAppointments = appointments?.filter(apt => apt.status === 'draft').length || 0;
  const completedAppointments = appointments?.filter(apt => apt.status === 'completed').length || 0;

  // Debug logging
  console.log('📅 CalendarDashboard - Debug Info:', {
    appointments,
    filteredAppointments,
    appointmentsLoading,
    appointmentsError,
    dateRange: getDateRange()
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'no_show': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Bestätigt';
      case 'draft': return 'Entwurf';
      case 'cancelled': return 'Abgesagt';
      case 'completed': return 'Abgeschlossen';
      case 'no_show': return 'Nicht erschienen';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'viewing': return <Eye className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'consultation': return <Video className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'viewing': return 'bg-blue-500';
      case 'call': return 'bg-green-500';
      case 'meeting': return 'bg-purple-500';
      case 'consultation': return 'bg-orange-500';
      case 'signing': return 'bg-red-500';
      case 'inspection': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'viewing': return 'Besichtigung';
      case 'call': return 'Anruf';
      case 'meeting': return 'Meeting';
      case 'consultation': return 'Beratung';
      case 'signing': return 'Vertragsunterzeichnung';
      case 'inspection': return 'Inspektion';
      default: return type;
    }
  };

  const StatsCard = ({ title, value, icon, color, description }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  const AppointmentCard = ({ appointment }: { appointment: AppointmentResponse }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer group"
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
      <div className={`p-3 rounded-lg ${getTypeColor(appointment.type || 'other')} shadow-lg`}>
            <div className="text-white">
        {getTypeIcon(appointment.type || 'other')}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {appointment.title}
            </h3>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(appointment.start_datetime || '').toLocaleTimeString('de-DE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} - {new Date(appointment.end_datetime || '').toLocaleTimeString('de-DE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              
              {appointment.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate max-w-32">{appointment.location}</span>
                </div>
              )}
            </div>

            {appointment.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                {appointment.description}
              </p>
            )}

            {appointment.attendees && appointment.attendees.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Teilnehmer:</p>
                <div className="flex flex-wrap gap-2">
                  {appointment.attendees.slice(0, 3).map((attendee: any, index: number) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                    >
                      {attendee.name}
                    </span>
                  ))}
                  {appointment.attendees.length > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                      +{appointment.attendees.length - 3} mehr
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
            {getStatusLabel(appointment.status)}
          </span>
          
          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
            {getTypeLabel(appointment.type || 'other')}
          </span>
        </div>
      </div>

      {appointment.property_title && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
            <i className="ri-home-4-line mr-2"></i>
            Immobilie: {appointment.property_title}
          </p>
        </div>
      )}
    </motion.div>
  );

  // Show loading state
  if (appointmentsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Termine werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (appointmentsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-700 dark:text-red-300 mb-2">
            Fehler beim Laden der Termine
          </h3>
          <p className="text-red-600 dark:text-red-400">
            {appointmentsError.message || 'Es ist ein unbekannter Fehler aufgetreten'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📅 Terminplaner
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verwalten Sie Ihre Termine und Meetings
          </p>
        </div>
        <button
          onClick={() => {}}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Neuer Termin</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Gesamt Termine"
          value={totalAppointments}
          icon={<Calendar className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        
        <StatsCard
          title="Bestätigte Termine"
          value={confirmedAppointments}
          icon={<CheckCircle className="h-6 w-6 text-white" />}
          color="bg-green-500"
          description={`${totalAppointments > 0 ? Math.round((confirmedAppointments / totalAppointments) * 100) : 0}% bestätigt`}
        />
        
        <StatsCard
          title="Ausstehend"
          value={pendingAppointments}
          icon={<AlertCircle className="h-6 w-6 text-white" />}
          color="bg-yellow-500"
          description="Benötigen Bestätigung"
        />
        
        <StatsCard
          title="Heute"
          value={todayAppointments.length}
          icon={<Clock className="h-6 w-6 text-white" />}
          color="bg-purple-500"
          description="Heutige Termine"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Termine durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['today', 'week', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {mode === 'today' ? 'Heute' : mode === 'week' ? 'Woche' : 'Monat'}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Alle Typen</option>
                <option value="viewing">Besichtigungen</option>
                <option value="meeting">Meetings</option>
                <option value="call">Anrufe</option>
                <option value="consultation">Beratungen</option>
                <option value="signing">Vertragsunterzeichnungen</option>
                <option value="inspection">Inspektionen</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredAppointments.length} von {totalAppointments} Terminen angezeigt
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredAppointments
              .sort((a, b) => new Date(a.start_datetime || '').getTime() - new Date(b.start_datetime || '').getTime())
              .map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {filterType !== 'all' || searchTerm ? 'Keine passenden Termine gefunden' : 'Keine Termine derzeit'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filterType !== 'all' || searchTerm ? 
              'Versuchen Sie andere Filter-Optionen oder Suchbegriffe.' :
              'Es sind noch keine Termine vom Backend verfügbar.'
            }
          </p>
          {(!filterType || filterType === 'all') && !searchTerm && (
            <button
              onClick={() => {
                // Create appointment handler
                console.log('Create new appointment');
              }}
              className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Ersten Termin erstellen
            </button>
          )}
        </div>
      )}

      {/* Live Status */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <motion.div 
          className="w-2 h-2 bg-green-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span>Live-Daten • Letzte Aktualisierung: {new Date().toLocaleTimeString('de-DE')}</span>
      </div>
    </div>
  );
};

export default CalendarDashboard; 
