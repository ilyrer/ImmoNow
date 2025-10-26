# Social Media OAuth Setup Guide

## Übersicht

Dieses Dokument beschreibt die Einrichtung der OAuth-Integration für Social Media Plattformen (Facebook, Instagram, TikTok) im Social Media Hub.

## Backend-Konfiguration

### 1. Umgebungsvariablen

Erstellen Sie eine `.env` Datei im Backend-Verzeichnis mit folgenden Variablen:

```bash
# Facebook OAuth
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# Instagram OAuth
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# TikTok OAuth
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# OAuth Redirect URI
SOCIAL_OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Encryption Key für Token-Verschlüsselung (32 Zeichen)
SOCIAL_TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### 2. Datenbank-Migration

Führen Sie die Migration aus, um TikTok-Unterstützung hinzuzufügen:

```bash
cd backend
python manage.py migrate
```

## Frontend-Konfiguration

### 1. OAuth-Callback-Route

Die OAuth-Callback-Route ist bereits in `App.jsx` konfiguriert:

```jsx
<Route path="/oauth/callback" element={<OAuthCallback />} />
<Route path="/oauth/:platform/callback" element={<OAuthCallback />} />
```

### 2. OAuth-Modal

Das `OAuthConnectModal` ist bereits in die `AccountsView` integriert und wird automatisch angezeigt, wenn der Benutzer ein Social Media Konto verbinden möchte.

## Plattform-spezifische Einrichtung

### Facebook

1. Gehen Sie zu [Facebook Developers](https://developers.facebook.com/)
2. Erstellen Sie eine neue App
3. Fügen Sie das "Facebook Login" Produkt hinzu
4. Konfigurieren Sie die OAuth-Redirect-URI: `http://localhost:3000/oauth/callback`
5. Fügen Sie die folgenden Berechtigungen hinzu:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`

### Instagram

1. Verwenden Sie die Facebook App (Instagram ist Teil von Facebook)
2. Aktivieren Sie Instagram Basic Display API
3. Fügen Sie die folgenden Berechtigungen hinzu:
   - `user_profile`
   - `user_media`

### TikTok

1. Gehen Sie zu [TikTok for Developers](https://developers.tiktok.com/)
2. Erstellen Sie eine neue App
3. Aktivieren Sie TikTok Login Kit
4. Konfigurieren Sie die OAuth-Redirect-URI: `http://localhost:3000/oauth/callback`
5. Fügen Sie die folgenden Berechtigungen hinzu:
   - `user.info.basic`
   - `video.publish`

## API-Endpunkte

### OAuth-Autorisierung starten

```http
POST /api/v1/social/oauth/{platform}/authorize
```

**Parameter:**
- `platform`: facebook, instagram, tiktok

**Response:**
```json
{
  "auth_url": "https://platform.com/oauth/authorize?..."
}
```

### OAuth-Callback verarbeiten

```http
GET /api/v1/social/oauth/{platform}/callback
```

**Parameter:**
- `code`: OAuth-Autorisierungscode
- `state`: OAuth-State-Parameter

**Response:**
```json
{
  "id": "account_id",
  "platform": "facebook",
  "account_name": "Account Name",
  "status": "active"
}
```

### Token aktualisieren

```http
POST /api/v1/social/oauth/{platform}/refresh
```

**Body:**
```json
{
  "account_id": "account_id"
}
```

## Sicherheit

### Token-Verschlüsselung

Alle Access- und Refresh-Tokens werden verschlüsselt in der Datenbank gespeichert:

```python
# Token verschlüsseln
encrypted_token = oauth_service.encrypt_token(access_token)

# Token entschlüsseln
decrypted_token = oauth_service.decrypt_token(encrypted_token)
```

### State-Parameter

Der OAuth-State-Parameter wird verwendet, um CSRF-Angriffe zu verhindern:

```python
state_data = {
    'user_id': user_id,
    'tenant_id': tenant_id,
    'nonce': secrets.token_urlsafe(32),
    'timestamp': datetime.utcnow().isoformat()
}
```

## Fehlerbehandlung

### Häufige Fehler

1. **Invalid Client ID**: Überprüfen Sie die Umgebungsvariablen
2. **Redirect URI Mismatch**: Stellen Sie sicher, dass die Redirect-URI in der App-Konfiguration korrekt ist
3. **Token Expired**: Implementieren Sie automatische Token-Aktualisierung
4. **Scope Insufficient**: Überprüfen Sie die angeforderten Berechtigungen

### Debugging

Aktivieren Sie Debug-Logging:

```python
import logging
logging.getLogger('app.services.oauth_service').setLevel(logging.DEBUG)
```

## Testing

### Lokale Entwicklung

1. Starten Sie das Backend:
```bash
cd backend
python manage.py runserver
```

2. Starten Sie das Frontend:
```bash
cd real-estate-dashboard
npm start
```

3. Navigieren Sie zu `/social-hub` und testen Sie die OAuth-Verbindung

### OAuth-Flow testen

1. Klicken Sie auf "Neues Profil" im Social Hub
2. Wählen Sie eine Plattform aus
3. Klicken Sie auf "Verbinden"
4. Folgen Sie dem OAuth-Flow im Popup-Fenster
5. Überprüfen Sie, ob das Konto erfolgreich verbunden wurde

## Produktions-Deployment

### Umgebungsvariablen

Stellen Sie sicher, dass alle OAuth-Credentials in der Produktionsumgebung konfiguriert sind:

```bash
# Produktions-URLs
SOCIAL_OAUTH_REDIRECT_URI=https://yourdomain.com/oauth/callback
FRONTEND_URL=https://yourdomain.com
```

### HTTPS-Anforderung

Alle OAuth-Provider erfordern HTTPS in der Produktion. Stellen Sie sicher, dass Ihr Server SSL-Zertifikate konfiguriert hat.

## Support

Bei Problemen mit der OAuth-Integration:

1. Überprüfen Sie die Logs im Backend
2. Testen Sie die OAuth-URLs manuell
3. Überprüfen Sie die App-Konfiguration in den Developer-Portalen
4. Stellen Sie sicher, dass alle Umgebungsvariablen korrekt gesetzt sind
