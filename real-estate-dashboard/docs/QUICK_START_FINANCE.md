# 🚀 Professional Financing Calculator - Quick Start

## Installation abgeschlossen ✅

Alle Dependencies sind bereits installiert:
- ✅ `docx` (Word-Dokument-Generierung)
- ✅ `file-saver` (Datei-Download)
- ✅ `@types/file-saver` (TypeScript Types)

## Starten der Anwendung

```bash
cd c:\Users\albian\Documents\Immonow\CIM_Frontend\real-estate-dashboard
npm start
```

Oder mit dem Batch-Script:
```bash
.\start-app.bat
```

## Navigation

1. Öffne Browser: `http://localhost:3000`
2. Navigiere zu **Finanzierung** (Sidebar oder `/finance`)

## Features im Überblick

### 📊 Tab 1: Rechner
**Hauptfunktionen:**
- Kaufpreis, Eigenkapital, Zinssatz eingeben
- Laufzeit & Nebenkosten konfigurieren
- Optionale Versicherung & Sondertilgung
- 3 interaktive Charts:
  - **Tilgungsverlauf**: Restschuld über Zeit
  - **Kostenaufteilung**: Pie-Chart der Gesamtkosten
  - **Monatliche Belastung**: Bar-Chart der monatlichen Kosten

**Ergebnis:**
- Monatliche Rate (inkl. aller Nebenkosten)
- Darlehenssumme & Beleihungsgrad
- Gesamtzinsen über Laufzeit
- Gesamtkosten (eff. Zinssatz)
- Detaillierter Tilgungsplan (Jahresübersicht)

### 🏦 Tab 2: Bankenvergleich
**Deutsche Banken mit realistischen Konditionen:**
1. **Deutsche Bank** - 3,45% | ⭐ 4,5/5
2. **Commerzbank** - 3,38% | ⭐ 4,7/5 | **EMPFOHLEN**
3. **KfW-Förderbank** - 2,95% | ⭐ 4,8/5 | **EMPFOHLEN**
4. **Sparkasse** - 3,55% | ⭐ 4,2/5
5. **ING** - 3,42% | ⭐ 4,6/5
6. **Interhyp** - 3,29% | ⭐ 4,9/5 | **EMPFOHLEN**
7. **Volksbank** - 3,49% | ⭐ 4,3/5
8. **Postbank** - 3,52% | ⭐ 4,1/5

**Features:**
- Automatische Empfehlung (beste Konditionen + höchstes Rating)
- Ersparnis-Berechnung (bestes vs. schlechtestes Angebot)
- Expandable Details: Gebühren, Sondertilgung, Vor-/Nachteile
- Zinsbindung, Max. Beleihung, Min. Eigenkapital

### 📈 Tab 3: Investment-Analyse
**Für Vermietungsobjekte:**

**Input:**
- Monatliche Kaltmiete (z.B. 2.000 €)
- Leerstandsrate (typisch 3-7%)

**Output: 6 Kennzahlen**
1. **Bruttomietrendite**: Jahresmiete / Kaufpreis × 100
2. **Nettomietrendite**: (Miete - Kosten) / Kaufpreis × 100
3. **Cap Rate**: Kapitalisierungsrate
4. **Jährlicher Cashflow**: Mieteinnahmen - Kosten - Finanzierung
5. **Cash-on-Cash Return**: Rendite auf Eigenkapital
6. **Eigenkapital-Multiplikator**: Hebel-Effekt

**Investment-Score (0-100):**
- 80-100: **Exzellente Investition** (grün)
- 60-79: **Gute Investition** (blau)
- 40-59: **Akzeptable Investition** (orange)
- 0-39: **Risikoreiche Investition** (rot)

**20-Jahres-Projektion:**
- Kumulierter Cashflow
- Wertsteigerung (2% p.a. angenommen)
- Gesamtertrag
- ROI auf Eigenkapital

## Word-Export Funktion

### Button oben rechts: "Word Export"

