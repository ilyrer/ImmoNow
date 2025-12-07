# KI-Exposé & Multi-Portal Publishing - Features

Dieses Dokument beschreibt die zwei neuen Features für das Immobilien-Management-System: **KI-Exposé-Generator** und **Multi-Portal-Publishing**.

## 📋 Übersicht

Beide Features sind vollständig als **Frontend-Only mit Mock-Daten** implementiert und verwenden `localStorage` für die Persistenz. Sie können später nahtlos durch echte API-Calls ersetzt werden.

## 🎯 Feature A: KI-Exposé Generator

### Beschreibung
Automatische Generierung von professionellen Immobilien-Exposés mit KI-Unterstützung. Benutzer können Zielgruppe, Tonalität, Sprache und Länge konfigurieren.

### Komponenten
- **`ExposeTab.tsx`** - Haupttab mit Konfigurations-Panel
- **`ExposePreview.tsx`** - Editierbare Vorschau mit Titel, Text und Highlights
- **`ExposeVersionList.tsx`** - Liste gespeicherter Versionen

### Hooks
- **`useAiExposeMock()`** - Generiert Mock-Exposé mit simuliertem API-Delay
- **`useExposeVersionsMock(propertyId)`** - CRUD für Versionen (localStorage)
- **`useExposeDraftsMock(propertyId)`** - Draft-Management

### Types (`/types/expose.ts`)
```typescript
ExposeAudience = 'kauf' | 'miete' | 'investor'
ExposeTone = 'neutral' | 'elegant' | 'kurz'
ExposeLanguage = 'de' | 'en'
ExposeLength = 'short' | 'standard' | 'long'
ExposeQuality = 'low' | 'med' | 'high'

ExposeDraft, ExposeVersion, GenerateExposeRequest
```

### LocalStorage Keys
- `cim_expose_versions` - Gespeicherte Versionen
- `cim_expose_drafts` - Draft-Konfigurationen

### Features
✅ Konfigurations-Panel (Zielgruppe, Tonalität, Sprache, Länge, Keywords)  
✅ "Text vorschlagen" Button mit Loading-State  
✅ Editierbare Preview (Titel, Body, Bullets)  
✅ Wortanzahl, SEO-Score, Qualitätsmeter  
✅ Versionen speichern und verwalten  
✅ Versionsliste mit Aktionen (Anzeigen, Löschen, Veröffentlichen)  
✅ Empty/Loading/Error States  
⚠️ "PDF erstellen" disabled (für spätere API-Integration)

### Workflow
1. Benutzer konfiguriert Exposé-Parameter
2. Klick auf "Text vorschlagen" → Mock-API-Call (1.5-2.5s)
3. Preview zeigt generierten Text (editierbar)
4. "Als Version speichern" → localStorage
5. Version erscheint in Liste mit Metadaten

---

## 🚀 Feature B: Multi-Portal Publishing

### Beschreibung
Veröffentlichung von Immobilien auf mehreren Portalen (ImmoScout24, Immowelt, eBay Kleinanzeigen) mit Validierung, Feld-Mapping und Job-Tracking.

### Komponenten
- **`PublishTab.tsx`** - Haupttab mit Konfiguration und Aktionen
- **`PortalChecklist.tsx`** - Portal-Auswahl mit Checkboxen
- **`MappingBadges.tsx`** - Feld-Validierung (Preis ✔, Energie ✖)
- **`MediaPicker.tsx`** - Bildauswahl mit Sortierung
- **`PublishStatusTable.tsx`** - Job-Status-Übersicht

### Hooks
- **`usePublishQueueMock(propertyId)`** - Job-Management (create, update, retry, remove)
- **`usePortalValidationMock()`** - Mock-Validierung der Pflichtfelder
- **`useContactProfilesMock()`** - Kontaktprofile verwalten
- **`usePortalConfigsMock()`** - Portal-Konfigurationen
- **`usePortalListingsMock(propertyId)`** - Aktive Listings
- **`useSyncLogsMock(propertyId?)`** - Sync-Logs

### Types (`/types/publish.ts`)
```typescript
Portal = 'scout24' | 'immowelt' | 'ebay'
PublishJobStatus = 'draft' | 'scheduled' | 'sent' | 'live' | 'error'
MappingStatus = 'ok' | 'warn' | 'error' | 'missing'

PublishJob, PortalValidation, FieldMapping, PublishContactProfile
```

