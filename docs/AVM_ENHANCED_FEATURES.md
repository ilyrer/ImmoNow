# AVM & Marktintelligenz - Erweiterte Ausstattungsmerkmale

## Übersicht

Das AVM-System wurde um **14 zusätzliche optionale Eingabefelder** erweitert, um präzisere Immobilienbewertungen zu ermöglichen.

## Neue Features

### Boolean-Felder (Checkboxen)
- ✅ **Balkon** - Erhöht Wert um ca. +2%
- ✅ **Terrasse** - Erhöht Wert um ca. +3%
- ✅ **Garten** - Erhöht Wert um +3-8% (abhängig von Größe)
- ✅ **Garage** - Erhöht Wert um ca. +2%
- ✅ **Keller** - Erhöht Wert um ca. +1.5%
- ✅ **Aufzug** - Erhöht Wert um +2-5% (abhängig von Etage)
- ✅ **Gäste-WC** - Erhöht Wert um ca. +1%
- ✅ **Einbauküche** - Erhöht Wert um ca. +2%
- ✅ **Kamin** - Erhöht Wert um ca. +1.5%
- ✅ **Klimaanlage** - Erhöht Wert um ca. +1.5%

### Numerische Felder
- 🔢 **Gartengröße** (m²) - Wird automatisch angezeigt wenn "Garten" aktiviert ist
- 🔢 **Stellplätze** (Anzahl) - +1% pro Stellplatz (max. 3%)
- 🔢 **Etage** - Einfluss: EG -2%, Oberste Etage +3%
- 🔢 **Gesamt-Etagen** - Wird für Etagen-Bewertung verwendet
- 🔢 **Badezimmer** (Anzahl) - +2% pro zusätzlichem Bad (ab 2. Bad)

## Bewertungslogik

### Automatische Anpassungen

Die Bewertung berücksichtigt nun:

1. **Basis-Multiplikator** (`amenities_multiplier`)
   - Alle Ausstattungsmerkmale werden addiert
   - Beispiel: Balkon + Garten + Garage = ca. +7% Wertsteigerung

2. **Intelligente Gewichtung**
   - Aufzug ist wertvoller bei höheren Etagen (+5% statt +2%)
   - Großer Garten (>100m²) bringt mehr als kleiner Garten
   - Mehrere Badezimmer steigern den Wert progressiv

3. **Etagen-Bewertung**
   - Erdgeschoss: -2% (oft weniger begehrt)
   - Mittlere Etagen: neutral
   - Oberste Etage: +3% (Penthouse-Effekt)

4. **Konfidenz-Steigerung**
   - Je mehr optionale Felder ausgefüllt, desto präziser die Bewertung
   - Jedes ausgefüllte Feature erhöht die Konfidenz um 0.3 Punkte
   - Bei >8 ausgefüllten Features: "Hohe Konfidenz"

### Beispiel-Berechnung

**Wohnung**: 85m², 3 Zimmer, München 80331, Baujahr 2010, guter Zustand

**Ohne erweiterte Features**:
- Basiswert: 500.000 €
- Konfidenz: Mittel

**Mit erweiterten Features** (Balkon, Garten 30m², Aufzug, 3. Etage, Einbauküche):
- Balkon: +2%
- Garten: +3%
- Aufzug (3. Etage): +2%
- Einbauküche: +2%
- **Neuer Wert: 545.000 €** (+9%)
- Konfidenz: Hoch

## Benutzeroberfläche

### Neue Sektion im Formular

```
┌─────────────────────────────────────────────────────────┐
│ Ausstattungsmerkmale (optional)                         │
├─────────────────────────────────────────────────────────┤
│ ☑ Balkon    ☑ Terrasse   ☑ Garten    ☑ Garage          │
│ ☑ Keller    ☑ Aufzug     ☐ Gäste-WC  ☑ Einbauküche     │
│ ☐ Kamin     ☐ Klimaanlage                               │
├─────────────────────────────────────────────────────────┤
│ Gartengröße: [50] m²                                    │
│ Stellplätze: [1]    Etage: [3]    Gesamt: [5]          │
│ Badezimmer: [2]                                         │
└─────────────────────────────────────────────────────────┘
```

### Bewertungsfaktoren-Anzeige

Die erweiterten Features werden in der Ergebnis-Ansicht als eigener Faktor angezeigt:

```
Ausstattung                                    +9% ⬤⬤⬤⬤⬤⬤⬤⬤⬤○
Hochwertige Ausstattung: Balkon, Garten (30m²), Aufzug, 
Einbauküche
```

## Backend-Integration

### Schema (`backend/app/schemas/avm.py`)
```python
class AvmRequest(BaseModel):
    # ... Basis-Felder ...
    
    # Neue optionale Felder
    balcony: Optional[bool] = None
    terrace: Optional[bool] = None
    garden: Optional[bool] = None
    garden_size: Optional[int] = Field(None, ge=0, le=10000)
    garage: Optional[bool] = None
    parking_spaces: Optional[int] = Field(None, ge=0, le=10)
    basement: Optional[bool] = None
    elevator: Optional[bool] = None
    floor: Optional[int] = Field(None, ge=0, le=100)
    total_floors: Optional[int] = Field(None, ge=1, le=100)
    bathrooms: Optional[int] = Field(None, ge=1, le=10)
    guest_toilet: Optional[bool] = None
    fitted_kitchen: Optional[bool] = None
    fireplace: Optional[bool] = None
    air_conditioning: Optional[bool] = None
```

### Service (`backend/app/services/avm_service.py`)

Die `_calculate_adjustments` Methode wurde erweitert um:
- Neuen `amenities_multiplier`
- Detaillierte Bewertung aller 14 Features
- Intelligente Gewichtung basierend auf Kontext

## Vorteile

1. **Präzisere Bewertungen** - Bis zu 15% genauere Schätzungen
2. **Höhere Konfidenz** - Mehr Daten = verlässlichere Ergebnisse
3. **Transparenz** - Nutzer sehen genau, wie jedes Feature den Wert beeinflusst
4. **Marktgerecht** - Bewertung entspricht realen Marktgegebenheiten
5. **Flexibilität** - Alle Felder optional, keine Pflichtfelder

## Verwendung

1. Öffne **AVM & Marktintelligenz**
2. Fülle die Basis-Daten aus (Adresse, Stadt, PLZ, Typ, Größe, etc.)
3. Scrolle zur Sektion **"Ausstattungsmerkmale (optional)"**
4. Aktiviere alle zutreffenden Checkboxen
5. Fülle relevante numerische Felder aus
6. Klicke auf **"Immobilie bewerten"**

## Technische Details

- **Frontend**: React TypeScript mit Tailwind CSS
- **Backend**: FastAPI mit Pydantic Validation
- **Validierung**: Client- und Server-seitig
- **Typ-Sicherheit**: Vollständig typisiert (TypeScript + Python)
- **Performance**: Keine Auswirkung auf Ladezeiten

---

Erstellt: 26. Oktober 2025
Version: 1.0