**Generiert professionelle .docx-Datei mit:**
- ✅ Deckblatt mit Kundendaten & Datum
- ✅ Executive Summary (Zusammenfassung)
- ✅ Detaillierte Kostenaufstellung (Tabellen)
- ✅ Finanzierungsstruktur (Eigenkapital vs. Darlehen)
- ✅ Monatliche Belastung (Tilgung, Versicherung, Instandhaltung)
- ✅ Tilgungsplan (Jahresübersicht, bis zu 20 Jahre)
- ✅ Gesamtübersicht mit Summen
- ✅ Rechtliche Hinweise & Unterschriftenfeld

**Dateiname:** `Finanzierungsangebot_Kunde_2025-10-01.docx`

**Verwendung:**
1. Finanzierung konfigurieren
2. Auf "Word Export" klicken
3. Datei wird automatisch heruntergeladen
4. Mit Microsoft Word oder LibreOffice öffnen

## Beispiel-Szenarien

### Szenario 1: Eigennutzer
```
Kaufpreis: 500.000 €
Eigenkapital: 100.000 € (20%)
Zinssatz: 3,45%
Laufzeit: 25 Jahre
Nebenkosten: 35.000 € (~7%)

Ergebnis:
→ Monatliche Rate: ~2.400 €
→ Gesamtzinsen: ~230.000 €
→ Gesamtkosten: ~765.000 €
```

### Szenario 2: Kapitalanleger
```
Kaufpreis: 300.000 €
Eigenkapital: 60.000 € (20%)
Zinssatz: 3,38%
Laufzeit: 25 Jahre
Monatliche Miete: 1.500 €
Leerstand: 5%

Ergebnis:
→ Monatliche Rate: ~1.450 €
→ Cashflow: +50 €/Monat (+600 €/Jahr)
→ Bruttomietrendite: 6,0%
→ Cash-on-Cash Return: 5,2%
→ Investment-Score: 75/100 (Gute Investition)
```

### Szenario 3: Luxusimmobilie
```
Kaufpreis: 1.200.000 €
Eigenkapital: 360.000 € (30%)
Zinssatz: 3,29% (Interhyp)
Laufzeit: 20 Jahre
Sondertilgung: 10.000 € p.a.

Ergebnis:
→ Monatliche Rate: ~5.100 €
→ Mit Sondertilgung: Abbezahlt in 17 Jahren
→ Ersparnis durch Interhyp: ~45.000 €
```

## Design-Highlights

### Professionelles Banking-Design
- ❌ **Keine Emojis** (nur Icons von Lucide React)
- ✅ **Seriöse Farbpalette**: Blau/Indigo-Gradients
- ✅ **Moderne Typografie**: Calibri, Font-Mono für Zahlen
- ✅ **Glasmorphism-Effekte**: Backdrop-Blur & Transparenz
- ✅ **Dark Mode Support**: Alle Komponenten dark-mode-ready
- ✅ **Smooth Animations**: Framer Motion für Übergänge

### Responsive Layout
- ✅ **Mobile**: Single-Column, Touch-optimiert
- ✅ **Tablet**: 2-Column Grid
- ✅ **Desktop**: 3-4 Column Grid mit Sidebar

## Troubleshooting

### Problem: Word-Export funktioniert nicht
**Lösung:**
```bash
npm install docx file-saver --save
npm install --save-dev @types/file-saver
```

### Problem: Berechnungen falsch
**Check:**
- Zinssatz in Prozent (z.B. 3,45 nicht 0,0345)
- Laufzeit in Jahren (z.B. 25 nicht 300)
- Nebenkosten als Betrag (z.B. 35000 nicht 7%)

### Problem: Charts werden nicht angezeigt
**Check:**
- `recharts` installiert: `npm install recharts`
- Browser-Console auf Fehler prüfen
- Daten korrekt berechnet (results nicht null)

## Weitere Dokumentation

- **Technische Details**: `PROFESSIONAL_FINANCING_README.md`
- **API-Dokumentation**: `src/types/finance.ts` (TypeScript Interfaces)
- **Mock-Daten**: `src/api/finance/mockBankData.ts`

## Support

Bei Fragen oder Problemen:
1. Check Browser Console (F12)
2. Prüfe Network Tab (für API-Fehler)
3. Validiere Input-Daten (keine negativen Werte)

---

**Version 2.0.0** | Professioneller Finanzierungsrechner für ImmoNow CRM
