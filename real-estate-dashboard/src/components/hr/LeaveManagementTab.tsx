/**
 * LeaveManagementTab
 * Urlaubsverwaltung mit Kalender und Antragstellung
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  CalendarDays,
  Plane
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, LoadingSpinner } from '../admin/GlassUI';
import { 
  useLeaveRequests, 
  useCreateLeaveRequest, 
  useApproveLeaveRequest,
  useLeaveCalendar
} from '../../api/hrHooks';
import type { 
  LeaveRequestCreate, 
  LeaveRequestResponse
} from '../../types/hr';
import { LeaveType, LeaveStatus, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from '../../types/hr';

interface LeaveManagementTabProps {
  employeeId: string;
}

const LeaveManagementTab: React.FC<LeaveManagementTabProps> = ({ employeeId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType>(LeaveType.VACATION);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    data: leaveRequestsData, 
    isLoading, 
    error 
  } = useLeaveRequests({
    employee_id: employeeId,
    status: filterStatus === 'all' ? undefined : filterStatus
  });

  const createLeaveRequestMutation = useCreateLeaveRequest();
  const approveLeaveRequestMutation = useApproveLeaveRequest();

  const leaveRequests = leaveRequestsData?.items || [];

  // Kalender-Logik
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  
  const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  // Hole Kalender-Daten für den aktuellen Monat
  const startDateStr = firstDayOfMonth.toISOString().split('T')[0];
  const endDateStr = lastDayOfMonth.toISOString().split('T')[0];
  
  const { data: calendarData } = useLeaveCalendar(employeeId, startDateStr, endDateStr);
  const approvedLeaveDates = calendarData?.leave_dates || [];

  // Kalender-Tage generieren
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Leere Tage für den Anfang des Monats
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Prüfe ob an diesem Tag genehmigter Urlaub ist (aus API)
      const approvedLeave = approvedLeaveDates.find(leave => leave.date === dateString);
      
      // Prüfe auch lokale Requests für andere Status
      const leaveOnThisDay = leaveRequests.find(request => {
        const start = new Date(request.start_date);
        const end = new Date(request.end_date);
        return date >= start && date <= end;
      });
      
      days.push({
        day,
        date,
        dateString,
        isApprovedLeave: !!approvedLeave,
        isLeaveDay: !!leaveOnThisDay,
        leaveRequest: leaveOnThisDay,
        approvedLeave: approvedLeave
      });
    }
    
    return days;
  }, [year, month, leaveRequests, approvedLeaveDates]);

  const handleCreateLeaveRequest = async () => {
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const leaveRequestData: LeaveRequestCreate = {
      start_date: startDate,
      end_date: endDate,
      leave_type: selectedLeaveType,
      days_count: daysCount,
      reason: reason || undefined
    };
    
    try {
      await createLeaveRequestMutation.mutateAsync(leaveRequestData);
      setShowCreateModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (error) {
      console.error('Fehler beim Erstellen des Urlaubsantrags:', error);
    }
  };

  const handleApproveLeaveRequest = async (requestId: string, approved: boolean) => {
    try {
      await approveLeaveRequestMutation.mutateAsync({
        leaveRequestId: requestId,
        approvalData: {
          approved,
          manager_notes: approved ? 'Genehmigt' : 'Abgelehnt'
        }
      });
    } catch (error) {
      console.error('Fehler beim Genehmigen/Ablehnen:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.PENDING:
        return <Badge variant="warning">Ausstehend</Badge>;
      case LeaveStatus.APPROVED:
        return <Badge variant="success">Genehmigt</Badge>;
      case LeaveStatus.REJECTED:
        return <Badge variant="danger">Abgelehnt</Badge>;
      case LeaveStatus.CANCELLED:
        return <Badge variant="default">Storniert</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

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
          Fehler beim Laden der Urlaubsanträge
        </h3>
        <p className="text-gray-600">
          Die Urlaubsanträge konnten nicht geladen werden. Bitte versuchen Sie es später erneut.
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
            <Calendar className="w-6 h-6 mr-2" />
            Urlaubsverwaltung
          </h2>
          <p className="text-gray-600 mt-1">
            Urlaubsanträge verwalten und Kalender einsehen
          </p>
        </div>
        
        <GlassButton 
          variant="primary" 
          className="flex items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Urlaub beantragen
        </GlassButton>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verfügbare Urlaubstage</p>
              <p className="text-2xl font-bold text-gray-900">25</p>
            </div>
            <CalendarDays className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Genommene Urlaubstage</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaveRequests
                  .filter(r => r.status === LeaveStatus.APPROVED)
                  .reduce((sum, r) => sum + r.days_count, 0)}
              </p>
            </div>
            <Plane className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ausstehende Anträge</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaveRequests.filter(r => r.status === LeaveStatus.PENDING).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verbleibende Tage</p>
              <p className="text-2xl font-bold text-gray-900">
                {25 - leaveRequests
                  .filter(r => r.status === LeaveStatus.APPROVED)
                  .reduce((sum, r) => sum + r.days_count, 0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kalender */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Kalender
            </h3>
            <div className="flex items-center gap-2">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </GlassButton>
              <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
                {monthNames[month]} {year}
              </span>
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            </div>
          </div>

          {/* Wochentage */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Kalender-Tage */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-10" />;
              }
              
              return (
                <div
                  key={day.day}
                  className={`
                    h-10 flex items-center justify-center text-sm rounded-lg cursor-pointer relative
                    ${day.isApprovedLeave 
                      ? 'bg-green-100 text-green-800 font-semibold' 
                      : day.isLeaveDay && day.leaveRequest?.status === LeaveStatus.PENDING
                      ? 'bg-orange-100 text-orange-800 font-semibold'
                      : day.isLeaveDay && day.leaveRequest?.status === LeaveStatus.REJECTED
                      ? 'bg-red-100 text-red-800 font-semibold'
                      : 'hover:bg-gray-100'
                    }
                    ${day.date.toDateString() === new Date().toDateString() 
                      ? 'bg-blue-100 text-blue-800 font-semibold' 
                      : ''
                    }
                  `}
                  title={
                    day.isApprovedLeave 
                      ? `Genehmigter Urlaub: ${day.approvedLeave?.leave_type} - ${day.approvedLeave?.reason}`
                      : day.isLeaveDay 
                      ? `Urlaub (${day.leaveRequest?.status}): ${day.leaveRequest?.leave_type} - ${day.leaveRequest?.reason}`
                      : ''
                  }
                  onClick={() => {
                    // Beim Klick auf Kalender-Tag: Start-Datum setzen
                    if (!day.isLeaveDay) {
                      setStartDate(day.dateString);
                    }
                  }}
                >
                  {day.day}
                  {day.isApprovedLeave && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                  {day.isLeaveDay && day.leaveRequest?.status === LeaveStatus.PENDING && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                  {day.isLeaveDay && day.leaveRequest?.status === LeaveStatus.REJECTED && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legende */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span className="text-gray-600">Urlaub</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 rounded"></div>
              <span className="text-gray-600">Heute</span>
            </div>
          </div>
        </GlassCard>

        {/* Urlaubsanträge */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Urlaubsanträge
            </h3>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as LeaveStatus | 'all')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Alle</option>
                <option value={LeaveStatus.PENDING}>Ausstehend</option>
                <option value={LeaveStatus.APPROVED}>Genehmigt</option>
                <option value={LeaveStatus.REJECTED}>Abgelehnt</option>
                <option value={LeaveStatus.CANCELLED}>Storniert</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {leaveRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {LEAVE_TYPE_LABELS[request.leave_type]}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(request.start_date)} - {formatDate(request.end_date)}
                        </span>
                        <span className="font-medium">({request.days_count} Tage)</span>
                      </div>
                      
                      {request.reason && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5" />
                          <span>{request.reason}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Antragsteller: {request.employee_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {request.status === LeaveStatus.PENDING && (
                    <div className="flex items-center gap-2 ml-4">
                      <GlassButton
                        variant="success"
                        size="sm"
                        onClick={() => handleApproveLeaveRequest(request.id, true)}
                        disabled={approveLeaveRequestMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </GlassButton>
                      <GlassButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleApproveLeaveRequest(request.id, false)}
                        disabled={approveLeaveRequestMutation.isPending}
                      >
                        <XCircle className="w-4 h-4" />
                      </GlassButton>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {leaveRequests.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Keine Urlaubsanträge
                </h4>
                <p className="text-gray-600">
                  Es wurden noch keine Urlaubsanträge gestellt.
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Urlaub beantragen Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Urlaub beantragen
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urlaubstyp
                </label>
                <select
                  value={selectedLeaveType}
                  onChange={(e) => setSelectedLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Von
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bis
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Begründung (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Grund für den Urlaub..."
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Abbrechen
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleCreateLeaveRequest}
                disabled={!startDate || !endDate || createLeaveRequestMutation.isPending}
              >
                {createLeaveRequestMutation.isPending ? 'Wird erstellt...' : 'Antrag stellen'}
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagementTab;
