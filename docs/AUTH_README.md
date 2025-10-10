# Authentication & Multi-Tenancy System

## Übersicht

Dieses System implementiert ein vollständiges Authentication & Multi-Tenancy System für die CIM Immobilien-Plattform.

## Features

### ✅ Backend (Django + FastAPI)

1. **User Management**
   - Custom User Model mit Email-basierter Authentifizierung
   - Password Hashing mit bcrypt
   - Email-Verifizierung (vorbereitet)
   - User Profile mit Avatar, Sprache, Timezone

2. **Multi-Tenancy**
   - Tenant Model für Organisationen
   - TenantUser für User-Tenant Beziehungen mit Rollen
   - Tenant-Isolation über JWT Claims
   - Subscription Management (Free, Basic, Professional, Enterprise)

3. **Rollen & Permissions**
   - **Owner**: Vollzugriff, kann alles verwalten
   - **Admin**: Fast Vollzugriff, kann User verwalten
   - **Manager**: Kann Properties und Tasks verwalten
   - **Agent**: Standard Immobilienmakler
   - **Viewer**: Nur Lese-Zugriff
   
   Granulare Permissions:
   - `can_manage_properties`
   - `can_manage_documents`
   - `can_manage_users`
   - `can_view_analytics`
   - `can_export_data`

4. **JWT Authentication**
   - Access Tokens (1 Stunde Gültigkeit)
   - Refresh Tokens (30 Tage Gültigkeit)
   - Token Payload enthält: user_id, email, tenant_id, role

5. **API Endpoints**
   ```
   POST /api/v1/auth/register     - Neuen User & Tenant registrieren
   POST /api/v1/auth/login        - User einloggen
   POST /api/v1/auth/refresh      - Access Token erneuern
   GET  /api/v1/auth/me           - Aktuellen User abrufen
   GET  /api/v1/auth/me/tenant    - Tenant-Info & Permissions abrufen
   POST /api/v1/auth/logout       - User ausloggen
   GET  /api/v1/auth/verify-token - Token validieren
   ```

### ✅ Frontend (React + TypeScript)

1. **Auth Service** (`src/services/api.service.ts`)
   - `login()` - Mit echten API Calls
   - `register()` - User & Tenant Registration
   - `logout()` - Token cleanup
   - `getCurrentUser()` - User info mit Permissions
   - `isAuthenticated()` - Auth Status Check
   - `testBackendConnection()` - Backend Health Check
   - `debugTokens()` - Token Debug Helper

2. **Token Management**
   - Automatisches Speichern von Tokens in localStorage
   - authToken, refreshToken, tenantId, tenantSlug
   - Automatic Authorization Header injection

3. **User Context** (vorbereitet für Erweiterung)
   - User State Management
   - Permissions Check Helper
   - Tenant Switching Support

## Installation & Setup

### Backend Setup

1. **Dependencies installieren**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Django Settings konfigurieren**
   
   In `backend/settings.py` den AUTH_USER_MODEL setzen:
   ```python
   AUTH_USER_MODEL = 'app.User'
   ```

3. **Migrationen erstellen und ausführen**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Superuser erstellen** (optional)
   ```bash
   python manage.py createsuperuser
   ```