### LocalStorage Keys
- `cim_publish_jobs` - Publishing-Jobs
- `cim_portal_listings` - Aktive Listings
- `cim_sync_logs` - Sync-Historie
- `cim_contact_profiles` - Kontaktprofile
- `cim_portal_configs` - Portal-Konfigurationen

### Features
✅ Portal-Auswahl (ImmoScout24, Immowelt, eBay)  
✅ Feld-Mapping-Validierung mit Status-Badges  
✅ Medienauswahl (Primärbild, Reihenfolge)  
✅ Kontaktprofil-Dropdown  
✅ AGB-Checkbox  
✅ "Jetzt veröffentlichen" und "Planen" (DateTime-Picker)  
✅ Status-Tabelle mit Retry/Löschen-Aktionen  
✅ Mock-Status-Progression (Draft → Scheduled → Sent → Live)  
✅ 10% Fehlerwahrscheinlichkeit für Realismus  
✅ Externe IDs bei Erfolg  

### Workflow
1. Benutzer wählt Portale aus
2. Validierung zeigt Feld-Status (Preis ✔, Adresse ✔, Energie ✖)
3. Medien auswählen
4. Kontaktprofil wählen, AGB akzeptieren
5. "Veröffentlichen" oder "Planen" → Job erstellt
6. Job erscheint in Status-Tabelle (Draft → ... → Live)
7. Bei Fehler: Retry-Button verfügbar

---

## 🔧 Integration in PropertyDetail

### Neue Tabs
Die beiden Tabs wurden in `PropertyDetail.tsx` integriert:

```tsx
{ id: 'expose', label: 'Exposé (KI)', icon: 'ri-magic-line' }
{ id: 'publish', label: 'Veröffentlichen', icon: 'ri-send-plane-line' }
```

### Verwendung
```tsx
{activeTab === 'expose' && (
  <ExposeTab propertyId={String(property.id)} />
)}

{activeTab === 'publish' && (
  <PublishTab propertyId={String(property.id)} property={property} />
)}
```

---

## 🎨 Design & Styling

### Apple Glass Theme
Beide Features verwenden das konsistente Apple Glass Design:
- **Glassmorphism**: `backdrop-blur-xl`, transparente Hintergründe
- **Soft Shadows**: `shadow-lg`, `shadow-xl`
- **Gradients**: `from-blue-600 via-indigo-600 to-purple-600`
- **Smooth Transitions**: `transition-all duration-200`
- **Framer Motion**: `initial`, `animate`, `exit` für Animationen
- **Dark Mode**: Vollständige Unterstützung mit `dark:` Klassen

### Komponenten-Muster
- **Cards**: Weißer/dunkler Hintergrund mit Blur und Border
- **Buttons**: Gradient-Hintergründe mit Hover-Effekten
- **Badges**: Status-abhängige Farben (grün ✔, gelb ⚠, rot ✖)
- **Empty States**: Icon + Beschreibung + CTA-Button
- **Loading States**: Spinner mit Blur-Backdrop

---

## 🚀 Migration zu echten APIs

### Exposé Feature
**Backend-Endpunkte (erforderlich):**
```typescript
POST   /api/properties/{id}/expose/generate  // Generate expose
GET    /api/properties/{id}/expose/versions  // List versions
POST   /api/properties/{id}/expose/versions  // Save version
DELETE /api/expose/versions/{id}             // Delete version
PUT    /api/expose/versions/{id}/publish     // Publish version
POST   /api/expose/versions/{id}/pdf         // Generate PDF
```

**Änderungen:**
1. Ersetze `useAiExposeMock()` mit echtem Hook (`useGenerateExpose()`)
2. Ersetze `useExposeVersionsMock()` mit API-basiertem Hook
3. Aktiviere "PDF erstellen" Button
4. Füge Error-Handling und Toast-Benachrichtigungen hinzu

