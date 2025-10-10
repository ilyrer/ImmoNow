# KI-Exposé & Multi-Portal Publishing Features

## Übersicht

Zwei neue Features wurden zur Immobilienverwaltung hinzugefügt:

1. **KI-Exposé Generator** - Automatische Generierung von Exposé-Texten mit verschiedenen Stilen
2. **Multi-Portal Publishing** - Veröffentlichung auf mehreren Immobilienportalen mit Validierung und Tracking

**Status:** ✅ Frontend-Only Implementation mit Mock-Daten  
**Bereit für:** API-Integration

---

## 📁 Dateistruktur

### Types
```
src/types/
├── expose.ts          # Exposé-Typen (Draft, Version, Quality)
└── publish.ts         # Publishing-Typen (Job, Portal, Validation)
```

### Hooks (Mocks)
```
src/hooks/
├── useExposeMock.ts   # KI-Exposé Mock-Logik
└── usePublishMock.ts  # Multi-Portal Mock-Logik
```

### Components
```
src/components/properties/
├── ExposeTab.tsx              # Haupttab für Exposé-Generator
├── ExposePreview.tsx          # Bearbeitbare Vorschau
├── ExposeVersionList.tsx      # Gespeicherte Versionen
├── PublishTab.tsx             # Haupttab für Publishing
├── PortalChecklist.tsx        # Portal-Auswahl (ImmoScout24, etc.)
├── MappingBadges.tsx          # Feld-Validierung (Preis ✔, Energie ✖)
├── MediaPicker.tsx            # Bildauswahl mit Primärbild
└── PublishStatusTable.tsx     # Job-Status-Tracking
```

### Integration
```
src/components/properties/PropertyDetail.tsx
  ├── Zeile 10-11:  Import ExposeTab, PublishTab
  ├── Zeile 675:    Tab "Exposé (KI)"
  ├── Zeile 676:    Tab "Veröffentlichen"
  ├── Zeile 1343:   <ExposeTab propertyId={...} />
  └── Zeile 1347:   <PublishTab propertyId={...} property={...} />
```

---

## 🎨 UI/UX Features

### Apple Glass Design
- **Glassmorphism:** `backdrop-blur-xl`, transparente Hintergründe
- **Soft Shadows:** Sanfte Schatten und abgerundete Ecken (`rounded-2xl`)
- **Gradient Buttons:** Farbverläufe (Blue → Indigo → Purple)
- **Dark Mode:** Vollständige Dark-Mode-Unterstützung
- **Animations:** Framer Motion für Übergänge und Micro-Interactions

### Exposé-Generator
- **Anpassbare Parameter:**
  - Zielgruppe (Käufer, Mieter, Investor)
  - Tonalität (Neutral, Elegant, Kurz & Prägnant)
  - Sprache (Deutsch, Englisch)
  - Länge (Kurz, Standard, Lang)
  - SEO-Keywords (Comma-separated input)

- **Live-Vorschau:**
  - Bearbeitbarer Titel und Fließtext
  - 6 Highlight-Bullets
  - Wortanzahl-Anzeige
  - Qualitätsmeter (Mock: Low/Med/High)

- **Versionsverwaltung:**
  - Mehrere Versionen speichern
  - Datum/Uhrzeit-Tracking
  - Löschen und Wiederherstellen

### Multi-Portal Publishing
- **Portal-Auswahl:**
  - ImmoScout24 🏠
  - Immowelt 🌍
  - eBay Kleinanzeigen 🛒

- **Validierung:**
  - Automatische Feld-Prüfung pro Portal
  - Status-Badges: ✔ OK | ⚠ Warnung | ✖ Fehler | ℹ Optional
  - Fehlende Pflichtfelder werden hervorgehoben

- **Medienauswahl:**
  - Primärbild markieren
  - Mehrfachauswahl
  - Visual Feedback bei Auswahl

- **Job-Tracking:**
  - Status: Entwurf → Geplant → Gesendet → Live | Fehler
  - Externe Portal-IDs
  - Fehlerdetails mit Retry-Funktion
  - Zeitstempel für alle Aktionen

---

## 💾 Datenspeicherung (localStorage)

