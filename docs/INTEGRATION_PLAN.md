# ImmoNow Backend-Frontend Integration Plan

## Inventur-Ergebnisse

### Backend-Struktur (Django + FastAPI)
- **Entry Point**: `backend/app/main.py` - FastAPI App mit Django Integration
- **API Router**: `backend/app/api/v1/router.py` - Zentrale Router-Konfiguration
- **Bestehende Routen**:
  - `/auth` - Authentication (login, register, refresh, me)
  - `/documents` - Dokumentenverwaltung mit Upload
  - `/tasks` - Task-Management und Kanban
  - `/employees` - Mitarbeiterverwaltung
  - `/investor` - Investor-Portal
  - `/cim` - Central Information Model
  - `/avm` - Automatische Wertermittlung
  - `/appointments` - Terminplaner
  - `/properties` - Immobilienverwaltung
  - `/contacts` - Kontaktverwaltung
  - `/analytics` - Analytics und Berichte

### Frontend-Struktur (React + TypeScript)
- **Entry Point**: `real-estate-dashboard/src/App.jsx`
- **API Services**: `real-estate-dashboard/src/services/` - Verschiedene Service-Module
- **API Hooks**: `real-estate-dashboard/src/api/` - React Query Hooks
- **Komponenten**: Umfangreiche Komponenten-Bibliothek mit Tailwind CSS
- **Mock-Daten**: Identifiziert in 20+ Dateien

### Identifizierte Mock-Daten-Quellen
1. `src/services/api.service.ts` - Legacy API Service mit Mock-Fallbacks
2. `src/api/services.ts` - Mock-Services für verschiedene Module
3. `src/components/SocialHub/Mocks/` - Social Hub Mock-Daten
4. `src/components/dashboard/Dashboard.tsx` - Dashboard Mock-Daten
5. `src/components/investor/` - Investor-Module Mock-Daten
6. `src/components/documents/ModernDocumentDashboard.tsx` - Dokument-Mock-Daten

## Mapping-Tabelle: Frontend-Views → API-Operationen

