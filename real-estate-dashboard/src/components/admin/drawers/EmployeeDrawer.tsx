import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Employee } from '../../../types/admin';
// TODO: Implement real API hooks
import { GlassButton } from '../GlassUI';

// Mock hooks for backward compatibility
const useEmployeesMock = () => ({
  updateEmployee: async (id: string, data: any) => {
    console.warn('Mock updateEmployee called');
    return { success: true };
  }
});

const useRolesMock = () => ({
  roles: [
    { id: 'admin', name: 'Admin', displayName: 'Admin' },
    { id: 'manager', name: 'Manager', displayName: 'Manager' },
    { id: 'agent', name: 'Agent', displayName: 'Agent' }
  ]
});

interface EmployeeDrawerProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}

const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({ employee, open, onClose }) => {
  const { updateEmployee } = useEmployeesMock();
  const { roles } = useRolesMock();
  
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({
        name: '',
        email: '',
        roleId: '',
        status: 'active',
      });
    }
  }, [employee]);

  const handleSave = () => {
    if (employee) {
      updateEmployee(employee.id, formData);
    }
    // TODO: Create new employee
    onClose();
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-Mail
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rolle
            </label>
            <select
              value={formData.roleId || ''}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="">Rolle wählen...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team
            </label>
            <input
              type="text"
              value={formData.team || ''}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
              <option value="on_leave">Beurlaubt</option>
            </select>
          </div>

          <div className="flex gap-3 pt-6">
            <GlassButton onClick={handleSave} variant="primary" icon={Save} className="flex-1">
              Speichern
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
