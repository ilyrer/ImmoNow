# Schnellstart: Neue Module integrieren

## 1. Routes in App.jsx registrieren

Öffne `src/App.jsx` und füge die neuen Routes hinzu:

```jsx
// Neue Imports hinzufügen
import AvmPage from './pages/AvmPage';
import MatchingPage from './pages/MatchingPage';

// In der Routes-Sektion ergänzen:
<Route path="/avm" element={<AvmPage />} />
<Route path="/matching" element={<MatchingPage />} />
```

## 2. Sidebar-Navigation ergänzen (optional)

Falls du die Module in der Sidebar anzeigen möchtest, öffne `src/components/common/Sidebar.tsx` oder `GlobalSidebar.tsx`:

```jsx
import { Building2, Target } from 'lucide-react';

// Im Sidebar-Menü ergänzen:
<NavLink to="/avm">
  <Building2 className="w-5 h-5" />
  <span>AVM & Marktintelligenz</span>
</NavLink>

<NavLink to="/matching">
  <Target className="w-5 h-5" />
  <span>KI-Matching</span>
</NavLink>
```

## 3. Build & Test

```bash
# Terminal im Projekt-Root (real-estate-dashboard)
npm start

# oder
start-app.bat
```

**URLs testen:**
- http://localhost:3000/avm
- http://localhost:3000/matching

## 4. Verwendung

### AVM Seite:
1. Stadt auswählen (München, Berlin, Hamburg, Frankfurt, Köln)
2. PLZ, Immobilientyp, Größe eingeben
3. "Immobilie bewerten" klicken
4. Ergebnis mit Marktwert, Vergleichsobjekten und Markt-Trends anschauen

### Matching Seite:
1. **Kunde → Immobilie:** Kunde aus Liste auswählen → passende Immobilien anzeigen
2. **Immobilie → Kunde:** Button wechseln → Immobilie auswählen → passende Kunden anzeigen
3. Match-Score und Details analysieren

## 5. Mock-Daten anpassen

### AVM Daten:
**Datei:** `src/api/avm/mockData.ts`

```typescript
// Mehr Städte hinzufügen:
const CITIES = [
  { name: 'München', postalCodes: ['80331', '80333'] },
  { name: 'Stuttgart', postalCodes: ['70173', '70174'] }, // NEU
];

// Preise anpassen:
const cityMultipliers: Record<string, number> = {
  'München': 8500,    // € pro m²
  'Stuttgart': 7000,  // NEU
};
```

### Matching Daten:
**Datei:** `src/api/matching/mockData.ts`

```typescript
// Mehr Kunden/Immobilien generieren:
setCustomers(matchingMockService.generateCustomers(20)); // statt 12
setProperties(matchingMockService.generateProperties(30)); // statt 15
```

## 6. Design anpassen

Alle Komponenten nutzen Tailwind CSS und sind Dark-Mode-fähig:

```jsx
// Farben ändern:
className="bg-blue-600"      // → bg-purple-600
className="text-green-500"   // → text-teal-500

// Gradients anpassen:
className="bg-gradient-to-r from-blue-600 to-purple-600"
// → from-indigo-600 to-pink-600
```

## 7. Troubleshooting

### Module werden nicht gefunden:
```bash
# TypeScript Cache löschen
rm -rf node_modules/.cache
npm start
```

### Charts werden nicht angezeigt:
Prüfe ob `recharts` installiert ist:
```bash
npm install recharts
```

### Icons fehlen:
Prüfe ob `lucide-react` installiert ist:
```bash
npm install lucide-react
```

## Fertig! 🎉

Du hast erfolgreich:
- ✅ AVM & Marktintelligenz-Modul integriert
- ✅ KI-Matching-Modul integriert
- ✅ 5 weitere Module geprüft (bereits vorhanden)

**Nächste Schritte:**
- Backend-Integration vorbereiten (API-Endpoints)
- Mock-Interceptor anpassen (`src/api/mockInterceptor.ts`)
- Benutzer-Tests durchführen
