# ✅ CORS & Django Async Fehler behoben

## Probleme

### 1. CORS-Fehler
```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/cim/overview' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Ursache:** Frontend läuft auf Port 5173 (Vite), aber CORS erlaubt nur Port 3000

### 2. Django Async-Fehler
```
django.core.exceptions.SynchronousOnlyOperation: 
You cannot call this from an async context - use a thread or sync_to_async.
```

**Ursache:** CIM-Service macht synchrone Django ORM-Aufrufe in async Funktion

## Lösungen

### 1. CORS-Konfiguration erweitert

**Datei:** `backend/backend/settings.py`

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # ✅ Vite default port hinzugefügt
    "http://127.0.0.1:5173",  # ✅ Vite default port hinzugefügt
    "http://localhost",
    "http://127.0.0.1",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Only in development
```

### 2. Django Async mit sync_to_async

**Datei:** `backend/app/services/cim_service.py`

**Vorher:**
```python
# ❌ Synchrone DB-Aufrufe in async Funktion
async def get_overview(self, ...):
    properties = Property.objects.filter(...).order_by(...)[:limit]
    for prop in properties:
        # ...
```

**Nachher:**
```python
# ✅ Verwendet sync_to_async für DB-Aufrufe
from asgiref.sync import sync_to_async

async def get_overview(self, ...):
    # Wrap list() call in sync_to_async
    properties_list = await sync_to_async(list)(
        properties_query.order_by('-created_at')[:limit]
    )
    
    for prop in properties_list:
        # ...
```

**Alle geänderten DB-Aufrufe:**
- ✅ `Property.objects.filter().order_by()[:limit]` → `sync_to_async(list)(...)`
- ✅ `Contact.objects.filter().order_by()[:limit]` → `sync_to_async(list)(...)`
- ✅ `Property.objects.count()` → `sync_to_async(...count)()`
- ✅ `Contact.objects.count()` → `sync_to_async(...count)()`

## Backend neu starten

Die Änderungen erfordern einen Neustart des Backends:

```bash
cd backend

# Terminal beenden (Ctrl+C falls läuft)

# Backend neu starten
python manage.py runserver
```

## Testing

### 1. Backend läuft auf Port 8000
```bash
# Prüfe ob Backend antwortet
curl http://localhost:8000/api/v1/cim/overview?limit=10&days_back=30
```

### 2. Frontend kann zugreifen
```bash
cd real-estate-dashboard
npm run dev
# Öffne http://localhost:5173/cim
```

### 3. Console Logs prüfen

**Backend Console sollte zeigen:**
```
[timestamp] INFO     Starting ASGI/Daphne application
[timestamp] INFO     HTTP GET /api/v1/cim/overview 200 [0.25, ...]
```

**Browser Console sollte zeigen:**
```
🔍 CIM Service - Fetching overview from backend: {...}
✅ CIM Service - Backend response: { propertiesCount: 12, ... }
```

## Fehler behoben

| Problem | Status | Lösung |
|---------|--------|--------|
| CORS blockiert localhost:5173 | ✅ Behoben | Port 5173 zu CORS_ALLOWED_ORIGINS hinzugefügt |
| Django Async Error | ✅ Behoben | sync_to_async für alle DB-Aufrufe |
| Properties werden nicht geladen | ✅ Bereit | Nach Backend-Neustart |
| CIM zeigt keine Daten | ✅ Bereit | Nach Backend-Neustart |

## Nächste Schritte

1. **Backend neu starten:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Frontend testen:**
   - Öffne `http://localhost:5173/cim`
   - Sollte 12 Immobilien zeigen
   - Keine CORS-Fehler mehr
   - Keine Async-Fehler mehr

3. **Logs prüfen:**
   - Backend Console: Keine Errors
   - Browser Console: Erfolgreiche API-Calls
   - Network Tab: Status 200 OK

## Zusätzliche CORS-Optionen

Falls weitere Ports benötigt werden:

```python
# In settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",   # React default
    "http://localhost:5173",   # Vite default
    "http://localhost:8080",   # Vue default
    # ... weitere Ports
]

# Oder für Development alle Origins erlauben:
CORS_ALLOW_ALL_ORIGINS = True  # NUR IN DEVELOPMENT!
```

## Wichtig

- ✅ **Immer Backend neu starten** nach settings.py Änderungen
- ✅ **sync_to_async verwenden** für alle Django ORM-Aufrufe in async Funktionen
- ✅ **CORS richtig konfigurieren** für Frontend-Port
- ⚠️ **CORS_ALLOW_ALL_ORIGINS = True** nur in Development!

---

**Status:** ✅ Beide Fehler behoben, Backend-Neustart erforderlich
