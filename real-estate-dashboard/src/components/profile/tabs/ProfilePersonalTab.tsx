import React from 'react';
import { Save, Camera } from 'lucide-react';
// TODO: Implement real API hooks
import { GlassCard, GlassButton } from '../../admin/GlassUI';

interface Profile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const ProfilePersonalTab: React.FC = () => {
  // TODO: Implement real profile API hooks
  const profile: Profile | null = null;
  const updateProfile = (data: Partial<Profile>) => Promise.resolve();

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Persönliche Daten</h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vorname</label>
            <input type="text" value={profile?.firstName || ''} onChange={(e) => updateProfile({ firstName: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nachname</label>
            <input type="text" value={profile?.lastName || ''} onChange={(e) => updateProfile({ lastName: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-Mail</label>
            <input type="email" value={profile?.email || ''} onChange={(e) => updateProfile({ email: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefon</label>
            <input type="tel" value={profile?.phone || ''} onChange={(e) => updateProfile({ phone: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          </div>
        </div>
        <div className="flex gap-3">
          <GlassButton variant="primary" icon={Save}>Speichern</GlassButton>
        </div>
      </div>
    </GlassCard>
  );
};

export default ProfilePersonalTab;
