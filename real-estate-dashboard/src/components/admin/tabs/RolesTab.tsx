import React, { useState } from 'react';
import { Shield, Plus, Save } from 'lucide-react';
// TODO: Implement real API hooks
import { MODULE_SCOPES } from '../../../types/admin';
import type { ModuleName } from '../../../types/admin';
import { GlassCard, GlassButton, Badge, EmptyState } from '../GlassUI';

// Mock hook for backward compatibility
const useRolesMock = () => {
  const roles = [
    {
      id: 'admin',
      name: 'Admin',
      displayName: 'Admin',
      description: 'Vollzugriff auf alle Module',
      scopes: Object.keys(MODULE_SCOPES).flatMap(module => 
        MODULE_SCOPES[module as ModuleName].map(scope => `${module}:${scope}`)
      ),
      isSystem: true
    },
    {
      id: 'manager',
      name: 'Manager',
      displayName: 'Manager',
      description: 'Eingeschränkter Zugriff',
      scopes: ['properties:read', 'contacts:read'],
      isSystem: false
    }
  ];

  const updateRole = async (id: string, data: any) => {
    console.warn('Mock updateRole called');
    return { success: true };
  };

  return {
    roles,
    updateRole
  };
};

const RolesTab: React.FC = () => {
  const { roles, updateRole } = useRolesMock();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(roles[0]?.id || null);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const handleScopeToggle = (scope: string) => {
    if (!selectedRole) return;
    const newScopes = selectedRole.scopes.includes(scope)
      ? selectedRole.scopes.filter(s => s !== scope)
      : [...selectedRole.scopes, scope];
    updateRole(selectedRole.id, { scopes: newScopes });
  };

  const modulesWithScopes = Object.entries(MODULE_SCOPES) as [ModuleName, readonly string[]][];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Role List */}
      <GlassCard className="p-6 lg:col-span-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Rollen</h3>
          <GlassButton size="sm" variant="primary" icon={Plus}>
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
                {role.displayName}
              </div>
              {role.isSystem && (
                <Badge variant="info" size="sm">System</Badge>
              )}
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {role.scopes.length} Berechtigungen
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
                {selectedRole.displayName}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedRole.description}
              </p>
            </div>

            <div className="space-y-6">
              {modulesWithScopes.map(([module, scopes]) => (
                <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize">
                    {module}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {scopes.map(action => {
                      const scopeKey = `${module}.${action}`;
                      const isEnabled = selectedRole.scopes.includes(scopeKey);
                      return (
                        <label
                          key={scopeKey}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                            isEnabled
                              ? 'bg-green-500/20 border border-green-500/50'
                              : 'bg-gray-100/50 dark:bg-gray-700/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleScopeToggle(scopeKey)}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {action}
                          </span>
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
