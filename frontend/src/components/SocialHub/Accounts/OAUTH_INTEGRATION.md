# OAuth Integration Guide

## Aktueller Stand

Derzeit verwendet das System eine **simulierte OAuth-Authentifizierung** für Social Media Accounts. Dies ermöglicht es, die Benutzeroberfläche und den Flow zu testen, ohne echte API-Credentials zu benötigen.

## So funktioniert die aktuelle Simulation

### 1. Account-Verwaltung
- **Datei**: `AccountsView.tsx`
- Zeigt alle verfügbaren Social Media Plattformen
- Button "Verbinden" öffnet OAuth-Modal
- Nach "Autorisierung" wird Account als verbunden markiert

### 2. Mock Service
- **Datei**: `mockService.ts`
- Simuliert Backend-API-Calls
- Verwaltet Account-Status im Frontend-State
- Simuliert API-Verzögerungen für realistische UX

### 3. OAuth Modal
Das Modal zeigt:
- Platform-Branding (Farben, Icons)
- Liste der Berechtigungen
- Profil-/Seiten-Auswahl
- Autorisierungs-Button
- Info-Box über Demo-Modus

## Migration zu echtem OAuth

### Schritt 1: Backend API erstellen

Erstellen Sie Backend-Endpunkte für:

```python
# backend/cim_app/social_media/views.py

@api_view(['GET'])
def initiate_oauth(request, platform):
    """
    Initiiert OAuth-Flow für eine Plattform
    Returns: OAuth authorization URL
    """
    oauth_url = get_oauth_url(platform)
    return Response({
        'authorization_url': oauth_url,
        'state': generate_state_token()
    })

@api_view(['POST'])
def oauth_callback(request, platform):
    """
    Callback nach erfolgreicher OAuth-Authentifizierung
    Speichert Access Token im Backend
    """
    code = request.data.get('code')
    state = request.data.get('state')
    
    # Validate state token
    # Exchange code for access token
    # Store tokens securely
    # Return account info
    
    return Response({
        'account_id': account.id,
        'connected': True,
        'display_name': account.display_name
    })

@api_view(['GET'])
def list_accounts(request):
    """Liste aller verbundenen Accounts"""
    accounts = SocialMediaAccount.objects.filter(user=request.user)
    return Response(AccountSerializer(accounts, many=True).data)

@api_view(['DELETE'])
def disconnect_account(request, account_id):
    """Trennt ein verbundenes Konto"""
    account = get_object_or_404(SocialMediaAccount, id=account_id, user=request.user)
    account.delete()
    return Response(status=204)
```

### Schritt 2: OAuth URLs konfigurieren

Für jede Plattform benötigen Sie:

#### Instagram (via Facebook)
```python
INSTAGRAM_OAUTH_URL = "https://api.instagram.com/oauth/authorize"
INSTAGRAM_CLIENT_ID = "your_client_id"
INSTAGRAM_REDIRECT_URI = "https://your-domain.com/api/oauth/callback/instagram"
INSTAGRAM_SCOPE = "instagram_basic,instagram_content_publish"
```

#### Facebook
```python
FACEBOOK_OAUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth"
FACEBOOK_CLIENT_ID = "your_app_id"
FACEBOOK_REDIRECT_URI = "https://your-domain.com/api/oauth/callback/facebook"
FACEBOOK_SCOPE = "pages_manage_posts,pages_read_engagement"
```

#### LinkedIn
```python
LINKEDIN_OAUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_CLIENT_ID = "your_client_id"
LINKEDIN_REDIRECT_URI = "https://your-domain.com/api/oauth/callback/linkedin"
LINKEDIN_SCOPE = "w_member_social"
```

#### TikTok
```python
TIKTOK_OAUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
TIKTOK_CLIENT_KEY = "your_client_key"
TIKTOK_REDIRECT_URI = "https://your-domain.com/api/oauth/callback/tiktok"
TIKTOK_SCOPE = "user.info.basic,video.publish"
```

#### YouTube
```python
YOUTUBE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
YOUTUBE_CLIENT_ID = "your_client_id"
YOUTUBE_REDIRECT_URI = "https://your-domain.com/api/oauth/callback/youtube"
YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.upload"
```

### Schritt 3: Frontend Service erstellen

Ersetzen Sie `mockService.ts` durch einen echten Service:

