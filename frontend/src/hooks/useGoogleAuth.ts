import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { googleAuthService, GoogleUserInfo } from '../services/googleAuth';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = async (): Promise<GoogleUserInfo> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔐 Starting Google Sign-In...');
      const userInfo = await googleAuthService.signIn();
      console.log('✅ Google Sign-In successful:', userInfo);
      toast.success('Successfully authenticated with Google!');
      
      return userInfo;
    } catch (err: any) {
      console.error('❌ Google Sign-In failed:', err);
      let errorMessage = err instanceof Error ? err.message : 'Google login failed';
      
      // Handle specific error cases
      if (errorMessage.includes('popup_closed_by_user')) {
        errorMessage = 'Login wurde abgebrochen';
      } else if (errorMessage.includes('origin') || errorMessage.includes('Not a valid origin')) {
        errorMessage = 'Google Sign-In ist nicht für diese Domain konfiguriert.\n\nBitte fügen Sie http://localhost:3000 als autorisierte JavaScript-Ursprung in der Google Cloud Console hinzu:\n1. Gehen Sie zu https://console.cloud.google.com/apis/credentials\n2. Wählen Sie Ihre OAuth 2.0 Client ID\n3. Fügen Sie http://localhost:3000 unter "Autorisierte JavaScript-Ursprünge" hinzu';
      } else if (errorMessage.includes('idpiframe_initialization_failed')) {
        errorMessage = 'Google Sign-In konnte nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung und Browser-Einstellungen.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOutFromGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await googleAuthService.signOut();
      toast.success('Successfully signed out from Google!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign out failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentGoogleUser = async (): Promise<GoogleUserInfo | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      return await googleAuthService.getCurrentUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current Google user';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getGoogleAccessToken = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      return await googleAuthService.getAccessToken();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get Google access token';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    loginWithGoogle,
    signOutFromGoogle,
    getCurrentGoogleUser,
    getGoogleAccessToken,
    isLoading,
    error
  };
};
