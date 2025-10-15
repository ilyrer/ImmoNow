import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  MoreVertical,
  Filter,
  UserX,
  UserCheck,
  Users as UsersIcon,
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, EmptyState, LoadingSpinner } from '../GlassUI';
import EmployeeDrawer from '../drawers/EmployeeDrawer';
import { useAdminUsers, useUpdateUserRoles, AdminUser } from '../../../api/adminHooks';
import type { Employee } from '../../../types/admin';

const EmployeesTab: React.FC = () => {
  const { data: users = [], isLoading: loading, error } = useAdminUsers();
  const updateUserRolesMutation = useUpdateUserRoles();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Convert AdminUser to Employee format for compatibility
  const employees = users.map(user => ({
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    status: user.is_active ? 'active' as const : 'inactive' as const,
    role: user.roles[0]?.name || 'user',
    roleId: user.roles[0]?.id.toString() || 'user',
    team: 'management', // TODO: Add team field to backend
    lastLogin: user.last_login
  }));

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
    }
  };

  const handleSelectEmployee = (id: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmployees(newSelected);
  };

  const handleBulkActivate = () => {
    // TODO: Implement bulk activate functionality
    console.log('Bulk activate:', Array.from(selectedEmployees));
    setSelectedEmployees(new Set());
  };

  const handleBulkDeactivate = () => {
    // TODO: Implement bulk deactivate functionality
    console.log('Bulk deactivate:', Array.from(selectedEmployees));
    setSelectedEmployees(new Set());
  };

  const handleEditEmployee = (emp: any) => {
    const user = users.find(u => u.id === emp.id);
    if (user) {
      // Convert AdminUser to Employee format for EmployeeDrawer
      const employeeData = {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        roleId: user.roles[0]?.id.toString() || 'user',
        team: 'management', // TODO: Add team field to backend
        status: user.is_active ? 'active' as const : 'inactive' as const,
        lastLogin: user.last_login
      };
      setSelectedEmployee(employeeData);
    }
    setDrawerOpen(true);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setDrawerOpen(true);
  };

  const getRoleName = (roleId: string) => {
    const user = users.find(u => u.id === roleId);
    return user?.roles[0]?.name || 'Unbekannt';
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Nie';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Vor wenigen Minuten';
    if (diffHours < 24) return `Vor ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `Vor ${diffDays}d`;
    return date.toLocaleDateString('de-DE');
  };

  if (loading) {
    return (
      <GlassCard className="p-8">
        <LoadingSpinner size="lg" />
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Mitarbeitende suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            >
              <option value="all">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
            
            <GlassButton onClick={handleAddEmployee} variant="primary" icon={Plus}>
              Mitarbeiter hinzufügen
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Bulk Actions Bar */}
      {selectedEmployees.size > 0 && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedEmployees.size} Mitarbeiter ausgewählt
            </span>
            <div className="flex gap-2">
              <GlassButton onClick={handleBulkActivate} variant="success" size="sm" icon={UserCheck}>
                Aktivieren
              </GlassButton>
              <GlassButton onClick={handleBulkDeactivate} variant="danger" size="sm" icon={UserX}>
                Deaktivieren
              </GlassButton>
              <GlassButton onClick={() => setSelectedEmployees(new Set())} variant="secondary" size="sm">
                Abbrechen
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Employee Table */}
      <GlassCard className="overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Keine Mitarbeitenden gefunden"
            description="Es wurden keine Mitarbeitenden mit den aktuellen Filtern gefunden."
            action={{ label: 'Filter zurücksetzen', onClick: () => { setSearchTerm(''); setStatusFilter('all'); } }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.size === filteredEmployees.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Rolle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Letzter Login
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.has(emp.id)}
                        onChange={() => handleSelectEmployee(emp.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {emp.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info">{getRoleName(emp.roleId)}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 dark:text-gray-300">
                        {emp.team || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.status === 'active' ? (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1 inline" />
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <XCircle className="w-3 h-3 mr-1 inline" />
                          Inaktiv
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {formatLastLogin(emp.lastLogin)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditEmployee(emp)}
                          className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement user status toggle
                            console.log('Toggle user status:', emp.id, emp.status);
                          }}
                          className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                          title={emp.status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                        >
                          {emp.status === 'active' ? (
                            <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Employee Drawer */}
      <EmployeeDrawer
        employee={selectedEmployee}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
};

export default EmployeesTab;