### Publishing Feature
**Backend-Endpunkte (erforderlich):**
```typescript
GET    /api/portals/configs                   // Get portal configs
POST   /api/portals/configs                   // Create config
PUT    /api/portals/configs/{id}              // Update config
POST   /api/properties/{id}/publish           // Create publish job
GET    /api/properties/{id}/publish/jobs      // List jobs
PUT    /api/publish/jobs/{id}/retry           // Retry failed job
DELETE /api/publish/jobs/{id}                 // Delete job
GET    /api/properties/{id}/listings          // Get portal listings
GET    /api/portals/sync/logs                 // Get sync logs
POST   /api/properties/{id}/validate          // Validate for portals
```

**Änderungen:**
1. Ersetze alle `*Mock()` Hooks mit echten API-Hooks
2. Implementiere Webhook-Listener für Status-Updates
3. Füge Real-time Updates via WebSockets hinzu (optional)
4. Aktiviere Drag-and-Drop für Medien-Reihenfolge
5. Implementiere Retry-Logic mit Exponential Backoff

---

## 📦 Demo-Daten Seeding

### Exposé
```typescript
// Seed 3 Versionen für Property ID "123"
localStorage.setItem('cim_expose_versions', JSON.stringify([
  {
    id: 'v1',
    propertyId: '123',
    title: 'Traumhafte Stadtvilla...',
    body: '...',
    bullets: ['Zentrale Lage', 'Modern'],
    wordCount: 150,
    quality: 'high',
    createdAt: new Date().toISOString()
  }
]));
```

### Publishing
```typescript
// Seed 2 Jobs für Property ID "123"
localStorage.setItem('cim_publish_jobs', JSON.stringify([
  {
    id: 'job1',
    propertyId: '123',
    portals: ['scout24', 'immowelt'],
    status: 'live',
    externalId: 'EXT_ABC123',
    createdAt: new Date().toISOString()
  }
]));
```

---

## ✅ Testing Checklist

### Exposé
- [ ] Generierung mit verschiedenen Konfigurationen
- [ ] Bearbeiten von Titel/Body/Bullets
- [ ] Version speichern und laden
- [ ] Version löschen
- [ ] Version veröffentlichen
- [ ] Empty State anzeigen
- [ ] Loading State während Generierung
- [ ] Error Handling

### Publishing
- [ ] Portal-Auswahl (1-3 Portale)
- [ ] Validierung anzeigen (OK/Warn/Error)
- [ ] Medien auswählen
- [ ] Sofort veröffentlichen
- [ ] Geplant veröffentlichen (Datum/Zeit)
- [ ] Job-Status-Tabelle aktualisieren
- [ ] Retry bei Fehler
- [ ] Job löschen
- [ ] Empty State anzeigen
- [ ] AGB-Checkbox erforderlich

---

## 📚 Weitere Dokumentation

- **Types**: `/src/types/expose.ts`, `/src/types/publish.ts`
- **Hooks**: `/src/hooks/useExposeMock.ts`, `/src/hooks/usePublishMock.ts`
- **Components**: `/src/components/properties/*`
- **Styling Guide**: `docs/APPLE_GLASS_QUICK_REFERENCE.md`

---

## 🐛 Known Issues / Limitations

### Exposé
- PDF-Generierung noch nicht implementiert
- SEO-Score ist Mock (fixed random Wert)
- Keine Sprach-Übersetzung (nur UI-Label ändert sich)

### Publishing
- Keine echten Portal-APIs verbunden
- Status-Progression ist zeitbasiert (nicht event-driven)
- Drag-and-Drop für Medien fehlt noch
- Keine Rate-Limiting-Simulation

---

## 💡 Zukünftige Erweiterungen

### Exposé
- [ ] Mehrsprachige Übersetzungen (DeepL API)
- [ ] Template-Bibliothek mit Vorlagen
- [ ] A/B-Testing verschiedener Versionen
- [ ] Automatische Optimierungsvorschläge
- [ ] Export zu Word/PDF mit Custom-Branding

### Publishing
- [ ] Automatische Preis-Anpassung je nach Portal
- [ ] Bulk-Publishing für mehrere Properties
- [ ] Analytics-Dashboard (Views, Leads pro Portal)
- [ ] Automatische Re-Publishing bei Preis-Änderung
- [ ] Integration mit CRM für Lead-Tracking

---

**Version**: 1.0.0  
**Letztes Update**: Oktober 2025  
**Status**: ✅ Production Ready (Frontend-Only)
