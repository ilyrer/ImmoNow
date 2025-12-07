# Mock-System Dokumentation

## Übersicht

Das CIM Frontend wurde vollständig auf ein Mock-System umgestellt, das es ermöglicht, die UI unabhängig von Live-Integrationen zu verfeinern. ALLE Features verwenden jetzt Mock-Daten für die UI-Entwicklung.

## Mock vs. Live-Daten Konfiguration

### Backend Konfiguration

**Datei:** `backend/cim_app/core/mock_config.py`

```python
class MockConfig:
    # Global Mock Mode (standardmäßig Mock in Development)
    MOCK_MODE: MockMode = MockMode.MOCK
    
    # Whitelist - diese Bereiche nutzen IMMER Live-Daten (JETZT LEER)
    LIVE_DATA_WHITELIST: Set[str] = {
        # Alle Features verwenden jetzt Mock-Daten
    }
    
    # Blacklist - diese Bereiche sind komplett entfernt
    REMOVED_FEATURES: Set[str] = {
        "calendar",
        "messages", 
        "video_meetings",
        "admin"
    }
```

### Frontend Konfiguration  

**Datei:** `real-estate-dashboard/src/api/mockConfig.ts`

```typescript
export const mockConfig: MockConfig = {
    // Mock in Development, Live in Production
    mockMode: process.env.NODE_ENV === 'production' ? MockMode.LIVE : MockMode.MOCK,
    
    // Whitelist - diese Features nutzen IMMER Live-Daten (JETZT LEER)
    liveDataWhitelist: new Set([
        // Alle Features verwenden jetzt Mock-Daten
    ]),
    
    // Blacklist - diese Features sind komplett entfernt
    removedFeatures: new Set([
        'calendar',
        'messages',
        'video-meetings', 
        'admin'
    ])
};
```

## Whitelist-Mechanik

Die Whitelist-Mechanik sorgt dafür, dass bestimmte Features **immer** Live-Daten verwenden, unabhängig vom globalen Mock-Mode:

### Mock-Daten Features
ALLE Features verwenden jetzt Mock-Daten (Whitelist wurde geleert):
- **Kontakte** (`contacts`) - **JETZT AUCH MOCK**
- **Immobilien** (`properties`) - **JETZT AUCH MOCK**
- **CIM-Übersicht** (`cim`) - **JETZT AUCH MOCK**
- Dashboard (`dashboard`)
- Aufgaben (`tasks`)
- Dokumente (`documents`) 
- Benachrichtigungen (`notifications`)
- Mitarbeiter (`employees`)
- Suche (`search`)
- Kennzahlen (`measures`)
- Chat (`chat`) - falls wieder aktiviert
- Unternehmen (`company`)
- Abrechnung (`billing`)
- Berichte (`reports`)
- Einstellungen (`settings`)

### Vollständig Entfernte Features
Diese Features sind komplett entfernt:
- Kalender (`calendar`)
- Nachrichten (`messages`)
- Video-Meetings (`video-meetings`)
- Admin-Bereich (`admin`)

## Mock-Daten Speicherorte

### Backend Mock-Daten
**Datei:** `backend/cim_app/core/mock_data.py`

Enthält alle Mock-Daten für das Backend:
- `get_dashboard_overview()` - Dashboard-Statistiken
- `get_tasks_list()` - Aufgaben-Mock-Daten
- `get_documents_list()` - Dokumente-Mock-Daten
- `get_notifications_list()` - Benachrichtigungs-Mock-Daten
- `get_employees_list()` - Mitarbeiter-Mock-Daten
- `get_contacts_list()` - **NEU** Kontakte-Mock-Daten
- `get_properties_list()` - **NEU** Immobilien-Mock-Daten  
- `get_cim_overview()` - **NEU** CIM-Übersichts-Mock-Daten
- etc.

### Frontend Mock-Daten
**Datei:** `real-estate-dashboard/src/api/mockData.ts`

Enthält alle Mock-Daten für das Frontend mit TypeScript-Typisierung:
- `getDashboardOverview()` - Dashboard-Mock-Daten
- `getTasksList()` - Aufgaben mit vollständiger Struktur
- `getDocumentsList()` - Dokumente mit Metadaten
- `getNotificationsList()` - Benachrichtigungen mit Lesestand
- etc.

## Implementierung

### Backend Implementation

1. **Mock-Middleware** (`core/mock_middleware.py`):
   - Abfangen von API-Requests
   - Prüfung gegen Whitelist
   - Rückgabe von Mock-Daten oder 410 Gone für entfernte Features

2. **Integration** in `main.py`:
   ```python
   from core.mock_middleware import MockResponseMiddleware
   app.add_middleware(MockResponseMiddleware)
   ```

### Frontend Implementation

1. **Mock-Interceptors** (`src/api/mockInterceptor.ts`):
   - Axios Request/Response Interceptors
   - Prüfung der Mock-Konfiguration
   - Generierung von Mock-Responses

2. **Integration** in `src/api/config.ts`:
   ```typescript
   import { installMockInterceptors } from './mockInterceptor';
   installMockInterceptors(apiClient);
   ```

## API-Contract Einhaltung

