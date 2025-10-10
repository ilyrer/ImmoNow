# 🔐 TOKEN ABGELAUFEN - SCHNELLANLEITUNG

## ⚠️ PROBLEM
Dein Authentication Token ist **ABGELAUFEN**!

```json
Token Details:
{
  "exp": 1759947585,  // Expiration: Oktober 2025 (ABGELAUFEN!)
  "email": "isuf@info.de",
  "role": "owner"
}
```

## ✅ SOFORTLÖSUNG

### Option 1: Neu einloggen (EMPFOHLEN)
1. Die Seite wird automatisch zum Login weitergeleitet
2. Melde dich mit deinen Zugangsdaten neu an
3. Neuer Token wird automatisch gespeichert

### Option 2: Backend starten für neuen Token
Wenn Backend auf `localhost:8000` läuft:

```powershell
cd backend
python manage.py runserver
```

Dann im Browser:
1. Gehe zu `/login`
2. Melde dich an mit:
   - Email: `isuf@info.de`
   - Passwort: [dein Passwort]

### Option 3: Mock-Token für Tests (TEMPORÄR)
Wenn du nur schnell testen willst OHNE Backend:

```javascript
// In Browser Console eingeben:
localStorage.setItem('access_token', 'mock-token-for-testing');
localStorage.setItem('authToken', 'mock-token-for-testing');
localStorage.setItem('tenant_id', '04dacceb-fed7-4e79-a037-ed55d47c44fd');
location.reload();
```

**⚠️ WICHTIG:** Mock-Token funktioniert nur für Frontend-Tests, NICHT für echte Backend-Calls!

---

## 🔧 WAS WURDE GEFIXT

### 1. Automatische Weiterleitung
Bei 401 Unauthorized wird jetzt automatisch:
- Token aus localStorage gelöscht
- Nach 1 Sekunde zu `/login` weitergeleitet
- Benutzerfreundliche Fehlermeldung angezeigt

### 2. Bessere Fehlermeldungen
Widgets zeigen jetzt:
- ❌ Vorher: "Fehler beim Laden der Aufgaben"
- ✅ Nachher: "Session abgelaufen - Bitte neu anmelden"

### 3. apiClient prüft Token
```typescript
// Bei 401 Response:
if (response.status === 401) {
  console.error('🔐 Authentication failed - Token might be expired');
  this.clearAuth();
  localStorage.removeItem('authToken');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('access_token');
  
  // Redirect to login
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
}
```

---

## 📋 AKTUELLER STATUS

### Deine localStorage Keys:
```
authToken: eyJhbGci... (ABGELAUFEN!)
auth_token: eyJhbGci... (ABGELAUFEN!)
access_token: mock-token (UNGÜLTIG)
refreshToken: eyJhbGci... (kann für Refresh verwendet werden)
tenant_id: 04dacceb-fed7-4e79-a037-ed55d47c44fd (OK)
```

### Was passiert jetzt:
1. ✅ apiClient erkennt 401 Fehler
2. ✅ Löscht abgelaufene Tokens
3. ✅ Zeigt "Session abgelaufen" Meldung
4. ✅ Leitet automatisch zu Login weiter

---

## 🚀 NÄCHSTE SCHRITTE

### Sofort:
1. **Warte auf automatische Weiterleitung** zu `/login` (oder gehe manuell)
2. **Melde dich neu an** mit deinen Zugangsdaten
3. **Neuer Token wird gespeichert**
4. **Dashboard lädt automatisch**

### Langfristig (TODO):
- [ ] Automatic Token Refresh implementieren
- [ ] Refresh Token verwenden statt Neuanmeldung
- [ ] Token Expiration Warnung vor Ablauf
- [ ] Silent Token Refresh im Hintergrund

---

## 🔑 TOKEN REFRESH (für später)

Dein Refresh Token ist noch gültig:
```
refreshToken: eyJhbGci...
Expires: 2026-02-06 (noch ~4 Monate gültig!)
```

Kann verwendet werden um neuen Access Token zu bekommen ohne Neuanmeldung:
```typescript
// POST /api/v1/auth/refresh
{
  "refresh_token": "eyJhbGci..."
}

// Response:
{
  "access_token": "neuer-token...",
  "refresh_token": "gleicher-refresh-token..."
}
```

---

## ❓ HÄUFIGE FRAGEN

### Warum ist der Token abgelaufen?
Access Tokens haben kurze Laufzeit (1 Stunde) aus Sicherheitsgründen.

### Muss ich mich jedes Mal neu anmelden?
Nein! Mit Token Refresh (kommt bald) wird das automatisch.

### Kann ich die Ablaufzeit verlängern?
Ja, im Backend in `settings.py`:
```python
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Erhöhe auf z.B. 480 (8 Stunden)
```

### Funktionieren die Widgets jetzt?
Nach Neuanmeldung: **JA!** 
Ohne gültigen Token: Zeigen "Session abgelaufen" Meldung

---

**Status**: ✅ Fehlerbehandlung verbessert - Bitte neu anmelden!  
**Datum**: 2024-01-18  
**Fix**: Automatische Weiterleitung bei abgelaufenem Token