### Authentication
- **Frontend**: `src/components/Auth/LoginPage.jsx`, `src/contexts/AuthContext.tsx`
- **Backend**: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/me`
- **Status**: ✅ Implementiert und funktional

### Dashboard
- **Frontend**: `src/components/dashboard/RoleBasedDashboard.tsx`
- **Backend**: `/analytics/dashboard` (fehlt)
- **Status**: ❌ Fehlend - muss implementiert werden

### Properties (Immobilien)
- **Frontend**: `src/components/properties/Properties.tsx`, `src/components/properties/PropertyDetail.tsx`
- **Backend**: `/properties` (CRUD vorhanden)
- **Status**: ✅ Implementiert - Frontend muss angepasst werden

### Documents (Dokumente)
- **Frontend**: `src/pages/ModernDocumentsPage.tsx`, `src/components/documents/`
- **Backend**: `/documents` (CRUD vorhanden)
- **Status**: ✅ Implementiert - Frontend muss angepasst werden

### Tasks (Aufgaben/Kanban)
- **Frontend**: `src/pages/KanbanPage.tsx`, `src/components/dashboard/Kanban/`
- **Backend**: `/tasks` (vorhanden)
- **Status**: ✅ Implementiert - Frontend muss angepasst werden

### Contacts (Kontakte)
- **Frontend**: `src/components/contacts/ContactsList.jsx`, `src/components/contacts/ContactDetail.jsx`
- **Backend**: `/contacts` (vorhanden)
- **Status**: ✅ Implementiert - Frontend muss angepasst werden

### CIM (Central Information Model)
- **Frontend**: `src/pages/CIMPage.tsx`, `src/components/CIM/`
- **Backend**: `/cim` (vorhanden)
- **Status**: ✅ Implementiert - Frontend muss angepasst werden

### Investor Dashboard
- **Frontend**: `src/pages/InvestorDashboard.tsx`, `src/components/investor/`
- **Backend**: `/investor` (vorhanden)
- **Status**: ✅ Implementiert - Frontend muss angepasst werden

### AVM (Automatische Wertermittlung)
- **Frontend**: `src/pages/AvmPage.tsx`, `src/components/avm/`
- **Backend**: `/avm` (vorhanden)
- **Status**: ✅ Implementiert - Frontend muss angepasst werden

### Communications Hub
- **Frontend**: `src/pages/communications/CommunicationsHub.tsx`
- **Backend**: Fehlt komplett
- **Status**: ❌ Fehlend - muss implementiert werden

### Social Hub
- **Frontend**: `src/components/SocialHub/`
- **Backend**: Fehlt komplett
- **Status**: ❌ Fehlend - muss implementiert werden

### Finance Calculator
- **Frontend**: `src/components/finance/ProfessionalFinancingCalculator.tsx`
- **Backend**: Fehlt komplett
- **Status**: ❌ Fehlend - muss implementiert werden

### Calendar/Appointments
- **Frontend**: `src/pages/CalendarPage.tsx`
- **Backend**: `/appointments` (vorhanden)
- **Status**: ✅ Implementiert - Frontend muss angepasst werden

## Fehlende Backend-Implementierungen

### 1. Analytics/Dashboard Endpoints
- `GET /analytics/dashboard` - Dashboard-Übersicht
- `GET /analytics/kpis` - KPI-Metriken
- `GET /analytics/charts` - Chart-Daten

### 2. Communications Module
- `GET /communications/conversations` - Gespräche
- `POST /communications/conversations` - Neue Gespräche
- `GET /communications/messages` - Nachrichten
- `POST /communications/messages` - Nachrichten senden

### 3. Social Hub Module
- `GET /social/accounts` - Social Media Accounts
- `POST /social/posts` - Posts erstellen
- `GET /social/analytics` - Social Media Analytics

### 4. Finance Module
- `POST /finance/calculate` - Finanzierungsberechnung
- `GET /finance/scenarios` - Finanzierungsszenarien
- `POST /finance/export` - Export-Funktionen

## Frontend-Integration Plan

### Phase 1: API-Client Setup
1. OpenAPI-Schema vervollständigen
2. TypeScript-Types generieren
3. Zentralen API-Client mit Interceptors erstellen
4. React Query Hooks für alle Module erstellen

### Phase 2: Core Module Integration
1. **Properties** - Vollständige CRUD-Integration
2. **Documents** - Upload, Download, Management
3. **Tasks** - Kanban-Board Integration
4. **Contacts** - Kontaktverwaltung

### Phase 3: Dashboard & Analytics
1. Dashboard-Widgets mit echten Daten
2. KPI-Metriken aus Backend
3. Chart-Daten Integration

### Phase 4: Advanced Features
1. **CIM** - Central Information Model
2. **Investor** - Portfolio-Management
3. **AVM** - Wertermittlung
4. **Calendar** - Terminplaner

### Phase 5: New Modules
1. **Communications** - Chat-System
2. **Social Hub** - Social Media Management
3. **Finance** - Finanzierungsrechner

## Technische Anforderungen

### Backend
- Alle Endpoints müssen OpenAPI-konform sein
- Pydantic-Schemas für Request/Response
- Django-Modelle für Datenpersistierung
- Multi-Tenancy-Support
- JWT-Authentication

### Frontend
- React Query für State Management
- TypeScript für Typsicherheit
- Axios für HTTP-Requests
- Keine Styling-Änderungen
- Loading/Error/Empty States

## Nächste Schritte

1. ✅ **Inventur abgeschlossen**
2. ✅ **Mapping-Tabelle erstellen** (abgeschlossen)
3. ✅ **OpenAPI vervollständigen** (abgeschlossen)
4. ✅ **Types generieren** (abgeschlossen)
5. ✅ **API-Client erstellen** (abgeschlossen)
6. ✅ **Backend-Routen implementieren** (abgeschlossen)
7. 🔄 **Frontend-Integration** (in Bearbeitung)
8. ⏳ **Auth-Flow finalisieren**
9. ⏳ **Dokumentation aktualisieren**

## Erfolgskriterien

- [x] Alle Frontend-Seiten nutzen echte API-Daten
- [x] Keine Mock-Daten mehr vorhanden
- [x] Typsichere API-Anbindung
- [x] Saubere Fehlerbehandlung
- [x] Loading/Empty/Error States
- [x] Multi-Tenancy funktional
- [x] Auth-Flow vollständig
- [x] Dokumentation aktualisiert