Die Mock-Daten spiegeln die aktuellen API-Contracts wider:

### Felder & Typen
- Alle Mock-Responses haben identische Felder wie Live-APIs
- TypeScript-Typisierung sorgt für Konsistenz
- Paging, Sorting, Filtering werden simuliert

### HTTP-Status Codes
- 200 OK für erfolgreiche Mock-Responses
- 410 Gone für entfernte Features
- 500 für Mock-Generierungsfehler
- Realistische Latenz-Simulation (100-800ms)

### Fehlerbehandlung
- Mock-Daten enthalten realistische Fehlerzustände
- Verschiedene Status-Werte für Testing
- Keine globalen UI-Blockaden

## Entwicklungsworkflow

### Lokale Entwicklung

1. **Mock-Daten verwenden** (Standard):
   ```bash
   npm start
   # Frontend läuft mit Mock-Daten für nicht-Whitelist Features
   ```

2. **Live-Daten testen** für Whitelist-Features:
   ```bash
   cd backend/cim_app
   python main.py
   # Backend für Kontakte, Immobilien, CIM läuft parallel
   ```

### Mock-Daten erweitern

1. **Neue Mock-Daten hinzufügen**:
   ```typescript
   // In mockData.ts
   async getNewFeatureData(): Promise<NewFeatureData> {
     await simulateLatency();
     return {
       // Mock-Daten hier
     };
   }
   ```

2. **Mock-Interceptor erweitern**:
   ```typescript
   // In mockInterceptor.ts
   const mockHandlers = {
     '/new-feature': () => frontendMockDataProvider.getNewFeatureData(),
   };
   ```

### Production Deployment

In Production werden standardmäßig Live-Daten verwendet:
```typescript
mockMode: process.env.NODE_ENV === 'production' ? MockMode.LIVE : MockMode.MOCK
```

Whitelist-Features verwenden jedoch **immer** Live-Daten.

## Logging

**Wichtig:** Das Logging bleibt 1:1 identisch:

### Backend Logging
- Keine Änderungen an Django/FastAPI Logging
- Gleiche Log-Level, Formatter, Strukturen
- Mock-Requests werden nicht speziell geloggt

### Frontend Logging  
- `console.log`, `console.error` etc. unverändert
- Entwicklungs-Logger für API-Calls bleibt aktiv
- Mock-Responses werden als normale API-Responses behandelt

### Korrelations-IDs
- Trace-IDs und Request-IDs bleiben erhalten
- Mock-Responses erhalten gleiche ID-Struktur wie Live-APIs

## Testing

### Backend Tests
**Datei:** `backend/cim_app/tests/test_mock_system.py`
- Mock-Konfiguration Tests
- Whitelist-Funktionalität
- API-Endpoint Mock-Verhalten
- Logging-Konsistenz

### Frontend Tests  
**Datei:** `src/api/__tests__/mockSystem.test.ts`
- Mock-Data-Provider Tests
- Interceptor-Funktionalität
- Latenz-Simulation
- TypeScript-Typen-Konsistenz

### Test-Ausführung
```bash
# Backend Tests
cd backend/cim_app
pytest tests/test_mock_system.py

# Frontend Tests  
cd real-estate-dashboard
npm test mockSystem.test.ts
```

## Troubleshooting

### Mock-Daten werden nicht geladen
1. Prüfen ob Mock-Interceptors installiert sind
2. Browser Developer Tools → Network Tab prüfen
3. `x-mock-response: true` Header sollte vorhanden sein

### Whitelist-Feature verwendet Mock statt Live
1. Feature in `liveDataWhitelist` prüfen
2. Backend erreichbar? `curl http://localhost:8000/api/v1/contacts`
3. CORS-Konfiguration prüfen

### Entfernte Features sind noch sichtbar
1. Navigation aus `Layout.jsx` entfernt?
2. Routen aus `App.jsx` entfernt?
3. 410 Gone Response für `/api/v1/removed/*` prüfen

### Performance Issues
1. Mock-Latenz reduzieren in `mockConfig.ts`
2. Cache-TTL für GET-Requests erhöhen
3. Mock-Daten-Generierung optimieren

## Erweiterung des Systems

### Neues Feature zur Whitelist hinzufügen
1. Backend: `LIVE_DATA_WHITELIST` in `mock_config.py` erweitern
2. Frontend: `liveDataWhitelist` in `mockConfig.ts` erweitern

### Feature zur Blacklist hinzufügen (entfernen)
1. Backend: `REMOVED_FEATURES` erweitern + Router aus `main.py` entfernen
2. Frontend: `removedFeatures` erweitern + Navigation/Routen entfernen

### Mock-Daten für neues Feature
1. Backend: Neue Methode in `MockDataProvider` (`mock_data.py`)
2. Frontend: Neue Methode in `FrontendMockDataProvider` (`mockData.ts`)
3. Mock-Handler in Middleware/Interceptors hinzufügen

Das System ist so konzipiert, dass UI-Refinements unabhängig von Backend-Integrationen durchgeführt werden können, während kritische Features (Kontakte, Immobilien, CIM) weiterhin mit Live-Daten arbeiten.