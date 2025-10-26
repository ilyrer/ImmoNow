/**
 * EmployeeDetailPage
 * Hauptseite für Mitarbeiterdetails mit Tab-Navigation
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Euro,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  FileText,
  Settings,
  MoreVertical
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, LoadingSpinner } from '../admin/GlassUI';
import { useEmployeeDetail } from '../../api/hrHooks';
import EmployeeOverviewTab from './EmployeeOverviewTab';
import PayrollTab from './PayrollTab';
import LeaveManagementTab from './LeaveManagementTab';
import AttendanceTab from './AttendanceTab';
import OvertimeTab from './OvertimeTab';
import ExpensesTab from './ExpensesTab';
import EmployeeDocumentsTab from './EmployeeDocumentsTab';

type TabType = 'overview' | 'payroll' | 'leave' | 'attendance' | 'overtime' | 'expenses' | 'documents';

const EmployeeDetailPage: React.FC = () => {
  const { id: employeeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { 
    data: employeeDetail, 
    isLoading, 
    error 
  } = useEmployeeDetail(employeeId || '');

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Übersicht',
      icon: User,
      description: 'Mitarbeiterstatistiken und Schnellaktionen'
    },
    {
      id: 'payroll' as TabType,
      label: 'Lohnabrechnungen',
      icon: Euro,
      description: 'Lohnzettel und Gehaltsabrechnungen'
    },
    {
      id: 'leave' as TabType,
      label: 'Urlaub',
      icon: Calendar,
      description: 'Urlaubsanträge und Kalender'
    },
    {
      id: 'attendance' as TabType,
      label: 'Anwesenheit',
      icon: Clock,
      description: 'Check-in/out und Arbeitszeiterfassung'
    },
    {
      id: 'overtime' as TabType,
      label: 'Überstunden',
      icon: TrendingUp,
      description: 'Überstunden erfassen und genehmigen'
    },
    {
      id: 'expenses' as TabType,
      label: 'Spesen',
      icon: DollarSign,
      description: 'Spesen einreichen und Belege verwalten'
    },
    {
      id: 'documents' as TabType,
      label: 'Dokumente',
      icon: FileText,
      description: 'Mitarbeiterdokumente verwalten'
    }
  ];

  const renderTabContent = () => {
    if (!employeeId) return null;

    switch (activeTab) {
      case 'overview':
        return <EmployeeOverviewTab employeeId={employeeId} />;
      case 'payroll':
        return <PayrollTab employeeId={employeeId} />;
      case 'leave':
        return <LeaveManagementTab employeeId={employeeId} />;
      case 'attendance':
        return <AttendanceTab employeeId={employeeId} />;
      case 'overtime':
        return <OvertimeTab employeeId={employeeId} />;
      case 'expenses':
        return <ExpensesTab employeeId={employeeId} />;
      case 'documents':
        return <EmployeeDocumentsTab employeeId={employeeId} />;
      default:
        return <EmployeeOverviewTab employeeId={employeeId} />;
    }
  };

  const getStatusBadge = (isActive: boolean, isOnLeave: boolean) => {
    if (isOnLeave) {
      return <Badge variant="warning">Im Urlaub</Badge>;
    } else if (isActive) {
      return <Badge variant="success">Aktiv</Badge>;
    } else {
      return <Badge variant="default">Inaktiv</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !employeeDetail) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <User className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Mitarbeiter nicht gefunden
        </h3>
        <p className="text-gray-600 mb-4">
          Der angeforderte Mitarbeiter konnte nicht geladen werden.
        </p>
        <GlassButton
          variant="primary"
          onClick={() => navigate('/employees')}
        >
          Zurück zur Übersicht
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Mitarbeiterinfo */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mitarbeiter-Info */}
        <GlassCard className="p-6 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {employeeDetail.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {employeeDetail.full_name}
                </h1>
                <p className="text-gray-600">{employeeDetail.position}</p>
                <p className="text-sm text-gray-500">{employeeDetail.department}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(employeeDetail.is_active, employeeDetail.is_on_leave)}
                  {employeeDetail.is_on_leave && (
                    <span className="text-sm text-gray-500">
                      {employeeDetail.leave_start && employeeDetail.leave_end && (
                        `${new Date(employeeDetail.leave_start).toLocaleDateString('de-DE')} - ${new Date(employeeDetail.leave_end).toLocaleDateString('de-DE')}`
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <GlassButton
                variant="secondary"
                onClick={() => navigate('/employees')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </GlassButton>
              <GlassButton
                variant="secondary"
                className="flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Einstellungen
              </GlassButton>
              <GlassButton
                variant="secondary"
                size="sm"
              >
                <MoreVertical className="w-4 h-4" />
              </GlassButton>
            </div>
          </div>
          
          {/* Kontakt-Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium w-20">E-Mail:</span>
                <span>{employeeDetail.email}</span>
              </div>
              {employeeDetail.work_email && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Arbeit:</span>
                  <span>{employeeDetail.work_email}</span>
                </div>
              )}
              {employeeDetail.work_phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Telefon:</span>
                  <span>{employeeDetail.work_phone}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium w-20">Anstellung:</span>
                <span>{employeeDetail.employment_type}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium w-20">Seit:</span>
                <span>{new Date(employeeDetail.start_date).toLocaleDateString('de-DE')}</span>
              </div>
              {employeeDetail.office_location && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Standort:</span>
                  <span>{employeeDetail.office_location}</span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Tab-Navigation */}
      <GlassCard className="p-1">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Tab-Inhalt */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
