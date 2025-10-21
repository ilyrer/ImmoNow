import React, { useState, useRef } from 'react';
import { Save, Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { GlassCard, GlassButton } from '../../admin/GlassUI';
import { useProfile, useUpdateProfile, useUploadAvatar, useRemoveAvatar } from '../../../api/hooks';
import { toast } from 'react-hot-toast';

const ProfilePersonalTab: React.FC = () => {
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const removeAvatarMutation = useRemoveAvatar();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    language: 'de',
    timezone: 'Europe/Berlin',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        language: profile.language || 'de',
        timezone: profile.timezone || 'Europe/Berlin',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync(formData);
      setIsEditing(false);
      toast.success('Profil erfolgreich aktualisiert');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Profils');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wählen Sie eine Bilddatei aus');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Die Datei ist zu groß (max. 5MB)');
      return;
    }

    try {
      await uploadAvatarMutation.mutateAsync(file);
      toast.success('Avatar erfolgreich hochgeladen');
    } catch (error) {
      toast.error('Fehler beim Hochladen des Avatars');
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatarMutation.mutateAsync();
      toast.success('Avatar erfolgreich entfernt');
    } catch (error) {
      toast.error('Fehler beim Entfernen des Avatars');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profilbild</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-gray-700 shadow-lg">
                {getInitials(profile?.first_name || '', profile?.last_name || '')}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-700"></div>
          </div>
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <GlassButton
              variant="primary"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
            >
              Hochladen
            </GlassButton>
            {profile?.avatar && (
              <GlassButton
                variant="danger"
                icon={X}
                onClick={handleRemoveAvatar}
              >
                Entfernen
              </GlassButton>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Personal Information */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Persönliche Daten</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vorname *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ihr Vorname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nachname *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ihr Nachname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-Mail
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                placeholder="Ihre E-Mail-Adresse"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                E-Mail kann nicht geändert werden
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="+49 123 456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sprache
              </label>
              <select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zeitzone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="Europe/Berlin">Europa/Berlin</option>
                <option value="Europe/London">Europa/London</option>
                <option value="America/New_York">Amerika/New York</option>
                <option value="Asia/Tokyo">Asien/Tokio</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <GlassButton
              variant="primary"
              icon={Save}
              onClick={handleSave}
              disabled={!isEditing}
            >
              Änderungen speichern
            </GlassButton>
            {isEditing && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Ungespeicherte Änderungen</span>
              </div>
            )}
            {!isEditing && updateProfileMutation.isSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Erfolgreich gespeichert</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfilePersonalTab;
