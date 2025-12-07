import React from 'react';
import { Activity, MapPin, Calendar } from 'lucide-react';
// TODO: Implement real API hooks
// TODO: Implement real API hooks
import { GlassCard, Badge } from '../../admin/GlassUI';

interface Activity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  module: string;
}

interface Profile {
  firstName?: string;
  lastName?: string;
  position?: string;
  company?: string;
  bio?: string;
}

const ProfileOverviewTab: React.FC = () => {
  // TODO: Implement real profile API hooks
  const profile: Profile | null = null;
  const activities: Activity[] = [];
  const roles: string[] = [];

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <GlassCard className="p-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
            {profile && typeof profile === 'object' && ('firstName' in profile || 'lastName' in profile)
              ? `${(profile as any).firstName?.[0] ?? ''}${(profile as any).lastName?.[0] ?? ''}`
              : <span className="text-base">?</span>}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {profile && typeof profile === 'object' && (profile as Profile).firstName
                ? `${(profile as Profile).firstName ?? ''} ${(profile as Profile).lastName ?? ''}`.trim()
                : ''}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {(profile && typeof profile === 'object' && 'position' in profile ? (profile as Profile).position : '')}
              {((profile && typeof profile === 'object' && 'position' in profile && (profile as Profile).position) && (profile && typeof profile === 'object' && 'company' in profile && (profile as Profile).company) ? ' • ' : '')}
              {(profile && typeof profile === 'object' && 'company' in profile ? (profile as Profile).company : '')}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="info">Geschäftsführer</Badge>
              <Badge variant="success">Aktiv</Badge>
            </div>
            {(profile && typeof profile === 'object' && 'bio' in profile && (profile as Profile).bio) && (
              <p className="text-gray-700 dark:text-gray-300">{(profile as Profile).bio}</p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Recent Activity */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Letzte Aktivitäten
        </h3>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-700/50">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{activity.action}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleString('de-DE')}
                </div>
              </div>
              <Badge variant="info" size="sm">{activity.module}</Badge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfileOverviewTab;
