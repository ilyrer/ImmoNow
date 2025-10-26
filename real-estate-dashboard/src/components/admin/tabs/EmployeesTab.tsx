import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Mail,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, EmptyState, LoadingSpinner } from '../GlassUI';
import EmployeeDrawer from '../drawers/EmployeeDrawer';
import { 
  useUsers, 
  useUserStats, 
  useInviteUser, 
  useActivateUser, 
  useDeactivateUser, 
  useDeleteUser, 
  useBulkUserAction,
  useResendInvitation,
  AdminUser,
  InviteUserRequest,
  UserActivationRequest,
  UserDeletionRequest,
  BulkUserActionRequest,
  ResendInvitationRequest,
} from '../../../api/adminHooks';
import type { Employee } from '../../../types/admin';

const EmployeesTab: React.FC = () => {
  const navigate = useNavigate();
  
  // API Hooks
  const { data: usersData, isLoading: loading, error } = useUsers({ page: 1, size: 50 });
  const { data: userStats } = useUserStats();
  const inviteUserMutation = useInviteUser();
  const activateUserMutation = useActivateUser();
  const deactivateUserMutation = useDeactivateUser();
  const deleteUserMutation = useDeleteUser();
  const bulkUserActionMutation = useBulkUserAction();
  const resendInvitationMutation = useResendInvitation();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'invited'>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedBulkAction, setSelectedBulkAction] = useState<'activate' | 'deactivate' | 'delete' | 'resend_invitation'>('activate');

  // Convert AdminUser to Employee format for compatibility
  const users = usersData?.users || [];
  const employees = users.map(user => ({
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    status: user.status,
    role: user.roles[0]?.name || 'user',
    roleId: user.roles[0]?.id.toString() || 'user',
    team: user.department || 'management',
    lastLogin: user.last_login,
    employee_number: user.employee_number,
    department: user.department,
    position: user.position,
  }));

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee_number && emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status badge colors
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'invited': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'invited': return <Mail className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

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

  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) {
      try {
        const deletionRequest: UserDeletionRequest = {
          user_id: employeeId,
          reason: 'Admin deletion',
          anonymize_data: true
        };
        await deleteUserMutation.mutateAsync({ userId: employeeId, data: deletionRequest });
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleToggleStatus = async (employeeId: string, currentStatus: string) => {
    try {
      const activationRequest: UserActivationRequest = {
        user_id: employeeId,
        is_active: currentStatus !== 'active',
        reason: 'Admin status change'
      };
      
      if (currentStatus === 'active') {
        await deactivateUserMutation.mutateAsync({ userId: employeeId, data: activationRequest });
      } else {
        await activateUserMutation.mutateAsync({ userId: employeeId, data: activationRequest });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleInviteUser = async (inviteData: InviteUserRequest) => {
    try {
      await inviteUserMutation.mutateAsync(inviteData);
      setInviteDialogOpen(false);
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  };

  const handleBulkAction = async () => {
    if (selectedEmployees.size === 0) return;
    
    try {
      const bulkRequest: BulkUserActionRequest = {
        user_ids: Array.from(selectedEmployees),
        action: selectedBulkAction,
        reason: 'Bulk admin action'
      };
      
      await bulkUserActionMutation.mutateAsync(bulkRequest);
      setSelectedEmployees(new Set());
      setBulkActionDialogOpen(false);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleResendInvitation = async (userId: string) => {
    try {
      const resendRequest: ResendInvitationRequest = {
        user_id: userId,
        message: 'Einladung erneut gesendet'
      };
      await resendInvitationMutation.mutateAsync({ userId, data: resendRequest });
    } catch (error) {
      console.error('Error resending invitation:', error);
    }
  };

  const handleEditEmployee = (emp: any) => {
    // Navigate to the new employee detail page
    navigate(`/admin/employees/${emp.id}`);
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
              <option value="invited">Eingeladen</option>
            </select>
            
            <GlassButton onClick={() => setInviteDialogOpen(true)} variant="primary" icon={UserPlus}>
              Einladen
            </GlassButton>
            
            <GlassButton onClick={handleAddEmployee} variant="secondary" icon={Plus}>
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
              <select
                value={selectedBulkAction}
                onChange={(e) => setSelectedBulkAction(e.target.value as any)}
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-sm"
              >
                <option value="activate">Aktivieren</option>
                <option value="deactivate">Deaktivieren</option>
                <option value="resend_invitation">Einladung erneut senden</option>
                <option value="delete">Löschen</option>
              </select>
              <GlassButton onClick={handleBulkAction} variant="primary" size="sm">
                Ausführen
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
                      <Badge variant={emp.status === 'active' ? 'success' : 'default'}>
                        {getStatusIcon(emp.status)}
                        <span className="ml-1">
                          {emp.status === 'active' ? 'Aktiv' : 
                           emp.status === 'inactive' ? 'Inaktiv' :
                           emp.status === 'invited' ? 'Eingeladen' :
                           emp.status === 'pending' ? 'Ausstehend' : 'Unbekannt'}
                        </span>
                      </Badge>
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
                        
                        {emp.status === 'invited' && (
                          <button
                            onClick={() => handleResendInvitation(emp.id)}
                            className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                            title="Einladung erneut senden"
                          >
                            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleToggleStatus(emp.id, emp.status)}
                          className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                          title={emp.status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                        >
                          {emp.status === 'active' ? (
                            <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
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

      {/* Invite User Dialog */}
      {inviteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Mitarbeiter einladen</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const inviteData: InviteUserRequest = {
                email: formData.get('email') as string,
                first_name: formData.get('firstName') as string,
                last_name: formData.get('lastName') as string,
                role: formData.get('role') as string,
                department: formData.get('department') as string,
                position: formData.get('position') as string,
                message: formData.get('message') as string,
              };
              handleInviteUser(inviteData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">E-Mail</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vorname</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nachname</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rolle</label>
                  <select
                    name="role"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="agent">Agent</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Abteilung</label>
                    <input
                      type="text"
                      name="department"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Position</label>
                    <input
                      type="text"
                      name="position"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nachricht (optional)</label>
                  <textarea
                    name="message"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setInviteDialogOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={inviteUserMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviteUserMutation.isPending ? 'Wird gesendet...' : 'Einladen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesTab;
