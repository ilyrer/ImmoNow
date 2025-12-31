import React, { useState, useEffect } from 'react';
import { Save, Camera, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProfile, useUpdateProfile, useUploadAvatar } from '../../../hooks/useProfile';
import { GlassCard, GlassButton } from '../../admin/GlassUI';

const ProfilePersonalTab: React.FC = () => {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    company: '',
    position: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        company: profile.company || '',
        position: profile.position || '',
        location: profile.location || '',
        website: profile.website || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      toast.success('Profil erfolgreich aktualisiert');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Fehler beim Speichern');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadAvatarMutation.mutateAsync(file);
      toast.success('Avatar erfolgreich hochgeladen');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Fehler beim Hochladen');
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Persönliche Daten</h3>

      {/* Avatar Upload */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <img
            src={profile?.avatar || '/default-avatar.png'}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover"
          />
          <label className="absolute bottom-0 right-0 p-1.5 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
            <Camera className="w-4 h-4 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploadAvatarMutation.isPending}
            />
          </label>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{profile?.email}</p>
          <p className="text-sm text-gray-500">Klicken Sie auf das Kamera-Symbol, um ein neues Avatar hochzuladen</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vorname</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nachname</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unternehmen</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Standort</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              placeholder="https://"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none"
              placeholder="Erzählen Sie etwas über sich..."
            />
          </div>
        </div>
        <div className="flex gap-3">
          <GlassButton
            variant="primary"
            icon={Save}
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Speichern...' : 'Speichern'}
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
};

export default ProfilePersonalTab;
