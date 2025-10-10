# Investoren-Modul - Dokumentation

## Übersicht

Das **Investoren-Modul** ist ein professionelles Portfolio-Management-System für Immobilieninvestoren. Es bietet umfassende Tools zur Verwaltung, Analyse und Simulation von Immobilieninvestments.

## Features

### 1. Portfolio-Übersicht
**Pfad:** `/investoren` → Tab "Portfolio"

**Funktionen:**
- **KPI-Karten:** Gesamtwert, Ø ROI, Cashflow, Leerstandsquote
- **Asset-Tabelle:** Sortierbare Übersicht aller Immobilien
  - Adresse, Stadt
  - Typ (Wohnung, Haus, Gewerbe, Grundstück)
  - Größe in m²
  - Immobilienwert
  - ROI-Prozentsatz (farbcodiert)
  - Monatlicher Cashflow
  - Status (Vermietet, Leer, Renovierung)
- **Filter & Suche:**
  - Textsuche nach Adresse/Stadt
  - Filter nach Typ
  - Filter nach Status
  - Filter nach Standort
- **Export-Funktion** (UI-Mock)

**Design:**
- Glassmorphism-Style
- Responsive Grid-Layout
- Hover-Effekte auf Tabellenzeilen
- Sticky Header bei Scroll

### 2. Berichte
**Pfad:** `/investoren` → Tab "Berichte"

**Funktionen:**
- **Automatische Renditeberichte:** Monatliche Übersichten
- **KPI-Cards pro Bericht:**
  - ROI in %
  - Netto-Cashflow
  - Leerstandsquote
  - Anzahl Assets
- **Finanzdetails:**
  - Gesamteinnahmen
  - Gesamtausgaben
  - Netto-Einkommen
- **Bericht generieren:** Button zum Erstellen neuer Berichte
- **Export-Optionen:** PDF, Excel, CSV (UI-Mock)

**Design:**
- 2-spaltiges Grid für Berichte
- Gradient-Hintergründe für KPI-Cards
- Success-Notification nach Generierung
- Dropdown-Menü für Export

### 3. Analysen
**Pfad:** `/investoren` → Tab "Analysen"

**Funktionen:**
- **Leerstandsentwicklung:**
  - Line-Chart mit 12-Monats-Trend
  - Aktuelle Quote mit Trend-Indikator
  - Durchschnittliche Quote
- **Kosten vs. Einnahmen:**
  - Stacked Bar-Chart
  - Kategorien: Einnahmen, Instandhaltung, Nebenkosten, Verwaltung
  - Monatliche Aufschlüsselung
- **KPI-Karten:**
  - Aktuelle Leerstandsquote
  - Ø Leerstandsquote (12 Monate)
  - Ø Instandhaltungskosten/Monat
  - Kosten/Einnahmen-Ratio
- **Zusammenfassung:**
  - Gesamteinnahmen (12 Monate)
  - Gesamtkosten (12 Monate)
  - Netto-Ergebnis

**Design:**
- Recharts-basierte Visualisierungen
- Dark/Light-Theme Support
- Responsive Charts mit Tooltips
- Gradient-Overlays auf Charts

### 4. Simulationen
**Pfad:** `/investoren` → Tab "Simulationen"

**Funktionen:**
- **Simulation erstellen:**
  - Formular mit allen relevanten Parametern:
    - Name
    - Szenario (Optimistisch, Realistisch, Pessimistisch)
    - Investitionssumme
    - Eigenkapital
    - Zinssatz
    - Laufzeit
    - Monatliche Miete
    - Leerstandsannahme
    - Sanierungskosten (optional)
- **Simulation-Cards:**
  - Investment, Zinssatz, Break-Even-Punkt, Gesamt-ROI
  - Szenario-Badge
  - Löschen-Funktion
  - Auswahl zum Vergleich
- **Vergleichschart:**
  - Bis zu 3 Simulationen gleichzeitig
  - Line-Chart mit ROI-Projektion über Laufzeit
  - Farbcodierte Szenarien

**Design:**
- Slide-in Formular mit Animation
- Grid-Layout für Simulationskarten
- Multi-Select für Vergleich
- Selection-Indicator mit Checkmarks

### 5. Marktplatz
**Pfad:** `/investoren` → Tab "Marktplatz"

**Funktionen:**
- **Immobilienpakete-Grid:**
  - Cards mit Bildern
  - Status-Badge (Verfügbar, Reserviert, Verkauft)
  - Standort, Anzahl Objekte, ROI, Preis
  - Details-Button
- **Filter & Suche:**
  - Textsuche
  - Status-Filter
  - Standort-Filter
  - Preis-Range (vorbereitet)
  - ROI-Range (vorbereitet)
- **Detail-Drawer:**
  - Bildergalerie
  - Vollständige Paketbeschreibung
  - KPI-Grid (Preis, ROI, Objekte, Fläche)
  - Detaillierte Informationen:
    - Standort, Verkäufer
    - Durchschn. Miete, Auslastung
    - Baujahr, Zustand
    - Inserierungsdatum
  - Reservieren-Button