5. **Server starten**
   ```bash
   python manage.py runserver
   # oder mit FastAPI:
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. **Dependencies installieren** (bereits done)
   ```bash
   cd real-estate-dashboard
   npm install
   ```

2. **Environment Variables** (`.env.local`)
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

3. **Server starten**
   ```bash
   npm start
   ```

## Verwendung

### Registration Flow

```typescript
// Frontend Code
const handleRegister = async () => {
  try {
    const response = await apiService.register({
      email: "user@example.com",
      password: "SecurePass123",
      first_name: "Max",
      last_name: "Mustermann",
      tenant_name: "Mustermann Immobilien GmbH",
      plan: "professional",
      billing_cycle: "yearly"
    });
    
    // User ist automatisch eingeloggt
    setUser(response.user);
    // Tokens sind in localStorage gespeichert
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### Login Flow

```typescript
// Frontend Code
const handleLogin = async () => {
  try {
    const response = await apiService.login({
      email: "user@example.com",
      password: "SecurePass123"
    });
    
    setUser(response.user);
    // Tokens sind in localStorage gespeichert
    
    // User kann zu mehreren Tenants gehören
    console.log('Available tenants:', response.user.available_tenants);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Protected API Calls

```typescript
// Alle API Calls verwenden automatisch den Token aus localStorage
const fetchProperties = async () => {
  try {
    const response = await apiClient.get('/api/v1/properties');
    // Request enthält automatisch: Authorization: Bearer <token>
    // Tenant-Isolation über JWT Claims
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token abgelaufen, User ausloggen
      await apiService.logout();
      navigate('/login');
    }
  }
};
```

### Permission Checks

```typescript
// Im Frontend
if (user.permissions.can_manage_users) {
  // Show user management UI
}

if (user.role === 'owner' || user.role === 'admin') {
  // Show admin features
}
```

## API Request/Response Beispiele

### Register Request
```json
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "first_name": "Max",
  "last_name": "Mustermann",
  "phone": "+49 123 456789",
  "tenant_name": "Mustermann Immobilien GmbH",
  "company_email": "info@mustermann-immobilien.de",
  "plan": "professional",
  "billing_cycle": "yearly"
}
```

### Register Response
```json
{
  "message": "Registration successful! Welcome to Mustermann Immobilien GmbH",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "Max",
    "last_name": "Mustermann",
    "is_active": true,
    "email_verified": false
  },
  "tenant": {
    "id": "uuid",
    "name": "Mustermann Immobilien GmbH",
    "slug": "mustermann-immobilien-gmbh",
    "plan": "professional",
    "is_active": true
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Login Request
```json
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "tenant_id": "optional-tenant-uuid"
}
```

### Login Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "Max",
    "last_name": "Mustermann"
  },
  "tenant": {
    "id": "uuid",
    "name": "Mustermann Immobilien GmbH",
    "slug": "mustermann-immobilien-gmbh",
    "plan": "professional"
  },
  "tenant_role": {
    "tenant_id": "uuid",
    "tenant_name": "Mustermann Immobilien GmbH",
    "role": "owner",
    "can_manage_properties": true,
    "can_manage_documents": true,
    "can_manage_users": true,
    "can_view_analytics": true,
    "can_export_data": true
  },
  "available_tenants": [...]
}
```

## Sicherheit

### Password Requirements
- Mindestens 8 Zeichen
- Mindestens 1 Großbuchstabe
- Mindestens 1 Kleinbuchstabe
- Mindestens 1 Zahl

### Token Security
- Access Tokens: Kurze Lebensdauer (1 Stunde)
- Refresh Tokens: Längere Lebensdauer (30 Tage)
- Tokens enthalten keine sensiblen Daten
- JWT Secret Key muss in Production geändert werden!

### Tenant Isolation
- Alle API Requests sind automatisch Tenant-isoliert
- Middleware extrahiert tenant_id aus JWT
- Users können nur Daten ihres Tenants sehen/bearbeiten

## Nächste Schritte

### TODO: Login/Register UI Komponenten
- [ ] LoginForm Component erstellen
- [ ] RegisterForm Component erstellen
- [ ] Password Strength Indicator
- [ ] Email Verification Flow
- [ ] Forgot Password Flow
- [ ] User Profile Page
- [ ] Tenant Switcher Component

### TODO: Protected Routes
- [ ] PrivateRoute Component
- [ ] Role-based Route Guards
- [ ] Permission-based Component Rendering
- [ ] Redirect nach Login

### TODO: Advanced Features
- [ ] Email Verification
- [ ] Password Reset via Email
- [ ] Two-Factor Authentication
- [ ] Session Management
- [ ] Token Blacklisting
- [ ] Audit Log für User Actions
- [ ] User Invitation System
- [ ] Team Management UI

## Troubleshooting

### "testBackendConnection is not a function"
**Lösung**: Browser Cache leeren oder Hard Reload (Ctrl+F5)

### "User model not found"
**Lösung**: Migrationen ausführen:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Token bereits abgelaufen
**Lösung**: Refresh Token verwenden:
```typescript
const refreshToken = localStorage.getItem('refreshToken');
const response = await apiClient.post('/api/v1/auth/refresh', {
  refresh_token: refreshToken
});
localStorage.setItem('authToken', response.data.access_token);
```

## Support

Bei Fragen oder Problemen:
1. Logs checken (Browser Console + Backend Console)
2. Token mit `apiService.debugTokens()` überprüfen
3. Django Admin für direkte DB-Zugriffe verwenden

