/**
 * Browser-compatible Google OAuth Service
 * Uses Google's JavaScript API for client-side authentication
 */

const GOOGLE_CLIENT_ID = '569810192567-ng85oo2l395kuis7dd2fbqa6q8dtbslg.apps.googleusercontent.com';

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  verified_email: boolean;
}

class GoogleAuthService {
  private isInitialized = false;
  private gapi: any = null;

  /**
   * Initialize Google API
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Load Google API script if not already loaded
      if (!window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          window.gapi.load('auth2', () => {
            window.gapi.auth2.init({
              client_id: GOOGLE_CLIENT_ID,
            }).then(() => {
              this.gapi = window.gapi;
              this.isInitialized = true;
              resolve();
            }).catch(reject);
          });
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: GOOGLE_CLIENT_ID,
          }).then(() => {
            this.gapi = window.gapi;
            this.isInitialized = true;
            resolve();
          }).catch(reject);
        });
      }
    });
  }

  /**
   * Sign in with Google
   */
  async signIn(): Promise<GoogleUserInfo> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const authInstance = this.gapi.auth2.getAuthInstance();
      
      authInstance.signIn().then((googleUser: any) => {
        const profile = googleUser.getBasicProfile();
        const authResponse = googleUser.getAuthResponse();
        
        const userInfo: GoogleUserInfo = {
          id: profile.getId(),
          email: profile.getEmail(),
          name: profile.getName(),
          picture: profile.getImageUrl(),
          given_name: profile.getGivenName(),
          family_name: profile.getFamilyName(),
          verified_email: profile.getEmailVerified()
        };

        resolve(userInfo);
      }).catch(reject);
    });
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const authInstance = this.gapi.auth2.getAuthInstance();
    return authInstance.signOut();
  }

  /**
   * Check if user is signed in
   */
  async isSignedIn(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const authInstance = this.gapi.auth2.getAuthInstance();
    return authInstance.isSignedIn.get();
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<GoogleUserInfo | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const authInstance = this.gapi.auth2.getAuthInstance();
    const isSignedIn = authInstance.isSignedIn.get();
    
    if (!isSignedIn) {
      return null;
    }

    const googleUser = authInstance.currentUser.get();
    const profile = googleUser.getBasicProfile();
    
    return {
      id: profile.getId(),
      email: profile.getEmail(),
      name: profile.getName(),
      picture: profile.getImageUrl(),
      given_name: profile.getGivenName(),
      family_name: profile.getFamilyName(),
      verified_email: profile.getEmailVerified()
    };
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const authInstance = this.gapi.auth2.getAuthInstance();
    const isSignedIn = authInstance.isSignedIn.get();
    
    if (!isSignedIn) {
      return null;
    }

    const googleUser = authInstance.currentUser.get();
    const authResponse = googleUser.getAuthResponse();
    
    return authResponse.access_token;
  }
}

export const googleAuthService = new GoogleAuthService();