### Exposé Mock
```typescript
// Schlüssel
localStorage.setItem('cim_expose_drafts', JSON.stringify(drafts));
localStorage.setItem('cim_expose_versions', JSON.stringify(versions));

// Struktur
ExposeDraft {
  id, propertyId, audience, tone, lang, length, keywords
}

ExposeVersion {
  id, propertyId, title, body, bullets, quality, wordCount, createdAt
}
```

### Publishing Mock
```typescript
// Schlüssel
localStorage.setItem('cim_publish_jobs', JSON.stringify(jobs));
localStorage.setItem('cim_contact_profiles', JSON.stringify(profiles));
localStorage.setItem('cim_portal_configs', JSON.stringify(configs));

// Struktur
PublishJob {
  id, propertyId, portals, status, runAt, validations, 
  externalId, errorDetails, retryCount
}

PortalConfig {
  id, portal, name, isActive, apiKey, syncEnabled
}
```

### Demo-Daten initialisieren

Die Hooks initialisieren automatisch Default-Werte:

**Exposé:**
- Keine Demo-Daten nötig
- Drafts und Versionen werden beim ersten Klick auf "Text vorschlagen" erstellt

**Publishing:**
```typescript
// Default Contact Profile
{
  id: 'default_profile',
  name: 'Standard Kontakt',
  email: 'kontakt@immobilien.de',
  phone: '+49 123 456789'
}

// Default Portal Configs
[
  { portal: 'scout24', isActive: true, syncEnabled: true },
  { portal: 'immowelt', isActive: true, syncEnabled: true },
  { portal: 'ebay', isActive: false, syncEnabled: false }
]
```

### localStorage zurücksetzen
```javascript
// Im Browser Console
localStorage.removeItem('cim_expose_drafts');
localStorage.removeItem('cim_expose_versions');
localStorage.removeItem('cim_publish_jobs');
localStorage.removeItem('cim_contact_profiles');
localStorage.removeItem('cim_portal_configs');
```

---

## 🔌 API-Integration (Zukunft)

### Exposé API Endpoints

**POST /api/properties/:id/expose/generate**
```typescript
Request: {
  audience: 'kauf' | 'miete' | 'investor',
  tone: 'neutral' | 'elegant' | 'kurz',
  lang: 'de' | 'en',
  length: 'short' | 'standard' | 'long',
  keywords: string[]
}

Response: {
  title: string,
  body: string,
  bullets: string[],
  quality: 'low' | 'med' | 'high',
  wordCount: number
}
```

**GET /api/properties/:id/expose/versions**
```typescript
Response: ExposeVersion[]
```

**POST /api/properties/:id/expose/versions**
```typescript
Request: ExposeVersion
Response: ExposeVersion
```

**DELETE /api/properties/:id/expose/versions/:versionId**
```typescript
Response: { success: boolean }
```

### Publishing API Endpoints

**POST /api/properties/:id/publish**
```typescript
Request: CreatePublishJobRequest {
  propertyId: string,
  portals: Portal[],
  runAt?: string | null,
  contactProfileId?: string,
  mediaIds?: string[]
}

Response: PublishJob
```

**GET /api/properties/:id/publish/jobs**
```typescript
Response: PublishJob[]
```

**POST /api/properties/:id/publish/jobs/:jobId/retry**
```typescript
Response: PublishJob
```

**DELETE /api/properties/:id/publish/jobs/:jobId**
```typescript
Response: { success: boolean }
```

**GET /api/portals/validate**
```typescript
Request: {
  portals: Portal[],
  propertyData: Property
}

Response: PortalValidation[]
```

**GET /api/portals/configs**
```typescript
Response: PortalConfig[]
```

**PATCH /api/portals/configs/:id**
```typescript
Request: Partial<PortalConfig>
Response: PortalConfig
```

### Migration von Mock zu API

1. **Ersetze Mock-Hooks:**
```typescript
// Vorher
import { useAiExposeMock } from '../../hooks/useExposeMock';

// Nachher
import { useAiExpose } from '../../hooks/useApi';
```

2. **Backend-Funktionen implementieren:**
   - KI-Integration (OpenAI GPT-4, Claude, etc.)
   - Portal-APIs (ImmoScout24 SDK, Immowelt API)
   - Webhook-Handler für Status-Updates
   - Job-Queue (Redis, Bull, etc.)

