/**
 * EmployeeOverviewTab
 * Übersichtstab für Mitarbeiterdetails mit Statistiken
 */

import React from 'react';
import {
  User,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  MapPin,
  Phone,
  Mail,
  Building,
  Award,
  Target,
  Activity
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, LoadingSpinner } from '../admin/GlassUI';
import { useEmployeeDetail, useUpdateEmployeeDetail } from '../../api/hrHooks';
import type { EmployeeDetailResponse } from '../../types/hr';

interface EmployeeOverviewTabProps {
  employeeId: string;
}

const EmployeeOverviewTab: React.FC<EmployeeOverviewTabProps> = ({ employeeId }) => {
  const { data: employeeDetail, isLoading, error } = useEmployeeDetail(employeeId);
  const updateEmployeeMutation = useUpdateEmployeeDetail();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState<Partial<EmployeeDetailResponse>>({});

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    console.error('Employee Detail Error:', error);
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Fehler beim Laden der Mitarbeiterdaten</p>
        <p className="text-sm text-gray-500 mt-2">
          {error instanceof Error ? error.message : 'Unbekannter Fehler'}
        </p>
      </div>
    );
  }

  if (!employeeDetail) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Keine Mitarbeiterdaten gefunden</p>
      </div>
    );
  }

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      department: employeeDetail?.department,
      position: employeeDetail?.position,
      employment_type: employeeDetail?.employment_type,
      work_email: employeeDetail?.work_email,
      work_phone: employeeDetail?.work_phone,
      office_location: employeeDetail?.office_location,
    });
  };

  const handleSave = async () => {
    try {
      await updateEmployeeMutation.mutateAsync({
        employeeId,
        data: editData
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const getStatusBadge = () => {
    if (employeeDetail.is_on_leave) {
      return <Badge variant="warning">Im Urlaub</Badge>;
    }
    if (employeeDetail.is_active) {
      return <Badge variant="success">Aktiv</Badge>;
    }
    return <Badge variant="danger">Inaktiv</Badge>;
  };

  const getEmploymentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'full_time': 'Vollzeit',
      'part_time': 'Teilzeit',
      'contract': 'Vertrag',
      'intern': 'Praktikum',
      'freelance': 'Freelance'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{employeeDetail.full_name}</h1>
            <p className="text-gray-600">{employeeDetail.position} • {employeeDetail.department}</p>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusBadge()}
              <Badge variant="info">{getEmploymentTypeLabel(employeeDetail.employment_type)}</Badge>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Mitarbeiternummer</p>
          <p className="text-lg font-semibold">{employeeDetail.employee_number}</p>
          <GlassButton 
            variant="primary" 
            onClick={handleEdit}
            className="mt-2"
          >
            Bearbeiten
          </GlassButton>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Urlaub */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Urlaubstage</p>
              <p className="text-2xl font-bold text-gray-900">
                {employeeDetail.total_leave_days_used} / {employeeDetail.total_leave_days_used + employeeDetail.total_leave_days_remaining}
              </p>
              <p className="text-sm text-gray-500">
                {employeeDetail.total_leave_days_remaining} Tage übrig
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>

        {/* Überstunden */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Überstunden</p>
              <p className="text-2xl font-bold text-gray-900">
                {Number(employeeDetail.total_overtime_hours).toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500">Gesamt</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </GlassCard>

        {/* Spesen */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Spesen</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(employeeDetail.total_expenses_amount)}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(employeeDetail.total_expenses_pending)} ausstehend
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>

        {/* Anwesenheit */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Anwesenheit</p>
              <p className="text-2xl font-bold text-gray-900">
                {Number(employeeDetail.attendance_rate).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Rate</p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </GlassCard>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Persönliche Informationen
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{employeeDetail.email}</span>
            </div>
            {employeeDetail.work_email && (
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{employeeDetail.work_email}</span>
              </div>
            )}
            {employeeDetail.work_phone && (
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{employeeDetail.work_phone}</span>
              </div>
            )}
            {employeeDetail.office_location && (
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{employeeDetail.office_location}</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Employment Information */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Anstellungsinformationen
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Einstellungsdatum:</span>
              <span className="font-medium">{formatDate(employeeDetail.start_date)}</span>
            </div>
            {employeeDetail.end_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">Austrittsdatum:</span>
                <span className="font-medium">{formatDate(employeeDetail.end_date)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Abteilung:</span>
              <span className="font-medium">{employeeDetail.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Position:</span>
              <span className="font-medium">{employeeDetail.position}</span>
            </div>
            {employeeDetail.manager_name && (
              <div className="flex justify-between">
                <span className="text-gray-600">Manager:</span>
                <span className="font-medium">{employeeDetail.manager_name}</span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Letzte Urlaubsanträge
          </h3>
          <div className="space-y-3">
            {employeeDetail.recent_leave_requests.length > 0 ? (
              employeeDetail.recent_leave_requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{formatDate(request.start_date)} - {formatDate(request.end_date)}</p>
                    <p className="text-sm text-gray-600">{request.leave_type}</p>
                  </div>
                  <Badge 
                    variant={
                      request.status === 'approved' ? 'success' :
                      request.status === 'rejected' ? 'danger' :
                      request.status === 'pending' ? 'warning' : 'default'
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Keine Urlaubsanträge vorhanden</p>
            )}
          </div>
        </GlassCard>

        {/* Recent Expenses */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Letzte Spesen
          </h3>
          <div className="space-y-3">
            {employeeDetail.recent_expenses.length > 0 ? (
              employeeDetail.recent_expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-gray-600">{formatDate(expense.date)} • {expense.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(expense.amount)}</p>
                    <Badge 
                      variant={
                        expense.status === 'approved' ? 'success' :
                        expense.status === 'rejected' ? 'danger' :
                        expense.status === 'submitted' ? 'warning' : 'default'
                      }
                    >
                      {expense.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Keine Spesen vorhanden</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Schnellaktionen
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassButton variant="secondary" className="flex flex-col items-center p-4">
            <Calendar className="w-6 h-6 mb-2" />
            <span className="text-sm">Urlaub beantragen</span>
          </GlassButton>
          <GlassButton variant="secondary" className="flex flex-col items-center p-4">
            <Clock className="w-6 h-6 mb-2" />
            <span className="text-sm">Check-in/out</span>
          </GlassButton>
          <GlassButton variant="secondary" className="flex flex-col items-center p-4">
            <DollarSign className="w-6 h-6 mb-2" />
            <span className="text-sm">Spesen einreichen</span>
          </GlassButton>
          <GlassButton variant="secondary" className="flex flex-col items-center p-4">
            <FileText className="w-6 h-6 mb-2" />
            <span className="text-sm">Dokument hochladen</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Mitarbeiterdaten bearbeiten</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abteilung</label>
                <input
                  type="text"
                  value={editData.department || ''}
                  onChange={(e) => setEditData({...editData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={editData.position || ''}
                  onChange={(e) => setEditData({...editData, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anstellungsart</label>
                <select
                  value={editData.employment_type || ''}
                  onChange={(e) => setEditData({...editData, employment_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full_time">Vollzeit</option>
                  <option value="part_time">Teilzeit</option>
                  <option value="contract">Vertrag</option>
                  <option value="intern">Praktikum</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              
              {/* HR Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jährliche Urlaubstage</label>
                <input
                  type="number"
                  value={editData.annual_leave_days || ''}
                  onChange={(e) => setEditData({...editData, annual_leave_days: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="365"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Überstunden-Saldo</label>
                <input
                  type="number"
                  step="0.1"
                  value={editData.overtime_balance || ''}
                  onChange={(e) => setEditData({...editData, overtime_balance: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spesen-Limit (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editData.expense_limit || ''}
                  onChange={(e) => setEditData({...editData, expense_limit: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Contact Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arbeits-E-Mail</label>
                <input
                  type="email"
                  value={editData.work_email || ''}
                  onChange={(e) => setEditData({...editData, work_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arbeits-Telefon</label>
                <input
                  type="tel"
                  value={editData.work_phone || ''}
                  onChange={(e) => setEditData({...editData, work_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bürostandort</label>
                <input
                  type="text"
                  value={editData.office_location || ''}
                  onChange={(e) => setEditData({...editData, office_location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Status */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editData.is_active || false}
                    onChange={(e) => setEditData({...editData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Aktiv</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editData.is_on_leave || false}
                    onChange={(e) => setEditData({...editData, is_on_leave: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Im Urlaub</span>
                </label>
              </div>
            </div>
            
            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <GlassButton variant="secondary" onClick={handleCancel}>
                Abbrechen
              </GlassButton>
              <GlassButton 
                variant="primary" 
                onClick={handleSave}
                disabled={updateEmployeeMutation.isPending}
              >
                {updateEmployeeMutation.isPending ? 'Speichern...' : 'Speichern'}
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeOverviewTab;
