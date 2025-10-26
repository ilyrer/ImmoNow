import React, { useState } from 'react';
import { Shield, Plus, Save } from 'lucide-react';
import { GlassCard, GlassButton, Badge, EmptyState } from '../GlassUI';
import { 
  useRoles, 
  useAdminPermissions, 
  useCreateRole, 
  useUpdateRole, 
  useDeleteRole,
  AdminRole,
  AdminPermission 
} from '../../../api/adminHooks';

const RolesTab: React.FC = () => {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: permissions = [], isLoading: permissionsLoading } = useAdminPermissions();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(roles[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const handleScopeToggle = (permissionId: number) => {
    if (!selectedRole) return;
    
    const currentPermissionIds = selectedRole.permissions.map(p => p.id);
    const newPermissionIds = currentPermissionIds.includes(permissionId)
      ? currentPermissionIds.filter(id => id !== permissionId)
      : [...currentPermissionIds, permissionId];
    
    updateRoleMutation.mutate({
      roleId: selectedRole.id,
      data: { permission_ids: newPermissionIds }
    });
  };

  const handleCreateRole = () => {
    setIsCreating(true);
    // TODO: Open create role dialog
  };

  const handleDeleteRole = (roleId: number) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Rolle löschen möchten?')) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, AdminPermission[]>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Role List */}
      <GlassCard className="p-6 lg:col-span-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Rollen</h3>
          <GlassButton size="sm" variant="primary" icon={Plus} onClick={handleCreateRole}>
            Neu
          </GlassButton>
        </div>
        <div className="space-y-2">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                selectedRoleId === role.id
                  ? 'bg-blue-500/20 border-2 border-blue-500/50'
                  : 'bg-gray-100/50 dark:bg-gray-700/50 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                {role.name}
              </div>
              {role.is_system && (
                <Badge variant="info" size="sm">System</Badge>
              )}
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {role.permissions.length} Berechtigungen
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Permissions Matrix */}
      <GlassCard className="p-6 lg:col-span-2">
        {!selectedRole ? (
          <EmptyState
            icon={Shield}
            title="Keine Rolle ausgewählt"
            description="Wählen Sie eine Rolle aus der Liste aus, um die Berechtigungen zu bearbeiten."
          />
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedRole.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedRole.description}
              </p>
            </div>

            <div className="space-y-6">
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categoryPermissions.map(permission => {
                      const isEnabled = selectedRole.permissions.some(p => p.id === permission.id);
                      return (
                        <label
                          key={permission.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                            isEnabled
                              ? 'bg-green-500/20 border border-green-500/50'
                              : 'bg-gray-100/50 dark:bg-gray-700/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleScopeToggle(permission.id)}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {permission.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {permission.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <GlassButton variant="primary" icon={Save}>
                Änderungen speichern
              </GlassButton>
              <GlassButton variant="secondary">
                Preset laden
              </GlassButton>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
};

export default RolesTab;