```typescript
// realAccountService.ts

import { apiClient } from '@/api/config';
import { SimpleSocialAccount, SocialPlatform } from './types';

class RealAccountService {
  /**
   * Initiiert OAuth-Flow
   */
  async initiateOAuth(platform: SocialPlatform): Promise<string> {
    const response = await apiClient.get(`/api/social-media/oauth/initiate/${platform}`);
    return response.data.authorization_url;
  }

  /**
   * Öffnet OAuth-Popup und wartet auf Callback
   */
  async connect(platform: SocialPlatform): Promise<SimpleSocialAccount> {
    // Hole OAuth URL
    const authUrl = await this.initiateOAuth(platform);
    
    // Öffne Popup
    const popup = window.open(
      authUrl,
      'OAuth Authorization',
      'width=600,height=700'
    );
    
    // Warte auf Callback
    return new Promise((resolve, reject) => {
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          // Hole aktualisierten Account-Status
          this.getAccount(platform)
            .then(resolve)
            .catch(reject);
        }
      }, 500);
    });
  }

  /**
   * Holt Account-Info
   */
  async getAccount(platform: SocialPlatform): Promise<SimpleSocialAccount> {
    const response = await apiClient.get(`/api/social-media/accounts/${platform}`);
    return response.data;
  }

  /**
   * Liste aller Accounts
   */
  async listAccounts(): Promise<SimpleSocialAccount[]> {
    const response = await apiClient.get('/api/social-media/accounts');
    return response.data;
  }

  /**
   * Trennt Account
   */
  async disconnect(accountId: string): Promise<void> {
    await apiClient.delete(`/api/social-media/accounts/${accountId}`);
  }
}

export const realAccountService = new RealAccountService();
```

### Schritt 4: Frontend-Komponente anpassen

In `AccountsView.tsx` ändern Sie:

```typescript
// Vorher:
import { mockAccountService } from './mockService';

// Nachher:
import { realAccountService } from './realAccountService';

// Im Code:
const handleConnectClick = async (platform: SocialPlatform) => {
  setLoading(platform);
  
  try {
    // OAuth-Flow startet automatisch
    const updatedAccount = await realAccountService.connect(platform);
    setAccounts(prev => prev.map(acc => 
      acc.platform === platform ? updatedAccount : acc
    ));
  } catch (error) {
    console.error('OAuth failed:', error);
    alert('Authentifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  } finally {
    setLoading(null);
  }
};
```

### Schritt 5: OAuth Callback Handler

Erstellen Sie eine Callback-Seite:

```typescript
// pages/OAuthCallback.tsx

import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/config';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const platform = searchParams.get('platform');

      if (!code || !state || !platform) {
        console.error('Invalid callback parameters');
        window.close();
        return;
      }

      try {
        // Sende Code an Backend
        await apiClient.post(`/api/social-media/oauth/callback/${platform}`, {
          code,
          state
        });

        // Schließe Popup
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'oauth_success', 
            platform 
          }, '*');
          window.close();
        } else {
          // Kein Popup, leite zur Hauptseite
          navigate('/social-hub/accounts');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'oauth_error', 
            platform 
          }, '*');
          window.close();
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Authentifizierung wird verarbeitet...</p>
      </div>
    </div>
  );
}
```

## Sicherheitshinweise

### 1. Token-Speicherung
- **NIEMALS** Access Tokens im Frontend speichern
- Tokens nur im Backend speichern (verschlüsselt)
- Verwenden Sie sichere Session-Cookies

### 2. State Parameter
- Generieren Sie kryptographisch sichere State-Tokens
- Validieren Sie State-Parameter im Callback
- Verhindert CSRF-Angriffe

### 3. Redirect URIs
- Whitelist erlaubter Redirect URIs im Backend
- Verwenden Sie HTTPS für alle OAuth-Flows
- Konfigurieren Sie Redirect URIs in den Platform-Apps

### 4. Token-Refresh
- Implementieren Sie automatisches Token-Refresh
- Speichern Sie Refresh-Tokens sicher
- Behandeln Sie abgelaufene Tokens graceful

## Testen der Integration

### 1. Entwicklungsumgebung
```bash
# Backend starten mit OAuth-Endpoints
cd backend/cim_app
python manage.py runserver

# Frontend starten
cd real-estate-dashboard
npm start
```

### 2. Test-Accounts
Erstellen Sie Test-Accounts für jede Plattform:
- Instagram: Developer-Konto erforderlich
- Facebook: Test-App erstellen
- LinkedIn: Developer-Account
- TikTok: Developer Portal
- YouTube: Google Cloud Project

### 3. Lokales Testen mit ngrok
```bash
# ngrok für lokale HTTPS-URL
ngrok http 3000

# Verwenden Sie ngrok-URL als Redirect URI
https://xyz.ngrok.io/oauth/callback
```

## Platform-spezifische Dokumentation

- **Instagram**: https://developers.facebook.com/docs/instagram-basic-display-api
- **Facebook**: https://developers.facebook.com/docs/facebook-login
- **LinkedIn**: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
- **TikTok**: https://developers.tiktok.com/doc/login-kit-web/
- **YouTube**: https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps

## Hilfe und Support

Bei Fragen zur OAuth-Integration:
1. Überprüfen Sie die Platform-Dokumentation
2. Testen Sie mit Postman/cURL zuerst
3. Verwenden Sie Browser DevTools für Debugging
4. Loggen Sie alle Schritte im Backend

## Nächste Schritte

1. ☐ Backend-Endpunkte implementieren
2. ☐ App-Credentials bei Plattformen registrieren
3. ☐ RealAccountService erstellen
4. ☐ OAuth-Callback-Handler implementieren
5. ☐ Token-Storage einrichten
6. ☐ Error-Handling verbessern
7. ☐ Testen mit echten Accounts
8. ☐ Produktions-Deployment vorbereiten
