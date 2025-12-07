import React, { useState, useEffect, useRef } from 'react';
import { GlassCard, GlassButton } from '../GlassUI';
import tenantService, { TenantDetail } from '../../../services/tenant.service';
import { Building2, Save, Upload, Loader2, Check, AlertCircle, X } from 'lucide-react';

export const OrganizationTab: React.FC = () => {
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    tax_id: '',
    registration_number: '',
    street: '',
    city: '',
    postal_code: '',
    country: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    language: 'de'
  });

  useEffect(() => {
    loadTenantData();
  }, []);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getTenant();
      setTenant(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        tax_id: data.tax_id || '',
        registration_number: data.registration_number || '',
        street: data.address?.street || '',
        city: data.address?.city || '',
        postal_code: data.address?.postal_code || '',
        country: data.address?.country || '',
        primary_color: data.branding?.primary_color || '#3B82F6',
        secondary_color: data.branding?.secondary_color || '#1E40AF',
        currency: data.defaults?.currency || 'EUR',
        timezone: data.defaults?.timezone || 'Europe/Berlin',
        language: data.defaults?.language || 'de'
      });
    } catch (error) {
      console.error('Failed to load tenant data:', error);
      showMessage('error', 'Fehler beim Laden der Unternehmensdaten');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await tenantService.updateTenant({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        tax_id: formData.tax_id,
        registration_number: formData.registration_number,
        street: formData.street,
        city: formData.city,
        postal_code: formData.postal_code,
        country: formData.country,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        currency: formData.currency,
        timezone: formData.timezone,
        language: formData.language
      });
      showMessage('success', 'Unternehmensdaten erfolgreich gespeichert');
      await loadTenantData();
    } catch (error) {
      console.error('Failed to save tenant data:', error);
      showMessage('error', 'Fehler beim Speichern der Daten');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Datei ist zu groß (max. 5MB)');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('error', 'Ungültiger Dateityp (nur PNG, JPG, SVG, WebP)');
      return;
    }

    try {
      setUploadingLogo(true);
      await tenantService.uploadLogo(file);
      showMessage('success', 'Logo erfolgreich hochgeladen');
      await loadTenantData();
    } catch (error) {
      console.error('Failed to upload logo:', error);
      showMessage('error', 'Fehler beim Hochladen des Logos');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Unternehmensprofil</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Unternehmensname *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              E-Mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Steuernummer
            </label>
            <input
              type="text"
              name="tax_id"
              value={formData.tax_id}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Registrierungsnummer
            </label>
            <input
              type="text"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Unternehmenslogo</h3>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
            {tenant?.branding?.logo_url ? (
              <img 
                src={tenant.branding.logo_url} 
                alt="Company Logo" 
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <GlassButton
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2"
            >
              {uploadingLogo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird hochgeladen...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Logo hochladen
                </>
              )}
            </GlassButton>
            <p className="text-xs text-gray-400 mt-2">
              PNG, JPG, SVG oder WebP (max. 5MB)
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Adresse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Straße & Hausnummer
            </label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stadt
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              PLZ
            </label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Land
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Primärfarbe
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="primary_color"
                value={formData.primary_color}
                onChange={handleInputChange}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sekundärfarbe
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="secondary_color"
                value={formData.secondary_color}
                onChange={handleInputChange}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Standardeinstellungen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Währung
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF (Fr.)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Zeitzone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Europe/Berlin">Europe/Berlin</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Europe/Zurich">Europe/Zurich</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sprache
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {tenant?.subscription && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Abonnement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Plan</p>
              <p className="text-lg font-semibold text-white">{tenant.subscription.plan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                tenant.subscription.status === 'active' 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-yellow-500/20 text-yellow-300'
              }`}>
                {tenant.subscription.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400">Benutzer</p>
              <p className="text-lg font-semibold text-white">
                {tenant.subscription.limits?.max_users || 'Unbegrenzt'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Immobilien</p>
              <p className="text-lg font-semibold text-white">
                {tenant.subscription.limits?.max_properties || 'Unbegrenzt'}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="flex justify-end">
        <GlassButton
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Wird gespeichert...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Änderungen speichern
            </>
          )}
        </GlassButton>
      </div>
    </div>
  );
};