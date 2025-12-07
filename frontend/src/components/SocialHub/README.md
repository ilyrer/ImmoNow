# SocialHub Modul

## Übersicht

Das **SocialHub-Modul** ist eine umfassende Social Media Management-Lösung für die CIM_Frontend-Anwendung. Es ermöglicht die zentrale Verwaltung aller Social Media Aktivitäten über eine einheitliche Benutzeroberfläche.

## Features

### 1. **Accounts (Kontenverwaltung)**
- Verbindung und Verwaltung mehrerer Social Media Konten
- Unterstützte Plattformen:
  - Facebook
  - Instagram
  - Twitter/X
  - LinkedIn
  - TikTok
  - YouTube
  - Pinterest
- Übersicht über Follower, Posts und Engagement-Raten
- Einstellungen für Auto-Post, Benachrichtigungen und Analytics

### 2. **Composer (Beitragseditor)**
- Intuitiver Editor für Social Media Beiträge
- Unterstützung verschiedener Post-Typen:
  - Text
  - Bilder
  - Videos
  - Carousels
- Multi-Platform-Publishing
- Hashtag- und Mention-Support
- Media-Upload mit Vorschau
- Entwürfe speichern
- Sofortveröffentlichung oder Zeitplanung

### 3. **Scheduler (Beitragsplaner)**
- Kalenderansicht für geplante Beiträge
- Verschiedene Ansichtsmodi (Tag, Woche, Monat)
- Timeline-Darstellung
- Status-Tracking (geplant, veröffentlicht, fehlgeschlagen)
- Bearbeitung und Löschung geplanter Posts

### 4. **Queue (Warteschlange)**
- Überwachung von Beiträgen in der Warteschlange
- Prioritätsverwaltung (hoch, mittel, niedrig)
- Status-Tracking:
  - In Warteschlange
  - Wird verarbeitet
  - Veröffentlicht
  - Fehlgeschlagen
- Fehlerbehandlung und Retry-Mechanismus
- Sofortige Veröffentlichung aus der Queue

### 5. **Analytics (Analytik)**
- Umfassende Performance-Übersicht
- Key Metrics:
  - Impressions
  - Engagements
  - Engagement Rate
  - Follower-Wachstum
- Platform-spezifische Statistiken
- Engagement-Aufschlüsselung (Likes, Kommentare, Shares, Saves)
- Top-Performance Posts
- Audience Demographics:
  - Altersgruppen
  - Geschlechter
  - Standorte
  - Aktive Zeiten
- Export-Funktionalität

### 6. **Media Library (Medien-Bibliothek)**
- Zentrale Verwaltung von Medien-Assets
- Upload-Funktionalität
- Grid- und Listenansicht
- Tag-Verwaltung
- Verwendungsübersicht (in welchen Posts verwendet)
- Download und Löschung

## Verzeichnisstruktur

```
src/components/SocialHub/
├── index.tsx                    # Hauptansicht mit Navigation
├── Accounts/
│   └── AccountsView.tsx        # Kontenverwaltung
├── Composer/
│   └── ComposerView.tsx        # Beitragseditor
├── Scheduler/
│   └── SchedulerView.tsx       # Beitragsplaner
├── Queue/
│   └── QueueView.tsx           # Warteschlange
├── Analytics/
│   └── AnalyticsView.tsx       # Analytics Dashboard
├── Media/
│   └── MediaView.tsx           # Medien-Bibliothek
├── Types/
│   └── index.ts                # TypeScript-Typen
└── Mocks/
    └── index.ts                # Mock-Daten
```

## Verwendete Komponenten

### Aus dem bestehenden System:
- **Card, CardHeader, CardTitle, CardContent** - Grundlegende Card-Komponenten
- **Button** - Wiederverwendbare Button-Komponente
- **Modal-Pattern** - Konsistente Modal-Dialoge

### Neue SocialHub-spezifische Komponenten:
- Platform-Icons und -Farben
- Status-Badges
- Priority-Badges
- Engagement-Metriken
- Timeline-Komponenten

## TypeScript-Typen

Das Modul definiert folgende Haupttypen:

- `SocialAccount` - Social Media Konto
- `SocialPost` - Social Media Beitrag
- `PostMedia` - Medien-Anhänge
- `QueueItem` - Warteschlangen-Eintrag
- `AnalyticsSummary` - Analytics-Daten
- `MediaLibraryItem` - Medien-Bibliotheks-Eintrag
- `SchedulerEvent` - Geplanter Beitrag

## Mock-Daten

Für Entwicklung und Testing stehen umfangreiche Mock-Daten zur Verfügung:

- `mockSocialAccounts` - Beispiel-Konten für verschiedene Plattformen
- `mockSocialPosts` - Beispiel-Beiträge mit verschiedenen Status
- `mockQueueItems` - Warteschlangen-Einträge
- `mockAnalyticsSummary` - Beispiel-Analytics-Daten
- `mockMediaLibrary` - Beispiel-Medien
- `mockSchedulerEvents` - Geplante Events

## Integration

### Navigation (noch nicht implementiert)

Um das SocialHub-Modul in die Hauptnavigation zu integrieren:

```tsx
import SocialHubIndex from './components/SocialHub';

// In der Route-Konfiguration:
<Route path="/social-hub" element={<SocialHubIndex />} />
```

### Als eigenständige Seite

```tsx
import React from 'react';
import SocialHubIndex from '../components/SocialHub';

const SocialHubPage: React.FC = () => {
  return (
    <div className="p-6">
      <SocialHubIndex />
    </div>
  );
};

export default SocialHubPage;
```

## Styling

Das Modul verwendet:
- **Tailwind CSS** für konsistentes Styling
- **Dark Mode Support** durch dark:-Varianten
- **Remix Icons** (ri-) für Icons
- **Gradient-Backgrounds** für Hero-Elemente
- **Hover-Effekte** für interaktive Elemente

## Zukünftige Erweiterungen

- Echte API-Integration (derzeit Mock-Daten)
- Echtzeit-Synchronisierung
- Collaborative Features (Team-Freigaben)
- Advanced Scheduling (Best-Time-to-Post)
- A/B Testing für Posts
- Sentiment Analysis
- Competitor Analysis
- Automatische Hashtag-Vorschläge
- AI-gestützte Content-Generierung

## Technische Details

### State Management
- Lokaler State mit React Hooks
- Zukünftig: Context API oder Redux für globalen State

### Performance
- Lazy Loading von Komponenten
- Optimierte Bildgrößen
- Virtualisierung für große Listen (zukünftig)

### Accessibility
- ARIA-Labels für Screen Reader
- Keyboard-Navigation
- Fokus-Management in Modals

## Entwicklung

### Neue Komponente hinzufügen

1. Erstelle die Komponente im entsprechenden Unterordner
2. Importiere benötigte Typen aus `Types/index.ts`
3. Nutze Mock-Daten aus `Mocks/index.ts`
4. Verwende bestehende Card-Komponenten für Konsistenz

### Neue Mock-Daten hinzufügen

Ergänze `Mocks/index.ts` mit neuen Beispieldaten:

```typescript
export const mockNewFeature: NewFeatureType[] = [
  // ... Mock-Daten
];
```

### Neue Typen definieren

Ergänze `Types/index.ts`:

```typescript
export interface NewFeatureType {
  id: string;
  // ... weitere Properties
}
```

## Support & Fragen

Bei Fragen oder Problemen wenden Sie sich an das Entwicklerteam.

---

**Version:** 1.0.0  
**Erstellt:** Oktober 2024  
**Status:** ✅ Entwicklung abgeschlossen (ohne Navigation)
