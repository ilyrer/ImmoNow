/**
 * AttendanceTab
 * Anwesenheitsverfolgung mit Check-in/out
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Play,
  Square,
  Filter,
  Search,
  RefreshCw,
  Timer,
  Coffee,
  Home
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, LoadingSpinner } from '../admin/GlassUI';
import { 
  useAttendance, 
  useRecordAttendance 
} from '../../api/hrHooks';
import type { 
  AttendanceCreate, 
  AttendanceResponse 
} from '../../types/hr';

interface AttendanceTabProps {
  employeeId: string;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ employeeId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    data: attendanceData, 
    isLoading, 
    error,
    refetch 
  } = useAttendance({
    employee_id: employeeId,
    start_date: new Date(filterYear, filterMonth, 1).toISOString().split('T')[0],
    end_date: new Date(filterYear, filterMonth + 1, 0).toISOString().split('T')[0]
  });

  const recordAttendanceMutation = useRecordAttendance();

  const attendanceRecords = attendanceData?.items || [];
  const todayRecord = attendanceRecords.find(record => {
    const recordDate = new Date(record.date);
    const today = new Date();
    return recordDate.toDateString() === today.toDateString();
  });

  // Prüfe Check-in Status beim Laden
  useEffect(() => {
    if (todayRecord) {
      setIsCheckedIn(!!todayRecord.check_in && !todayRecord.check_out);
    }
  }, [todayRecord]);

  const handleCheckIn = async () => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const attendanceData: AttendanceCreate = {
      date: now.toISOString().split('T')[0],
      check_in: timeString,
      location: currentLocation || 'Büro',
      notes: notes || undefined
    };

    try {
      await recordAttendanceMutation.mutateAsync(attendanceData);
      setIsCheckedIn(true);
      setNotes('');
      refetch();
    } catch (error) {
      console.error('Fehler beim Check-in:', error);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const attendanceData: AttendanceCreate = {
      date: todayRecord.date,
      check_in: todayRecord.check_in,
      check_out: timeString,
      location: todayRecord.location || 'Büro',
      notes: notes || todayRecord.notes || undefined
    };

    try {
      await recordAttendanceMutation.mutateAsync(attendanceData);
      setIsCheckedIn(false);
      setNotes('');
      refetch();
    } catch (error) {
      console.error('Fehler beim Check-out:', error);
    }
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const calculateWorkingHours = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return '0:00';
    
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    
    const totalMinutes = outMinutes - inMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getTotalWorkingHours = () => {
    return attendanceRecords.reduce((total, record) => {
      if (record.check_in && record.check_out) {
        const hours = calculateWorkingHours(record.check_in, record.check_out);
        const [h, m] = hours.split(':').map(Number);
        return total + h + m / 60;
      }
      return total;
    }, 0);
  };

  const getAverageWorkingHours = () => {
    const workingDays = attendanceRecords.filter(r => r.check_in && r.check_out).length;
    return workingDays > 0 ? getTotalWorkingHours() / workingDays : 0;
  };

  const getAttendanceStats = () => {
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.check_in).length;
    const fullDays = attendanceRecords.filter(r => r.check_in && r.check_out).length;
    
    return {
      totalDays,
      presentDays,
      fullDays,
      attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    };
  };

  const stats = getAttendanceStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Fehler beim Laden der Anwesenheitsdaten
        </h3>
        <p className="text-gray-600">
          Die Anwesenheitsdaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Clock className="w-6 h-6 mr-2" />
            Anwesenheitsverfolgung
          </h2>
          <p className="text-gray-600 mt-1">
            Check-in/out und Arbeitszeiterfassung
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <GlassButton 
            variant="secondary" 
            className="flex items-center"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Aktualisieren
          </GlassButton>
        </div>
      </div>

      {/* Check-in/out Bereich */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Status und Aktionen */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Timer className="w-5 h-5 mr-2" />
              Heute
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  isCheckedIn ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className="font-medium">
                  {isCheckedIn ? 'Eingestempelt' : 'Ausgestempelt'}
                </span>
              </div>
              
              {todayRecord && (
                <div className="text-sm text-gray-600">
                  {todayRecord.check_in && (
                    <span>Eingestempelt: {formatTime(todayRecord.check_in)}</span>
                  )}
                  {todayRecord.check_out && (
                    <span className="ml-4">Ausgestempelt: {formatTime(todayRecord.check_out)}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!isCheckedIn ? (
                <GlassButton
                  variant="success"
                  className="flex items-center"
                  onClick={handleCheckIn}
                  disabled={recordAttendanceMutation.isPending}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {recordAttendanceMutation.isPending ? 'Wird eingestempelt...' : 'Check-in'}
                </GlassButton>
              ) : (
                <GlassButton
                  variant="danger"
                  className="flex items-center"
                  onClick={handleCheckOut}
                  disabled={recordAttendanceMutation.isPending}
                >
                  <Square className="w-4 h-4 mr-2" />
                  {recordAttendanceMutation.isPending ? 'Wird ausgestempelt...' : 'Check-out'}
                </GlassButton>
              )}
            </div>
          </div>

          {/* Zusätzliche Informationen */}
          <div className="lg:w-80">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Zusätzliche Informationen</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arbeitsort
                </label>
                <select
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Büro</option>
                  <option value="home">Home Office</option>
                  <option value="client">Kunde</option>
                  <option value="travel">Dienstreise</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notizen zum Arbeitstag..."
                />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Anwesenheitsrate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.attendanceRate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Arbeitstage</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.fullDays} / {stats.totalDays}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gesamtstunden</p>
              <p className="text-2xl font-bold text-gray-900">
                {getTotalWorkingHours().toFixed(1)}h
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ø Stunden/Tag</p>
              <p className="text-2xl font-bold text-gray-900">
                {getAverageWorkingHours().toFixed(1)}h
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-500" />
          </div>
        </GlassCard>
      </div>

      {/* Filter und Suche */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Anwesenheitsdaten durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleDateString('de-DE', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Anwesenheitsliste */}
      <GlassCard className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Anwesenheitsliste
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arbeitszeit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arbeitsort
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(record.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.check_in ? formatTime(record.check_in) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.check_out ? formatTime(record.check_out) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.check_in && record.check_out 
                        ? calculateWorkingHours(record.check_in, record.check_out)
                        : '-'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      {record.location === 'home' ? (
                        <Home className="w-4 h-4 mr-1 text-blue-500" />
                      ) : record.location === 'client' ? (
                        <MapPin className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Coffee className="w-4 h-4 mr-1 text-gray-500" />
                      )}
                      <span>{record.location || 'Büro'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.check_in && record.check_out ? (
                      <Badge variant="success">Vollständig</Badge>
                    ) : record.check_in ? (
                      <Badge variant="warning">Ausstehend</Badge>
                    ) : (
                      <Badge variant="default">Nicht anwesend</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leerer Zustand */}
        {attendanceRecords.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Anwesenheitsdaten
            </h3>
            <p className="text-gray-600">
              Für den ausgewählten Zeitraum wurden keine Anwesenheitsdaten gefunden.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default AttendanceTab;