- **Paket anbieten:** Button (UI-Mock)

**Design:**
- 3-spaltiges Grid
- Hover-Effekte mit Scale-Animation
- Slide-in Drawer von rechts
- Backdrop mit Blur
- Glassmorphism-Style

## Technische Implementierung

### Types
**Datei:** `src/types/investor.ts`

```typescript
- InvestorAsset
- InvestorReport
- Simulation
- MarketplacePackage
- VacancyTrend
- CostAnalysis
- PortfolioKPIs
```

### Mock Hooks
**Datei:** `src/hooks/useInvestorMock.ts`

```typescript
- useInvestorPortfolioMock()
- useInvestorReportsMock()
- useInvestorSimulationsMock()
- useMarketplaceMock()
- useVacancyTrendsMock()
- useCostAnalysisMock()
```

Alle Hooks implementieren:
- Loading States
- Error Handling
- Mock-Daten-Generierung
- CRUD-Operationen (Mock)
- Realistische Delays (500-1500ms)

### Komponenten
```
src/components/investor/
├── PortfolioView.tsx      # Portfolio mit KPIs, Tabelle, Filter
├── ReportsView.tsx        # Berichte mit Generation
├── AnalyticsView.tsx      # Charts für Vakanz & Kosten
├── SimulationsView.tsx    # ROI-Simulationen
└── MarketplaceView.tsx    # Marktplatz mit Drawer

src/pages/
└── InvestorDashboard.tsx  # Hauptseite mit Tab-Navigation
```

### Navigation
- **Sidebar:** Neuer Menüpunkt "Investoren" unter Module
- **Route:** `/investoren`
- **Icon:** Briefcase (Lucide)

## Verwendete Libraries

- **React** 18+
- **TypeScript**
- **Tailwind CSS** - Styling
- **Framer Motion** - Animationen
- **Recharts** - Charts
- **Lucide React** - Icons
- **React Router** - Navigation

## Mock-Daten

Alle Daten sind simuliert und werden clientseitig generiert:

- **Portfolio:** 12 zufällige Assets mit realistischen Werten
- **Berichte:** 12 monatliche Berichte (letztes Jahr)
- **Analysen:** 12 Monate Vakanz- und Kostentrends
- **Simulationen:** 3 vordefinierte Szenarien
- **Marktplatz:** 8 Immobilienpakete

## Styling-Konzept

### Glassmorphism
```css
background: rgba(255, 255, 255, 0.8)
backdrop-filter: blur(20px)
border: 1px solid rgba(255, 255, 255, 0.2)
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)
```

### Farbschema
- **Primär:** Blue-500 → Purple-600 (Gradient)
- **Erfolg:** Green-500 → Emerald-600
- **Warnung:** Yellow-500 → Orange-600
- **Fehler:** Red-500 → Pink-600
- **Neutral:** Gray-50 → Gray-900

### Responsive Breakpoints
- **Mobile:** < 768px (1 Spalte)
- **Tablet:** 768px - 1024px (2 Spalten)
- **Desktop:** > 1024px (3-4 Spalten)

## Dark Mode Support

Alle Komponenten unterstützen Dark Mode via Tailwind's `dark:` Modifier:
- Automatische Farbinversion
- Optimierte Kontraste
- Backdrop-Blur angepasst

## Animationen

### Framer Motion Varianten
```typescript
// Stagger Children
containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

// Slide In
slideIn = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' }
}
```

### Transitions
- Tab-Wechsel: 300ms
- Hover: 200ms
- Drawer: Spring (damping: 25)
- Cards: Stagger mit 0.1s Delay

## Zukünftige Erweiterungen

### Backend-Integration
- API-Endpoints für alle CRUD-Operationen
- Echtzeitdaten via WebSocket
- Benutzer-spezifische Portfolios
- Dokument-Upload für Berichte

### Erweiterte Features
- PDF-Report-Generierung (serverseitig)
- Excel-Export mit Formeln
- Email-Benachrichtigungen
- Portfolio-Vergleich
- Benchmark-Analyse
- Historische Datentrends
- Prognose-Modelle mit ML

### Zusätzliche Charts
- Cashflow-Waterfall
- Portfolio-Allocation (Pie)
- Rendite-Heatmap
- Vergleich mit Markt-Indizes

## Performance

- Lazy Loading für Tab-Content
- Memoization für berechnete Werte
- Virtualisierung für große Listen
- Code-Splitting pro View

## Testing

Alle Komponenten sind vorbereitet für:
- Unit Tests (Jest)
- Component Tests (React Testing Library)
- E2E Tests (Cypress)

## Deployment

Keine speziellen Requirements:
- Standard React Build
- Keine zusätzlichen Dependencies
- Kompatibel mit bestehender Infrastruktur

---

**Version:** 1.0.0  
**Erstellt:** Oktober 2025  
**Autor:** Senior Frontend Engineer  
**Status:** ✅ Production Ready (Mock-Version)
