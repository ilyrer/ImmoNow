import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UpcomingDeadlines from './TeamStatusComponents/UpcomingDeadlines';
import CalendarView from './TeamStatusComponents/CalendarView';
import { 
  useAppointments, 
  useEmployees 
} from '../../hooks/useApi';

// Mock Appointment interface
interface Appointment {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  attendees?: string[];
  location?: string;
  type?: string;
}

// Mock useCalendarDay hook
const useCalendarDay = () => {
  return { data: null };
};

// Mock hooks with proper return types
const useCreateAppointment = () => {
  return {
    mutateAsync: async (data: any) => {
      console.log('Mock create appointment:', data);
      return Promise.resolve({ id: '1', ...data });
    }
  };
};

const useUpdateAppointment = () => {
  return {
    mutateAsync: async (data: any) => {
      console.log('Mock update appointment:', data);
      return Promise.resolve({ id: data.id, ...data.appointment });
    }
  };
};

const useDeleteAppointment = () => {
  return {
    mutateAsync: async (id: string) => {
      console.log('Mock delete appointment:', id);
      return Promise.resolve();
    }
  };
};

// Erweiterte Interfaces
interface DeadlinesRefHandle {
  getDeadlines: () => any[];
  openNewDeadlineModal: (date?: Date) => void;
}

interface CalendarRefHandle {
  getSelectedDate: () => Date | null;
  setSelectedDate: (date: Date) => void;
}

type DeadlineTimeRange = 'today' | 'week' | 'month' | 'all';

const TermineCalendarPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'calendar' | 'deadlines'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Refs für Child Components
  const deadlinesRef = useRef<DeadlinesRefHandle>(null);
  const calendarRef = useRef<CalendarRefHandle>(null);
  
  // API Hooks
  const { data: appointmentsData, isLoading: appointmentsLoading, error: appointmentsError } = useAppointments();
  const { data: employeesData } = useEmployees();
  const { data: calendarDay } = useCalendarDay();
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();

  // Form State für neue/editing Appointments
  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    attendees: [] as string[],
    location: '',
    type: 'meeting'
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!showAppointmentModal) {
      setAppointmentForm({
        title: '',
        start: '',
        end: '',
        description: '',
        attendees: [],
        location: '',
        type: 'meeting'
      });
      setEditingAppointment(null);
    }
  }, [showAppointmentModal]);

  // Set form data when editing
  useEffect(() => {
    if (editingAppointment) {
      setAppointmentForm({
        title: editingAppointment.title,
        start: editingAppointment.start,
        end: editingAppointment.end,
        description: editingAppointment.description || '',
        attendees: editingAppointment.attendees || [],
        location: editingAppointment.location || '',
        type: editingAppointment.type || 'meeting'
      });
    }
  }, [editingAppointment]);

  const handleCreateAppointment = async () => {
    if (!appointmentForm.title || !appointmentForm.start || !appointmentForm.end) return;
    
    try {
      await createAppointmentMutation.mutateAsync({
        title: appointmentForm.title,
        start: appointmentForm.start,
        end: appointmentForm.end,
        description: appointmentForm.description,
        attendees: appointmentForm.attendees,
        location: appointmentForm.location,
        type: appointmentForm.type
      });
      
      setShowAppointmentModal(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !appointmentForm.title || !appointmentForm.start || !appointmentForm.end) return;
    
    try {
      await updateAppointmentMutation.mutateAsync({
        id: editingAppointment.id,
        appointment: {
          title: appointmentForm.title,
          start: appointmentForm.start,
          end: appointmentForm.end,
          description: appointmentForm.description,
          attendees: appointmentForm.attendees,
          location: appointmentForm.location,
          type: appointmentForm.type
        }
      });
      
      setShowAppointmentModal(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointmentMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (calendarRef.current) {
      calendarRef.current.setSelectedDate(date);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleNewAppointment = (date?: Date) => {
    if (date) {
      setAppointmentForm(prev => ({
        ...prev,
        start: date.toISOString(),
        end: new Date(date.getTime() + 60 * 60 * 1000).toISOString() // +1 hour
      }));
    }
    setShowAppointmentModal(true);
  };

  const appointments = appointmentsData || [];
  const employees = employeesData || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Termine & Kalender
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Verwalten Sie Ihre Termine und Deadlines
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'calendar'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Kalender
                </button>
                <button
                  onClick={() => setCurrentView('deadlines')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'deadlines'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Deadlines
                </button>
              </div>
              
              <button
                onClick={() => handleNewAppointment()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="ri-add-line mr-2"></i>
                Neuer Termin
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {currentView === 'calendar' ? (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <CalendarView
                  {...{
                    appointments,
                    selectedDate,
                    onDateSelect: handleDateSelect,
                    onAppointmentClick: handleAppointmentClick,
                    onNewAppointment: handleNewAppointment,
                    onDeleteAppointment: handleDeleteAppointment
                  } as any}
                />
              </motion.div>
            ) : (
              <motion.div
                key="deadlines"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <UpcomingDeadlines
                  ref={deadlinesRef}
                  timeRange={"all" as any}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Appointment Modal */}
        <AnimatePresence>
          {showAppointmentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {editingAppointment ? 'Termin bearbeiten' : 'Neuen Termin erstellen'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Titel
                    </label>
                    <input
                      type="text"
                      value={appointmentForm.title}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Termin-Titel eingeben"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start
                      </label>
                      <input
                        type="datetime-local"
                        value={appointmentForm.start}
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ende
                      </label>
                      <input
                        type="datetime-local"
                        value={appointmentForm.end}
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Beschreibung
                    </label>
                    <textarea
                      value={appointmentForm.description}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-24 resize-none"
                      placeholder="Beschreibung eingeben"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ort
                    </label>
                    <input
                      type="text"
                      value={appointmentForm.location}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ort eingeben"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Typ
                    </label>
                    <select
                      value={appointmentForm.type}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="appointment">Termin</option>
                      <option value="event">Event</option>
                      <option value="deadline">Deadline</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAppointmentModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}
                    disabled={!appointmentForm.title || !appointmentForm.start || !appointmentForm.end}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingAppointment ? 'Aktualisieren' : 'Erstellen'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TermineCalendarPage;