3. **Datenbank-Schema:**
```sql
CREATE TABLE expose_versions (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  title TEXT,
  body TEXT,
  bullets JSONB,
  quality VARCHAR(10),
  word_count INT,
  created_at TIMESTAMP
);

CREATE TABLE publish_jobs (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  portals TEXT[],
  status VARCHAR(20),
  run_at TIMESTAMP,
  external_id VARCHAR(255),
  error_details TEXT,
  retry_count INT,
  created_at TIMESTAMP
);

CREATE TABLE portal_configs (
  id UUID PRIMARY KEY,
  portal VARCHAR(50),
  is_active BOOLEAN,
  api_key TEXT,
  sync_enabled BOOLEAN
);
```

---

## 🧪 Testing & Demo

### Exposé Generator testen
1. Öffne PropertyDetail einer Immobilie
2. Klicke auf Tab "Exposé (KI)"
3. Wähle Parameter (Zielgruppe, Tonalität, etc.)
4. Füge SEO-Keywords hinzu: "Neubau, zentral, energieeffizient"
5. Klicke "Text vorschlagen" → Simuliert 2s Ladezeit
6. Bearbeite Titel, Text oder Bullets
7. Klicke "Als Version speichern"
8. Versionen werden unten angezeigt

### Publishing testen
1. Öffne PropertyDetail einer Immobilie
2. Klicke auf Tab "Veröffentlichen"
3. Wähle Portale: ImmoScout24 ✔, Immowelt ✔
4. Prüfe Validierungs-Badges (Preis ✔, Energie ✖)
5. Wähle Bilder aus (Primärbild markiert)
6. Akzeptiere AGB
7. Klicke "Jetzt veröffentlichen"
8. Job erscheint in Status-Tabelle (Status: Draft → Scheduled → Sent → Live)
9. Bei Fehler: Retry-Button nutzen

### Edge Cases
- **Keine Portale gewählt:** Alert erscheint
- **AGB nicht akzeptiert:** Button disabled
- **Fehler-Simulation:** 10% Chance auf Fehler (Mock)
- **Retry-Limit:** Max 3 Wiederholungen

---

## 📊 Status & Roadmap

### ✅ Implementiert
- [x] Alle Typen definiert
- [x] Mock-Hooks mit localStorage
- [x] Vollständige UI-Komponenten
- [x] Apple Glass Design
- [x] Dark Mode
- [x] Animationen
- [x] Validierung (Mock)
- [x] Error Handling
- [x] Loading States
- [x] Empty States
- [x] Integration in PropertyDetail

### 🚧 Ausstehend
- [ ] i18n-Strings (properties.expose.*, properties.publish.*)
- [ ] API-Implementierung (Backend)
- [ ] Echte KI-Integration
- [ ] Portal-APIs verbinden
- [ ] Webhook-Handler
- [ ] Unit Tests
- [ ] E2E Tests

### 🎯 Nächste Schritte
1. **i18n:** Strings in Sprachdateien auslagern
2. **Backend:** API-Endpoints implementieren
3. **KI:** OpenAI/Claude für Textgenerierung
4. **Portale:** SDK/API-Integration (ImmoScout24, Immowelt)
5. **Testing:** Jest + React Testing Library

---

## 🛠️ Troubleshooting

### TypeScript findet Module nicht
**Problem:** `Cannot find module './MappingBadges'`

**Lösung:**
```bash
# VS Code Command Palette (Ctrl+Shift+P)
> TypeScript: Restart TS Server
```

### Mock-Daten werden nicht angezeigt
**Lösung:**
```javascript
// Browser Console
console.log(localStorage.getItem('cim_publish_jobs'));
console.log(localStorage.getItem('cim_expose_versions'));
```

### Komponente rendert nicht
**Check:**
1. PropertyDetail.tsx importiert ExposeTab & PublishTab
2. Tabs-Array enthält { id: 'expose' } und { id: 'publish' }
3. activeTab-State funktioniert

---

## 👥 Kontakt & Support

**Entwickler:** Senior Frontend Engineer  
**Tech Stack:** React + TypeScript + Tailwind + React Router + React Query  
**Design:** Apple Glass Style (Glassmorphism)

**Fragen?** Öffne ein Issue oder kontaktiere das Dev-Team.

---

## 📝 Lizenz

© 2025 Immonow / CIM Frontend. Alle Rechte vorbehalten.
