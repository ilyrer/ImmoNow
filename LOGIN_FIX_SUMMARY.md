# Login Fix - Zusammenfassung

## Problem
1. **Unauthorized Errors**: Dashboard zeigt "unauthorized" beim Laden
2. **Kein Redirect**: Nach erfolgreichem Login bleibt User auf Login-Seite
3. **Inkonsistente Token-Storage**: Mehrere localStorage Keys für denselben Token

## Root Cause
Die Authentifizierungs-Tokens wurden in mehreren Varianten gespeichert:
- `authToken` vs `auth_token`
- `tenantId` vs `tenant_id`

Das führte dazu, dass:
- `api.service.ts` schrieb in `authToken`
- `AuthContext.tsx` las aus `auth_token`
- API Client hatte keine Auth-Header gesetzt
- Navigation funktionierte nicht mit `replace: true`

## Implementierte Fixes

### 1. Konsistente Token-Storage
**Datei**: `real-estate-dashboard/src/services/api.service.ts`

```typescript
// Beide Keys setzen für Kompatibilität
localStorage.setItem('auth_token', response.data.access_token);  // NEU - Primary
localStorage.setItem('tenant_id', response.data.tenant.id);       // NEU - Primary
localStorage.setItem('authToken', response.data.access_token);    // OLD - Backward compat
localStorage.setItem('tenantId', response.data.tenant.id);        // OLD - Backward compat
```

### 2. Navigation mit Replace
**Datei**: `real-estate-dashboard/src/pages/AuthPage.tsx`

```typescript
// Redirect mit replace: true damit Back-Button nicht zur Login-Seite geht
navigate('/dashboard', { replace: true });
```

### 3. JWT Error Fix
**Datei**: `backend/app/core/security.py`

```python
# PyJWT 2.x verwendet InvalidTokenError statt JWTError
except jwt.InvalidTokenError:  # ✅ Neu
    raise ValidationError("Invalid token")
```

### 4. DateTime Serialization in Error Handlers
**Datei**: `backend/app/main.py`

```python
# Alle Exception Handler nutzen jetzt CustomJSONResponse
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return CustomJSONResponse(  # ✅ Statt JSONResponse
        status_code=500,
        content=ErrorResponse(...).model_dump()
    )
```

## Auth Flow

```
1. User gibt Credentials ein
   ↓
2. AuthPage.handleLogin() 
   ↓
3. apiService.login()
   → POST /api/v1/auth/login
   → Speichert Tokens in localStorage (beide Key-Varianten)
   → Ruft apiClient.setAuth(token, tenantId)
   ↓
4. apiClient.setAuth()
   → Setzt Header: Authorization: Bearer {token}
   → Setzt Header: X-Tenant-ID: {tenantId}
   ↓
5. AuthPage: setAuth() im AuthContext
   → Updated React State
   ↓
6. navigate('/dashboard', { replace: true })
   → User landet im Dashboard
   → Alle API Calls haben Auth Headers
```

## Testing

### Backend testen:
```bash
cd C:\Users\albian\Documents\CIM_Frontend\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Login Flow testen:
1. Öffne http://localhost:3000
2. Login mit Test-User
3. Browser Console checken:
   - `✅ Auth token set in API client after login`
   - `✅ Token: eyJ...` (erste 20 Zeichen)
   - `✅ Tenant ID: {uuid}`
   - `✅ Login successful: {user object}`
   - `✅ Navigating to /dashboard...`
4. Network Tab checken:
   - Alle Requests haben `Authorization: Bearer {token}` Header
   - Alle Requests haben `X-Tenant-ID: {uuid}` Header

### LocalStorage prüfen:
```javascript
// In Browser Console
console.log({
  auth_token: localStorage.getItem('auth_token'),
  tenant_id: localStorage.getItem('tenant_id'),
  authToken: localStorage.getItem('authToken'),   // Legacy
  tenantId: localStorage.getItem('tenantId')      // Legacy
});
```

## Erwartetes Verhalten

✅ Nach Login: Sofortiger Redirect zum Dashboard
✅ Dashboard lädt ohne Fehler
✅ Properties werden angezeigt
✅ Keine "Unauthorized" Errors
✅ Browser Back-Button geht nicht zurück zur Login-Seite
✅ Page Reload behält Login-Status bei (AuthContext lädt Tokens aus localStorage)

## Häufige Probleme

### Problem: "Unauthorized" nach Login
**Lösung**: Browser Console öffnen, prüfen ob `apiClient.setAuth()` aufgerufen wurde

### Problem: Keine Navigation nach Login
**Lösung**: `navigate('/dashboard', { replace: true })` muss mit replace flag sein

### Problem: Nach Page Reload ausgeloggt
**Lösung**: AuthContext muss Tokens beim Mount aus localStorage laden (bereits implementiert)

### Problem: 500 Errors mit "datetime not JSON serializable"
**Lösung**: CustomJSONResponse muss in allen Exception Handlers verwendet werden (bereits implementiert)

## Nächste Schritte

1. **Backend starten**: `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
2. **Frontend bereits läuft**: http://localhost:3000
3. **Neuen User registrieren** oder mit bestehendem einloggen
4. **Erwarte**: Direkter Redirect zum Dashboard ohne Fehler

## Debugging Commands

```bash
# Backend Logs live verfolgen
cd C:\Users\albian\Documents\CIM_Frontend\backend
python -m uvicorn app.main:app --reload --log-level debug

# Tokens im Backend prüfen
python -c "from app.core.security import security_manager; print(security_manager.create_access_token({'sub': 'test'}))"

# Django Password Hash Test
cd backend
python test_django_password.py
```
