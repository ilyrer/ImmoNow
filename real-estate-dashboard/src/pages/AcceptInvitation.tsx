import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Eye, EyeOff, Lock, User, Mail } from 'lucide-react';
import { GlassCard, GlassButton, LoadingSpinner } from '../components/admin/GlassUI';
import { apiClient } from '../api/config';

interface InvitationData {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  position?: string;
  expires_at: string;
  is_valid: boolean;
}

interface PasswordSetupData {
  password: string;
  confirmPassword: string;
}

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [passwordData, setPasswordData] = useState<PasswordSetupData>({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/auth/validate-invitation/${token}`);
      setInvitationData(response.data);
      
      if (!response.data.is_valid) {
        setError('Diese Einladung ist nicht mehr gültig oder bereits abgelaufen.');
      }
    } catch (error: any) {
      console.error('Error validating invitation:', error);
        setError(typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Einladung konnte nicht validiert werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (field: keyof PasswordSetupData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Passwort muss mindestens 8 Zeichen lang sein');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Passwort muss mindestens eine Zahl enthalten');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Passwort muss mindestens ein Sonderzeichen enthalten');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !invitationData) return;
    
    // Validate passwords
    const passwordErrors = validatePassword(passwordData.password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(', '));
      return;
    }
    
    if (passwordData.password !== passwordData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await apiClient.post('/auth/accept-invitation', {
        token,
        password: passwordData.password
      });
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Account erfolgreich erstellt! Sie können sich jetzt anmelden.',
            email: invitationData.email
          }
        });
      }, 3000);
      
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Fehler beim Erstellen des Accounts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <GlassCard className="p-8">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 dark:text-gray-400">Einladung wird validiert...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <GlassCard className="p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-red-500/20 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Einladung ungültig
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </p>
            <GlassButton 
              onClick={() => navigate('/login')}
              variant="primary"
              className="mt-4"
            >
              Zur Anmeldung
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <GlassCard className="p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-green-500/20 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Account erstellt!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ihr Account wurde erfolgreich erstellt. Sie werden zur Anmeldung weitergeleitet...
            </p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <GlassCard className="p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="p-4 bg-blue-500/20 rounded-full inline-block mb-4">
            <User className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Einladung annehmen
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Richten Sie Ihr Passwort ein, um Ihr Konto zu aktivieren
          </p>
        </div>

        {invitationData && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Einladungsdetails
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {invitationData.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {invitationData.first_name} {invitationData.last_name}
                </span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Rolle: <span className="font-medium">{invitationData.role}</span>
              </div>
              {invitationData.department && (
                <div className="text-gray-600 dark:text-gray-400">
                  Abteilung: <span className="font-medium">{invitationData.department}</span>
                </div>
              )}
              <div className="text-gray-500 dark:text-gray-500 text-xs">
                Gültig bis: {formatExpiryDate(invitationData.expires_at)}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-600 dark:text-red-400 text-sm">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.password}
                onChange={(e) => handlePasswordChange('password', e.target.value)}
                required
                className="w-full px-4 py-3 pl-12 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sicheres Passwort eingeben"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Mindestens 8 Zeichen mit Groß-, Kleinbuchstaben, Zahlen und Sonderzeichen
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Passwort bestätigen
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                required
                className="w-full px-4 py-3 pl-12 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Passwort wiederholen"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <GlassButton
            variant="primary"
            className="w-full"
            disabled={isSubmitting || !invitationData?.is_valid}
          >
            {isSubmitting ? 'Account wird erstellt...' : 'Account erstellen'}
          </GlassButton>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bereits ein Konto?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Zur Anmeldung
            </button>
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default AcceptInvitation;
