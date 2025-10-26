import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Building, Calendar, Phone, MapPin, Briefcase } from 'lucide-react';
import type { Employee } from '../../../types/admin';
import { GlassButton } from '../GlassUI';
import { 
  useCreateEmployee, 
  useUpdateEmployee, 
  useAdminRoles,
  EmployeeCreate,
  EmployeeUpdate 
} from '../../../api/adminHooks';

interface EmployeeDrawerProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}

const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({ employee, open, onClose }) => {
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const { data: roles = [] } = useAdminRoles();
  
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({
        name: '',
        email: '',
        roleId: '',
        status: 'active',
        employee_number: '',
        department: '',
        position: '',
        employment_type: 'full-time',
        start_date: '',
        work_email: '',
        work_phone: '',
        office_location: '',
        manager_id: '',
        is_active: true,
        is_on_leave: false,
        notes: '',
      });
    }
    setErrors({});
  }, [employee]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name ist erforderlich';
    if (!formData.email) newErrors.email = 'E-Mail ist erforderlich';
    if (!formData.employee_number) newErrors.employee_number = 'Mitarbeiternummer ist erforderlich';
    if (!formData.department) newErrors.department = 'Abteilung ist erforderlich';
    if (!formData.position) newErrors.position = 'Position ist erforderlich';
    if (!formData.start_date) newErrors.start_date = 'Startdatum ist erforderlich';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      if (employee) {
        // Update existing employee
        const updateData: EmployeeUpdate = {
          employee_number: formData.employee_number,
          department: formData.department,
          position: formData.position,
          employment_type: formData.employment_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          work_email: formData.work_email,
          work_phone: formData.work_phone,
          office_location: formData.office_location,
          manager_id: formData.manager_id,
          is_active: formData.is_active,
          is_on_leave: formData.is_on_leave,
          leave_start: formData.leave_start,
          leave_end: formData.leave_end,
          notes: formData.notes,
        };
        await updateEmployeeMutation.mutateAsync({ id: employee.id, data: updateData });
      } else {
        // Create new employee
        const createData: EmployeeCreate = {
          user_id: '', // This would need to be selected from existing users
          employee_number: formData.employee_number!,
          department: formData.department!,
          position: formData.position!,
          employment_type: formData.employment_type!,
          start_date: formData.start_date!,
          end_date: formData.end_date,
          work_email: formData.work_email,
          work_phone: formData.work_phone,
          office_location: formData.office_location,
          manager_id: formData.manager_id,
          is_active: formData.is_active!,
          is_on_leave: formData.is_on_leave!,
          leave_start: formData.leave_start,
          leave_end: formData.leave_end,
          notes: formData.notes,
        };
        await createEmployeeMutation.mutateAsync(createData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {employee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Grunddaten
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vorname *
                </label>
                <input
                  type="text"
                  value={formData.name?.split(' ')[0] || ''}
                  onChange={(e) => setFormData({ ...formData, name: `${e.target.value} ${formData.name?.split(' ')[1] || ''}`.trim() })}
                  className={`w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nachname *
                </label>
                <input
                  type="text"
                  value={formData.name?.split(' ')[1] || ''}
                  onChange={(e) => setFormData({ ...formData, name: `${formData.name?.split(' ')[0] || ''} ${e.target.value}`.trim() })}
                  className={`w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-Mail *
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mitarbeiternummer *
              </label>
              <input
                type="text"
                value={formData.employee_number || ''}
                onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                className={`w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 ${
                  errors.employee_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.employee_number && <p className="text-red-500 text-sm mt-1">{errors.employee_number}</p>}
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Anstellungsdaten
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Abteilung *
                </label>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 ${
                    errors.department ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 ${
                    errors.position ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Anstellungsart
                </label>
                <select
                  value={formData.employment_type || 'full-time'}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  <option value="full-time">Vollzeit</option>
                  <option value="part-time">Teilzeit</option>
                  <option value="contract">Vertrag</option>
                  <option value="intern">Praktikant</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Startdatum *
                </label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 ${
                    errors.start_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enddatum (optional)
              </label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Kontaktdaten
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arbeits-E-Mail
                </label>
                <input
                  type="email"
                  value={formData.work_email || ''}
                  onChange={(e) => setFormData({ ...formData, work_email: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arbeits-Telefon
                </label>
                <input
                  type="tel"
                  value={formData.work_phone || ''}
                  onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bürostandort
              </label>
              <input
                type="text"
                value={formData.office_location || ''}
                onChange={(e) => setFormData({ ...formData, office_location: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Status and Leave */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Status & Urlaub
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active || false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Aktiv
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_on_leave"
                  checked={formData.is_on_leave || false}
                  onChange={(e) => setFormData({ ...formData, is_on_leave: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="is_on_leave" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Beurlaubt
                </label>
              </div>
            </div>

            {formData.is_on_leave && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Urlaub von
                  </label>
                  <input
                    type="date"
                    value={formData.leave_start || ''}
                    onChange={(e) => setFormData({ ...formData, leave_start: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Urlaub bis
                  </label>
                  <input
                    type="date"
                    value={formData.leave_end || ''}
                    onChange={(e) => setFormData({ ...formData, leave_end: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notizen
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              placeholder="Zusätzliche Informationen..."
            />
          </div>

          <div className="flex gap-3 pt-6">
            <GlassButton 
              onClick={handleSave} 
              variant="primary" 
              icon={Save} 
              className="flex-1"
              disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
            >
              {createEmployeeMutation.isPending || updateEmployeeMutation.isPending 
                ? 'Wird gespeichert...' 
                : 'Speichern'
              }
            </GlassButton>
            <GlassButton onClick={onClose} variant="secondary" className="flex-1">
              Abbrechen
            </GlassButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeDrawer;
