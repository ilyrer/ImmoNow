# API URL Dopplung Fix ✅

## Problem
Alle Widgets hatten doppelte `/api/v1/api/v1/` URLs in den API-Calls, was zu `ECONNREFUSED` Proxy-Fehlern führte.

## Ursache
Der `apiClient` hat bereits `baseURL = '/api/v1'` konfiguriert (siehe `lib/api/client.ts`), daher darf man beim Aufruf von `apiClient.get()` **NICHT** nochmal `/api/v1` hinzufügen.

## Gelöste Fehler
```
❌ Vorher: apiClient.get('/api/v1/analytics/dashboard')
   → Ergebnis: /api/v1/api/v1/analytics/dashboard (404)

✅ Nachher: apiClient.get('/analytics/dashboard')
   → Ergebnis: /api/v1/analytics/dashboard (korrekt)
```

## Korrigierte Dateien

### 1. TaskProgressWidget.tsx
```diff
- const response = await apiClient.get('/api/v1/tasks');
+ const response = await apiClient.get('/tasks');
```

### 2. PropertyPerformanceWidget.tsx
```diff
- apiClient.get('/api/v1/analytics/properties'),
- apiClient.get('/api/v1/properties')
+ apiClient.get('/analytics/properties'),
+ apiClient.get('/properties')
```

### 3. ActivityFeedWidget.tsx
```diff
- const response = await apiClient.get('/api/v1/analytics/dashboard');
+ const response = await apiClient.get('/analytics/dashboard');
```

### 4. CalendarWidget.tsx
```diff
- const response = await apiClient.get('/api/v1/calendar/entries', {
+ const response = await apiClient.get('/calendar/entries', {
...
- const appointmentsRes = await apiClient.get('/api/v1/appointments');
+ const appointmentsRes = await apiClient.get('/appointments');
```

### 5. LiveOverviewWidget.tsx
```diff
- apiClient.get('/api/v1/analytics/dashboard'),
- apiClient.get('/api/v1/analytics/properties'),
- apiClient.get('/api/v1/analytics/contacts'),
- apiClient.get('/api/v1/analytics/tasks'),
+ apiClient.get('/analytics/dashboard'),
+ apiClient.get('/analytics/properties'),
+ apiClient.get('/analytics/contacts'),
+ apiClient.get('/analytics/tasks'),
```

### 6. RevenueChartWidget.tsx
```diff
- const response = await apiClient.get('/api/v1/analytics/dashboard');
+ const response = await apiClient.get('/analytics/dashboard');
```

### 7. LeadConversionWidget.tsx
```diff
- apiClient.get('/api/v1/analytics/contacts'),
- apiClient.get('/api/v1/analytics/dashboard'),
+ apiClient.get('/analytics/contacts'),
+ apiClient.get('/analytics/dashboard'),
```

## Regel für API-Calls

### ✅ Korrekt:
```typescript
import apiClient from '../../../../lib/api/client';

// GET Request
const response = await apiClient.get('/analytics/dashboard');
const properties = await apiClient.get('/properties');
const tasks = await apiClient.get('/tasks');

// POST Request
await apiClient.post('/tasks', taskData);

// PUT Request
await apiClient.put('/properties/123', propertyData);

// DELETE Request
await apiClient.delete('/tasks/456');
```

### ❌ Falsch:
```typescript
// NICHT /api/v1 hinzufügen!
const response = await apiClient.get('/api/v1/analytics/dashboard'); // ❌
const properties = await apiClient.get('/api/v1/properties'); // ❌
```

## apiClient Konfiguration
```typescript
// lib/api/client.ts
class ApiClient {
  constructor() {
    this.baseURL = '/api/v1';  // ← Wird automatisch hinzugefügt!
  }
  
  async request(config) {
    let fullUrl = `${this.baseURL}${url}`;  // Kombiniert zu /api/v1/dein-endpoint
    // ...
  }
}
```

## Backend-Endpunkte

### Vollständige URL-Struktur:
```
Frontend → Proxy (package.json) → Backend

apiClient.get('/tasks')
  ↓
/api/v1/tasks (durch baseURL)
  ↓
http://localhost:3000/api/v1/tasks (Frontend)
  ↓
http://localhost:8000/api/v1/tasks (Backend über Proxy)
```

## Nächste Schritte
1. ✅ Backend-Server starten: `cd backend && python manage.py runserver`
2. ✅ Frontend-Server starten: `cd real-estate-dashboard && npm start`
3. ✅ Dashboard öffnen und Widgets testen
4. ✅ Alle Widgets sollten jetzt Live-Daten vom Backend laden

## Verifizierung
Nach dem Fix sollten alle Widgets erfolgreich Daten laden:
- ✅ Top Immobilien (PropertyPerformanceWidget)
- ✅ Aufgaben (TaskProgressWidget)
- ✅ Aktivitäten (ActivityFeedWidget)
- ✅ Kalender (CalendarWidget)
- ✅ Live Overview
- ✅ Revenue Chart
- ✅ Lead Conversion
- ✅ Marktanalyse (MarketTrendsWidget)

---

**Status**: ✅ Alle Mock-Daten entfernt, alle Widgets nutzen Live-Backend-Daten  
**Datum**: 2024-01-18  
**Fix**: API URL Dopplung behoben
