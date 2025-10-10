# AI Components

Dieser Ordner enthält alle KI-bezogenen Komponenten der Real Estate Dashboard Anwendung.

## Komponenten

### GlobalAIChatbot.jsx
- **Zweck**: Globaler KI-Assistent für das gesamte Dashboard
- **Features**: 
  - Intent-Erkennung für verschiedene Aufgaben
  - Integration mit AI-Services
  - Aufgaben-, Immobilien- und Meeting-Erstellung
  - Floating Chat-Interface
  - Moderne Animationen mit Framer Motion

### AITest.tsx
- **Zweck**: Test-Komponente für KI-Funktionalitäten
- **Features**: Experimentelle KI-Features und Tests

## AI-Services Integration

Die Komponenten nutzen den `AIService` aus `src/services/ai.service.ts`:
- `suggestTaskPriority()` - Aufgaben-Priorisierung
- `generatePropertyDescription()` - Immobilienbeschreibungen
- `analyzeMarketTrends()` - Marktanalysen
- `generateMarketingContent()` - Marketing-Content

## Verwendung

```jsx
import { GlobalAIChatbot } from '../AI';

<GlobalAIChatbot 
  user={user}
  onCreateTask={handleCreateTask}
  onCreateProperty={handleCreateProperty}
  onCreateMeeting={handleCreateMeeting}
/>
```

## Zukünftige Erweiterungen

Geplante KI-Komponenten:
- `AIAssistant` - Erweiterte KI-Assistenz
- `SmartSuggestions` - Intelligente Vorschläge
- `AIAnalytics` - KI-gestützte Analysen
- `VoiceAssistant` - Sprachsteuerung
- `PredictiveAnalytics` - Vorhersage-Analysen 